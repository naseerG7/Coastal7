import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";

import { getProduct } from "../services/productService";
import { addToCart } from "../services/cartService";

function ProductDetails() {
  const { productId } = useParams();
  const navigate = useNavigate();

 const [quantity, setQuantity] = useState(1);

  const [adding, setAdding] = useState(false);

  const [buying, setBuying] = useState(false);

  const [message, setMessage] = useState("");

  const [error, setError] = useState("");

 // ============================================================
// LOAD PRODUCT WITH TANSTACK QUERY
// ============================================================

const {
  data: product,
  isLoading: loading,
  isError: productLoadError,
} = useQuery({
  queryKey: ["product", productId],
  queryFn: () => getProduct(productId),
  enabled: !!productId,
});

  // ============================================================
  // QUANTITY
  // ============================================================

  const increaseQuantity = () => {
    if (!product) {
      return;
    }

    setQuantity((current) =>
      Math.min(current + 1, product.stock)
    );
  };

  const decreaseQuantity = () => {
    setQuantity((current) =>
      Math.max(current - 1, 1)
    );
  };

  // ============================================================
  // ADD TO CART
  // ============================================================

  const handleAddToCart = async () => {
    if (!product || product.stock <= 0) {
      return;
    }

    try {
      setAdding(true);

      setMessage("");

      setError("");

      await addToCart(
        product.id,
        quantity
      );

      setMessage(
        `${quantity} item${
          quantity > 1 ? "s" : ""
        } added to your cart.`
      );
    } catch (error) {
      console.error(
        "ADD TO CART ERROR:",
        error
      );

      setError(
        error.response?.data?.detail ||
          "Unable to add product to cart."
      );
    } finally {
      setAdding(false);
    }
  };

  // ============================================================
  // BUY NOW
  // ============================================================

  const handleBuyNow = async () => {
    if (!product || product.stock <= 0) {
      return;
    }

    try {
      setBuying(true);

      setMessage("");

      setError("");

      /*
       * Add the selected quantity to the cart first.
       *
       * The checkout page will then load the cart
       * and display the selected product.
       */
      await addToCart(
        product.id,
        quantity
      );

      /*
       * Go directly to checkout.
       */
      navigate("/checkout");
    } catch (error) {
      console.error(
        "BUY NOW ERROR:",
        error
      );

      setError(
        error.response?.data?.detail ||
          "Unable to continue to checkout."
      );
    } finally {
      setBuying(false);
    }
  };

  // ============================================================
  // LOADING
  // ============================================================

  if (loading) {
    return (
      <section className="product-details-page">
        <div className="details-loading">
          <div className="loading-spinner"></div>

          <h2>
            Loading product...
          </h2>

          <p>
            Please wait while we get
            the product details.
          </p>
        </div>
      </section>
    );
  }

  // ============================================================
  // ERROR
  // ============================================================

  if (productLoadError && !product) {
    return (
      <section className="product-details-page">
        <div className="product-error-box">
          <div className="error-icon">
            ⚠️
          </div>

          <h2>
            Could not load product
          </h2>

          <p>Product not found or could not be loaded.</p>

          <Link
            className="details-primary-button"
            to="/products"
          >
            ← Back to Products
          </Link>
        </div>
      </section>
    );
  }

  if (!product) {
    return null;
  }

  // ============================================================
  // PRODUCT CALCULATIONS
  // ============================================================

  const price = Number(product.price);

  const totalPrice =
    price * quantity;

  /*
   * Demo rating/review information.
   *
   * We will connect real reviews later.
   */
  const rating = "4.5";

  const reviewCount = "1,248";

  /*
   * Demo delivery date.
   *
   * Later we can calculate this dynamically
   * based on the customer's address.
   */
  const deliveryText =
    "FREE delivery available";

  // ============================================================
  // IMAGE
  // ============================================================

  const imageUrl = product.image_url
    ? product.image_url.startsWith("http")
      ? product.image_url
      : `http://127.0.0.1:8000${product.image_url}`
    : null;

  return (
    <section className="product-details-page">

      {/* ======================================================
          BREADCRUMB
      ======================================================= */}

      <div className="product-breadcrumb">
        <Link to="/">
          Home
        </Link>

        <span>›</span>

        <Link to="/products">
          Products
        </Link>

        <span>›</span>

        <span>
          {product.category}
        </span>

        <span>›</span>

        <strong>
          {product.name}
        </strong>
      </div>

      {/* ======================================================
          MAIN PRODUCT SECTION
      ======================================================= */}

      <div className="product-details-main">

        {/* ====================================================
            LEFT - IMAGE
        ===================================================== */}

        <div className="product-details-image-section">

          <div className="product-details-image">

            {imageUrl ? (
              <img
                src={imageUrl}
                alt={product.name}
              />
            ) : (
              <div className="product-no-image">
                <span>📦</span>

                <p>
                  No Image Available
                </p>
              </div>
            )}

          </div>

        </div>

        {/* ====================================================
            CENTER - PRODUCT INFORMATION
        ===================================================== */}

        <div className="product-details-information">

          <h1 className="product-details-title">
            {product.name}
          </h1>

          {/* CATEGORY */}

          <p className="product-details-category">
            Category:

            <strong>
              {product.category}
            </strong>
          </p>

          {/* RATING */}

          <div className="product-details-rating">

            <span className="rating-stars">
              ★★★★★
            </span>

            <span className="rating-number">
              {rating}
            </span>

            <span className="rating-divider">
              |
            </span>

            <span className="rating-count">
              {reviewCount} ratings
            </span>

          </div>

          <hr />

          {/* PRICE */}

          <div className="product-price-section">

            <span className="product-price-label">
              Price:
            </span>

            <strong className="product-details-price">
              ₹
              {price.toLocaleString(
                "en-IN"
              )}
            </strong>

          </div>

          {/* TAX MESSAGE */}

          <p className="price-tax-message">
            Inclusive of applicable taxes
          </p>

          {/* DESCRIPTION */}

          <div className="product-description-section">

            <h2>
              About this product
            </h2>

            <p>
              {product.description ||
                "This product is available on ShopFlow. Please check the product specifications and availability before ordering."}
            </p>

          </div>

          {/* STOCK */}

          <div className="product-stock-section">

            {product.stock > 0 ? (
              <>
                <span className="stock-available">
                  In Stock
                </span>

                <span className="stock-count">
                  {product.stock} available
                </span>
              </>
            ) : (
              <span className="stock-unavailable">
                Currently unavailable
              </span>
            )}

          </div>

          {/* DELIVERY */}

          <div className="delivery-information">

            <div className="delivery-row">

              <span className="delivery-icon">
                🚚
              </span>

              <div>
                <strong>
                  Delivery
                </strong>

                <p>
                  {deliveryText}
                </p>
              </div>

            </div>

            <div className="delivery-row">

              <span className="delivery-icon">
                🔄
              </span>

              <div>
                <strong>
                  Easy Returns
                </strong>

                <p>
                  Eligible products can be
                  returned according to
                  ShopFlow return policy.
                </p>
              </div>

            </div>

            <div className="delivery-row">

              <span className="delivery-icon">
                🔒
              </span>

              <div>
                <strong>
                  Secure Transaction
                </strong>

                <p>
                  Your transaction is
                  protected by secure
                  checkout.
                </p>
              </div>

            </div>

          </div>

        </div>

        {/* ====================================================
            RIGHT - PURCHASE BOX
        ===================================================== */}

        <aside className="product-buy-box">

          <div className="buy-box-price">
            ₹
            {totalPrice.toLocaleString(
              "en-IN"
            )}
          </div>

          <p className="buy-box-delivery">
            FREE delivery
          </p>

          <p className="buy-box-stock">

            {product.stock > 0
              ? `${product.stock} in stock`
              : "Out of stock"}

          </p>

          {product.stock > 0 && (
            <>

              {/* QUANTITY */}

              <div className="buy-box-quantity">

                <label htmlFor="product-quantity">
                  Quantity:
                </label>

                <div className="quantity-controls-large">

                  <button
                    type="button"
                    onClick={
                      decreaseQuantity
                    }
                    disabled={
                      quantity <= 1
                    }
                    aria-label="Decrease quantity"
                  >
                    −
                  </button>

                  <span
                    id="product-quantity"
                  >
                    {quantity}
                  </span>

                  <button
                    type="button"
                    onClick={
                      increaseQuantity
                    }
                    disabled={
                      quantity >=
                      product.stock
                    }
                    aria-label="Increase quantity"
                  >
                    +
                  </button>

                </div>

              </div>

              {/* ADD TO CART */}

              <button
                type="button"
                className="product-add-cart-button"
                onClick={
                  handleAddToCart
                }
                disabled={adding}
              >
                {adding
                  ? "Adding..."
                  : "🛒 Add to Cart"}
              </button>

              {/* BUY NOW */}

              <button
                type="button"
                className="product-buy-now-button"
                onClick={
                  handleBuyNow
                }
                disabled={buying}
              >
                {buying
                  ? "Preparing Checkout..."
                  : "⚡ Buy Now"}
              </button>

              {/* SUCCESS */}

              {message && (
                <div className="product-success-message">
                  ✓ {message}

                  <Link to="/cart">
                    View Cart
                  </Link>
                </div>
              )}

              {/* ERROR */}

              {error && (
                <div className="product-error-message">
                  {error}
                </div>
              )}

              {/* SECURE */}

              <div className="buy-box-security">

                <span>
                  🔒
                </span>

                <p>
                  Secure transaction
                </p>

              </div>

              {/* PURCHASE PROTECTION */}

              <div className="purchase-protection">

                <strong>
                  ShopFlow Purchase Protection
                </strong>

                <p>
                  Shop confidently with
                  secure payments and
                  protected ordering.
                </p>

              </div>

            </>
          )}

        </aside>

      </div>

      {/* ======================================================
          PRODUCT SUMMARY
      ======================================================= */}

      <div className="product-information-card">

        <h2>
          Product Information
        </h2>

        <div className="product-information-grid">

          <div>

            <span>
              Product
            </span>

            <strong>
              {product.name}
            </strong>

          </div>

          <div>

            <span>
              Category
            </span>

            <strong>
              {product.category}
            </strong>

          </div>

          <div>

            <span>
              Availability
            </span>

            <strong>
              {product.stock > 0
                ? "In Stock"
                : "Out of Stock"}
            </strong>

          </div>

          <div>

            <span>
              Price
            </span>

            <strong>
              ₹
              {price.toLocaleString(
                "en-IN"
              )}
            </strong>

          </div>

        </div>

      </div>

      {/* ======================================================
          BOTTOM ACTIONS
      ======================================================= */}

      <div className="details-bottom-actions">

        <Link
          className="details-secondary-button"
          to="/products"
        >
          ← Continue Shopping
        </Link>

        <Link
          className="details-cart-button"
          to="/cart"
        >
          🛒 View Cart
        </Link>

      </div>

    </section>
  );
}

export default ProductDetails;