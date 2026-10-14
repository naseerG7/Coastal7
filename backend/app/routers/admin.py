from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.database import get_db
from app.core.dependencies import get_current_admin
from app.core.security import hash_password
from app.models import User, Product, Order, OrderItem

from app.routers.websocket import manager


router = APIRouter(
    prefix="/admin",
    tags=["Admin"],
)


# ============================================================
# STATUS CONSTANTS
# ============================================================

ORDER_STATUSES = {
    "pending",
    "confirmed",
    "processing",
    "shipped",
    "out_for_delivery",
    "delivered",
    "cancelled",
}


# ============================================================
# STATUS UPDATE SCHEMA
# ============================================================

class OrderStatusUpdate(BaseModel):
    status: str


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


# ============================================================
# ADMIN ORDERS - GET ALL ORDERS
# ============================================================

@router.get("/orders")
async def get_admin_orders(
    current_admin: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):

    # N+1 Query Optimization: Eager load Order.items using selectinload
    result = await db.execute(
        select(Order, User)
        .join(User, Order.user_id == User.id)
        .options(selectinload(Order.items))
        .order_by(Order.created_at.desc())
    )

    rows = result.all()

    response = []

    for order, customer in rows:
        items = order.items or []

        response.append(
            {
                "id": order.id,
                "user_id": order.user_id,
                "customer_name": customer.name,
                "customer_email": customer.email,
                "status": order.status,
                "total_amount": float(order.total_amount),
                "created_at": order.created_at,
                "updated_at": order.updated_at,
                "items": [
                    {
                        "id": item.id,
                        "product_id": item.product_id,
                        "product_name": item.product_name,
                        "price": float(item.price),
                        "quantity": item.quantity,
                        "item_total": float(item.item_total),
                    }
                    for item in items
                ],
            }
        )

    return response


# ============================================================
# ADMIN ORDERS - GET SINGLE ORDER
# ============================================================

@router.get("/orders/{order_id}")
async def get_admin_order(
    order_id: int,
    current_admin: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):

    result = await db.execute(
        select(Order, User)
        .join(User, Order.user_id == User.id)
        .options(selectinload(Order.items))
        .where(Order.id == order_id)
    )

    row = result.first()

    if not row:
        raise HTTPException(
            status_code=404,
            detail="Order not found",
        )

    order, customer = row
    items = order.items or []

    return {
        "id": order.id,
        "user_id": order.user_id,
        "customer_name": customer.name,
        "customer_email": customer.email,
        "status": order.status,
        "total_amount": float(order.total_amount),
        "created_at": order.created_at,
        "updated_at": order.updated_at,
        "items": [
            {
                "id": item.id,
                "product_id": item.product_id,
                "product_name": item.product_name,
                "price": float(item.price),
                "quantity": item.quantity,
                "item_total": float(item.item_total),
            }
            for item in items
        ],
    }

# ============================================================
# ADMIN ORDERS - UPDATE ORDER STATUS
# ============================================================

@router.put("/orders/{order_id}/status")
async def update_admin_order_status(
    order_id: int,
    status_data: OrderStatusUpdate,
    current_admin: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    new_status = status_data.status.strip().lower()

    if new_status not in ORDER_STATUSES:
        raise HTTPException(
            status_code=400,
            detail={
                "message": "Invalid order status",
                "allowed_statuses": sorted(ORDER_STATUSES),
            },
        )

    result = await db.execute(
        select(Order).where(Order.id == order_id)
    )
    order = result.scalar_one_or_none()

    if not order:
        raise HTTPException(
            status_code=404,
            detail="Order not found",
        )

    current_status = order.status.strip().lower()

    allowed_transitions = {
        "processing": {"shipped"},
        "shipped": {"out_for_delivery"},
        "out_for_delivery": {"delivered"},
        "delivered": set(),
        "cancelled": set(),
        "pending": {"processing", "cancelled"},
        "confirmed": {"processing", "cancelled"},
    }

    allowed_next_statuses = allowed_transitions.get(
        current_status, set()
    )

    if new_status not in allowed_next_statuses:
        raise HTTPException(
            status_code=400,
            detail={
                "message": "Invalid order status transition",
                "current_status": current_status,
                "requested_status": new_status,
                "allowed_next_statuses": sorted(
                    allowed_next_statuses
                ),
            },
        )

    order.status = new_status

    await db.commit()
    await db.refresh(order)

    # Notify only the customer who owns this order.
    await manager.send_to_user(
        order.user_id,
        {
            "type": "order_status",
            "order_id": order.id,
            "user_id": order.user_id,
            "status": order.status,
            "message": (
                f"Your order #{order.id} is now "
                f"{order.status.replace('_', ' ').title()}."
            ),
        },
    )

    return {
        "message": "Order status updated successfully",
        "id": order.id,
        "previous_status": current_status,
        "status": order.status,
        "total_amount": float(order.total_amount),
        "updated_at": order.updated_at,
    }
