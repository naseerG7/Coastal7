from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.database import get_db
from app.core.dependencies import (
    get_current_customer,
    get_current_admin,
)
from app.models import Cart, CartItem, Order, OrderItem, Product, User
from app.schemas.order import (
    OrderResponse,
    OrderDetailResponse,
    OrderStatusUpdate,
)


router = APIRouter(
    tags=["Orders"]
)


# ============================================================
# CUSTOMER - CREATE ORDER FROM CART
# ============================================================

@router.post(
    "/orders",
    response_model=OrderDetailResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_order(
    current_user: User = Depends(get_current_customer),
    db: AsyncSession = Depends(get_db),
):
    # --------------------------------------------------------
    # 1. Find the customer's cart
    # --------------------------------------------------------

    cart_result = await db.execute(
        select(Cart).where(
            Cart.user_id == current_user.id
        )
    )

    cart = cart_result.scalar_one_or_none()

    if not cart:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cart is empty",
        )

    # --------------------------------------------------------
    # 2. Get all cart items
    # --------------------------------------------------------

    cart_items_result = await db.execute(
        select(CartItem).where(
            CartItem.cart_id == cart.id
        )
    )

    cart_items = cart_items_result.scalars().all()

    if not cart_items:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cart is empty",
        )

    # --------------------------------------------------------
    # 3. Load products and validate stock
    # --------------------------------------------------------

    product_ids = [
        cart_item.product_id
        for cart_item in cart_items
    ]

    products_result = await db.execute(
        select(Product).where(
            Product.id.in_(product_ids)
        )
    )

    products = products_result.scalars().all()

    products_by_id = {
        product.id: product
        for product in products
    }

    # Make sure every cart product still exists.
    for cart_item in cart_items:

        product = products_by_id.get(
            cart_item.product_id
        )

        if not product:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=(
                    f"Product {cart_item.product_id} "
                    "no longer exists"
                ),
            )

        # ----------------------------------------------------
        # Stock validation
        # ----------------------------------------------------

        if product.stock < cart_item.quantity:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=(
                    f"Not enough stock for "
                    f"'{product.name}'. "
                    f"Available: {product.stock}, "
                    f"Requested: {cart_item.quantity}"
                ),
            )

    # --------------------------------------------------------
    # 4. Calculate order total
    # --------------------------------------------------------

    total_amount = 0

    for cart_item in cart_items:

        product = products_by_id[
            cart_item.product_id
        ]

        item_total = (
            product.price * cart_item.quantity
        )

        total_amount += item_total

    # --------------------------------------------------------
    # 5. Create the order
    # --------------------------------------------------------

    order = Order(
        user_id=current_user.id,
        total_amount=total_amount,
        status="pending",
    )

    db.add(order)

    # Flush gives us order.id before commit.
    await db.flush()

    # --------------------------------------------------------
    # 6. Create order items and reduce stock
    # --------------------------------------------------------

    for cart_item in cart_items:

        product = products_by_id[
            cart_item.product_id
        ]

        item_total = (
            product.price * cart_item.quantity
        )

        order_item = OrderItem(
            order_id=order.id,
            product_id=product.id,
            product_name=product.name,
            price=product.price,
            quantity=cart_item.quantity,
            item_total=item_total,
        )

        db.add(order_item)

        # Reduce inventory.
        product.stock -= cart_item.quantity

    # --------------------------------------------------------
    # 7. Clear the customer's cart
    # --------------------------------------------------------

    await db.execute(
        delete(CartItem).where(
            CartItem.cart_id == cart.id
        )
    )

    # --------------------------------------------------------
    # 8. Commit everything together
    # --------------------------------------------------------

    await db.commit()

    # --------------------------------------------------------
    # 9. Load the order with its items
    # --------------------------------------------------------

    result = await db.execute(
        select(Order)
        .options(selectinload(Order.items))
        .where(Order.id == order.id)
    )

    created_order = result.scalar_one()

    return created_order


# ============================================================
# CUSTOMER - GET MY ORDERS
# ============================================================

@router.get(
    "/orders/my-orders",
    response_model=list[OrderResponse]
)
async def get_my_orders(
    current_user: User = Depends(get_current_customer),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Order)
        .where(
            Order.user_id == current_user.id
        )
        .order_by(Order.created_at.desc())
    )

    orders = result.scalars().all()

    return orders


# ============================================================
# CUSTOMER - GET ONE OF MY ORDERS
# ============================================================

@router.get(
    "/orders/my-orders/{order_id}",
    response_model=OrderDetailResponse
)
async def get_my_order(
    order_id: int,
    current_user: User = Depends(get_current_customer),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Order)
        .options(selectinload(Order.items))
        .where(
            Order.id == order_id,
            Order.user_id == current_user.id,
        )
    )

    order = result.scalar_one_or_none()

    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Order not found",
        )

    return order


# ============================================================
# ADMIN - GET ALL ORDERS
# ============================================================

@router.get(
    "/admin/orders",
    response_model=list[OrderResponse]
)
async def get_all_orders(
    current_user: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Order)
        .order_by(Order.created_at.desc())
    )

    orders = result.scalars().all()

    return orders


# ============================================================
# ADMIN - GET ANY ORDER
# ============================================================

@router.get(
    "/admin/orders/{order_id}",
    response_model=OrderDetailResponse
)
async def get_admin_order(
    order_id: int,
    current_user: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Order)
        .options(selectinload(Order.items))
        .where(Order.id == order_id)
    )

    order = result.scalar_one_or_none()

    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Order not found",
        )

    return order


# ============================================================
# ADMIN - UPDATE ORDER STATUS
# ============================================================

@router.put(
    "/admin/orders/{order_id}/status",
    response_model=OrderResponse
)
async def update_order_status(
    order_id: int,
    status_data: OrderStatusUpdate,
    current_user: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Order).where(
            Order.id == order_id
        )
    )

    order = result.scalar_one_or_none()

    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Order not found",
        )

    order.status = status_data.status

    await db.commit()
    await db.refresh(order)

    return order