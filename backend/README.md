# Day 10 — E-Commerce Backend

This is the single project we will build throughout Day 10.

## Current Phase

Phase 1 — Foundation.

At the moment, the project contains:
- FastAPI application
- Uvicorn server support
- Health endpoints
- Swagger/OpenAPI documentation
- Project structure for authentication, products, cart, orders, Celery, WebSockets, Redis, and tests

The feature folders are intentionally empty/stubbed for now. We will implement them step by step so you understand each part.

## Run locally

### 1. Create a virtual environment

Windows PowerShell:

    python -m venv venv
    .env\Scripts\Activate.ps1

Windows CMD:

    python -m venv venv
    venv\Scriptsctivate

### 2. Install dependencies

    pip install -r requirements.txt

### 3. Start the API

    uvicorn app.main:app --reload

### 4. Open

    http://127.0.0.1:8000/
    http://127.0.0.1:8000/docs
    http://127.0.0.1:8000/redoc

## Run tests

    pytest

## Docker

The docker-compose file is prepared for the later PostgreSQL and Redis phases.

    copy .env.example .env
    docker compose up --build

## Day 10 implementation order

1. Foundation and configuration
2. PostgreSQL + SQLAlchemy
3. Authentication + JWT
4. Product CRUD
5. Product image uploads
6. Redis cart
7. Orders + stock validation
8. Celery + confirmation email
9. WebSocket order updates
10. Redis product caching
11. 20+ pytest tests
12. Swagger/OpenAPI + Postman
13. Final integration
