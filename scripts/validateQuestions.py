import json
import os
import sys
import re
import time
import random
from pathlib import Path
from google import genai
from dotenv import load_dotenv
from collections import defaultdict

# Load environment variables from .env
load_dotenv()

def roman_to_int(s):
    rom_val = {'I': 1, 'V': 5, 'X': 10, 'L': 50, 'C': 100, 'D': 500, 'M': 1000}
    int_val = 0
    for i in range(len(s)):
        if i > 0 and rom_val[s[i]] > rom_val[s[i-1]]:
            int_val += rom_val[s[i]] - 2 * rom_val[s[i-1]]
        else:
            int_val += rom_val[s[i]]
    return int_val

def normalize_module_name(name):
    if name is None: return None
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

def index_notes_by_module(text):
    index = {}
    current_mod = None
    lines = text.split('\n')
    for line in lines:
        mod_match = re.search(r'(MODULE|UNIT|PART)\s*[-–]?\s*([IVX\d]+)', line, re.IGNORECASE)
        if mod_match:
            current_mod = normalize_module_name(line)
            if current_mod not in index: index[current_mod] = ""
        if current_mod:
            index[current_mod] += " " + line
    return index

def get_allowed_topics(syllabus_data, module_name):
    if not module_name: return []
    norm_target = normalize_module_name(module_name)
    
    for full_mod_key, topics_info in syllabus_data.items():
        if normalize_module_name(full_mod_key) == norm_target:
            allowed = []
            for topic, subtopics in topics_info.items():
                allowed.append(topic)
                allowed.extend(subtopics)
            return list(set(allowed))
    return []

