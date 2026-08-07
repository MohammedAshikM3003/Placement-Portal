# Marksheet OCR Service Setup

This service uses **PaddleOCR** to extract student info and subject tables from:
- **Result Sheet** PDFs (temporary exam results)
- **Original Marksheet / Grade Sheet** (official documents)

## Architecture

```
Frontend (React)
    ↓ Upload PDF
Node.js Backend (:5000)
    ↓ Forward file
Python OCR Service (:5001)
    ↓ PaddleOCR + Regex Parser
    ↓ Return JSON
Frontend auto-fills Blue Card + Table
```

## Prerequisites

- **Python 3.8+** installed
- **Poppler** (for PDF→image conversion)

### Install Poppler

**Windows:**
1. Download from https://github.com/oschwartz10612/poppler-windows/releases
2. Extract to `C:\poppler`
3. Add `C:\poppler\Library\bin` to your system PATH

**macOS:**
```bash
brew install poppler
```

**Linux (Ubuntu/Debian):**
```bash
sudo apt-get install poppler-utils
```

## Setup

```bash
cd backend/ocr-service

# Create virtual environment (recommended)
python -m venv venv

# Activate it
# Windows:
venv\Scripts\activate
# Linux/macOS:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

> **Note:** First run will download PaddleOCR models (~150MB). This is a one-time download.

## Run the OCR Service

```bash
python ocr_server.py
```

The service starts on **port 5001** by default.  
Set `OCR_PORT` environment variable to change it.

## API Endpoints

### `POST /parse-marksheet`

Upload a PDF or image file for OCR extraction.

**Request:** `multipart/form-data` with `file` field

**Response:**
```json
{
  "success": true,
  "document_type": "result_sheet",
  "student_info": {
    "name": "Mohammed Ashik M",
    "register_number": "73152313074",
    "date_of_birth": "30-03-2006",
    "programme": "B.E Computer Science And Engineering",
    "semester": 5,
    "sgpa": "7.127",
    "cgpa": "7.916",
    "exam_month_year": "Dec 2024"
  },
  "subjects": [
    {
      "sno": 1,
      "semester": 5,
      "courseCode": "20CS511",
      "courseName": "Principles Of Compiler Design",
      "grade": "B+",
      "result": "P"
    }
  ]
}
```

### `GET /health`

Health check endpoint. Returns `{"status": "ok"}`.

## How It Works

1. **Upload** — PDF or image file received
2. **Convert** — PDF pages converted to images using `pdf2image`
3. **OCR** — PaddleOCR extracts text with position coordinates
4. **Detect Type** — Keywords identify Result Sheet vs Original Marksheet
5. **Extract Info** — Regex patterns pull student details (name, reg no, SGPA, etc.)
6. **Extract Table** — Course code patterns identify subject rows; nearby text clustered into columns
7. **Return JSON** — Structured data sent back to frontend

## Document Type Detection

| Document | Keywords Detected |
|----------|-------------------|
| Result Sheet | "UG & PG END SEMESTER", "PROVISIONAL RESULT" |
| Original Marksheet | "GRADE SHEET", "STATEMENT OF MARKS", "CHOICE BASED CREDIT SYSTEM" |

## Supported File Types

- PDF (`.pdf`)
- Images (`.png`, `.jpg`, `.jpeg`, `.bmp`, `.tiff`, `.webp`)

## Configuration

| Environment Variable | Default | Description |
|---------------------|---------|-------------|
| `OCR_PORT` | `5001` | Port for the OCR service |
| `OCR_SERVICE_URL` | `http://localhost:5001` | Set in Node.js backend `.env` to point to OCR service |

## Running Both Services

Terminal 1 — Node.js Backend:
```bash
cd backend
npm run dev
```

Terminal 2 — Python OCR Service:
```bash
cd backend/ocr-service
python ocr_server.py
```

The frontend upload page will automatically send files through the Node.js backend to the OCR service.
