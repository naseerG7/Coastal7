from io import BytesIO
from PIL import Image, UnidentifiedImageError
from pathlib import Path
from uuid import uuid4

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, Query
from sqlalchemy import select, func, or_
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.dependencies import get_current_admin
from app.models import Product, ProductImage, User
from app.ai.vector_store import index_product, delete_product_embedding
from app.schemas.product import (
    ProductCreate,
    ProductResponse,
    ProductUpdate,
)


MAX_IMAGE_SIZE = 5 * 1024 * 1024  # 5 MB
ALLOWED_IMAGE_FORMATS = {
    "JPEG": ".jpg",
    "PNG": ".png",
    "WEBP": ".webp",
}
MAX_CSV_SIZE = 5 * 1024 * 1024  # 5 MB

router = APIRouter(
    prefix="/products",
    tags=["Products"],
)


# ============================================================
# GET ALL PRODUCTS (WITH POSTGRESQL FULL-TEXT SEARCH & FUZZY TRGM SEARCH)
# ============================================================

@router.get("/", response_model=list[ProductResponse])
async def get_products(
    search: str | None = Query(None, description="Search term for full-text and fuzzy search"),
    category: str | None = Query(None, description="Filter by category"),
    fuzzy: bool = Query(True, description="Enable pg_trgm typo-tolerant search"),
    min_price: float | None = Query(None, description="Minimum price filter"),
    max_price: float | None = Query(None, description="Maximum price filter"),
    sort: str | None = Query(None, description="Sort order"),
    db: AsyncSession = Depends(get_db),
):
    stmt = select(Product)

    # 1. Category Filter
    if category and category.strip() and category.lower() != "all":
        stmt = stmt.where(func.lower(Product.category) == category.strip().lower())

    # 2. Price Range Filters
    if min_price is not None:
        stmt = stmt.where(Product.price >= min_price)
    if max_price is not None:
        stmt = stmt.where(Product.price <= max_price)

    # 3. Advanced PostgreSQL Full-Text Search (tsvector) + Fuzzy Search (pg_trgm)
    score_expr = None
    if search and search.strip():
        term = search.strip()

        # PostgreSQL tsvector Full-Text Search
        ts_vector = func.to_tsvector(
            "english",
            func.coalesce(Product.name, "") + " " +
            func.coalesce(Product.description, "") + " " +
            func.coalesce(Product.category, "")
        )
        ts_query = func.plainto_tsquery("english", term)
        fts_match = ts_vector.op("@@")(ts_query)
        fts_rank = func.ts_rank(ts_vector, ts_query)

        # PostgreSQL pg_trgm Trigram Fuzzy Search (Typo Tolerance)
        trgm_name_sim = func.similarity(Product.name, term)
        trgm_desc_sim = func.similarity(func.coalesce(Product.description, ""), term)

        conditions = [
            fts_match,
            Product.name.ilike(f"%{term}%"),
            Product.description.ilike(f"%{term}%"),
        ]

        if fuzzy:
            # Match if trigram similarity exceeds threshold (e.g. 'samusng' matches 'Samsung')
            conditions.append(trgm_name_sim >= 0.2)
            conditions.append(trgm_desc_sim >= 0.2)

        stmt = stmt.where(or_(*conditions))

        # Combined relevance score: full-text search rank (weighted) + trigram similarity score
        score_expr = (fts_rank * 2.0) + trgm_name_sim

    # 4. Sorting
    if sort == "price-low":
        stmt = stmt.order_by(Product.price.asc())
    elif sort == "price-high":
        stmt = stmt.order_by(Product.price.desc())
    elif sort == "name-az":
        stmt = stmt.order_by(Product.name.asc())
    elif sort == "name-za":
        stmt = stmt.order_by(Product.name.desc())
    elif sort == "newest":
        stmt = stmt.order_by(Product.created_at.desc())
    elif score_expr is not None:
        stmt = stmt.order_by(score_expr.desc(), Product.id.asc())
    else:
        stmt = stmt.order_by(Product.id.asc())

    try:
        result = await db.execute(stmt)
        products = result.scalars().all()
        return products
    except Exception:
        # Fallback to basic ILIKE substring search if PostgreSQL extensions are pending
        fallback_stmt = select(Product)
        if category and category.strip() and category.lower() != "all":
            fallback_stmt = fallback_stmt.where(func.lower(Product.category) == category.strip().lower())
        if search and search.strip():
            term = search.strip()
            fallback_stmt = fallback_stmt.where(
                or_(
                    Product.name.ilike(f"%{term}%"),
                    Product.description.ilike(f"%{term}%"),
                    Product.category.ilike(f"%{term}%"),
                )
            )
        fallback_stmt = fallback_stmt.order_by(Product.id.asc())
        fallback_result = await db.execute(fallback_stmt)
        return fallback_result.scalars().all()


# ============================================================
# BULK CSV PRODUCT IMPORT (CELERY BACKGROUND TASK)
# ============================================================

