
from decimal import Decimal
from pathlib import Path

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import FileResponse
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload, joinedload

from app.core.database import get_db
from app.core.security import decode_access_token, oauth2_scheme
from app.models import Order, OrderItem, Product, User
from app.routers.tasks import dispatch_background_job
from app.tasks.invoice import generate_invoice_pdf, build_invoice_pdf


router = APIRouter(
    prefix="/orders",
    tags=["Orders"],
)


# =========================================================
# AUTH HELPER
# =========================================================

def get_user_id_from_token(token: str) -> int:
    try:
        user_id = decode_access_token(token)

        if user_id is None:
            raise ValueError("User ID missing from token")

        return int(user_id)

    except (ValueError, TypeError):
        raise HTTPException(
            status_code=401,
            detail="Invalid or expired token",
        )


# =========================================================
# PRODUCT IMAGE HELPER
# =========================================================

def get_product_image(product):
    """
    Read an image field that actually exists on the Product model.
    Supports common image field names without requiring a new
    database column.
    """
    if product is None:
        return None

    possible_fields = (
        "image_url",
        "image",
        "image_path",
        "image_filename",
        "product_image",
        "image_name",
        "photo",
    )

    for field in possible_fields:
        value = getattr(product, field, None)

        if value:
            return str(value)

    return None


# =========================================================
# ORDER ITEM RESPONSE HELPER
# =========================================================

def build_order_item_response(item, product=None):
    image = get_product_image(product)

    return {
        "id": item.id,
        "product_id": item.product_id,
        "product_name": item.product_name,
        "price": float(item.price),
        "quantity": item.quantity,
        "item_total": float(item.item_total),
        "image_url": image,
    }


# =========================================================
# ORDER RESPONSE HELPER
# =========================================================

async def build_order_response(order, db: AsyncSession | None = None):
    # N+1 Optimization: If items are eager-loaded on order, use them directly without extra DB queries!
    if hasattr(order, "items") and order.items is not None:
        return {
            "id": order.id,
            "user_id": order.user_id,
            "status": order.status,
            "total_amount": float(order.total_amount),
            "created_at": order.created_at,
            "updated_at": order.updated_at,
            "items": [
                build_order_item_response(item, getattr(item, "product", None))
                for item in order.items
            ],
        }

    if db is not None:
        result = await db.execute(
            select(OrderItem, Product)
            .outerjoin(
                Product,
                Product.id == OrderItem.product_id,
            )
            .where(OrderItem.order_id == order.id)
        )
        rows = result.all()
        return {
            "id": order.id,
            "user_id": order.user_id,
            "status": order.status,
            "total_amount": float(order.total_amount),
            "created_at": order.created_at,
            "updated_at": order.updated_at,
            "items": [
                build_order_item_response(item, product)
                for item, product in rows
            ],
        }

    return {
        "id": order.id,
        "user_id": order.user_id,
        "status": order.status,
        "total_amount": float(order.total_amount),
        "created_at": order.created_at,
        "updated_at": order.updated_at,
        "items": [],
    }


# =========================================================
# CREATE ORDER
# =========================================================

