import json
import sys
import re
import os
from pathlib import Path
from collections import defaultdict

def normalize_text_basic(text):
    if not text:
        return ""
    return text.lower().strip()

def get_semantic_key(text):
    text = normalize_text_basic(text)
    text = re.sub(r'[^\w\s]', '', text)
    prefixes = [
        r'^(what\s+is|what\s+are|define|explain|describe|discuss|mention|list|give|state|illustrate|write\s+a\s+note\s+on|write\s+short\s+notes\s+on|write\s+notes\s+on|differentiate\s+between|distinguish\s+between|briefly\s+explain|compare|with\s+a\s+neat\s+diagram\s+explain)\s+',
        r'^(the\s+|an\s+|a\s+)'
    ]
    changed = True
    while changed:
        old_text = text
        for p in prefixes:
            text = re.sub(p, '', text)
        changed = (old_text != text)
  
    # Simple plural to singular conversion
    if text.endswith('s') and len(text) > 4:
        if not text.endswith(('ss', 'is', 'us', 'os')):
            text = text[:-1]
            
    return text.strip()

def normalize_module_name(name):
    if name is None:
        return None
    match = re.search(r'(?:MODULE|UNIT)\s*[-–]?\s*(\d+)', name, re.IGNORECASE)
    if match:
        return f"MODULE-{match.group(1)}"
    match_just_digit = re.search(r'(\d+)', name)
    if match_just_digit:
        return f"MODULE-{match_just_digit.group(1)}"
    return name.strip().upper()

