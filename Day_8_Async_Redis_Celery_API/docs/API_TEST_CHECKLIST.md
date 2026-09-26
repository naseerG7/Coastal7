# Day 8 API Test Checklist

- [ ] GET /health
- [ ] GET /async-fetch?urls=https://example.com,https://httpbin.org/get
- [ ] GET /cached-data?key=sample twice and verify second response is from cache
- [ ] DELETE /cached-data/sample
- [ ] Test repeated requests and verify HTTP 429 after the configured limit
- [ ] POST /background-task?message=hello
- [ ] Start Celery worker
- [ ] POST /celery-task?report_name=test
- [ ] GET /celery-task/{task_id}
- [ ] Start Flower and inspect the task
- [ ] Run pytest
