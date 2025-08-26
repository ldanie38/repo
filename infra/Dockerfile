# infra/Dockerfile
FROM python:3.13-slim

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

WORKDIR /app

# Install deps
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy source
COPY . .

# Point Python at backend/
ENV PYTHONPATH=/app/backend

EXPOSE 8000

# Launch
CMD CMD ["python", "manage.py", "runserver", "0.0.0.0:8000"]









