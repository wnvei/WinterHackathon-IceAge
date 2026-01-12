import json
import sys
import re
import os
from pathlib import Path
from collections import defaultdict

def normalize_text_basic(text):
    if not text:
        return ""
    # Remove extra whitespace and convert to lower
    return " ".join(text.split()).lower()

def get_semantic_key(text):
    """Generates a key for deduplication by stripping noise and common prefixes."""
    text = normalize_text_basic(text)
    # Remove punctuation
    text = re.sub(r'[^\w\s]', '', text)
    # Remove common question starters
    prefixes = [
        r'^(what\s+is|what\s+are|define|explain|describe|discuss|mention|list|give|state|illustrate|write\s+a\s+note\s+on|write\s+short\s+notes\s+on|write\s+notes\s+on|differentiate\s+between|distinguish\s+between|briefly\s+explain|compare|with\s+a\s+neat\s+diagram\s+explain)\s+',
        r'^(the\s+|an\s+|a\s+|with\s+)'
    ]
    changed = True
    while changed:
        old_text = text
        for p in prefixes:
            text = re.sub(p, '', text)
        changed = (old_text != text)
  
    # Basic stemming (simple plural)
    if text.endswith('s') and len(text) > 4:
        if not text.endswith(('ss', 'is', 'us', 'os')):
            text = text[:-1]
            
    return text.strip()

def roman_to_int(s):
    rom_val = {'I': 1, 'V': 5, 'X': 10, 'L': 50, 'C': 100, 'D': 500, 'M': 1000}
    int_val = 0
    for i in range(len(s)):
        if i > 0 and rom_val[s[i]] > rom_val[s[i - 1]]:
            int_val += rom_val[s[i]] - 2 * rom_val[s[i - 1]]
        else:
            int_val += rom_val[s[i]]
    return int_val

def normalize_module_name(name):
    if name is None:
        return None
    # Handle MODULE-1, UNIT 2, PART III, etc.
    match = re.search(r'(?:MODULE|UNIT|PART)\s*[-–]?\s*([IVX\d]+)', name, re.IGNORECASE)
    if match:
        val = match.group(1).upper()
        if re.match(r'^[IVXLC]+$', val):
            try: return f"MODULE-{roman_to_int(val)}"
            except: pass
        return f"MODULE-{val}"
    
    match_just_digit = re.search(r'(\d+)', name)
    if match_just_digit:
        return f"MODULE-{match_just_digit.group(1)}"
    
    return name.strip().upper()

