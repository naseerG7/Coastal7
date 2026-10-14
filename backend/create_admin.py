import asyncio

from sqlalchemy import select

from app.core.database import AsyncSessionLocal
from app.core.security import hash_password
from app.models import User


async def create_admin():
    async with AsyncSessionLocal() as db:

        email = "admin@example.com"
        password = "Admin@123"

        result = await db.execute(
            select(User).where(User.email == email)
        )

        existing_user = result.scalar_one_or_none()

        if existing_user:
            existing_user.role = "admin"
            existing_user.hashed_password = hash_password("Admin@123")

    await db.commit()

    print("Admin account updated successfully.")
    print(f"Email: {existing_user.email}")
    print(f"Password: Admin@123")
    print(f"Role: {existing_user.role}")
    admin = User(
            name="Administrator",
            email=email,
            hashed_password=hash_password(password),
            role="admin",
        )

    db.add(admin)
    await db.commit()
    await db.refresh(admin)
    print("Admin created successfully.")
    print(f"ID: {admin.id}")
    print(f"Email: {admin.email}")
    print(f"Role: {admin.role}")
    return


if __name__ == "__main__":
    asyncio.run(create_admin())