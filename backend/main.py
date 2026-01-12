from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import json
import os
from pathlib import Path
from typing import List, Dict

app = FastAPI(title="IceAge API", description="AI-powered Exam Preparation Platform")

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

BASE_DIR = Path(__file__).resolve().parent.parent
SUBJECTS_DIR = BASE_DIR / "Subject"

@app.get("/")
def read_root():
    return {"message": "Welcome to IceAge API", "status": "online"}

@app.get("/subjects")
def get_subjects():
    if not SUBJECTS_DIR.exists():
        return []
    subjects = [d.name for d in SUBJECTS_DIR.iterdir() if d.is_dir()]
    return sorted(subjects)

@app.get("/subjects/{subject_name}/questions")
def get_questions(subject_name: str):
    q_path = SUBJECTS_DIR / subject_name / "outputs" / "questions_with_answers.json"
    if not q_path.exists():
        # Fallback to validated_questions if answers aren't generated yet
        q_path = SUBJECTS_DIR / subject_name / "processed" / "validated_questions.json"
        
    if not q_path.exists():
        raise HTTPException(status_code=404, detail="Questions not found for this subject")
    
    with open(q_path, "r", encoding="utf-8") as f:
        data = json.load(f)
    return data

@app.get("/subjects/{subject_name}/importance")
def get_importance(subject_name: str):
    i_path = SUBJECTS_DIR / subject_name / "outputs" / "topic_importance.json"
    if not i_path.exists():
        raise HTTPException(status_code=404, detail="Importance data not found")
    
    with open(i_path, "r", encoding="utf-8") as f:
        data = json.load(f)
    return data

@app.get("/subjects/{subject_name}/syllabus")
def get_syllabus(subject_name: str):
    s_path = SUBJECTS_DIR / subject_name / "processed" / "syllabus.json"
    if not s_path.exists():
        raise HTTPException(status_code=404, detail="Syllabus not found")
    
    with open(s_path, "r", encoding="utf-8") as f:
        data = json.load(f)
    return data

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)