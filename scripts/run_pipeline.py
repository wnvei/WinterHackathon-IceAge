import os
import sys
import json
import logging
import subprocess
from pathlib import Path

# Configure logging for clear pipeline visibility
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    datefmt='%H:%M:%S'
)
logger = logging.getLogger("Pipeline")

def run_pipeline():
    # 1. Subject Discovery
    base_dir = Path(__file__).resolve().parent.parent
    data_dir = base_dir / "Subject"
    
    target_subject = sys.argv[1].strip() if len(sys.argv) > 1 else None
    
    subjects_to_process = []
    if target_subject:
        subjects_to_process = [target_subject]
    else:
        if not data_dir.exists():
            logger.error(f"Data directory not found at {data_dir}")
            sys.exit(1)
        subjects_to_process = [d.name for d in data_dir.iterdir() if d.is_dir()]

    # 2. Manifest Loading
    manifest_path = base_dir / "manifest.json"
    manifest = {}
    if manifest_path.exists():
        try:
            with open(manifest_path, 'r', encoding='utf-8') as f:
                manifest = json.load(f)
        except (json.JSONDecodeError, IOError):
            logger.warning("Manifest file corrupted. Starting fresh.")
            manifest = {}

    # 3. Process Each Subject
    for subject in subjects_to_process:
        subject_dir = data_dir / subject
        raw_dir = subject_dir / "raw"
        
        if manifest.get(subject) == "READY":
            logger.info(f"Subject '{subject}' is already READY. Skipping.")
            continue

        logger.info(f"🚀 Processing subject: {subject}")

        # Validation
        required_raw = ["Notes", "Question Papers", "Syllabus"]
        valid = True
        for r_folder in required_raw:
            folder_path = raw_dir / r_folder
            if not folder_path.exists() or not folder_path.is_dir() or not any(folder_path.iterdir()):
                logger.warning(f"Incomplete raw data for '{subject}' (missing {r_folder}). Skipping.")
                valid = False
                break
        
        if not valid:
            continue

        # Prepare folders
        (subject_dir / "processed").mkdir(exist_ok=True)
        (subject_dir / "outputs").mkdir(exist_ok=True)

        # Execution Sequence
        pipeline_sequence = [
            "extractText.py",
            "generateSyllabusJSON.py",
            "processQuestions.py",
            "validateQuestions.py",
            "finalizeQuestions.py",
            "analyzeTopicImportance.py",
            "generateAnswers.py"
        ]

        success = True
        for script_name in pipeline_sequence:
            script_path = base_dir / "scripts" / script_name
            if not script_path.exists():
                logger.error(f"Script not found: {script_name}")
                success = False
                break
                
            logger.info(f"  Executing: {script_name}...")
            try:
                subprocess.run([sys.executable, str(script_path), subject], check=True, cwd=str(base_dir))
            except subprocess.CalledProcessError:
                logger.error(f"  FAILED at step: {script_name}")
                success = False
                break
        
        if success:
            manifest[subject] = "READY"
            with open(manifest_path, 'w', encoding='utf-8') as f:
                json.dump(manifest, f, indent=4)
            logger.info(f"Successfully processed {subject}")
        else:
            logger.error(f"Aborted pipeline for {subject}")

if __name__ == "__main__":
    run_pipeline()
