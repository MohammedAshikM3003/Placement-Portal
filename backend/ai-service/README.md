# Placement Portal Rule-Based AI Service

This FastAPI service provides rule-based NLP features for grammar correction, resume enhancement, resume generation, and ATS checks.

## Endpoints

- GET /health
- POST /grammar/check
- POST /resume/enhance
- POST /resume/generate
- POST /ats/check

## Local Run

1. Create a virtual environment and install dependencies.
2. Start the service:

```bash
uvicorn app:app --host 0.0.0.0 --port 7860
```

## Docker

```bash
docker build -t placement-portal-ai-service .
docker run -p 7860:7860 placement-portal-ai-service
```

## Request Examples

Grammar check:

```json
{ "text": "this is a test" }
```

Resume enhance:

```json
{ "text": "I worked on placement portal project" }
```

Resume generate:

```json
{ "projectName": "Placement Portal", "technologies": ["React", "Node.js"], "description": "Built a placement platform" }
```

ATS check:

```json
{ "resumeText": "...", "jobDescription": "..." }
```
