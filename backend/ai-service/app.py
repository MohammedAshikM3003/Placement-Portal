from typing import List, Optional

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel

from ats import check_ats
from grammar import fixGrammar
from resume import enhance_resume_text, generate_project_description
from feedback_engine.engine import make_concise
from student_filter_engine.engine import filter_students

app = FastAPI(title="Placement Portal Rule-Based AI Service")


class TextRequest(BaseModel):
    text: str


class StudentFilterRequest(BaseModel):
    prompt: str


class ResumeEnhanceRequest(BaseModel):
    text: Optional[str] = None
    items: Optional[List[str]] = None
    category: Optional[str] = None


class ResumeGenerateRequest(BaseModel):
    projectName: str
    technologies: Optional[List[str]] = None
    description: Optional[str] = None


class AtsCheckRequest(BaseModel):
    resumeText: str
    jobDescription: Optional[str] = ""


@app.get("/health")
async def health():
    return {"status": "ok"}


@app.post("/grammar/check")
async def grammar_check(payload: TextRequest):
    return fixGrammar(payload.text)


@app.post("/resume/enhance")
async def resume_enhance(payload: ResumeEnhanceRequest):
    if payload.items:
        enhanced = [enhance_resume_text(item, payload.category) for item in payload.items]
        return {"items": enhanced}
    if payload.text is None:
        raise HTTPException(status_code=400, detail="text is required")
    return {"original": payload.text, "enhanced": enhance_resume_text(payload.text, payload.category)}


@app.post("/resume/generate")
async def resume_generate(payload: ResumeGenerateRequest):
    return generate_project_description(payload.projectName, payload.technologies or [], payload.description or "")


@app.post("/ats/check")
async def ats_check(payload: AtsCheckRequest):
    return check_ats(payload.resumeText, payload.jobDescription or "")


@app.post("/feedback/concise")
async def feedback_concise(payload: TextRequest):
    if not payload.text:
        return {"original": "", "concise": ""}
    return {"original": payload.text, "concise": make_concise(payload.text)}


@app.post("/students/ai-filter")
async def students_ai_filter(payload: StudentFilterRequest):
    if not payload.prompt:
        raise HTTPException(status_code=400, detail="prompt is required")
    try:
        return filter_students(payload.prompt)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

