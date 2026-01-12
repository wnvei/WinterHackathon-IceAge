import os
import sys
import json
import re
from pathlib import Path

def parse_syllabus_hierarchical(text: str) -> dict:
    syllabus = {}
    lines = text.split('\n')
    clean_lines = []
    for line in lines:
        l = line.strip()
        if not l or l.startswith('--- Page') or l.startswith('FILE:') or l.startswith('====='):
            continue
        if re.match(r'Chapter\s+\d+:', l, re.IGNORECASE):
            continue
        clean_lines.append(l)
    
    clean_text = " ".join(clean_lines)
    clean_text = re.sub(r'\s+', ' ', clean_text) 
    

    module_pattern = r'(Module\s*[-–]?\s*\d+|Unit\s*\d+)'
    
    stop_words = [
        r'A–Demonstration',
        r'B–Exercise',
        r'C–Structured Enquiry',
        r'D–Open Ended Experiments',
        r'Course Outcomes:', 
        r'Articulation Matrix', 
        r'Textbooks?', 
        r'Reference Books?', 
        r'Suggested Learning Resources'
    ]
    for stop_word in stop_words:
        stop_match = re.search(stop_word, clean_text, re.IGNORECASE)
        if stop_match:
            clean_text = clean_text[:stop_match.start()]
            break
            
    # Get all start positions of modules
    starts = [m.start() for m in re.finditer(module_pattern, clean_text, re.IGNORECASE)]
    
    for i in range(len(starts)):
        end = starts[i+1] if i+1 < len(starts) else len(clean_text)
        block = clean_text[starts[i]:end].strip()
        
        # Split block into Header and Content
        module_match = re.search(module_pattern, block, re.IGNORECASE)
        header_end = module_match.end()
        
        # Look for "(0X hours)"
        hours_match = re.search(r'\(\s*\d+\s*hours\s*\)', block, re.IGNORECASE)
        
        if hours_match:
            header_end = hours_match.end()
        else:
            # Fallback for modules without hours: look for first colon
            first_colon = block.find(':')
            if first_colon != -1:
                header_end = min(header_end + 40, first_colon)
            else:
                header_end = min(len(block), header_end + 40)
             
        # Extract Module Header
        module_header = block[:header_end].strip()
        module_content = block[header_end:].strip()
        
        # If the first topic is merged into header (no colon yet), 
        # try to split if we see a clear topic-like start
        if module_content and not module_content.startswith((':', ';')):
            # If the first word of content is capitalized and followed by colon later
            pass

        topics_dict = {}
        
        # Split module content into segments by semicolon or period (if not in middle of word)
        segments = re.split(r';|\.\s+(?=[A-Z])', module_content)
        
        for segment in segments:
            segment = segment.strip()
            # Filter out segments that start with/are just "Textbook" or "Chapter"
            if not segment or len(segment) < 3:
                continue
            if re.match(r'^(Textbook|Chapter|Ref)\b', segment, re.IGNORECASE):
                continue
                
            # Remove trailing periods and leaked textbook references from within the text
            segment = segment.rstrip('.')
            segment = re.sub(r'\s*Textbook\s*\d+.*$', '', segment, flags=re.IGNORECASE).strip()
            
            if not segment: continue

            # Check for "Topic: Subtopic1, Subtopic2"
            if ':' in segment:
                parts = segment.split(':', 1)
                topic_name = parts[0].strip()
                subtopics_str = parts[1].strip()
                if re.match(r'^(Textbook|Chapter)\b', topic_name, re.IGNORECASE):
                    continue
                subtopics = []
                for s in subtopics_str.split(','):
                    s_clean = s.strip()
                    # Skip if subtopic is just a number or textbook ref
                    if s_clean and not re.match(r'^\d+$', s_clean) and not re.search(r'Textbook|Chapter', s_clean, re.IGNORECASE):
                        subtopics.append(s_clean)
                
                if subtopics:
                    topics_dict[topic_name] = subtopics
            else:
                # If it's a long segment without a colon, it's just a topic
                # Filter out generic page-leaked chapters or textbook headers
                if not re.search(r'Textbook|Chapter', segment, re.IGNORECASE):
                    topics_dict[segment] = [segment]
        
        if topics_dict:
            syllabus[module_header] = topics_dict
                
    return syllabus

def save_syllabus_json(syllabus_dict: dict, output_path: str):
    try:
        os.makedirs(os.path.dirname(output_path), exist_ok=True)
        with open(output_path, 'w', encoding='utf-8') as f:
            json.dump(syllabus_dict, f, indent=2, ensure_ascii=False)
        print(f"Successfully saved syllabus JSON to: {output_path}")
    except Exception as e:
        print(f"Error saving JSON file: {e}")
        exit(1)

def main():
    base_dir = Path(__file__).parent.parent
    data_dir = base_dir / "Subject"
    
    # Check for targeted subject argument
    target_subject = sys.argv[1] if len(sys.argv) > 1 else None

    if not data_dir.exists():
        print(f"Error: Data directory not found at {data_dir}")
        exit(1)
    
    for subject_dir in data_dir.iterdir():
        if not subject_dir.is_dir():
            continue
        
        # If a target subject is specified, skip others
        if target_subject and subject_dir.name.lower() != target_subject.lower():
            continue

        print(f"\nProcessing subject: {subject_dir.name}")
        
        processed_dir = subject_dir / "processed"
        syllabus_txt_path = processed_dir / "syllabus.txt"
        syllabus_json_path = processed_dir / "syllabus.json"
        
        if not syllabus_txt_path.exists():
            print(f"Warning: syllabus.txt not found at {syllabus_txt_path}")
            continue
        
        print(f"Loading syllabus from: {syllabus_txt_path}")
        with open(syllabus_txt_path, 'r', encoding='utf-8') as f:
            syllabus_text = f.read()
        
        print("Parsing syllabus hierarchically...")
        syllabus_dict = parse_syllabus_hierarchical(syllabus_text)
        
        if syllabus_dict:
            print(f"Extracted {len(syllabus_dict)} modules.")
            save_syllabus_json(syllabus_dict, str(syllabus_json_path))
        else:
            print("Warning: Could not extract structured syllabus data.")

if __name__ == "__main__":
    main()
