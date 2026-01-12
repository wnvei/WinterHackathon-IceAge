import os
import sys
import json
import re
from pathlib import Path

def parse_syllabus_hierarchical(text: str) -> dict:
    syllabus = {}
    lines = text.split('\n')
    clean_lines = []
    
    # Pre-processing: Remove obvious noise and document headers
    for line in lines:
        l = line.strip()
        if not l or l.startswith('--- Page') or l.startswith('FILE:') or l.startswith('====='):
            continue
        # Skip common headers that aren't content
        if re.match(r'^(Chapter|Section)\s+\d+:', l, re.IGNORECASE):
            continue
        clean_lines.append(l)
    
    clean_text = " ".join(clean_lines)
    clean_text = re.sub(r'\s+', ' ', clean_text) 
    
    # Universal Module/Unit pattern
    module_pattern = r'(Module\s*[-–]?\s*[IVX\d]+|Unit\s*[IVX\d]+|PART\s*[IVX\d]+)'
    
    # Stop words for ending syllabus extraction
    stop_words = [
        r'Course Outcomes:', 
        r'Articulation Matrix', 
        r'Textbooks?', 
        r'Reference Books?', 
        r'Suggested Learning Resources',
        r'Self Learning Component',
        r'Laboratory Experiments',
        r'Tutorials?'
    ]
    
    for stop_word in stop_words:
        stop_match = re.search(stop_word, clean_text, re.IGNORECASE)
        if stop_match:
            clean_text = clean_text[:stop_match.start()]
            break
            
    # Find all module starts
    matches = list(re.finditer(module_pattern, clean_text, re.IGNORECASE))
    
    if not matches:
        # Fallback: Treat the whole thing as one module if no structure found
        matches = [re.match(r'^', clean_text)] # Dummy match at start
    
    for i, match in enumerate(matches):
        start = match.start()
        end = matches[i+1].start() if i+1 < len(matches) else len(clean_text)
        block = clean_text[start:end].strip()
        
        # Split block into Header and Content
        # Typically Header ends with "hours)" or a colon, or after the module name itself
        header_match = re.search(module_pattern, block, re.IGNORECASE)
        if not header_match: continue
        
        header_end = header_match.end()
        
        # Look for "(0X hours)" or similar hour decorations
        hours_match = re.search(r'\(\s*\d+\s*(hours|hrs)\s*\)', block, re.IGNORECASE)
        if hours_match and hours_match.start() < header_end + 100:
            header_end = hours_match.end()
        else:
            # Look for the first major separator after the header
            first_sep = re.search(r'[:\-–]', block[header_end:header_end+50])
            if first_sep:
                header_end += first_sep.end()
              
        module_header = block[:header_end].strip().strip(':').strip('-').strip()
        module_content = block[header_end:].strip()
        
        # If header is too long, it probably leaked content
        if len(module_header) > 100:
             module_header = block[:header_match.end()].strip()
             module_content = block[header_match.end():].strip()

        topics_dict = {}
        
        # Robust topic splitting: Semicolons are best, then periods followed by Capitalized words
        # Also handle numbered lists like 1. Topic 2. Topic
        segments = re.split(r';|\.\s+(?=[A-Z])|\d+\.\s+(?=[A-Z])', module_content)
        
        for segment in segments:
            segment = segment.strip()
            if not segment or len(segment) < 4:
                continue
            
            # Remove trailing punctuation and common artifacts
            segment = segment.rstrip('.').rstrip(',')
            segment = re.sub(r'\(Ref:.*?\)', '', segment, flags=re.IGNORECASE).strip()
            segment = re.sub(r'Textbook\s*\d+.*$', '', segment, flags=re.IGNORECASE).strip()

            if not segment: continue

            # Check for "Topic: Subtopic1, Subtopic2"
            if ':' in segment:
                parts = segment.split(':', 1)
                topic_name = parts[0].strip()
                subtopics_str = parts[1].strip()
                
                # If topic name is just a common word like "Chapter", skip or merge
                if re.match(r'^(Topic|Chapter|Lesson|Unit)\b', topic_name, re.IGNORECASE):
                    # Try to use the first subtopic as the name
                    sub_parts = [s.strip() for s in subtopics_str.split(',') if s.strip()]
                    if sub_parts:
                        topic_name = sub_parts[0]
                        subtopics = sub_parts
                    else:
                        continue
                else:
                    subtopics = [s.strip() for s in subtopics_str.split(',') if s.strip()]
                
                if topic_name and subtopics:
                    topics_dict[topic_name] = subtopics
            else:
                # Direct topic
                if not re.search(r'^(Textbook|Reference|Author|Publisher)', segment, re.IGNORECASE):
                    topics_dict[segment] = [segment]
        
        if topics_dict:
            # Normalize module header for key consistency
            norm_header = re.sub(r'\s+', ' ', module_header).upper()
            syllabus[norm_header] = topics_dict
                
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
    
    target_subject = sys.argv[1] if len(sys.argv) > 1 else None

    if not data_dir.exists():
        print(f"Error: Data directory not found at {data_dir}")
        exit(1)
    
    subjects_found = 0
    for subject_dir in data_dir.iterdir():
        if not subject_dir.is_dir():
            continue
        
        if target_subject and subject_dir.name.lower() != target_subject.lower():
            continue

        subjects_found += 1
        print(f"\nProcessing syllabus for: {subject_dir.name}")
        
        processed_dir = subject_dir / "processed"
        syllabus_txt_path = processed_dir / "syllabus.txt"
        syllabus_json_path = processed_dir / "syllabus.json"
        
        if not syllabus_txt_path.exists():
            print(f"  Warning: syllabus.txt not found at {syllabus_txt_path}")
            continue
        
        with open(syllabus_txt_path, 'r', encoding='utf-8') as f:
            syllabus_text = f.read()
        
        print("  Parsing hierarchical content...")
        syllabus_dict = parse_syllabus_hierarchical(syllabus_text)
        
        if syllabus_dict:
            print(f"  Extracted {len(syllabus_dict)} modules.")
            save_syllabus_json(syllabus_dict, str(syllabus_json_path))
        else:
            print("  Warning: Could not extract structured syllabus data.")

    if subjects_found == 0:
        print(f"No subjects found to process.")

if __name__ == "__main__":
    main()
