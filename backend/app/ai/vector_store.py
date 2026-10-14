import asyncio
import os
from pathlib import Path

import chromadb
from chromadb.utils.embedding_functions import DefaultEmbeddingFunction
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import Product


# Store vectors inside the existing backend directory by default.
BACKEND_DIR = Path(__file__).resolve().parents[2]

CHROMA_PATH = Path(
    os.getenv(
        "SHOPFLOW_CHROMA_PATH",
        str(BACKEND_DIR / "data" / "chroma"),
    )
)

COLLECTION_NAME = "shopflow_products"

# Initial threshold based on the distances measured in your catalogue.
# Override it with SHOPFLOW_MAX_SEMANTIC_DISTANCE if testing requires it.
MAX_SEMANTIC_DISTANCE = float(
    os.getenv("SHOPFLOW_MAX_SEMANTIC_DISTANCE", "1.70")
)

_embedding_function = DefaultEmbeddingFunction()

_client = chromadb.PersistentClient(
    path=str(CHROMA_PATH),
)

_collection = _client.get_or_create_collection(
    name=COLLECTION_NAME,
    embedding_function=_embedding_function,
    metadata={"description": "ShopFlow product catalogue embeddings"},
)


def _product_document(product: Product) -> str:
    """Build searchable text from a product record."""
    return "\n".join(
        [
            f"Product name: {product.name or ''}",
            f"Category: {product.category or ''}",
            f"Description: {product.description or ''}",
        ]
    )


def _upsert_product_sync(product_id: int, document: str) -> None:
    """Insert or update a product embedding."""
    _collection.upsert(
        ids=[str(product_id)],
        documents=[document],
    )


async def index_product(product: Product) -> None:
    """Index one product without blocking the async event loop."""
    await asyncio.to_thread(
        _upsert_product_sync,
        product.id,
        _product_document(product),
    )


def _delete_product_sync(product_id: int) -> None:
    """Remove a product from the vector index."""
    _collection.delete(ids=[str(product_id)])


async def delete_product_embedding(product_id: int) -> None:
    """Remove a deleted product without blocking the event loop."""
    await asyncio.to_thread(
        _delete_product_sync,
        product_id,
    )


def _search_sync(message: str, limit: int) -> list[int]:
    """Return the strongest semantic match when it is sufficiently relevant."""
    if not message.strip() or limit < 1:
        return []

    collection_count = _collection.count()

    if collection_count == 0:
        return []

    results = _collection.query(
        query_texts=[message],
        n_results=min(limit, collection_count),
        include=["distances"],
    )

    ids = results.get("ids", [[]])[0]
    distances = results.get("distances", [[]])[0]

    if not ids or not distances:
        return []

    # Chroma distances are lower for closer matches.
    # Reject a query when even its closest product is too far away.
    best_distance = distances[0]

    if best_distance is None or best_distance > MAX_SEMANTIC_DISTANCE:
        return []

    # Return only the closest semantic candidate. This avoids presenting
    # several weakly related products as relevant sources.
    try:
        return [int(ids[0])]
    except (TypeError, ValueError):
        return []


async def search_product_ids(
    message: str,
    limit: int = 8,
) -> list[int]:
    """Search product embeddings and return relevant database IDs."""
    return await asyncio.to_thread(
        _search_sync,
        message,
        limit,
    )


def _replace_all_sync(
    product_records: list[tuple[int, str]],
) -> None:
    """Replace the vector index with the supplied product catalogue."""
    existing_ids = _collection.get().get("ids", [])

    if existing_ids:
        _collection.delete(ids=existing_ids)

    # Keep each batch small to limit memory use.
    batch_size = 100

    for start in range(0, len(product_records), batch_size):
        batch = product_records[start : start + batch_size]

        _collection.upsert(
            ids=[str(product_id) for product_id, _ in batch],
            documents=[document for _, document in batch],
        )


async def rebuild_product_index(db: AsyncSession) -> int:
    """Rebuild the persistent vector index from PostgreSQL."""
    result = await db.execute(select(Product))
    products = list(result.scalars().all())

    records = [
        (product.id, _product_document(product))
        for product in products
    ]

    await asyncio.to_thread(
        _replace_all_sync,
        records,
    )

    return len(records)


async def ensure_product_index(db: AsyncSession) -> int:
    """Build the index on first use when it is empty."""
    count = await asyncio.to_thread(_collection.count)

    if count == 0:
        return await rebuild_product_index(db)

    return count