@router.post("/")
async def create_order(
    token: str = Depends(oauth2_scheme),
    db: AsyncSession = Depends(get_db),
):
    user_id = get_user_id_from_token(token)

    from app.models import Cart, CartItem

    # Find this customer's cart.
    result = await db.execute(
        select(Cart).where(Cart.user_id == user_id)
    )
    cart = result.scalar_one_or_none()

    if not cart:
        raise HTTPException(
            status_code=400,
            detail="Cart is empty",
        )

    # Get cart items and their associated products.
    result = await db.execute(
        select(CartItem, Product)
        .join(
            Product,
            CartItem.product_id == Product.id,
        )
        .where(CartItem.cart_id == cart.id)
    )
    rows = result.all()

    if not rows:
        raise HTTPException(
            status_code=400,
            detail="Cart is empty",
        )

    # Validate quantities and stock.
    total = Decimal("0.00")
    order_data = []

    for cart_item, product in rows:
        if cart_item.quantity <= 0:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid quantity for {product.name}",
            )

        if cart_item.quantity > product.stock:
            raise HTTPException(
                status_code=400,
                detail=(
                    f"Only {product.stock} item(s) available "
                    f"for {product.name}"
                ),
            )

        price = Decimal(str(product.price))
        item_total = price * cart_item.quantity
        total += item_total

        order_data.append(
            {
                "cart_item": cart_item,
                "product": product,
                "price": price,
                "item_total": item_total,
            }
        )

    # Create the order for the authenticated customer.
    order = Order(
        user_id=user_id,
        status="processing",
        total_amount=total,
    )

    db.add(order)
    await db.flush()

    # Create order items and reduce stock.
    for data in order_data:
        cart_item = data["cart_item"]
        product = data["product"]

        order_item = OrderItem(
            order_id=order.id,
            product_id=product.id,
            product_name=product.name,
            price=data["price"],
            quantity=cart_item.quantity,
            item_total=data["item_total"],
        )

        db.add(order_item)
        product.stock -= cart_item.quantity

    # Clear only this customer's cart.
    for cart_item, _product in rows:
        await db.delete(cart_item)

    await db.commit()
    await db.refresh(order)

    return {
        "id": order.id,
        "user_id": order.user_id,
        "status": order.status,
        "total_amount": float(order.total_amount),
        "created_at": order.created_at,
        "updated_at": order.updated_at,
        "message": "Order created successfully",
    }


# =========================================================
# GET MY ORDERS
# =========================================================

@router.get("/my-orders")
async def get_my_orders(
    token: str = Depends(oauth2_scheme),
    db: AsyncSession = Depends(get_db),
):
    user_id = get_user_id_from_token(token)

    # N+1 Query Optimization: Load all orders and their related items + products
    # using selectinload and joinedload instead of firing separate queries per order
    result = await db.execute(
        select(Order)
        .where(Order.user_id == user_id)
        .options(
            selectinload(Order.items).joinedload(OrderItem.product)
        )
        .order_by(Order.created_at.desc())
    )

    orders = result.scalars().all()

    return [
        await build_order_response(order, db)
        for order in orders
    ]


# =========================================================
# GET SINGLE ORDER (SUPPORTS BOTH /my-orders/{id} AND /{id})
# =========================================================

@router.get("/my-orders/{order_id}")
async def get_my_order(
    order_id: int,
    token: str = Depends(oauth2_scheme),
    db: AsyncSession = Depends(get_db),
):
    user_id = get_user_id_from_token(token)

    result = await db.execute(
        select(Order)
        .where(
            Order.id == order_id,
            Order.user_id == user_id,
        )
        .options(
            selectinload(Order.items).joinedload(OrderItem.product)
        )
    )

    order = result.scalar_one_or_none()

    if not order:
        raise HTTPException(
            status_code=404,
            detail="Order not found",
        )

    return await build_order_response(order, db)


@router.get("/{order_id}")
async def get_order_by_id(
    order_id: int,
    token: str = Depends(oauth2_scheme),
    db: AsyncSession = Depends(get_db),
):
    return await get_my_order(order_id, token, db)


# =========================================================
# GENERATE PDF INVOICE (CELERY BACKGROUND TASK)
# =========================================================