def validate_questions():
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        print("ERROR: GEMINI_API_KEY environment variable not set.")
        return

    client = genai.Client(api_key=api_key)
    base_dir = Path(__file__).resolve().parent.parent
    data_dir = base_dir / "Subject"
    
    target_subject = sys.argv[1] if len(sys.argv) > 1 else None

    if not data_dir.exists():
        print(f"Error: Data directory not found at {data_dir}")
        return

    for subject_dir in data_dir.iterdir():
        if not subject_dir.is_dir(): continue
        if target_subject and subject_dir.name.lower() != target_subject.lower(): continue

        processed_dir = subject_dir / "processed"
        questions_path = processed_dir / "questions.json"
        syllabus_path = processed_dir / "syllabus.json"
        notes_path = processed_dir / "notes.txt"
        output_path = processed_dir / "validated_questions.json"

        if not questions_path.exists() or not syllabus_path.exists() or not notes_path.exists():
            print(f"Skipping {subject_dir.name}: Missing core files.")
            continue

        print(f"\nAI Validation for {subject_dir.name}...")

        with open(questions_path, 'r', encoding='utf-8') as f:
            questions_data = json.load(f).get('questions', [])
        with open(syllabus_path, 'r', encoding='utf-8') as f:
            syllabus_data = json.load(f)
        with open(notes_path, 'r', encoding='utf-8') as f:
            full_notes = f.read()

        updated_questions = []
        stats = defaultdict(int)

        for q in questions_data:
            module = q.get('module') or "UNKNOWN"
            # If module is unknown, we give the AI the full syllabus keys to pick from
            syllabus_summary = {}
            for m_key, m_info in syllabus_data.items():
                syllabus_summary[m_key] = list(m_info.keys())

            notes_context = full_notes

            prompt = f"""
            Task: Deep clean and validate an academic question.
            
            Raw Question: "{q['question']}"
            Stated Marks: {q.get('marks') or "null"}
            Stated Module: {module}
            
            Syllabus (Available Modules & Topics):
            {json.dumps(syllabus_summary, indent=2)}
            
            Context (Notes for grounding):
            \"\"\"{notes_context}\"\"\"

            Rules:
            1. is_junk: If the 'Raw Question' is just noise, a header, or an instruction (e.g., "Answer any five"), set to true.
            2. cleaned_question: Rewrite the question as a clear, professional English sentence. Remove only the non-text "fluff" / metadata (e.g., "L2", "CO1", "PO6", "10 Marks", "(a)", "Q.No"). Keep the actual question text and command verbs.
            3. module: IGNORE 'Stated Module' if incorrect. Match the question content to the 'Syllabus' keys provided. Output the exact Module key (e.g., "MODULE-1").
            4. topic: Maps to the most relevant topic key from the syllabus for that module. MANDATORY: Must be one of the keys or sub-keys from the provided syllabus. Do NOT return null.
            5. marks: Inferred marks (integer) if missing, based on question complexity (2, 5, or 8).
            6. notes_validation:
               - 'CONFIRMED': The answer is explicitly or implicitly present in the Context. Semantic matches (diction vs phrasing) are ACCEPTABLE.
               - 'PARTIAL': The core concept is mentioned, but specific details/list items asked for might be missing.
               - 'NOT_FOUND': The concept is completely absent from the notes.
            7. syllabus_status: If you can map it to a module/topic, return "IN_SYLLABUS". Else "OUT_OF_SYLLABUS".

            Output JSON Format:
            {{
                "is_junk": boolean,
                "cleaned_question": "string",
                "module": "string",
                "topic": "string",
                "marks": integer,
                "notes_validation": "CONFIRMED | PARTIAL | NOT_FOUND",
                "syllabus_status": "IN_SYLLABUS | OUT_OF_SYLLABUS"
            }}
            """
            # Backoff Logic
            max_retries = 5
            base_delay = 5
            
            ai_res = None
            for attempt in range(max_retries):
                try:
                    response = client.models.generate_content(
                        model='gemini-2.0-flash',
                        contents=prompt,
                        config={"response_mime_type": "application/json"}
                    )
                    ai_res = json.loads(response.text.strip())
                    break # Success
                except Exception as e:
                    if "429" in str(e) or "RESOURCE_EXHAUSTED" in str(e):
                        if attempt < max_retries - 1:
                            wait_time = base_delay * (2 ** attempt) + random.uniform(0, 2)
                            print(f"  Rate limited. Retrying in {wait_time:.1f}s...")
                            time.sleep(wait_time)
                        else:
                            print(f"Error validating {q['id']} after retries: {e}")
                            stats["ERROR"] += 1
                    else:
                        print(f"Error validating {q['id']}: {e}")
                        stats["ERROR"] += 1
                        break

            if not ai_res:
                continue

            if isinstance(ai_res, list):
                ai_res = ai_res[0] if ai_res else {}

            if ai_res.get('is_junk'):
                stats["JUNK"] += 1
                continue

            q['question'] = ai_res.get('cleaned_question', q['question'])
            q['module'] = normalize_module_name(ai_res.get('module', q['module']))
            q['topic'] = ai_res.get('topic', q.get('topic'))
            q['marks'] = ai_res.get('marks', q.get('marks'))
            q['notes_validation'] = ai_res.get('notes_validation', 'NOT_FOUND')
            q['syllabus_status'] = ai_res.get('syllabus_status', "IN_SYLLABUS")

            if q['notes_validation'] == 'CONFIRMED': stats["VERIFIED"] += 1
            elif q['notes_validation'] == 'PARTIAL': stats["VERIFIED"] += 1 # Count partial as verified for stats
            stats["VALID"] += 1
                
            updated_questions.append(q)
            time.sleep(0.3)

        with open(output_path, 'w', encoding='utf-8') as f:
            json.dump({"questions": updated_questions}, f, indent=2, ensure_ascii=False)

        print(f"  Done. Valid: {stats['VALID']}, Verified in Notes: {stats['VERIFIED']}, Junk Filtered: {stats['JUNK']}, Errors: {stats['ERROR']}")

if __name__ == "__main__":
    validate_questions()
