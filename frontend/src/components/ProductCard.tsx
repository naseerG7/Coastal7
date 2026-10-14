import { useState } from "react";
import { Link } from "react-router-dom";
import { addToCart } from "../services/cartService";
import type { Product } from "../types/products";

interface ProductCardProps {
  product: Product;
}

function ProductCard({ product }: ProductCardProps) {
  const [adding, setAdding] = useState<boolean>(false);
  const [message, setMessage] = useState<string>("");
  const [error, setError] = useState<string>("");

  const handleAddToCart = async (): Promise<void> => {
    try {
      setAdding(true);
      setMessage("");
      setError("");

      await addToCart(product.id, 1);

      setMessage("Added to cart!");
    } catch (err: any) {
      console.error("ADD TO CART ERROR:", err);

      setError(
        err?.response?.data?.detail ||
          "Unable to add product to cart."
      );
    } finally {
      setAdding(false);
    }
  };

  const imageUrl = product.image_url
    ? `http://127.0.0.1:8000${product.image_url}`
    : null;

  return (
    <article className="product-card">

      {/* Product Image */}
      <Link
        to={`/products/${product.id}`}
        className="product-image-link"
      >
        <div className="product-card-image">

          {imageUrl ? (
            <img
              src={imageUrl}
              alt={product.name}
              loading="lazy"
            />
          ) : (
            <div className="no-product-image">
              <span>📦</span>
              <p>No Image</p>
            </div>
          )}

        </div>
      </Link>

      {/* Product Information */}
      <div className="product-card-body">

        <p className="product-card-category">
          {product.category}
        </p>

        <Link
          to={`/products/${product.id}`}
          className="product-card-title"
        >
          {product.name}
        </Link>

        <div className="product-rating">
          <span>★★★★★</span>
          <small>4.5</small>
        </div>

        <div className="product-card-price">
          ₹{Number(product.price).toLocaleString("en-IN")}
        </div>

        <p className="product-stock">
          {product.stock > 0
            ? `${product.stock} available`
            : "Out of Stock"}
        </p>

        {/* Actions */}
        <div className="product-card-actions">

          <Link
            to={`/products/${product.id}`}
            className="view-product-button"
          >
            View Details
          </Link>

          <button
            type="button"
            onClick={handleAddToCart}
            disabled={adding || product.stock <= 0}
            className="add-cart-button"
          >
            {adding ? "Adding..." : "🛒 Add to Cart"}
          </button>

        </div>

        {message && (
          <p className="product-success">
            ✓ {message}
          </p>
        )}

        {error && (
          <p className="product-error">
            {error}
          </p>
        )}

      </div>

    </article>
  );
}

export default ProductCard;