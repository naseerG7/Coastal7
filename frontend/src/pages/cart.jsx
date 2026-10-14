import { useState } from "react";
import { useNavigate } from "react-router-dom";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  getCart,
  updateCartItem,
  removeFromCart,
} from "../services/cartService";

import "./cart.css";

function Cart() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // ============================================================
  // LOCAL UI STATE
  // ============================================================

  const [updatingItem, setUpdatingItem] = useState(null);
  const [removingItem, setRemovingItem] = useState(null);

  // ============================================================
  // GET CART
  // ============================================================

  const {
    data: cart,
    isLoading: loading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ["cart"],
    queryFn: getCart,
  });

  // ============================================================
  // ERROR MESSAGE
  // ============================================================

  const getErrorMessage = (err, fallbackMessage) => {
    return (
      err?.response?.data?.detail ||
      fallbackMessage
    );
  };

  const cartError =
    isError && error
      ? getErrorMessage(
          error,
          "Unable to load your shopping cart."
        )
      : "";

  // ============================================================
  // UPDATE QUANTITY MUTATION
  // ============================================================

  const updateQuantityMutation = useMutation({
    mutationFn: ({ itemId, quantity }) =>
      updateCartItem(itemId, quantity),

    onMutate: ({ itemId }) => {
      setUpdatingItem(itemId);
    },

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["cart"],
      });
    },

    onError: (err) => {
      console.error(
        "CART QUANTITY ERROR:",
        err
      );
    },

    onSettled: () => {
      setUpdatingItem(null);
    },
  });

  // ============================================================
  // REMOVE ITEM MUTATION
  // ============================================================

  const removeItemMutation = useMutation({
    mutationFn: (itemId) =>
      removeFromCart(itemId),

    onMutate: (itemId) => {
      setRemovingItem(itemId);
    },

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["cart"],
      });
    },

    onError: (err) => {
      console.error(
        "REMOVE CART ITEM ERROR:",
        err
      );
    },

    onSettled: () => {
      setRemovingItem(null);
    },
  });

  // ============================================================
  // UPDATE QUANTITY
  // ============================================================

  const handleQuantityChange = (
    itemId,
    quantity
  ) => {
    if (quantity < 1) {
      return;
    }

    updateQuantityMutation.mutate({
      itemId,
      quantity,
    });
  };

  // ============================================================
  // REMOVE ITEM
  // ============================================================

  const handleRemove = (itemId) => {
    removeItemMutation.mutate(itemId);
  };

  // ============================================================
  // CHECKOUT
  // ============================================================

  const handleCheckout = () => {
    if (!cart?.items?.length) {
      return;
    }

    navigate("/checkout");
  };

  // ============================================================
  // CONTINUE SHOPPING
  // ============================================================

  const handleContinueShopping = () => {
    navigate("/products");
  };

  // ============================================================
  // CALCULATIONS
  // ============================================================

  const items = cart?.items || [];

  const getItemCount = () => {
    return items.reduce(
      (total, item) =>
        total + Number(item.quantity || 0),
      0
    );
  };

  const getProductCount = () => {
    return items.length;
  };

  const getSubtotal = () => {
    return items.reduce(
      (total, item) =>
        total +
        Number(item.price || 0) *
          Number(item.quantity || 0),
      0
    );
  };

  const itemCount = getItemCount();
  const productCount = getProductCount();

  const subtotal = getSubtotal();

  // Free delivery
  const deliveryCharge = 0;

  const total =
    subtotal + deliveryCharge;

  // ============================================================
  // LOADING
  // ============================================================

  if (loading) {
    return (
      <section className="shopflow-cart-page">
        <div className="cart-loading">
          <div className="cart-loading-spinner"></div>

          <h2>
            Loading your cart...
          </h2>

          <p>
            Please wait while we load your
            shopping cart.
          </p>
        </div>
      </section>
    );
  }

  // ============================================================
  // ERROR WITHOUT CART
  // ============================================================

  if (isError && !cart) {
    return (
      <section className="shopflow-cart-page">
        <div className="cart-error">
          <div className="cart-error-icon">
            !
          </div>

          <h2>
            Unable to Load Cart
          </h2>

          <p>
            {cartError}
          </p>

          <button
            type="button"
            onClick={() => refetch()}
            className="cart-retry-button"
          >
            Try Again
          </button>
        </div>
      </section>
    );
  }

  // ============================================================
  // EMPTY CART
  // ============================================================

  if (
    !cart ||
    !cart.items ||
    cart.items.length === 0
  ) {
    return (
      <section className="shopflow-cart-page">
        <div className="cart-empty">
          <div className="cart-empty-icon">
            🛒
          </div>

          <h1>
            Your Cart is Empty
          </h1>

          <p>
            You haven't added any products
            to your shopping cart yet.
          </p>

          <button
            type="button"
            onClick={
              handleContinueShopping
            }
            className="continue-shopping-button"
          >
            Continue Shopping
          </button>
        </div>
      </section>
    );
  }

  // ============================================================
  // MAIN CART
  // ============================================================

  return (
    <section className="shopflow-cart-page">
      <div className="cart-container">

        {/* ======================================================
            CART HEADER
        ====================================================== */}

        <div className="cart-header">
          <div>
            <h1>
              Shopping Cart
            </h1>

            <p>
              {productCount}{" "}
              {productCount === 1
                ? "product"
                : "products"}{" "}
              · {itemCount}{" "}
              {itemCount === 1
                ? "item"
                : "items"}
            </p>
          </div>

          <button
            type="button"
            onClick={
              handleContinueShopping
            }
            className="continue-shopping-button"
          >
            Continue Shopping
          </button>
        </div>

        {/* ======================================================
            ERROR MESSAGE
        ====================================================== */}

        {cartError && (
          <div className="cart-inline-error">
            <span>
              {cartError}
            </span>

            <button
              type="button"
              onClick={() =>
                queryClient.removeQueries({
                  queryKey: ["cart"],
                })
              }
              aria-label="Close error"
            >
              ×
            </button>
          </div>
        )}

        {/* ======================================================
            CART CONTENT
        ====================================================== */}

        <div className="cart-layout">

          {/* ====================================================
              CART ITEMS
          ==================================================== */}

          <div className="cart-items-section">

            <div className="cart-section-header">
              <h2>
                Your Items
              </h2>

              <span>
                {itemCount} items
              </span>
            </div>

            <div className="cart-items">

              {cart.items.map((item) => {
                const productName =
                  item.name;

                const productImage =
                  item.image_url;

                const productPrice =
                  Number(
                    item.price || 0
                  );

                const quantity =
                  Number(
                    item.quantity || 1
                  );

                const itemTotal =
                  Number(
                    item.item_total || 0
                  );

                const maxStock =
                  Number(
                    item.stock || 999
                  );

                const isUpdating =
                  updatingItem ===
                  item.id;

                const isRemoving =
                  removingItem ===
                  item.id;

                return (
                  <article
                    key={item.id}
                    className="cart-item"
                  >

                    {/* Product Image */}

                    <div className="cart-item-image">

                      {productImage ? (
                      <img
                        src={`http://127.0.0.1:8000${productImage}`}
                        alt={productName}
                        loading="lazy"
                      />
                      ) : (
                        <div className="cart-no-image">
                          <span>
                            📦
                          </span>
                        </div>
                      )}

                    </div>

                    {/* Product Information */}

                    <div className="cart-item-info">

                      <p className="cart-item-category">
                        {item.category}
                      </p>

                      <h3 className="cart-item-name">
                        {productName}
                      </h3>

                      {item.description && (
                        <p className="cart-item-description">
                          {
                            item.description
                          }
                        </p>
                      )}

                      <p className="cart-item-price">
                        ₹
                        {productPrice.toLocaleString(
                          "en-IN"
                        )}
                      </p>

                      <p className="cart-item-stock">
                        {item.stock > 0
                          ? `${item.stock} available`
                          : "Out of Stock"}
                      </p>

                    </div>

                    {/* Quantity Controls */}

                    <div className="cart-item-quantity">

                      <span className="quantity-label">
                        Quantity
                      </span>

                      <div className="quantity-controls">

                        <button
                          type="button"
                          aria-label="Decrease quantity"
                          onClick={() =>
                            handleQuantityChange(
                              item.id,
                              quantity - 1
                            )
                          }
                          disabled={
                            quantity <= 1 ||
                            isUpdating ||
                            isRemoving
                          }
                        >
                          −
                        </button>

                        <span>
                          {isUpdating
                            ? "..."
                            : quantity}
                        </span>

                        <button
                          type="button"
                          aria-label="Increase quantity"
                          onClick={() =>
                            handleQuantityChange(
                              item.id,
                              quantity + 1
                            )
                          }
                          disabled={
                            quantity >=
                              maxStock ||
                            isUpdating ||
                            isRemoving
                          }
                        >
                          +
                        </button>

                      </div>

                    </div>

                    {/* Item Total */}

                    <div className="cart-item-total">

                      <span className="cart-total-label">
                        Total
                      </span>

                      <strong>
                        ₹
                        {itemTotal.toLocaleString(
                          "en-IN"
                        )}
                      </strong>

                    </div>

                    {/* Remove */}

                    <button
                      type="button"
                      className="cart-remove-button"
                      onClick={() =>
                        handleRemove(
                          item.id
                        )
                      }
                      disabled={
                        isRemoving ||
                        isUpdating
                      }
                      aria-label={`Remove ${productName}`}
                    >
                      {isRemoving
                        ? "Removing..."
                        : "Remove"}
                    </button>

                  </article>
                );
              })}

            </div>

          </div>

          {/* ====================================================
              ORDER SUMMARY
          ==================================================== */}

          <aside className="cart-summary">

            <div className="cart-summary-header">
              <h2>
                Order Summary
              </h2>
            </div>

            <div className="cart-summary-content">

              <div className="summary-row">
                <span>
                  Products
                </span>

                <span>
                  {productCount}
                </span>
              </div>

              <div className="summary-row">
                <span>
                  Items
                </span>

                <span>
                  {itemCount}
                </span>
              </div>

              <div className="summary-row">
                <span>
                  Subtotal
                </span>

                <span>
                  ₹
                  {subtotal.toLocaleString(
                    "en-IN"
                  )}
                </span>
              </div>

              <div className="summary-row">
                <span>
                  Delivery
                </span>

                <span className="free-delivery">
                  FREE
                </span>
              </div>

              <div className="summary-divider"></div>

              <div className="summary-total">
                <span>
                  Total
                </span>

                <strong>
                  ₹
                  {total.toLocaleString(
                    "en-IN"
                  )}
                </strong>
              </div>

              <button
                type="button"
                className="proceed-checkout-button"
                onClick={
                  handleCheckout
                }
                disabled={
                  !cart.items.length
                }
              >
                Proceed to Buy
              </button>

              <button
                type="button"
                className="continue-shopping-summary-button"
                onClick={
                  handleContinueShopping
                }
              >
                Continue Shopping
              </button>

            </div>

          </aside>

        </div>

      </div>
    </section>
  );
}

export default Cart;