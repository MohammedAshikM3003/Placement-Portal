# Multi-stage Dockerfile for OCR Service
# Ensures Python 3.10 compatibility and production-grade deployment on Render

# ============================================================================
# Stage 1: Builder
# ============================================================================
FROM python:3.10-slim as builder

# Set working directory
WORKDIR /app

# Install system dependencies required for building Python packages
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    gcc \
    g++ \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements and install Python packages into a virtual environment
COPY requirements.txt .
RUN python -m venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"
RUN pip install --no-cache-dir --upgrade pip setuptools wheel && \
    pip install --no-cache-dir --prefer-binary -r requirements.txt

# ============================================================================
# Stage 2: Runtime
# ============================================================================
FROM python:3.10-slim

# Set working directory
WORKDIR /app

# Install runtime system dependencies for OCR operations
# - poppler-utils: PDF to image conversion (pdf2image)
# - libglib2.0-0: Required by OpenCV (libxrender)
# - libsm6: X11 shared memory extension (OpenCV)
# - libxext6: X11 protocol extensions (OpenCV)
# - libxrender-dev: X rendering library (OpenCV)
# - libgomp1: GNU OpenMP (threading in OpenCV)
RUN apt-get update && apt-get install -y --no-install-recommends \
    poppler-utils \
    libglib2.0-0 \
    libsm6 \
    libxext6 \
    libxrender1 \
    libgomp1 \
    && rm -rf /var/lib/apt/lists/*

# Copy virtual environment from builder
COPY --from=builder /opt/venv /opt/venv

# Set PATH to use venv
ENV PATH="/opt/venv/bin:$PATH" \
    PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1

# Copy OCR service code
COPY . .

# Expose port (Flask OCR service)
EXPOSE 5001

# Health check to verify service is running (calls /healthz)
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD python -c "import requests, os; port=os.environ.get('OCR_PORT', '5001'); requests.get(f'http://localhost:{port}/healthz').raise_for_status()" || exit 1

# Start Flask OCR server with explicit logging
CMD ["python", "-u", "ocr_server.py"]
