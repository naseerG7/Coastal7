from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from fastapi.staticfiles import StaticFiles

from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded

from app.core.rate_limiter import limiter
from app.core.ai_cache import close_ai_cache

from sqlalchemy import text

from app.core.database import engine, Base
from app.routers.auth import router as auth_router
from app.routers.products import router as products_router
from app.routers.cart import router as cart_router
from app.routers.orders import router as orders_router
from app.routers.admin import router as admin_router
from app.routers.websocket import router as websocket_router
from app.routers.tasks import router as tasks_router
from app.ai.router import router as ai_router

import app.models  # Registers models with SQLAlchemy metadata


# =========================================================
# FASTAPI APPLICATION
# =========================================================
app = FastAPI(
    title="E-Commerce Backend API",
    description="Day 10 FastAPI backend connected to the Day 11 React frontend",
    version="1.0.0",
)


# =========================================================
# API RATE LIMITING
# =========================================================
app.state.limiter = limiter

app.add_exception_handler(
    RateLimitExceeded,
    _rate_limit_exceeded_handler,
)

# =========================================================
# CORS
# =========================================================
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:5174",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# =========================================================
# RESPONSE COMPRESSION
# =========================================================
# Compress eligible responses of at least 500 bytes when the
# client supports gzip. Small responses remain uncompressed.
app.add_middleware(
    GZipMiddleware,
    minimum_size=500,
    compresslevel=6,
)


# =========================================================
# STATIC FILES
# =========================================================
Path("uploads").mkdir(parents=True, exist_ok=True)
Path("product_images").mkdir(parents=True, exist_ok=True)

app.mount(
    "/uploads",
    StaticFiles(directory="uploads"),
    name="uploads",
)

app.mount(
    "/product_images",
    StaticFiles(directory="product_images"),
    name="product_images",
)


# =========================================================
# CREATE DATABASE TABLES WHEN THE APPLICATION STARTS
# =========================================================
@app.on_event("shutdown")
async def shutdown_ai_cache():
    await close_ai_cache()
    Path("uploads/invoices").mkdir(parents=True, exist_ok=True)
    Path("uploads/products").mkdir(parents=True, exist_ok=True)

    async with engine.begin() as conn:
        try:
            await conn.execute(
                text("CREATE EXTENSION IF NOT EXISTS pg_trgm;")
            )
        except Exception as exc:
            print(f"Warning: Could not enable pg_trgm: {exc}")

        await conn.run_sync(Base.metadata.create_all)


# =========================================================
# EXISTING ROUTERS
# =========================================================
app.include_router(auth_router)
app.include_router(products_router)
app.include_router(cart_router)
app.include_router(orders_router)
app.include_router(admin_router)
app.include_router(websocket_router)
app.include_router(tasks_router)
app.include_router(tasks_router)
app.include_router(ai_router)


# =========================================================
# HEALTH / HOME
# =========================================================
@app.get("/", tags=["Health"])
def home():
    return {
        "message": "Welcome to our E-Commerce API",
        "status": "running",
    }


@app.get("/health", tags=["Health"])
def health_check():
    return {
        "status": "healthy",
    }
