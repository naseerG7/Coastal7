from fastapi import APIRouter, Depends
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.dependencies import get_current_admin
from app.core.security import hash_password
from app.models import User, Product, Order


router = APIRouter(
    prefix="/admin",
    tags=["Admin"]
)


# ============================================================
# ADMIN DASHBOARD
# ============================================================

@router.get("/dashboard")
async def admin_dashboard(
    current_admin: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    # Total customers
    customer_result = await db.execute(
        select(func.count(User.id))
        .where(User.role == "customer")
    )

    total_customers = customer_result.scalar_one()

    # Total products
    product_result = await db.execute(
        select(func.count(Product.id))
    )

    total_products = product_result.scalar_one()

    # Total orders
    order_result = await db.execute(
        select(func.count(Order.id))
    )

    total_orders = order_result.scalar_one()

    # Total revenue
    revenue_result = await db.execute(
        select(
            func.coalesce(
                func.sum(Order.total_amount),
                0
            )
        )
    )

    total_revenue = revenue_result.scalar_one()

    return {
        "total_customers": total_customers,
        "total_products": total_products,
        "total_orders": total_orders,
        "total_revenue": float(total_revenue),
    }


# ============================================================
# ADMIN CUSTOMERS
# ============================================================

@router.get("/customers")
async def get_admin_customers(
    current_admin: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(User)
        .where(User.role == "customer")
        .order_by(User.id.desc())
    )

    customers = result.scalars().all()

    return [
        {
            "id": customer.id,
            "name": customer.name,
            "email": customer.email,
            "role": customer.role,
        }
        for customer in customers
    ]


# ============================================================
# ADMIN SELLERS - GET ALL SELLERS
# ============================================================

@router.get("/sellers")
async def get_admin_sellers(
    current_admin: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(User)
        .where(User.role == "seller")
        .order_by(User.id.desc())
    )

    sellers = result.scalars().all()

    return [
        {
            "id": seller.id,
            "name": seller.name,
            "email": seller.email,
            "role": seller.role,
        }
        for seller in sellers
    ]


# ============================================================
# ADMIN SELLERS - CREATE SELLER
# ============================================================

@router.post("/sellers")
async def create_admin_seller(
    name: str,
    email: str,
    password: str,
    current_admin: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    # Check whether email already exists
    existing_result = await db.execute(
        select(User)
        .where(User.email == email)
    )

    existing_user = existing_result.scalar_one_or_none()

    if existing_user:
        return {
            "message": "User with this email already exists",
            "user_id": existing_user.id,
            "role": existing_user.role,
        }

    # Create seller
    seller = User(
        name=name,
        email=email,
        hashed_password=hash_password(password),
        role="seller",
    )

    db.add(seller)

    await db.commit()

    await db.refresh(seller)

    return {
        "message": "Seller created successfully",
        "id": seller.id,
        "name": seller.name,
        "email": seller.email,
        "role": seller.role,
    }