def parse_raw_questions(text: str) -> list:
    questions = []
    current_module = None
    current_source = None
    
    lines = text.split('\n')
    buffer = ""
    
    def process_buffer(content, module, source):
        if not content.strip(): return
        
        # Clean the content: Remove document separators (lines of === or ---)
        content = re.sub(r'={3,}', '', content)
        content = re.sub(r'-{3,}', '', content)
        content = content.replace('\n', ' ').strip()
        
        # Determine if this buffered content contains tabular data or joined questions
        row_questions = []
        
        # --- MCQ DETECTION ---
        # Detect patterns like (a) (b) (c) (d) or A. B. C. D.
        is_mcq = (
            len(re.findall(r'\([a-d]\)', content, re.IGNORECASE)) >= 2 or
            len(re.findall(r'\s[a-d][\.\)]\s', content, re.IGNORECASE)) >= 2 or
            'CHOOSE THE CORRECT' in content.upper() or
            'MULTIPLE CHOICE' in content.upper()
        )
        if is_mcq: return

        if content.count('|') >= 2:
            parts = [p.strip() for p in content.split('|')]
            if len(parts) >= 6:
                q_text = parts[1]
                try: m = int(parts[-1])
                except: m = None
                row_questions.append((q_text, m))
            else:
                q_text = " ".join([p for p in parts if len(p) > 5]).strip()
                row_questions.append((q_text, None))
        else:
            # Check for marks in the buffered content
            marks_match = re.search(r'\((\d+)\s*[Mm]arks?\)|\((\d+)\)\s*$', content)
            marks = int(marks_match.group(1) or marks_match.group(2)) if marks_match else None
            q_text = re.sub(r'\s*\((\d+)\s*[Mm]arks?\)|\s*\((\d+)\)\s*$', '', content).strip()
            
            # Keep multi-sentence questions together
            row_questions.append((q_text, marks))

        for qt, qm in row_questions:
            if qt.isupper() and not qm and '?' not in qt: continue
            
            noise_keywords = ['ST JOSEPH', 'ENGINEERING COLLEGE', 'AUTONOMOUS INSTITUTION', 'DEPARTMENT OF', 'COMPUTER SCIENCE', 'SUBJECT:', 'COURSE CODE:', 'TIME:', 'DURATION:', 'MODEL QUESTION', 'PART-A', 'PART-B']
            if any(keyword in qt.upper() for keyword in noise_keywords) and '?' not in qt and not qm:
                continue
            
            starters = r'^(What|How|Why|When|Where|Who|Which|Explain|Describe|Define|Differentiate|Write|List|Give|With|Compare|Discuss|Mention|Name|Solve|Identify|In|The|Briefly|Distinguish|Show|Calculate|State|Sketch|Find)\b'
            if len(qt) > 8 and not qt.endswith('...') and ( '?' in qt or re.match(starters, qt, re.IGNORECASE) or qm is not None):
                clean_q = re.sub(r'^\d+[\.\)]\s*', '', qt).strip()
                clean_q = re.sub(r'^[a-z][\.\)]\s*', '', clean_q).strip()
                clean_q = re.sub(r'\s+', ' ', clean_q).strip()

                questions.append({
                    'question': clean_q.rstrip('.').strip(),
                    'module': module,
                    'marks': qm,
                    'source': source
                })

    for line in lines:
        line = line.strip()
        if not line: continue
        
        # Discard document separators (lines of === or ---) so they don't enter the buffer
        if re.match(r'^[=\-]{3,}$', line):
            continue

        if line.startswith('FILE:'):
            process_buffer(buffer, current_module, current_source)
            buffer = ""
            current_source = line.replace('FILE:', '').strip()
            continue
            
        # Flexible module detection (handles vertical splits like "MODULE" \n "-1")
        if re.match(r'^(MODULE|UNIT)\s*[-–]?\s*\d+\s*$', line, re.IGNORECASE):
            process_buffer(buffer, current_module, current_source)
            buffer = ""
            current_module = normalize_module_name(line)
            continue
        
        # Check if the buffer + current line together form a module header
        if buffer and re.match(r'^(MODULE|UNIT)\s*[-–]?\s*\d+\s*$', (buffer + " " + line).strip(), re.IGNORECASE):
            if re.match(r'^(MODULE|UNIT)', buffer, re.IGNORECASE):
                current_module = normalize_module_name(buffer + " " + line)
                buffer = ""
                continue
        
        # If line starts with a number or question starter or has marks, it's likely a NEW question
        starters = r'^(What|How|Why|When|Where|Who|Which|Explain|Describe|Define|Differentiate|Write|List|Give|With|Compare|Discuss|Mention|Name|Solve|Identify|In|The|Briefly|Distinguish|Show|Calculate|State|Sketch|Find)\b'
        is_new = (
            re.match(r'^\d+[\.\)]', line) or 
            re.match(starters, line, re.IGNORECASE) or 
            re.search(r'\((\d+)\s*[Mm]arks?\)|\((\d+)\)\s*$', line) or
            re.match(r'^\d+\s*\|', line) # Only split on pipe if it's a numbered row (e.g. "1 |")
        ) and not re.match(r'^[ivx]+[\.\)]', line, re.IGNORECASE) # Don't split on roman numerals
        
        if is_new and buffer:
            # HEURISTIC: Don't split if the current line is just a single word (vertical text)
            # unless the previous buffer clearly ended (marks or question mark)
            buffer_is_done = buffer.endswith('?') or re.search(r'\(\d+\s*[Mm]arks?\)', buffer)
            line_is_substantial = len(line.split()) > 1
            
            if buffer_is_done or line_is_substantial or re.match(r'^\d+[\.\)]', line):
                process_buffer(buffer, current_module, current_source)
                buffer = line
            else:
                # Continue buffering the fragmented line
                buffer = (buffer + " " + line).strip()
        else:
            buffer = (buffer + " " + line).strip() if buffer else line
            
    process_buffer(buffer, current_module, current_source)
    return questions

def find_best_topic(question_text, module_name, syllabus_map):
    """Simple keyword-based topic matcher with synonym support."""
    if not module_name or module_name not in syllabus_map:
        return None
        
    synonyms = {
        "lan": "local area network",
        "wan": "wide area network",
        "man": "metropolitan area network",
        "osi": "open system interconnection",
        "tcp": "transmission control protocol",
        "udp": "user datagram protocol",
        "ip": "internet protocol",
        "dns": "domain name system",
        "http": "hypertext transfer protocol"
    }
    
    q_text_low = question_text.lower()
    for abbr, full in synonyms.items():
        if f" {abbr} " in f" {q_text_low} " or f"({abbr})" in q_text_low:
            q_text_low += " " + full
            
    q_words = set(re.findall(r'\b[a-z]{3,}\b', q_text_low))
    best_term = None
    max_score = 0
    
    for topic, subtopics in syllabus_map[module_name].items():
        # 1. Score the parent topic
        topic_words = set(re.findall(r'\b[a-z]{3,}\b', topic.lower()))
        t_score = len(q_words.intersection(topic_words)) * 2 # Weight parent slightly higher if tied
        
        if t_score > max_score:
            max_score = t_score
            best_term = topic
            
        # 2. Score each subtopic individually
        for st in subtopics:
            st_words = set(re.findall(r'\b[a-z]{3,}\b', st.lower()))
            # Weight subtopics based on overlap
            st_score = len(q_words.intersection(st_words)) * 1.5 # Subtopics are specific
            
            if st_score > max_score:
                max_score = st_score
                best_term = st
                
    # Final fallback: if score is very low, it might be generic
    if max_score < 1.5: # Require at least some unique word match
        return None
    return best_term