@router.post("/bulk-import-csv")
async def bulk_import_products_csv_endpoint(
    file: UploadFile = File(...),
    current_admin: User = Depends(get_current_admin),
):
    """
    Trigger bulk product import from a CSV file via Celery background task.
    Returns task_id for tracking progress in the UI.
    """
    if not (file.filename and file.filename.lower().endswith(".csv")):
        raise HTTPException(
            status_code=400,
            detail="Invalid file format. Please upload a .csv file.",
        )

    
    # Read at most 5 MB + 1 byte to detect oversized files.
    contents = await file.read(MAX_CSV_SIZE + 1)

    if len(contents) > MAX_CSV_SIZE:
        raise HTTPException(
            status_code=400,
            detail="CSV file size must not exceed 5 MB",
        )

    if not contents:
        raise HTTPException(
            status_code=400,
            detail="CSV file cannot be empty",
        )

    try:
        csv_text = contents.decode("utf-8")
    except UnicodeDecodeError:
        csv_text = contents.decode("latin-1")


    from app.tasks.csv_import import bulk_import_products_csv, process_csv_import
    from app.routers.tasks import dispatch_background_job

    task_id = dispatch_background_job(
        celery_func=bulk_import_products_csv,
        fallback_func=process_csv_import,
        args=(csv_text,),
        task_name=f"Bulk Import ({file.filename})",
    )

    return {
        "task_id": task_id,
        "filename": file.filename,
        "status": "PENDING",
        "message": f"Bulk import task initiated for {file.filename}",
    }


# ============================================================
# GET SINGLE PRODUCT
# ============================================================

@router.get(
    "/{product_id}",
    response_model=ProductResponse,
)
async def get_product(
    product_id: int,
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Product).where(
            Product.id == product_id
        )
    )

    product = result.scalar_one_or_none()

    if not product:
        raise HTTPException(
            status_code=404,
            detail="Product not found",
        )

    return product


# ============================================================
# CREATE PRODUCT
# ============================================================

@router.post(
    "/",
    response_model=ProductResponse,
    status_code=201,
)
async def create_product(
    product_data: ProductCreate,
    db: AsyncSession = Depends(get_db),
    current_admin: User = Depends(get_current_admin),
):
    product = Product(
        name=product_data.name,
        category=product_data.category,
        description=product_data.description,
        price=product_data.price,
        stock=product_data.stock,
    )

    db.add(product)

    await db.commit()
    await db.refresh(product)

    try:
        await index_product(product)
    except Exception:
        # Keep a successful database write successful if indexing fails.
        pass

    return product


# ============================================================
# EDIT / UPDATE PRODUCT
# ============================================================

@router.put(
    "/{product_id}",
    response_model=ProductResponse,
)
async def update_product(
    product_id: int,
    product_data: ProductUpdate,
    db: AsyncSession = Depends(get_db),
    current_admin: User = Depends(get_current_admin),
):
    result = await db.execute(
        select(Product).where(
            Product.id == product_id
        )
    )

    product = result.scalar_one_or_none()

    if not product:
        raise HTTPException(
            status_code=404,
            detail="Product not found",
        )

    # Update only values that were provided
    if product_data.name is not None:
        product.name = product_data.name

    if product_data.category is not None:
        product.category = product_data.category

    if product_data.description is not None:
        product.description = product_data.description

    if product_data.price is not None:
        product.price = product_data.price

    if product_data.stock is not None:
        product.stock = product_data.stock

        await db.commit()
    await db.refresh(product)

    try:
        await index_product(product)
    except Exception:
        # Keep a successful database write successful if indexing fails.
        pass

    return product


# ============================================================
# DELETE PRODUCT
# ============================================================

@router.delete(
    "/{product_id}",
)
async def delete_product(
    product_id: int,
    db: AsyncSession = Depends(get_db),
    current_admin: User = Depends(get_current_admin),
):
    result = await db.execute(
        select(Product).where(
            Product.id == product_id
        )
    )

    product = result.scalar_one_or_none()

    if not product:
        raise HTTPException(
            status_code=404,
            detail="Product not found",
        )

    await db.delete(product)

    await db.commit()

    try:
        await delete_product_embedding(product_id)
    except Exception:
        # The database deletion has already succeeded.
        pass

    return {
        "message": "Product deleted successfully",
        "product_id": product_id,
    }


# ============================================================
# INCREASE STOCK
# ============================================================

@router.post(
    "/{product_id}/increase-stock",
    response_model=ProductResponse,
)
async def increase_stock(
    product_id: int,
    quantity: int,
    db: AsyncSession = Depends(get_db),
    current_admin: User = Depends(get_current_admin),
):
    if quantity <= 0:
        raise HTTPException(
            status_code=400,
            detail="Quantity must be greater than 0",
        )

    result = await db.execute(
        select(Product).where(
            Product.id == product_id
        )
    )

    product = result.scalar_one_or_none()

    if not product:
        raise HTTPException(
            status_code=404,
            detail="Product not found",
        )

    product.stock += quantity

    await db.commit()
    await db.refresh(product)

    return product



