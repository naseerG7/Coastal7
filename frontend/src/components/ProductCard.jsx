
import { useState } from "react";
import { Link } from "react-router-dom";
import { addToCart } from "../services/cartService";

function ProductCard({ product }) {
  const [adding, setAdding] = useState(false);
  const [added, setAdded] = useState(false);

  const handleAddToCart = async () => {
    if (!product || product.stock <= 0 || adding) return;

    try {
      setAdding(true);

      const response = await addToCart(product.id, 1);
      setAdded(response?.message || "Added to cart");

      setTimeout(() => setAdded(false), 2000);
    } catch (err) {
      console.error("Failed to add to cart:", err);
    } finally {
      setAdding(false);
    }
  };

  const imageUrl = product.image_url
    ? product.image_url.startsWith("http")
      ? product.image_url
      : `http://127.0.0.1:8000${product.image_url}`
    : null;

  const isOutOfStock = product.stock <= 0;

  return (
    <article className="product-card">
      <div className="product-card-link">
        <Link
          to={`/products/${product.id}`}
          className="product-details-link"
        >
          <div className="product-photo">
            {imageUrl ? (
              <img
                src={imageUrl}
                alt={product.name}
                loading="lazy"
                decoding="async"
              />
            ) : (
              <span className="no-image" aria-label="No product image">
                📦
              </span>
            )}

            {product.stock <= 5 && product.stock > 0 && (
              <span className="deal-badge">
                Only {product.stock} left!
              </span>
            )}
          </div>

          <div className="product-info">
            <h3>{product.name}</h3>

            <p className="product-card-category">
              {product.category}
            </p>

            <div className="rating" aria-label="Rated 4.5 out of 5">
              ★★★★★ <span>4.5</span>
            </div>

            <p className="product-description">
              {product.description ||
                "Quality product available on ShopFlow."}
            </p>

            <strong className="product-price">
              ₹{Number(product.price).toLocaleString("en-IN")}
            </strong>

            <p className="delivery">🚚 Free Delivery</p>

            <p className="product-stock">
              {product.stock} available
            </p>
          </div>
        </Link>

        <div className="product-card-actions">
          <button
            type="button"
            className="add-cart-btn"
            onClick={handleAddToCart}
            disabled={adding || isOutOfStock}
          >
  {adding
  ? "Adding..."
  : added
    ? "Added to cart"
    : "Add to Cart"}
          </button>

          {isOutOfStock && (
            <span className="stock-status">Out of Stock</span>
          )}

          <Link
            to={`/products/${product.id}`}
            className="view-details-link"
          >
            View Details
          </Link>
        </div>
      </div>
    </article>
  );
}

export default ProductCard;