def parse_raw_questions(text: str) -> list:
    questions = []
    current_module = None
    current_source = None
    
    # Noise filters
    NOISE_PATTERNS = [
        r'ST\s*JOSEPH\s*ENGINEERING\s*COLLEGE.*',
        r'An\s*Autonomous\s*Institution.*',
        r'Fifth\s*Semester\s*B\.E\..*',
        r'USN:\s*[A-Z0-9]+.*',
        r'Duration\s*:\s*\d+\s*Hrs.*',
        r'Maximum\s*Marks\s*:\s*\d+.*',
        r'Page\s*\d+.*',
        r'\d+\s*\|\s*\d+', # 1 | 4 style page numbers
        r'PART\s*-\s*[A-B].*',
        r'Q\.No\..*Question.*BL.*CO.*PO.*Marks.*',
        r'Note:.*',
        r'Answer\s*any\s*five.*',
        r'Missing\s*data\s*may\s*be\s*suitably\s*assumed.*',
        r'OR\s*$', # Standalone ORs
        r'STJOSEPHENGINEERINGCOLLEGE.*',
        r'MANGALURU.*'
    ]

    lines = text.split('\n')
    buffer = ""
    
    def process_buffer(content, module, source):
        content = content.strip()
        if not content: return
        
        # Clean the content: Remove document separators and excessive noise
        content = re.sub(r'[=\-]{3,}', '', content)
        
        # Apply noise patterns line by line within the buffer if possible, or as a whole
        for pattern in NOISE_PATTERNS:
            content = re.sub(pattern, '', content, flags=re.IGNORECASE).strip()
            
        content = " ".join(content.split())
        if not content: return

        # MCQ Detection (Enhanced)
        options_count = len(re.findall(r'\([a-d]\)|\b[a-d][\.\)]\s', content))
        if options_count >= 3 or 'CHOOSE THE CORRECT' in content.upper():
            return

        # Check for marks patterns
        marks_match = re.search(r'\((\d+)\s*[Mm]arks?\)|\((\d+)\)\s*$|\[(\d+)\]\s*$', content)
        marks = None
        if marks_match:
            try:
                marks = int(next(m for m in marks_match.groups() if m))
            except: pass
            content = re.sub(r'\s*\((\d+)\s*[Mm]arks?\)|\s*\((\d+)\)\s*$|\s*\[(\d+)\]\s*$', '', content).strip()
            
        # Clean prefix numbers like "1.", "a)", "(i)"
        clean_q = re.sub(r'^\d+[\.\)]\s*', '', content).strip()
        clean_q = re.sub(r'^[a-z][\.\)]\s*', '', clean_q).strip()
        clean_q = re.sub(r'^[a-z][\.\)]\s*', '', clean_q).strip() # twice for a) b)
        clean_q = re.sub(r'^\([a-z]\)\s*', '', clean_q).strip()
        clean_q = re.sub(r'^[ivx]+[\.\)]\s*', '', clean_q, flags=re.IGNORECASE).strip()

        # Instruction detection (heuristic)
        if len(clean_q.split()) < 4 and not '?' in clean_q:
            return

        # Common headers that escaped patterns
        if clean_q.upper() in ['PART -A', 'PART -B', 'MODULE -1', 'MODULE -2', 'MODULE -3', 'MODULE -4', 'MODULE -5', 'OR']:
            return

        if len(clean_q) > 5:
            questions.append({
                'question': clean_q.rstrip('.').strip(),
                'module': module,
                'marks': marks,
                'source': source
            })

    for line in lines:
        line = line.strip()
        if not line: continue
        
        # Source detection
        if line.startswith('FILE:'):
            if buffer: process_buffer(buffer, current_module, current_source)
            buffer = ""
            current_source = line.replace('FILE:', '').strip()
            continue
            
        # Module detection
        if re.match(r'^(MODULE|UNIT|PART)\s*[-–]?\s*[IVX\d]+\s*$', line, re.IGNORECASE):
            if buffer: process_buffer(buffer, current_module, current_source)
            buffer = ""
            current_module = normalize_module_name(line)
            continue
        
        # New question detection markers
        starters = r'^(What|How|Why|When|Where|Who|Which|Explain|Describe|Define|Differentiate|Write|List|Give|With|Compare|Discuss|Mention|Name|Solve|Identify|State|Sketch|Find|Calculate|Briefly|Determine|Outline|Enumerate)\b'
        
        is_new_q = (
            re.match(r'^\d+[\.\)]', line) or 
            re.match(starters, line, re.IGNORECASE) or 
            re.search(r'\((\d+)\s*[Mm]arks?\)|\((\d+)\)\s*$|\[(\d+)\]\s*$', line)
        )
        
        if is_new_q and buffer:
            # Split if follows number, or previous buffer looks like a complete sentence (ends in . ? ! or ) )
            if re.match(r'^\d+[\.\)]', line) or (not buffer.endswith(',') and buffer.rstrip()[-1:] in '.?!)'):
                process_buffer(buffer, current_module, current_source)
                buffer = line
            else:
                buffer = (buffer + " " + line).strip()
        else:
            buffer = (buffer + " " + line).strip() if buffer else line
            
    if buffer:
        process_buffer(buffer, current_module, current_source)
    return questions

