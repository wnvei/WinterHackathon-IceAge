import json
import os
import sys
import re
import time
import random
from pathlib import Path
from google import genai
from dotenv import load_dotenv

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

def generate_answers():
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        print("ERROR: GEMINI_API_KEY environment variable not set.")
        return

    client = genai.Client(api_key=api_key)
    base_dir = Path(__file__).resolve().parent.parent
    data_dir = base_dir / "Subject"
    
    target_subject = sys.argv[1] if len(sys.argv) > 1 else None

    for subject_dir in data_dir.iterdir():
        if not subject_dir.is_dir(): continue
        if target_subject and subject_dir.name.lower() != target_subject.lower(): continue

        processed_dir = subject_dir / "processed"
        output_dir = subject_dir / "outputs"
        
        questions_path = processed_dir / "validated_questions.json"
        notes_path = processed_dir / "notes.txt"
        output_path = output_dir / "questions_with_answers.json"

        if not questions_path.exists() or not notes_path.exists():
            continue

        print(f"\nGenerating answers for {subject_dir.name}...")
        output_dir.mkdir(parents=True, exist_ok=True)

        with open(questions_path, 'r', encoding='utf-8') as f:
            questions_data = json.load(f).get('questions', [])
        with open(notes_path, 'r', encoding='utf-8') as f:
            notes_context = f.read() # Use FULL notes context

        updated_questions = []
        gen_count = 0

        for q in questions_data:
            # Skip only if explicitly NOT_FOUND (and even then, we might want to double check, but let's trust validation for now)
            # Actually, let's try to answer everything that isn't junk, trusting the prompt to say "Not supported" if needed.
            
            module = q.get('module')
            q_text = q.get('question')
            marks = q.get('marks') or "N/A"
            validation_status = q.get('notes_validation', 'UNKNOWN')
            
            # Context is now the full file
            
            length_instr = "Provide a concise answer."
            try:
                m_val = int(marks)
                if m_val <= 2: length_instr = "Answer in exactly 1-2 sentences."
                elif m_val >= 8: length_instr = "Provide a very detailed technical explanation (minimum 10 points/lines) covering all relevant details from the notes."
                else: length_instr = f"Provide a descriptive answer suitable for {m_val} marks."
            except: pass

            prompt = f"""
            Task: Answer the Exam Question using ONLY the provided Notes Context.
            
            Question: "{q_text}"
            Marks: {marks}
            Module: {module} (Use as a hint, but search ANYWHERE in notes)
            Validation Status: {validation_status}
            
            Notes Context:
            \"\"\"{notes_context}\"\"\"

            Rules:
            1. Source of Truth: Use ONLY the provided Notes Context.
            2. Semantic Matching: If exact keywords are missing but the *concept* is explained (even using different terms), ANSWER IT.
            3. Partial Answers: If only part of the answer is found, provide what is available and clearly state "Based on the notes, here is the available information...".
            4. Not Found: ONLY if the concept is completely absent, respond "Not supported by notes".
            5. Diagrams: If a diagram is mentioned/needed, say "Refer notes for diagram" and describe what it should show based on text.
            6. Formatting: {length_instr}
            
            Output JSON:
            {{
                "answer": "string",
                "source": "notes"
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
                    break
                except Exception as e:
                    if "429" in str(e) or "RESOURCE_EXHAUSTED" in str(e):
                        if attempt < max_retries - 1:
                            wait_time = base_delay * (2 ** attempt) + random.uniform(0, 2)
                            print(f"  Rate limited. Retrying in {wait_time:.1f}s...")
                            time.sleep(wait_time)
                    else:
                        print(f"Error generating answer for {q['id']}: {e}")
                        break
            
            if ai_res:
                q['answer'] = ai_res.get('answer', "No answer generated.")
                gen_count += 1
            else:
                q['answer'] = "Error during generation."

            updated_questions.append(q)
            time.sleep(0.4)

        with open(output_path, 'w', encoding='utf-8') as f:
            json.dump({"questions": updated_questions}, f, indent=2, ensure_ascii=False)

        print(f"  Done. Generated {gen_count} answers for {subject_dir.name}.")

if __name__ == "__main__":
    generate_answers()
