FROM python:3.10-slim

WORKDIR /app

RUN apt-get update \
    && apt-get install -y --no-install-recommends gcc libpq-dev \
    && pip install --no-cache-dir pipenv \
    && rm -rf /var/lib/apt/lists/*

# Copy your Pipfile and lock from the project root into the image
COPY Pipfile Pipfile.lock ./

# Install all dependencies in a Pipenv‐managed venv
RUN pipenv install --deploy --ignore-pipfile

# Copy your backend source code into the image
COPY backend ./backend

EXPOSE 8000

# Launch your FastAPI/Django app
CMD ["uvicorn", "backend.core.main:app", "--host", "0.0.0.0", "--port", "8000"]


