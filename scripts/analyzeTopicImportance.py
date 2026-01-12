import json
import os
import sys
from pathlib import Path

def analyze_importance():
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

        output_dir = subject_dir / "outputs"       
        input_path = output_dir / "final_questions.json"
        output_path = output_dir / "topic_importance.json"

        if not input_path.exists():
            continue

        print(f"\nAnalyzing topic importance for {subject_dir.name}...")

        with open(input_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
            questions = data.get('questions', [])

        # Aggregate
        # Key format: (module, topic) to ensure uniqueness if topics repeat across modules
        topic_map = {}

        for q in questions:
            topic = q.get('topic') or q.get('final_topic')
            module = q.get('module')
            importance = q.get('importance', 'LOW').upper()
            
            if not topic:
                continue

            key = (module, topic)
            if key not in topic_map:
                topic_map[key] = {
                    "topic": topic,
                    "module": module,
                    "question_count": 0,
                    "score": 0
                }
            
            topic_map[key]["question_count"] += 1
            
            if importance == "HIGH":
                topic_map[key]["score"] += 2
            elif importance == "MEDIUM":
                topic_map[key]["score"] += 1

        # Final logic for topic-level importance rating (PER MODULE)
        # This ensures each module has its own representative HIGH/MEDIUM/LOW topics
        module_groups = {}
        for item in topic_map.values():
            mod = item["module"]
            if mod not in module_groups:
                module_groups[mod] = []
            module_groups[mod].append(item)

        final_topics = []
        
        # Process each module group independently
        for mod, items in module_groups.items():
            # Sort topics within the module by score descending
            sorted_items = sorted(items, key=lambda x: x['score'], reverse=True)
            total_in_mod = len(sorted_items)
            
            if total_in_mod > 0:
                high_idx = max(1, int(total_in_mod * 0.15))
                med_idx = max(high_idx + 1, int(total_in_mod * 0.60))

                for idx, item in enumerate(sorted_items):
                    if idx < high_idx:
                        item["importance"] = "HIGH"
                    elif idx < med_idx:
                        item["importance"] = "MEDIUM"
                    else:
                        item["importance"] = "LOW"
                    
                    final_topics.append(item)

        final_topics.sort(key=lambda x: (x['module'], -x['score']))

        with open(output_path, 'w', encoding='utf-8') as f:
            json.dump({"topics": final_topics}, f, indent=2, ensure_ascii=False)

        print(f"  Processed {len(final_topics)} topics.")
        print(f"  Output saved to: {output_path}")

if __name__ == "__main__":
    analyze_importance()
