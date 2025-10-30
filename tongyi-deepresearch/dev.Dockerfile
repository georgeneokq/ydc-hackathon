FROM python:3.10 AS base

# Prevents Python from writing pyc files.
ENV PYTHONDONTWRITEBYTECODE=1

# Keeps Python from buffering stdout and stderr to avoid situations where
# the application crashes without emitting any logs due to buffering.
ENV PYTHONUNBUFFERED=1

WORKDIR /app

# Install uv
COPY --from=ghcr.io/astral-sh/uv:latest /uv /uvx /bin/

# Copy dependency management files
COPY requirements.txt \
    ./

# Prepare to install dependencies using uv
ENV UV_PROJECT_ENVIRONMENT=/app/.venv
ENV UV_HTTP_TIMEOUT=300
# To suppress warnings from uv attempting to use hardlinks
ENV UV_LINK_MODE=copy

# Create venv and install dependencies
RUN --mount=type=cache,target=/root/.cache/uv \
    uv venv /app/.venv --python 3.10 && \
    uv pip install -r requirements.txt

ENV VIRTUAL_ENV=/app/.venv \
    PATH="/app/.venv/bin:$PATH"

# Copy source code
COPY inference/ inference/

WORKDIR /app/inference

ENTRYPOINT ["python", "api_server.py", "--host", "0.0.0.0", "--port", "80", "--reload"]