def find_best_topic(question_text, module_name, syllabus_map):
    if not module_name or module_name not in syllabus_map:
        return None
        
    q_text_low = question_text.lower()
    q_words = set(re.findall(r'\b\w{3,}\b', q_text_low))
    
    best_term = None
    max_score = 0
    
    for topic, subtopics in syllabus_map[module_name].items():
        # Score the main topic
        topic_words = set(re.findall(r'\b\w{3,}\b', topic.lower()))
        score = len(q_words.intersection(topic_words)) * 2
        
        # Score subtopics
        for st in subtopics:
            st_words = set(re.findall(r'\b\w{3,}\b', st.lower()))
            st_score = len(q_words.intersection(st_words)) * 1.5
            if st_score > score: score = st_score
            
        if score > max_score:
            max_score = score
            best_term = topic
                
    return best_term if max_score > 1.0 else None

def process_questions():
    base_dir = Path(__file__).resolve().parent.parent
    data_dir = base_dir / "Subject"
    
    target_subject = sys.argv[1] if len(sys.argv) > 1 else None

    if not data_dir.exists():
        print(f"Error: Data directory not found at {data_dir}")
        return

    for subject_dir in data_dir.iterdir():
        if not subject_dir.is_dir():
            continue
            
        if target_subject and subject_dir.name.lower() != target_subject.lower():
            continue

        processed_dir = subject_dir / "processed"
        txt_path = processed_dir / "questions.txt"
        syllabus_path = processed_dir / "syllabus.json"
        output_path = processed_dir / "questions.json"
        
        if not txt_path.exists():
            continue
            
        print(f"\nProcessing questions for: {subject_dir.name}")
        
        # 1. Load Syllabus
        syllabus_map = {}
        if syllabus_path.exists():
            with open(syllabus_path, 'r', encoding='utf-8') as f:
                raw_syllabus = json.load(f)
                for k, v in raw_syllabus.items():
                    norm_k = normalize_module_name(k)
                    syllabus_map[norm_k] = v
        
        # 2. Parse Raw Text
        with open(txt_path, 'r', encoding='utf-8') as f:
            raw_parsed = parse_raw_questions(f.read())
        
        # 3. Deduplicate and Analyze Repetitions
        stats = defaultdict(lambda: {"count": 0, "sources": set(), "orig_q": ""})
        for q in raw_parsed:
            key = get_semantic_key(q['question'])
            if not key: continue
            stats[key]["count"] += 1
            if q['source']: stats[key]["sources"].add(q['source'])
            if not stats[key]["orig_q"] or len(q['question']) > len(stats[key]["orig_q"]):
                stats[key]["orig_q"] = q['question'] # Keep longest as representative

        # 4. Final Enrichment
        final_list = []
        seen_keys = set()
        q_id = 1
        
        for q in raw_parsed:
            key = get_semantic_key(q['question'])
            if not key or key in seen_keys: continue
            
            stat = stats[key]
            repeat_count = stat["count"]
            rep_question = stat["orig_q"]
            
            # Map to Syllabus
            topic = find_best_topic(rep_question, q['module'], syllabus_map)
            status = "IN_SYLLABUS" if topic else "OUT_OF_SYLLABUS"
            
            # Importance
            importance = "LOW"
            if repeat_count >= 3: importance = "HIGH"
            elif repeat_count == 2: importance = "MEDIUM"
            
            final_list.append({
                "id": q_id,
                "module": q['module'],
                "topic": topic,
                "question": rep_question,
                "marks": q['marks'],
                "syllabus_status": status,
                "repeat_count": repeat_count,
                "sources": sorted(list(stat["sources"])),
                "importance": importance
            })
            seen_keys.add(key)
            q_id += 1
            
        with open(output_path, 'w', encoding='utf-8') as f:
            json.dump({"questions": final_list}, f, indent=2, ensure_ascii=False)
            
        print(f"  Finalized {len(final_list)} unique questions.")

if __name__ == "__main__":
    process_questions()
