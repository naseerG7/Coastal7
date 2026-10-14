
import { Link } from "react-router-dom";
import { addToCart } from "../services/cartService";
import { useState } from "react";

const API_BASE = "http://127.0.0.1:8000";

function ChatbotProductCard({ product }) {
  const [adding, setAdding] = useState(false);
  const [notice, setNotice] = useState("");

  const imageUrl = product.image_url
    ? product.image_url.startsWith("http")
      ? product.image_url
      : `${API_BASE}${product.image_url}`
    : null;

  async function handleAddToCart() {
    if (!product || product.stock <= 0 || adding) return;

    try {
      setAdding(true);
      const result = await addToCart(product.id, 1);
      setNotice(result?.message || "Added to cart");
    } catch {
      setNotice("Could not add this item. Please try again.");
    } finally {
      setAdding(false);
    }
  }

  return (
    <article className="chatbot-product-card">
      <Link
        to={`/products/${product.id}`}
        className="chatbot-product-link"
      >
        {imageUrl ? (
          <img
            className="chatbot-product-image"
            src={imageUrl}
            alt={product.name}
            loading="lazy"
          />
        ) : (
          <div className="chatbot-product-no-image">
            No image available
          </div>
        )}

        <strong>{product.name}</strong>
      </Link>

      <span className="chatbot-product-category">
        {product.category}
      </span>

      <strong className="chatbot-product-price">
        ₹{Number(product.price).toLocaleString("en-IN")}
      </strong>

      <span className="chatbot-product-stock">
        {product.stock > 0
          ? `${product.stock} available`
          : "Out of stock"}
      </span>

      <button
        type="button"
        onClick={handleAddToCart}
        disabled={adding || product.stock <= 0}
      >
        {adding
          ? "Adding..."
          : product.stock <= 0
            ? "Out of stock"
            : "Add to cart"}
      </button>

      {notice && (
        <span role="status" className="chatbot-product-notice">
          {notice}
        </span>
      )}
    </article>
  );
}

export default function ChatbotProductResults({ products }) {
  if (!products?.length) return null;

  return (
    <div className="chatbot-product-results">
      {products.map((product) => (
        <ChatbotProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}
