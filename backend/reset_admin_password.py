from sqlalchemy import select
from app.core.database import AsyncSessionLocal
from app.core.security import hash_password
from app.models import User
import asyncio


async def reset_admin_password():
    email = "naseer@example.com"
    new_password = "Admin@123"

    async with AsyncSessionLocal() as db:
        result = await db.execute(
            select(User).where(User.email == email)
        )

        user = result.scalar_one_or_none()

        if not user:
            print("Admin user not found.")
            return

        user.hashed_password = hash_password(new_password)

        await db.commit()

        print("Admin password reset successfully.")
        print(f"Email: {email}")
        print(f"New password: {new_password}")


if __name__ == "__main__":
    asyncio.run(reset_admin_password())