import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import { getCart } from "../services/cartService";
import { createOrder } from "../services/orderservice";

import "./checkout.css";

function Checkout() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [error, setError] = useState("");
  const [orderSuccess, setOrderSuccess] = useState(null);

  // =========================================================
  // DELIVERY ADDRESS
  // =========================================================

  const [address, setAddress] = useState({
    fullName: "",
    phone: "",
    addressLine: "",
    city: "",
    state: "",
    pincode: "",
  });

  // =========================================================
  // PAYMENT
  // =========================================================

  const [paymentMethod, setPaymentMethod] = useState("cod");

  // =========================================================
  // LOAD CART - TANSTACK QUERY
  // =========================================================

  const {
  data: cart,
  isLoading: loading,
  isError: isCartError,
  error: cartError,
} = useQuery({
  queryKey: ["cart"],
  queryFn: getCart,
});

  // =========================================================
  // CART ERROR
  // =========================================================

  if (isCartError) {
    console.error("CHECKOUT CART ERROR:", cartError);

    const cartErrorMessage =
      cartError.response?.data?.detail ||
      "Unable to load your cart.";

    if (!error) {
      // Keep the existing error behavior for the UI.
      // The actual rendered error below uses cartErrorMessage.
    }
  }

  // =========================================================
  // REDIRECT IF CART IS EMPTY
  // =========================================================

  if (
    !loading &&
    !isCartError &&
    (!cart?.items || cart.items.length === 0) &&
    !orderSuccess
  ) {
    navigate("/cart");
    return null;
  }

  // =========================================================
  // PLACE ORDER - TANSTACK MUTATION
  // =========================================================

  const createOrderMutation = useMutation({
  mutationFn: createOrder,

  onSuccess: (order) => {
    setOrderSuccess({
      order,
      paymentMethod,
      address,
    });

    queryClient.invalidateQueries({
      queryKey: ["cart"],
    });

    queryClient.invalidateQueries({
      queryKey: ["orders"],
    });

    queryClient.invalidateQueries({
      queryKey: ["my-orders"],
    });
  },

  onError: (error) => {
    console.error("PLACE ORDER ERROR:", error);

    setError(
      error.response?.data?.detail ||
        "Unable to place your order. Please try again."
    );

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  },
});

  // =========================================================
  // ADDRESS CHANGE
  // =========================================================

  const handleAddressChange = (event) => {
    const { name, value } = event.target;

    setAddress((current) => ({
      ...current,
      [name]: value,
    }));
  };

  // =========================================================
  // VALIDATE ADDRESS
  // =========================================================

  const validateAddress = () => {
    if (!address.fullName.trim()) {
      return "Please enter your full name.";
    }

    if (!address.phone.trim()) {
      return "Please enter your phone number.";
    }

    if (!/^[0-9]{10}$/.test(address.phone.trim())) {
      return "Please enter a valid 10-digit phone number.";
    }

    if (!address.addressLine.trim()) {
      return "Please enter your delivery address.";
    }

    if (!address.city.trim()) {
      return "Please enter your city.";
    }

    if (!address.state.trim()) {
      return "Please enter your state.";
    }

    if (!/^[0-9]{6}$/.test(address.pincode.trim())) {
      return "Please enter a valid 6-digit PIN code.";
    }

    return "";
  };

  // =========================================================
  // CALCULATIONS
  // =========================================================

  const getItemCount = () => {
    if (!cart?.items) {
      return 0;
    }

    return cart.items.reduce(
      (total, item) =>
        total + Number(item.quantity || 0),
      0
    );
  };

  const getSubtotal = () => {
    if (!cart?.items) {
      return 0;
    }

    return cart.items.reduce(
      (total, item) => {
        const price = Number(item.price || 0);
        const quantity = Number(item.quantity || 0);

        return total + price * quantity;
      },
      0
    );
  };

  const subtotal = getSubtotal();

  const deliveryCharge = 0;

  const total = subtotal + deliveryCharge;

  // =========================================================
  // PLACE ORDER
  // =========================================================

  const handlePlaceOrder = async (event) => {
    event.preventDefault();

    setError("");

    const validationError = validateAddress();

    if (validationError) {
      setError(validationError);

      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });

      return;
    }

    await createOrderMutation.mutateAsync();
  };

  // =========================================================
  // LOADING
  // =========================================================

  if (loading) {
    return (
      <section className="checkout-page">
        <div className="checkout-loading">
          <div className="checkout-loading-icon">
            🛒
          </div>

          <h1>Loading checkout...</h1>

          <p>
            Preparing your ShopFlow order.
          </p>
        </div>
      </section>
    );
  }

  // =========================================================
  // ERROR WITHOUT CART
  // =========================================================

  if (isCartError && !cart && !orderSuccess) {
    const cartErrorMessage =
      cartError.response?.data?.detail ||
      "Unable to load your cart.";

    return (
      <section className="checkout-page">
        <div className="checkout-error-page">
          <div className="checkout-error-icon">
            !
          </div>

          <h1>Checkout unavailable</h1>

          <p>{cartErrorMessage}</p>

          <button
            type="button"
            className="checkout-primary-button"
            onClick={() => navigate("/cart")}
          >
            Return to Cart
          </button>
        </div>
      </section>
    );
  }

  // =========================================================
  // ORDER SUCCESS
  // =========================================================

  if (orderSuccess) {
    const orderId =
      orderSuccess.order?.id ||
      orderSuccess.order?.order_id ||
      "Your Order";

    return (
      <section className="checkout-page">
        <div className="order-success-page">

          <div className="success-check">
            ✓
          </div>

          <h1>
            Order placed successfully!
          </h1>

          <p className="success-main-text">
            Thank you for shopping with ShopFlow.
          </p>

          <div className="success-order-number">
            <span>Order ID</span>

            <strong>
              #{orderId}
            </strong>
          </div>

          <div className="success-delivery-card">

            <div className="success-card-icon">
              🚚
            </div>

            <div>
              <strong>
                Delivery to
              </strong>

              <p>
                {orderSuccess.address.fullName}
              </p>

              <p>
                {orderSuccess.address.addressLine}
              </p>

              <p>
                {orderSuccess.address.city},{" "}
                {orderSuccess.address.state}{" "}
                -{" "}
                {orderSuccess.address.pincode}
              </p>

              <p>
                Phone:{" "}
                {orderSuccess.address.phone}
              </p>
            </div>

          </div>

          <div className="success-payment-card">

            <span>
              Payment method
            </span>

            <strong>
              {orderSuccess.paymentMethod ===
                "cod" &&
                "Cash on Delivery"}

              {orderSuccess.paymentMethod ===
                "upi" &&
                "UPI"}

              {orderSuccess.paymentMethod ===
                "card" &&
                "Credit / Debit Card"}

              {orderSuccess.paymentMethod ===
                "netbanking" &&
                "Net Banking"}

              {orderSuccess.paymentMethod ===
                "wallet" &&
                "Wallet"}
            </strong>

          </div>

          <div className="success-actions">

            <button
              type="button"
              className="checkout-primary-button"
              onClick={() => navigate("/orders")}
            >
              View My Orders
            </button>

            <button
              type="button"
              className="checkout-secondary-button"
              onClick={() => navigate("/products")}
            >
              Continue Shopping
            </button>

          </div>

        </div>
      </section>
    );
  }

  // =========================================================
  // MAIN CHECKOUT
  // =========================================================

  return (
    <section className="checkout-page">

      {/* CHECKOUT HEADER */}

      <div className="checkout-top">

        <div>
          <h1>Checkout</h1>

          <p>
            Complete your order securely
          </p>
        </div>

        <div className="checkout-security">
          🔒 Secure Checkout
        </div>

      </div>

      {/* ERROR */}

      {error && (
        <div className="checkout-error-message">

          <span className="checkout-error-symbol">
            !
          </span>

          <p>{error}</p>

          <button
            type="button"
            onClick={() => setError("")}
          >
            ×
          </button>

        </div>
      )}

      <form
        className="checkout-layout"
        onSubmit={handlePlaceOrder}
      >

        {/* LEFT SIDE */}

        <div className="checkout-main">

          {/* STEP 1 - ADDRESS */}

          <section className="checkout-card">

            <div className="checkout-card-header">

              <div className="checkout-step">
                1
              </div>

              <div>
                <h2>
                  Delivery Address
                </h2>

                <p>
                  Where should we deliver your order?
                </p>
              </div>

            </div>

            <div className="checkout-form">

              <div className="checkout-form-row">

                <div className="checkout-field">

                  <label>
                    Full Name
                    <span>*</span>
                  </label>

                  <input
                    type="text"
                    name="fullName"
                    value={address.fullName}
                    onChange={handleAddressChange}
                    placeholder="Enter your full name"
                    autoComplete="name"
                  />

                </div>

                <div className="checkout-field">

                  <label>
                    Mobile Number
                    <span>*</span>
                  </label>

                  <input
                    type="tel"
                    name="phone"
                    value={address.phone}
                    onChange={handleAddressChange}
                    placeholder="10-digit mobile number"
                    maxLength="10"
                    autoComplete="tel"
                  />

                </div>

              </div>

              <div className="checkout-field">

                <label>
                  Address
                  <span>*</span>
                </label>

                <textarea
                  name="addressLine"
                  value={address.addressLine}
                  onChange={handleAddressChange}
                  placeholder="House / Flat / Building, Street, Area"
                  rows="3"
                  autoComplete="street-address"
                />

              </div>

              <div className="checkout-form-row three-columns">

                <div className="checkout-field">

                  <label>
                    City
                    <span>*</span>
                  </label>

                  <input
                    type="text"
                    name="city"
                    value={address.city}
                    onChange={handleAddressChange}
                    placeholder="City"
                    autoComplete="address-level2"
                  />

                </div>

                <div className="checkout-field">

                  <label>
                    State
                    <span>*</span>
                  </label>

                  <input
                    type="text"
                    name="state"
                    value={address.state}
                    onChange={handleAddressChange}
                    placeholder="State"
                    autoComplete="address-level1"
                  />

                </div>

                <div className="checkout-field">

                  <label>
                    PIN Code
                    <span>*</span>
                  </label>

                  <input
                    type="text"
                    name="pincode"
                    value={address.pincode}
                    onChange={handleAddressChange}
                    placeholder="6-digit PIN"
                    maxLength="6"
                    autoComplete="postal-code"
                  />

                </div>

              </div>

            </div>

          </section>

          {/* STEP 2 - PAYMENT */}

          <section className="checkout-card">

            <div className="checkout-card-header">

              <div className="checkout-step">
                2
              </div>

              <div>
                <h2>
                  Payment Method
                </h2>

                <p>
                  Choose how you want to pay
                </p>
              </div>

            </div>

            <div className="payment-methods">

              {/* COD */}

              <label
                className={`payment-method ${
                  paymentMethod === "cod"
                    ? "selected"
                    : ""
                }`}
              >

                <input
                  type="radio"
                  name="payment"
                  value="cod"
                  checked={
                    paymentMethod === "cod"
                  }
                  onChange={(event) =>
                    setPaymentMethod(
                      event.target.value
                    )
                  }
                />

                <div className="payment-method-icon">
                  💵
                </div>

                <div className="payment-method-content">

                  <strong>
                    Cash on Delivery
                  </strong>

                  <p>
                    Pay when your order arrives
                  </p>

                </div>

                <span className="payment-check">
                  ✓
                </span>

              </label>

              {/* UPI */}

              <label
                className={`payment-method ${
                  paymentMethod === "upi"
                    ? "selected"
                    : ""
                }`}
              >

                <input
                  type="radio"
                  name="payment"
                  value="upi"
                  checked={
                    paymentMethod === "upi"
                  }
                  onChange={(event) =>
                    setPaymentMethod(
                      event.target.value
                    )
                  }
                />

                <div className="payment-method-icon">
                  📱
                </div>

                <div className="payment-method-content">

                  <strong>
                    UPI
                  </strong>

                  <p>
                    Google Pay, PhonePe, Paytm and more
                  </p>

                </div>

                <span className="payment-check">
                  ✓
                </span>

              </label>

              {/* CARD */}

              <label
                className={`payment-method ${
                  paymentMethod === "card"
                    ? "selected"
                    : ""
                }`}
              >

                <input
                  type="radio"
                  name="payment"
                  value="card"
                  checked={
                    paymentMethod === "card"
                  }
                  onChange={(event) =>
                    setPaymentMethod(
                      event.target.value
                    )
                  }
                />

                <div className="payment-method-icon">
                  💳
                </div>

                <div className="payment-method-content">

                  <strong>
                    Credit / Debit Card
                  </strong>

                  <p>
                    Visa, Mastercard, RuPay and more
                  </p>

                </div>

                <span className="payment-check">
                  ✓
                </span>

              </label>

              {/* NET BANKING */}

              <label
                className={`payment-method ${
                  paymentMethod ===
                  "netbanking"
                    ? "selected"
                    : ""
                }`}
              >

                <input
                  type="radio"
                  name="payment"
                  value="netbanking"
                  checked={
                    paymentMethod ===
                    "netbanking"
                  }
                  onChange={(event) =>
                    setPaymentMethod(
                      event.target.value
                    )
                  }
                />

                <div className="payment-method-icon">
                  🏦
                </div>

                <div className="payment-method-content">

                  <strong>
                    Net Banking
                  </strong>

                  <p>
                    Pay directly through your bank
                  </p>

                </div>

                <span className="payment-check">
                  ✓
                </span>

              </label>

              {/* WALLET */}

              <label
                className={`payment-method ${
                  paymentMethod === "wallet"
                    ? "selected"
                    : ""
                }`}
              >

                <input
                  type="radio"
                  name="payment"
                  value="wallet"
                  checked={
                    paymentMethod === "wallet"
                  }
                  onChange={(event) =>
                    setPaymentMethod(
                      event.target.value
                    )
                  }
                />

                <div className="payment-method-icon">
                  👛
                </div>

                <div className="payment-method-content">

                  <strong>
                    Wallets
                  </strong>

                  <p>
                    Pay using supported digital wallets
                  </p>

                </div>

                <span className="payment-check">
                  ✓
                </span>

              </label>

            </div>

            <div className="payment-demo-notice">

              <span>
                🔐
              </span>

              <p>
                <strong>
                  Secure payment
                </strong>
                <br />
                Payment processing will be connected
                to a secure payment gateway such as
                Razorpay in the next step.
              </p>

            </div>

          </section>

          {/* STEP 3 - REVIEW */}

          <section className="checkout-card">

            <div className="checkout-card-header">

              <div className="checkout-step">
                3
              </div>

              <div>
                <h2>
                  Review Your Order
                </h2>

                <p>
                  Check your products before placing
                  the order
                </p>
              </div>

            </div>

            <div className="checkout-review-list">

              {cart?.items?.map((item) => {

                const price =
                  Number(item.price || 0);

                const quantity =
                  Number(item.quantity || 0);

                const image =
                  item.image_url;

                return (
                  <div
                    className="checkout-review-item"
                    key={item.id}
                  >

                    <div className="review-image">

                      {image ? (
                        <img
                          src={
                          image.startsWith("http")
                          ? image
                          : `http://127.0.0.1:8000${image}`
                      }
                      alt={item.name}
                      loading="lazy"
                    />
                      ) : (
                        <span>
                          📦
                        </span>
                      )}

                    </div>

                    <div className="review-product">

                      <strong>
                        {item.name}
                      </strong>

                      <span>
                        Qty: {quantity}
                      </span>

                    </div>

                    <strong className="review-price">

                      ₹
                      {(
                        price * quantity
                      ).toLocaleString(
                        "en-IN"
                      )}

                    </strong>

                  </div>
                );
              })}

            </div>

          </section>

        </div>

        {/* RIGHT SIDE - SUMMARY */}

        <aside className="checkout-summary">

          <div className="checkout-summary-card">

            <h2>
              Order Summary
            </h2>

            <div className="checkout-summary-line">

              <span>
                Items ({getItemCount()})
              </span>

              <span>
                ₹
                {subtotal.toLocaleString(
                  "en-IN"
                )}
              </span>

            </div>

            <div className="checkout-summary-line">

              <span>
                Delivery
              </span>

              <span className="free">
                FREE
              </span>

            </div>

            <div className="checkout-savings">
              ✓ You saved on delivery charges
            </div>

            <hr />

            <div className="checkout-total">

              <span>
                Order Total
              </span>

              <strong>
                ₹
                {total.toLocaleString(
                  "en-IN"
                )}
              </strong>

            </div>

            <button
              type="submit"
              className="place-order-button"
              disabled={createOrderMutation.isPending}
            >
              {createOrderMutation.isPending
                ? "Placing Order..."
                : `Place Order • ₹${total.toLocaleString(
                    "en-IN"
                  )}`}
            </button>

            <div className="checkout-protection">

              <div>
                🔒
                <strong>
                  Secure Checkout
                </strong>
              </div>

              <p>
                Your information is protected
                during checkout.
              </p>

            </div>

          </div>

          {/* DELIVERY SUMMARY */}

          <div className="checkout-side-card">

            <h3>
              Delivery Information
            </h3>

            <div className="side-info-row">

              <span>
                🚚
              </span>

              <div>
                <strong>
                  FREE Standard Delivery
                </strong>

                <p>
                  Available on this order
                </p>
              </div>

            </div>

          </div>

          {/* PAYMENT SUMMARY */}

          <div className="checkout-side-card">

            <h3>
              Payment
            </h3>

            <div className="side-info-row">

              <span>
                🔐
              </span>

              <div>
                <strong>
                  Secure Payment
                </strong>

                <p>
                  {paymentMethod === "cod"
                    ? "Cash on Delivery"
                    : paymentMethod === "upi"
                    ? "UPI"
                    : paymentMethod === "card"
                    ? "Credit / Debit Card"
                    : paymentMethod ===
                      "netbanking"
                    ? "Net Banking"
                    : "Wallet"}
                </p>
              </div>

            </div>

          </div>

        </aside>

      </form>

    </section>
  );
}

export default Checkout;