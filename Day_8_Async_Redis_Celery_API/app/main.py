import json
from fastapi import BackgroundTasks, Depends, FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.services import fetch_urls_concurrently, get_cached, set_cached
from app.rate_limit import check_rate_limit
from app.tasks import process_report
from app.redis_client import redis_client

app = FastAPI(title="Day 8 Async Redis Celery API", version="1.0.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[x.strip() for x in settings.allowed_origins.split(",")],
    allow_credentials=True, allow_methods=["*"], allow_headers=["*"],
)

@app.get("/health")
def health():
    return {"status": "ok"}

@app.get("/async-fetch", dependencies=[Depends(check_rate_limit)])
async def async_fetch(urls: str):
    url_list = [u.strip() for u in urls.split(",") if u.strip()]
    if not url_list:
        return {"detail": "Provide at least one URL"}
    results = await fetch_urls_concurrently(url_list)
    return {"count": len(results), "results": results}

@app.get("/cached-data", dependencies=[Depends(check_rate_limit)])
def cached_data(key: str = "sample"):
    cached = get_cached(key)
    if cached:
        return {"source": "cache", "key": key, "data": json.loads(cached)}
    data = {"message": "Generated data", "key": key}
    set_cached(key, json.dumps(data))
    return {"source": "generated", "key": key, "data": data}

@app.delete("/cached-data/{key}", dependencies=[Depends(check_rate_limit)])
def invalidate_cache(key: str):
    deleted = redis_client.delete(key)
    return {"key": key, "invalidated": bool(deleted)}

@app.post("/background-task")
def background_task(background_tasks: BackgroundTasks, message: str = "hello"):
    background_tasks.add_task(write_background_log, message)
    return {"status": "accepted", "message": message}

def write_background_log(message):
    with open("background_tasks.log", "a", encoding="utf-8") as f:
        f.write(message + "\n")

@app.post("/celery-task")
def celery_task(report_name: str = "daily-report"):
    task = process_report.delay(report_name)
    return {"status": "queued", "task_id": task.id, "report": report_name}

@app.get("/celery-task/{task_id}")
def celery_status(task_id: str):
    task = process_report.AsyncResult(task_id)
    return {"task_id": task_id, "state": task.state, "result": task.result}
