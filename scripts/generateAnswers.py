import json
import os
import sys
import re
import time
from pathlib import Path
from google import genai
from dotenv import load_dotenv

load_dotenv()

def index_notes_by_module(text):
    index = {}
    current_mod = None
    lines = text.split('\n')
    for line in lines:
        # Match "MODULE-1", "UNIT-1", "Module 1", etc.
        mod_match = re.search(r'(MODULE|UNIT)\s*[-–]?\s*(\d+)', line, re.IGNORECASE)
        if mod_match:
            current_mod = f"MODULE-{mod_match.group(2)}"
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
        output_dir = subject_dir / "outputs"
        
        questions_path = output_dir / "final_questions.json"
        notes_path = processed_dir / "notes.txt"
        output_path = output_dir / "questions_with_answers.json"

        if not questions_path.exists():
            continue

        print(f"\nGenerating answers for {subject_dir.name}...")

        try:
            with open(questions_path, 'r', encoding='utf-8') as f:
                questions_data = json.load(f).get('questions', [])
            with open(notes_path, 'r', encoding='utf-8') as f:
                raw_notes = f.read()
                notes_index = index_notes_by_module(raw_notes)
        except Exception as e:
            print(f"  ERROR: Could not load files: {e}")
            continue

        updated_questions = []
        stats = {
            "processed": 0,
            "generated": 0,
            "skipped": 0
        }

        print(f"  Processing {len(questions_data)} validated questions...")

        for q in questions_data:
            # Check validation status
            if q.get('notes_validation') != "CONFIRMED":
                stats["skipped"] += 1
                updated_questions.append(q)
                continue

            stats["processed"] += 1
            module = q.get('module', 'UNKNOWN')
            question_text = q.get('question', '')
            marks = q.get('marks', 'N/A')
            
            # Get module-specific notes
            notes_context = notes_index.get(module, "")
            if not notes_context:
                mod_num_match = re.search(r'(\d+)', module)
                if mod_num_match:
                    notes_context = notes_index.get(f"MODULE-{mod_num_match.group(1)}", "")
            
            notes_context = notes_context[:20000] 

            length_instr = ""
            try:
                marks_val = int(marks)
                if marks_val <= 2:
                    length_instr = "- Length: Approximately 2 concise lines."
                elif marks_val >= 8:
                    length_instr = "- Length: Very descriptive, minimum 10 lines. Cover EVERY relevant technical point found in the notes."
                else:
                    length_instr = "- Length: Descriptive and proportional to the marks provided."
            except:
                length_instr = "- Length: As descriptive as possible based on the available information in the notes."

            prompt = f"""
    You are an academic answering assistant.

    Exam Question:
    "{question_text}"

    Marks:
    {marks}

    Official Notes Context (Module {module}):
    \"\"\"{notes_context}\"\"\"

    Rules:
    - Use ONLY the information present in the provided notes context.
    - Do NOT add external knowledge.
    - Do NOT assume missing details.
    - If the answer is not fully supported by the notes, respond with "Not supported by notes".
    - For questions requiring diagrams or explanation with diagrams respond with "Refer notes for diagram" and provide the explanation part detailed strictly from the notes context.
    {length_instr}

    Output ONLY valid JSON:
    {{
      "answer": "answer text",
      "source": "notes"
    }}
    """
            try:
                # Call Gemini
                response = client.models.generate_content(
                    model='gemini-2.0-flash',
                    contents=prompt
                )

                res_text = response.text.strip()
                
                # Clean JSON
                if "```json" in res_text:
                    res_text = res_text.split("```json")[1].split("```")[0].strip()
                elif "```" in res_text:
                    res_text = res_text.split("```")[1].split("```")[0].strip()
                
                json_match = re.search(r'\{.*\}', res_text, re.DOTALL)
                if json_match:
                    res_text = json_match.group(0)

                ai_res = json.loads(res_text)
                q['answer'] = ai_res.get('answer', "No answer generated.")
                stats["generated"] += 1
                
                # Rate limit safety
                time.sleep(0.5)

            except Exception as e:
                print(f"    Error processing ID {q['id']}: {e}")
                q['answer'] = "Error during generation."

            updated_questions.append(q)

        with open(output_path, 'w', encoding='utf-8') as f:
            json.dump({"questions": updated_questions}, f, indent=2, ensure_ascii=False)

        print(f"  Generation complete for {subject_dir.name}!")
        print(f"  - Questions processed: {stats['processed']}")
        print(f"  - Answers generated: {stats['generated']}")
        print(f"  Output saved to: {output_path}")

if __name__ == "__main__":
    generate_answers()