# ============================================================
# UPDATE PRODUCT IMAGE
# ============================================================

@router.post(
    "/{product_id}/image",
    response_model=ProductResponse,
)
async def upload_product_image(
    product_id: int,
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
    current_admin: User = Depends(get_current_admin),
):
    result = await db.execute(
        select(Product).where(Product.id == product_id)
    )

    product = result.scalar_one_or_none()

    if not product:
        raise HTTPException(
            status_code=404,
            detail="Product not found",
        )

    # Read at most 5 MB + 1 byte to detect oversized uploads.
    contents = await file.read(MAX_IMAGE_SIZE + 1)

    if not contents:
        raise HTTPException(
            status_code=400,
            detail="Image file cannot be empty",
        )

    if len(contents) > MAX_IMAGE_SIZE:
        raise HTTPException(
            status_code=400,
            detail="Image size must not exceed 5 MB",
        )

    # Verify the actual image contents using Pillow.
    try:
        with Image.open(BytesIO(contents)) as image:
            image_format = image.format

            if image_format not in ALLOWED_IMAGE_FORMATS:
                raise HTTPException(
                    status_code=400,
                    detail="Only JPEG, PNG, and WebP images are allowed",
                )

            image.verify()

    except (UnidentifiedImageError, OSError, ValueError):
        raise HTTPException(
            status_code=400,
            detail="Invalid or corrupted image file",
        )

    # Use the verified image format, not the supplied filename.
    extension = ALLOWED_IMAGE_FORMATS[image_format]
    filename = f"{uuid4()}{extension}"

    upload_dir = Path("uploads/products")
    upload_dir.mkdir(parents=True, exist_ok=True)

    file_path = upload_dir / filename

    # Save only after the size and image checks pass.
    with open(file_path, "wb") as buffer:
        buffer.write(contents)

    # Store the image URL in the database.
    product.image_url = f"/uploads/products/{filename}"

    await db.commit()
    await db.refresh(product)

    return product
# ============================================================
# UPLOAD MULTIPLE ADDITIONAL PRODUCT GALLERY IMAGES
# ============================================================

@router.post("/{product_id}/images")
async def upload_product_images(
    product_id: int,
    files: list[UploadFile] = File(...),
    db: AsyncSession = Depends(get_db),
    current_admin: User = Depends(get_current_admin),
):
    if not files:
        raise HTTPException(
            status_code=400,
            detail="Please select at least one image",
        )

    if len(files) > 8:
        raise HTTPException(
            status_code=400,
            detail="You can upload a maximum of 8 gallery images at a time",
        )

    result = await db.execute(
        select(Product).where(Product.id == product_id)
    )
    product = result.scalar_one_or_none()

    if not product:
        raise HTTPException(
            status_code=404,
            detail="Product not found",
        )

    validated_images = []

    # Validate every image before saving any files.
    for file in files:
        contents = await file.read(MAX_IMAGE_SIZE + 1)

        if not contents:
            raise HTTPException(
                status_code=400,
                detail=f"{file.filename or 'Image'} cannot be empty",
            )

        if len(contents) > MAX_IMAGE_SIZE:
            raise HTTPException(
                status_code=400,
                detail=f"{file.filename or 'Image'} exceeds the 5 MB limit",
            )

        try:
            with Image.open(BytesIO(contents)) as image:
                image_format = image.format

                if image_format not in ALLOWED_IMAGE_FORMATS:
                    raise HTTPException(
                        status_code=400,
                        detail="Only JPEG, PNG, and WebP images are allowed",
                    )

                image.verify()

        except (UnidentifiedImageError, OSError, ValueError):
            raise HTTPException(
                status_code=400,
                detail="An image is invalid or corrupted",
            )

        extension = ALLOWED_IMAGE_FORMATS[image_format]
        filename = f"{uuid4()}{extension}"

        validated_images.append(
            {
                "filename": filename,
                "contents": contents,
                "image_url": f"/uploads/products/{filename}",
            }
        )

    upload_dir = Path("uploads/products")
    upload_dir.mkdir(parents=True, exist_ok=True)

    saved_paths = []

    try:
        image_records = []

        for image_data in validated_images:
            file_path = upload_dir / image_data["filename"]

            with open(file_path, "wb") as buffer:
                buffer.write(image_data["contents"])

            saved_paths.append(file_path)

            image_records.append(
                ProductImage(
                    product_id=product_id,
                    image_url=image_data["image_url"],
                )
            )

        db.add_all(image_records)
        await db.commit()

        for record in image_records:
            await db.refresh(record)

    except Exception:
        await db.rollback()

        for file_path in saved_paths:
            try:
                file_path.unlink(missing_ok=True)
            except OSError:
                pass

        raise

    return [
        {
            "id": record.id,
            "product_id": record.product_id,
            "image_url": record.image_url,
        }
        for record in image_records
    ]