@router.post("/{order_id}/invoice")
async def trigger_invoice_generation(
    order_id: int,
    token: str = Depends(oauth2_scheme),
    db: AsyncSession = Depends(get_db),
):
    """
    Trigger asynchronous PDF invoice generation via Celery.
    Returns task_id for UI progress polling.
    """
    user_id = get_user_id_from_token(token)

    # Fetch order and verify ownership
    result = await db.execute(
        select(Order)
        .where(Order.id == order_id, Order.user_id == user_id)
        .options(selectinload(Order.items).joinedload(OrderItem.product))
    )
    order = result.scalar_one_or_none()

    if not order:
        raise HTTPException(
            status_code=404,
            detail="Order not found",
        )

    # Fetch user info
    user_result = await db.execute(select(User).where(User.id == user_id))
    customer = user_result.scalar_one_or_none()
    customer_name = customer.name if customer else "Customer"
    customer_email = customer.email if customer else "customer@shopflow.com"

    order_data = {
        "id": order.id,
        "user_id": order.user_id,
        "customer_name": customer_name,
        "customer_email": customer_email,
        "status": order.status,
        "total_amount": float(order.total_amount),
        "created_at": str(order.created_at),
        "items": [
            {
                "id": item.id,
                "product_id": item.product_id,
                "product_name": item.product_name,
                "price": float(item.price),
                "quantity": item.quantity,
                "item_total": float(item.item_total),
            }
            for item in order.items
        ],
    }

    # Dispatch Celery background task with resilient fallback
    task_id = dispatch_background_job(
        celery_func=generate_invoice_pdf,
        fallback_func=build_invoice_pdf,
        args=(order_data,),
        task_name=f"Invoice PDF for Order #{order_id}",
    )

    return {
        "task_id": task_id,
        "order_id": order_id,
        "status": "PENDING",
        "message": f"Invoice generation task initiated for order #{order_id}",
    }


# =========================================================
# DOWNLOAD PDF INVOICE
# =========================================================

@router.get("/{order_id}/invoice/download")
async def download_invoice(
    order_id: int,
    token: str = Depends(oauth2_scheme),
    db: AsyncSession = Depends(get_db),
):
    """
    Download the generated PDF invoice file.
    """
    user_id = get_user_id_from_token(token)

    result = await db.execute(
        select(Order).where(
            Order.id == order_id,
            Order.user_id == user_id,
        )
    )
    order = result.scalar_one_or_none()

    if not order:
        raise HTTPException(
            status_code=404,
            detail="Order not found",
        )

    order_status = str(order.status).strip().lower()

    if order_status not in {"delivered", "completed"}:
        raise HTTPException(
            status_code=400,
            detail="Invoice available only after the order has been delivered.",
        )

    pdf_path = Path("uploads/invoices") / f"order_{order_id}_invoice.pdf"

    if not pdf_path.exists():
        raise HTTPException(
            status_code=404,
            detail="Invoice not generated yet. Please generate the invoice first.",
        )

    return FileResponse(
        path=str(pdf_path),
        media_type="application/pdf",
        filename=f"ShopFlow_Invoice_Order_{order_id}.pdf",
    )


# =========================================================
# CANCEL MY ORDER
# =========================================================

@router.put("/my-orders/{order_id}/cancel")
async def cancel_my_order(
    order_id: int,
    token: str = Depends(oauth2_scheme),
    db: AsyncSession = Depends(get_db),
):
    user_id = get_user_id_from_token(token)

    # Only find an order belonging to this customer.
    result = await db.execute(
        select(Order).where(
            Order.id == order_id,
            Order.user_id == user_id,
        )
    )

    order = result.scalar_one_or_none()

    if not order:
        raise HTTPException(
            status_code=404,
            detail="Order not found",
        )

    # Preserve the existing cancellation rule.
    if order.status.lower() != "pending":
        raise HTTPException(
            status_code=400,
            detail=(
                "Order cannot be cancelled because "
                f"its status is '{order.status}'."
            ),
        )

    result = await db.execute(
        select(OrderItem).where(
            OrderItem.order_id == order.id
        )
    )

    order_items = result.scalars().all()

    # Restore stock for cancelled items.
    for item in order_items:
        product_result = await db.execute(
            select(Product).where(
                Product.id == item.product_id
            )
        )

        product = product_result.scalar_one_or_none()

        if product:
            product.stock += item.quantity

    order.status = "cancelled"

    await db.commit()
    await db.refresh(order)

    return {
        "message": "Order cancelled successfully",
        "id": order.id,
        "status": order.status,
        "total_amount": float(order.total_amount),
        "updated_at": order.updated_at,
    }


# =========================================================
# DELETE MY ORDER
# =========================================================
# Intentionally disabled. Keep order history for refunds,
# payments, reporting, and administration.
# Permanent deletion should use an admin-only endpoint.