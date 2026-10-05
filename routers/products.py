from pathlib import Path
from uuid import uuid4

from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    UploadFile,
    File,
)
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from PIL import Image

from app.core.database import get_db
from app.models.product import Product
from app.schemas.product import (
    ProductCreate,
    ProductUpdate,
    ProductResponse,
)


router = APIRouter(
    prefix="/products",
    tags=["Products"]
)


# =========================================================
# GET ALL PRODUCTS
#
# Examples:
# GET /products/
# GET /products/?category=Mobiles
# GET /products/?category=Electronics
# =========================================================

@router.get(
    "/",
    response_model=list[ProductResponse]
)
async def get_products(
    category: str | None = None,
    db: AsyncSession = Depends(get_db),
):

    query = select(Product)

    # -----------------------------------------------------
    # FILTER BY CATEGORY
    # -----------------------------------------------------

    if category:
        query = query.where(
            Product.category.ilike(category.strip())
        )

    # -----------------------------------------------------
    # GET PRODUCTS
    # -----------------------------------------------------

    result = await db.execute(query)

    return result.scalars().all()


# =========================================================
# GET SINGLE PRODUCT
# =========================================================

@router.get(
    "/{product_id}",
    response_model=ProductResponse
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
            detail="Product not found"
        )

    return product


# =========================================================
# CREATE PRODUCT
# =========================================================

@router.post(
    "/",
    response_model=ProductResponse,
    status_code=201
)
async def create_product(
    data: ProductCreate,
    db: AsyncSession = Depends(get_db),
):

    product = Product(
        **data.model_dump()
    )

    db.add(product)

    await db.commit()

    await db.refresh(product)

    return product


# =========================================================
# UPDATE PRODUCT
# =========================================================

@router.put(
    "/{product_id}",
    response_model=ProductResponse
)
async def update_product(
    product_id: int,
    data: ProductUpdate,
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
            detail="Product not found"
        )

    # -----------------------------------------------------
    # UPDATE ONLY PROVIDED FIELDS
    # -----------------------------------------------------

    update_data = data.model_dump(
        exclude_unset=True
    )

    for field, value in update_data.items():
        setattr(product, field, value)

    await db.commit()

    await db.refresh(product)

    return product


# =========================================================
# DELETE PRODUCT
# =========================================================

@router.delete(
    "/{product_id}",
    status_code=204
)
async def delete_product(
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
            detail="Product not found"
        )

    await db.delete(product)

    await db.commit()


# =========================================================
# UPLOAD PRODUCT IMAGE
# =========================================================

@router.post(
    "/{product_id}/image"
)
async def upload_product_image(
    product_id: int,
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
):

    # -----------------------------------------------------
    # FIND PRODUCT
    # -----------------------------------------------------

    result = await db.execute(
        select(Product).where(
            Product.id == product_id
        )
    )

    product = result.scalar_one_or_none()

    if not product:
        raise HTTPException(
            status_code=404,
            detail="Product not found"
        )

    # -----------------------------------------------------
    # VALIDATE IMAGE TYPE
    # -----------------------------------------------------

    allowed_types = {
        "image/jpeg",
        "image/png",
        "image/webp",
    }

    if file.content_type not in allowed_types:
        raise HTTPException(
            status_code=400,
            detail=(
                "Only JPEG, PNG and WEBP images "
                "are allowed"
            )
        )

    # -----------------------------------------------------
    # CREATE UPLOAD DIRECTORY
    # -----------------------------------------------------

    upload_dir = Path(
        "uploads/products"
    )

    upload_dir.mkdir(
        parents=True,
        exist_ok=True
    )

    # -----------------------------------------------------
    # CREATE UNIQUE FILE NAME
    # -----------------------------------------------------

    filename = f"{uuid4()}.jpg"

    file_path = upload_dir / filename

    # -----------------------------------------------------
    # PROCESS IMAGE
    # -----------------------------------------------------

    try:

        image = Image.open(
            file.file
        ).convert("RGB")

        image.thumbnail(
            (800, 800)
        )

        image.save(
            file_path,
            format="JPEG",
            quality=85
        )

    except Exception:
        raise HTTPException(
            status_code=400,
            detail="Invalid image file"
        )

    # -----------------------------------------------------
    # SAVE IMAGE URL
    # -----------------------------------------------------

    product.image_url = (
        f"/uploads/products/{filename}"
    )

    await db.commit()

    await db.refresh(product)

    return {
        "message": (
            "Product image uploaded "
            "successfully"
        ),
        "image_url": product.image_url,
    }