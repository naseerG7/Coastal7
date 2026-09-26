# Day 8 – Async Programming, Redis Caching & Celery

## Objective
Build high-performance FastAPI endpoints using async execution, Redis caching/rate limiting, and Celery background processing.

## Topics
- Event loop, coroutines, async def vs def
- asyncio.gather() for concurrent calls
- Redis cache-aside, TTL, invalidation
- Sliding-window rate limiting
- Celery workers, Beat, retries, task states
- Flower monitoring
- BackgroundTasks vs Celery

## Setup
```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
```
Copy `.env.example` to `.env` and configure a reachable Redis instance.

## Run FastAPI
```powershell
uvicorn app.main:app --reload
```
Swagger: http://127.0.0.1:8000/docs

## Run Celery Worker (Windows development)
```powershell
celery -A app.celery_app.celery_app worker --loglevel=info --pool=solo
```

## Run Celery Beat
```powershell
celery -A app.celery_app.celery_app beat --loglevel=info
```

## Run Flower
```powershell
celery -A app.celery_app.celery_app flower
```
Flower: http://127.0.0.1:5555

## Test
```powershell
pytest
```

The application needs a reachable Redis instance. For remote Redis, put the provider connection URL in `.env`; never commit `.env` or credentials.

## BackgroundTasks vs Celery
FastAPI BackgroundTasks is suitable for small work after the response. Celery is intended for longer-running, retryable, worker-based jobs.