def process_questions():
    base_dir = Path(__file__).parent.parent
    data_dir = base_dir / "Subject"
    
    # Check for targeted subject argument
    target_subject = sys.argv[1] if len(sys.argv) > 1 else None

    for subject_dir in data_dir.iterdir():
        if not subject_dir.is_dir():
            continue
            
        # If a target subject is specified, skip others
        if target_subject and subject_dir.name.lower() != target_subject.lower():
            continue

        processed_dir = subject_dir / "processed"
        txt_path = processed_dir / "questions.txt"
        syllabus_path = processed_dir / "syllabus.json"
        output_path = processed_dir / "questions.json"
        
        if not txt_path.exists():
            continue
            
        print(f"\nProcessing {subject_dir.name}...")
        
        # 1. Load Syllabus for validation and mapping
        valid_modules = set()
        syllabus_map = {}
        if syllabus_path.exists():
            with open(syllabus_path, 'r', encoding='utf-8') as f:
                syllabus_data = json.load(f)
            for raw_key, content in syllabus_data.items():
                norm_key = normalize_module_name(raw_key)
                if norm_key:
                    valid_modules.add(norm_key)
                    # For topic mapping, keep content as is
                    syllabus_map[norm_key] = content
        
        # 2. Parse raw text (now including MCQ removal)
        with open(txt_path, 'r', encoding='utf-8') as f:
            raw_parsed = parse_raw_questions(f.read())
        
        print(f"Found {len(raw_parsed)} raw questions in {subject_dir.name}")
        
        # 3. Analyze repetitions & collect sources
        sem_stats = defaultdict(lambda: {"count": 0, "sources": set()})
        for q in raw_parsed:
            key = get_semantic_key(q['question'])
            if key:
                sem_stats[key]["count"] += 1
                if q['source']: sem_stats[key]["sources"].add(q['source'])
        
        # 4. Final deduplication & enrichment
        final_list = []
        seen_keys = set()
        q_id = 1
        
        for q in raw_parsed:
            key = get_semantic_key(q['question'])
            if not key or key in seen_keys:
                continue
                
            stats = sem_stats[key]
            repeat_count = max(1, stats["count"])
            
            # Syllabus Status
            status = "UNKNOWN"
            topic_mapping = None
            if q['module']:
                if q['module'] in valid_modules:
                    status = "IN_SYLLABUS"
                    topic_mapping = find_best_topic(q['question'], q['module'], syllabus_map)
                else:
                    status = "OUT_OF_SYLLABUS"
            
            # Importance
            importance = "LOW"
            if repeat_count >= 3: importance = "HIGH"
            elif repeat_count == 2: importance = "MEDIUM"
            
            final_list.append({
                "id": q_id,
                "module": q['module'],
                "topic": topic_mapping,
                "question": q['question'],
                "marks": q['marks'],
                "syllabus_status": status,
                "repeat_count": repeat_count,
                "sources": sorted(list(stats["sources"])),
                "importance": importance
            })
            seen_keys.add(key)
            q_id += 1
            
        # 5. Save Output
        with open(output_path, 'w', encoding='utf-8') as f:
            json.dump({"questions": final_list}, f, indent=2, ensure_ascii=False)
            
        print(f"DONE: {len(final_list)} unique questions finalized for {subject_dir.name}")

if __name__ == "__main__":
    process_questions()
