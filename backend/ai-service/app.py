from typing import List, Optional

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel

from ats import check_ats
from grammar import fixGrammar
from resume import enhance_resume_text, generate_project_description

app = FastAPI(title="Placement Portal Rule-Based AI Service")


class TextRequest(BaseModel):
    text: str


class ResumeEnhanceRequest(BaseModel):
    text: Optional[str] = None
    items: Optional[List[str]] = None


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
        enhanced = [enhance_resume_text(item) for item in payload.items]
        return {"items": enhanced}
    if payload.text is None:
        raise HTTPException(status_code=400, detail="text is required")
    return {"original": payload.text, "enhanced": enhance_resume_text(payload.text)}


@app.post("/resume/generate")
async def resume_generate(payload: ResumeGenerateRequest):
    return generate_project_description(payload.projectName, payload.technologies or [], payload.description or "")


@app.post("/ats/check")
async def ats_check(payload: AtsCheckRequest):
    return check_ats(payload.resumeText, payload.jobDescription or "")
