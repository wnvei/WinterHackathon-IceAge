import json
import os
import sys
from pathlib import Path

def finalize_questions():
    base_dir = Path(__file__).parent.parent
    data_dir = base_dir / "Subject"
    
    # Check for targeted subject argument in pipeline script
    target_subject = sys.argv[1] if len(sys.argv) > 1 else None

    for subject_dir in data_dir.iterdir():
        if not subject_dir.is_dir():
            continue   
        # If a target subject is specified, skip others
        if target_subject and subject_dir.name.lower() != target_subject.lower():
            continue

        processed_dir = subject_dir / "processed"
        output_dir = subject_dir / "outputs"
        
        input_path = processed_dir / "validated_questions.json"
        output_path = output_dir / "final_questions.json"

        if not input_path.exists():
            continue

        print(f"\nFinalizing questions for {subject_dir.name}...")
        output_dir.mkdir(parents=True, exist_ok=True)
        with open(input_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
            questions = data.get('questions', [])

        final_list = [
            q for q in questions 
            if q.get('syllabus_status') == "IN_SYLLABUS" 
            and q.get('notes_validation') == "CONFIRMED"
        ]
        with open(output_path, 'w', encoding='utf-8') as f:
            json.dump({"questions": final_list}, f, indent=2, ensure_ascii=False)

        print(f"  Successfully finalized {len(final_list)} questions.")
        print(f"  Output saved to: {output_path}")

if __name__ == "__main__":
    finalize_questions()
