import json
import os
import sys
import re
import time
from pathlib import Path
from google import genai
from dotenv import load_dotenv

# Load environment variables from .env
load_dotenv()

def index_notes_by_module(text):
    index = {}
    current_mod = None
    lines = text.split('\n')
    for line in lines:
        mod_match = re.search(r'(MODULE|UNIT)\s*[-–]?\s*(\d+)', line, re.IGNORECASE)
        if mod_match:
            current_mod = f"MODULE-{mod_match.group(2)}"
            if current_mod not in index: index[current_mod] = ""
        if current_mod:
            index[current_mod] += " " + line
    return index

def get_allowed_topics(syllabus_data, module_name):
    if module_name is None: return []
    topics = []
    mod_num_match = re.search(r'(\d+)', module_name)
    if not mod_num_match: return []
    target_num = mod_num_match.group(1)

    for full_mod_key, categories in syllabus_data.items():
        if re.search(r'(?:MODULE|UNIT)\s*[-–]?\s*' + target_num, full_mod_key, re.IGNORECASE):
            for category, subtopics in categories.items():
                topics.append(category)
                topics.extend(subtopics)
            break
    return list(set(topics))

def validate_questions():
    # 1. Initialize Client
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        print("ERROR: GEMINI_API_KEY environment variable not set.")
        return

    client = genai.Client(api_key=api_key)

    # 2. Iterate through all subjects in Subject/
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
        
        questions_path = processed_dir / "questions.json"
        syllabus_path = processed_dir / "syllabus.json"
        notes_path = processed_dir / "notes.txt"
        output_path = processed_dir / "validated_questions.json"

        if not questions_path.exists() or not syllabus_path.exists():
            continue

        print(f"\nAI Validation for {subject_dir.name}...")

        # 3. Load Files
        try:
            with open(questions_path, 'r', encoding='utf-8') as f:
                questions_data = json.load(f).get('questions', [])
            with open(syllabus_path, 'r', encoding='utf-8') as f:
                syllabus_data = json.load(f)
            with open(notes_path, 'r', encoding='utf-8') as f:
                notes_index = index_notes_by_module(f.read())
        except FileNotFoundError as e:
            print(f"  ERROR: Missing input file: {e}")
            continue

        # 4. Filter and Process
        updated_questions = []
        stats = {
            "CONFIRMED": 0,
            "REASSIGNED": 0,
            "UNKNOWN": 0,
            "NOTES_CONFIRMED": 0,
            "NOT_FOUND": 0,
            "ERRORS": 0
        }

        print(f"  Processing {len(questions_data)} questions via Gemini...")

        for q in questions_data:
            module = q.get('module', 'UNKNOWN')
            allowed_topics = get_allowed_topics(syllabus_data, module)
            
            if not allowed_topics:
                q['topic_validation'] = 'UNKNOWN'
                q['notes_validation'] = 'ERROR'
                q['final_topic'] = q.get('topic')
                updated_questions.append(q)
                stats["UNKNOWN"] += 1
                continue

            # Get module-specific notes
            notes_context = notes_index.get(module, "")
            # Truncate for prompt safety if very large
            notes_context = notes_context[:30000]

            prompt = f"""
    You are an academic expert. 
    Question: "{q['question']}"
    Assigned Module: {module}
    Allowed topics for this module: {json.dumps(allowed_topics)}

    Grounding Context (Official Notes):
    \"\"\"{notes_context}\"\"\"

    Task:
    1. Topic Correction: Select the most accurate topic from the "Allowed topics" list above. If the original topic "{q['topic']}" is perfect, keep it. If another topic from the allowed list is more accurate, select it.
    2. Notes Validation: Check if the concept required to answer this question is present in the provided "Grounding Context".

    Output:
    Return ONLY a valid JSON object in the exact format below.

    {{
    "final_topic": "exact topic name or null",
    "notes_validation": "CONFIRMED | NOT_FOUND"
    }}
    """
            try:
                # Call Gemini using new SDK
                response = client.models.generate_content(
                    model='gemini-2.0-flash',
                    contents=prompt
                )
                
                res_text = response.text.strip()
                # Simple cleaning in case of markdown
                if "```json" in res_text:
                    res_text = res_text.split("```json")[1].split("```")[0].strip()
                
                ai_res = json.loads(res_text)
                
                # Logic for topic_validation status
                final_t = ai_res.get('final_topic')
                orig_t = q.get('topic')

                if final_t == orig_t:
                    q['topic_validation'] = 'CONFIRMED'
                    stats["CONFIRMED"] += 1
                elif final_t in allowed_topics:
                    q['topic_validation'] = 'REASSIGNED'
                    stats["REASSIGNED"] += 1
                else:
                    q['topic_validation'] = 'UNKNOWN'
                    stats["UNKNOWN"] += 1

                q['final_topic'] = final_t
                q['notes_validation'] = ai_res.get('notes_validation', 'NOT_FOUND')
                
                if q['notes_validation'] == 'CONFIRMED':
                    stats["NOTES_CONFIRMED"] += 1
                else:
                    stats["NOT_FOUND"] += 1

            except Exception as e:
                print(f"    Error processing ID {q['id']}: {e}")
                q['topic_validation'] = 'ERROR'
                q['notes_validation'] = 'ERROR'
                q['final_topic'] = q.get('topic')
                stats["ERRORS"] += 1

            updated_questions.append(q)
            # Short sleep to avoid rate limiting
            time.sleep(0.5)

        # 5. Save Results
        with open(output_path, 'w', encoding='utf-8') as f:
            json.dump({"questions": updated_questions}, f, indent=2, ensure_ascii=False)

        # 6. Final Summary
        print(f"  Validation complete for {subject_dir.name}!")
        print(f"  - Confirmed Topics: {stats['CONFIRMED']}")
        print(f"  - Reassigned Topics: {stats['REASSIGNED']}")
        print(f"  - Unknown/Errors: {stats['UNKNOWN'] + stats['ERRORS']}")
        print(f"  - Verified In Notes: {stats['NOTES_CONFIRMED']}")
        print(f"  - Missing From Notes: {stats['NOT_FOUND']}")
        print(f"  Output saved to: {output_path}")

if __name__ == "__main__":
    validate_questions()