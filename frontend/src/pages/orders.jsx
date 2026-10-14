import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "../services/api";
import { generateInvoice, downloadInvoice } from "../services/taskService";
import TaskProgressModal from "../components/TaskProgressModal";
import "./Orders.css";
import { useWebSocket } from "../hooks/useWebSocket";

const STATUS_STEPS = [
  { id: "confirmed", label: "Confirmed", icon: "✓" },
  { id: "processing", label: "Processing", icon: "⚙" },
  { id: "shipped", label: "Shipped", icon: "↗" },
  { id: "out_for_delivery", label: "On the way", icon: "⌁" },
  { id: "delivered", label: "Delivered", icon: "✓" },
];

const STATUS_LABELS = {
  pending: "Order placed",
  confirmed: "Confirmed",
  processing: "Processing",
  shipped: "Shipped",
  out_for_delivery: "Out for delivery",
  delivered: "Delivered",
  cancelled: "Cancelled",
  refunded: "Refunded",
};

const TERMINAL_STATUSES = ["cancelled", "refunded"];

function normalizeStatus(status) {
  return String(status || "pending")
    .toLowerCase()
    .trim()
    .replaceAll(" ", "_");
}

function formatStatus(status) {
  const normalized = normalizeStatus(status);
  return STATUS_LABELS[normalized] || normalized.replaceAll("_", " ");
}

function formatDate(value) {
  if (!value) return "Date unavailable";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Date unavailable";

  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatCurrency(value) {
  const amount = Number(value);
  if (!Number.isFinite(amount)) return "Price unavailable";

  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(amount);
}

function getOrderId(order) {
  return order?.id ?? order?.order_id;
}

function getOrderItems(order) {
  const items = order?.items ?? order?.order_items ?? [];
  return Array.isArray(items) ? items : [];
}

function getProductName(item) {
  return (
    item?.product?.name ??
    item?.product_name ??
    item?.name ??
    "Product"
  );
}

function getProductQuantity(item) {
  return Number(item?.quantity ?? item?.qty ?? 1) || 1;
}

function getProductPrice(item) {
  return Number(
    item?.price ??
    item?.unit_price ??
    item?.product?.price
  );
}

function getProductImage(item) {
  return (
    item?.product?.image_url ??
    item?.product?.image ??
    item?.image_url ??
    item?.image ??
    ""
  );
}

function getOrderTotal(order) {
  return (
    order?.total_amount ??
    order?.total_price ??
    order?.total ??
    order?.amount
  );
}

function getOrderDate(order) {
  return (
    order?.created_at ??
    order?.order_date ??
    order?.createdAt
  );
}

function canCancelOrder(status) {
  return ["pending", "confirmed"].includes(normalizeStatus(status));
}

function getTimelineIndex(status) {
  const normalized = normalizeStatus(status);

  if (normalized === "pending") return -1;
  if (TERMINAL_STATUSES.includes(normalized)) return -2;

  return STATUS_STEPS.findIndex((step) => step.id === normalized);
}

async function fetchMyOrders() {
  const response = await api.get("/orders/my-orders");

  const data = response.data;
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.orders)) return data.orders;

  return [];
}

async function fetchOrderDetails(orderId) {
  const response = await api.get(`/orders/${orderId}`);
  return response.data?.order ?? response.data;
}

async function cancelOrderRequest(orderId) {
  const response = await api.post(`/orders/${orderId}/cancel`);
  return response.data;
}

function StatusBadge({ status }) {
  const normalized = normalizeStatus(status);

  return (
    <span className={`sf-status sf-status-${normalized}`}>
      <span className="sf-status-dot" />
      {formatStatus(normalized)}
    </span>
  );
}

function DeliveryTimeline({ status }) {
  const normalized = normalizeStatus(status);
  const currentIndex = getTimelineIndex(normalized);

  if (TERMINAL_STATUSES.includes(normalized)) {
    return (
      <div className={`sf-terminal-message sf-terminal-${normalized}`}>
        <span className="sf-terminal-icon">
          {normalized === "cancelled" ? "×" : "↶"}
        </span>
        <div>
          <strong>
            {normalized === "cancelled"
              ? "This order was cancelled"
              : "This order was refunded"}
          </strong>
          <p>
            {normalized === "cancelled"
              ? "This order is no longer progressing through delivery."
              : "Check your payment information for refund details."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="sf-timeline">
      {STATUS_STEPS.map((step, index) => {
        const completed = currentIndex >= index;
        const current = currentIndex === index;

        return (
          <div
            key={step.id}
            className={[
              "sf-timeline-step",
              completed ? "is-completed" : "",
              current ? "is-current" : "",
            ].filter(Boolean).join(" ")}
          >
            <div className="sf-timeline-marker">
              {completed ? step.icon : index + 1}
            </div>
            <span className="sf-timeline-label">{step.label}</span>
          </div>
        );
      })}
    </div>
  );
}

function ProductRow({ item }) {
  const image = getProductImage(item);
  const quantity = getProductQuantity(item);
  const unitPrice = getProductPrice(item);
  const hasPrice = Number.isFinite(unitPrice);
  const imageUrl =
    image && image.startsWith("/")
      ? `http://127.0.0.1:8000${image}`
      : image;

  return (
    <div className="sf-product-row">
      <div className="sf-product-image">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={getProductName(item)}
            loading="lazy"
            onError={(event) => {
              event.currentTarget.style.display = "none";
            }}
          />
        ) : (
          <span aria-hidden="true">▧</span>
        )}
      </div>

      <div className="sf-product-information">
        <h4>{getProductName(item)}</h4>
        <p>Quantity: {quantity}</p>
      </div>

      <div className="sf-product-price">
        {hasPrice
          ? formatCurrency(unitPrice * quantity)
          : "—"}
      </div>
    </div>
  );
}

function OrderCard({
  order,
  onViewDetails,
  onDownloadInvoice,
  onCancel,
  cancelling,
}) {
  const id = getOrderId(order);
  const status = normalizeStatus(order?.status);
  const items = getOrderItems(order);
  const total = getOrderTotal(order);

  return (
    <article className="sf-order-card">
      <div className="sf-order-top">
        <div className="sf-order-reference">
          <div className="sf-order-icon" aria-hidden="true">
            ↗
          </div>
          <div>
            <p className="sf-eyebrow">ORDER REFERENCE</p>
            <h3>#{id ?? "—"}</h3>
            <p className="sf-order-date">
              Placed on {formatDate(getOrderDate(order))}
            </p>
          </div>
        </div>

        <StatusBadge status={status} />
      </div>

      <div className="sf-order-divider" />

      <div className="sf-order-products">
        {items.length > 0 ? (
          items.slice(0, 2).map((item, index) => (
            <ProductRow
              key={item.id ?? item.product_id ?? index}
              item={item}
            />
          ))
        ) : (
          <div className="sf-products-unavailable">
            <span>▧</span>
            <p>Product details are not available in this order summary.</p>
          </div>
        )}

        {items.length > 2 && (
          <p className="sf-more-products">
            +{items.length - 2} more product(s)
          </p>
        )}
      </div>

      <DeliveryTimeline status={status} />

      <div className="sf-order-divider" />

      <div className="sf-order-bottom">
        <div className="sf-order-total">
          <span>Total amount</span>
          <strong>
            {total != null
              ? formatCurrency(total)
              : "Unavailable"}
          </strong>
        </div>

        <div className="sf-order-actions">
          <button
            type="button"
            className="sf-btn sf-btn-secondary"
            onClick={() => onDownloadInvoice(id)}
            disabled={id == null}
            title="Download PDF Invoice"
          >
            📄 Invoice (PDF)
          </button>

          <button
            type="button"
            className="sf-btn sf-btn-secondary"
            onClick={() => onViewDetails(id)}
            disabled={id == null}
          >
            View details <span aria-hidden="true">→</span>
          </button>

          {canCancelOrder(status) && (
            <button
              type="button"
              className="sf-btn sf-btn-danger"
              onClick={() => onCancel(id)}
              disabled={cancelling || id == null}
            >
              {cancelling ? "Cancelling…" : "Cancel order"}
            </button>
          )}
        </div>
      </div>
    </article>
  );
}

function OrderDetailsModal({ order, loading, onClose, onDownloadInvoice }) {
  useEffect(() => {
    function handleKeyDown(event) {
      if (event.key === "Escape") onClose();
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  const items = getOrderItems(order);
  const status = normalizeStatus(order?.status);
  const total = getOrderTotal(order);

  return (
    <div
      className="sf-modal-backdrop"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        className="sf-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="sf-modal-title"
      >
        <header className="sf-modal-header">
          <div>
            <p className="sf-eyebrow">SHOPFLOW ORDER</p>
            <h2 id="sf-modal-title">
              Order #{getOrderId(order) ?? "—"}
            </h2>
            <p>{formatDate(getOrderDate(order))}</p>
          </div>

          <button
            type="button"
            className="sf-modal-close"
            onClick={onClose}
            aria-label="Close order details"
          >
            ×
          </button>
        </header>

        <div className="sf-modal-content">
          {loading ? (
            <div className="sf-modal-loading">
              <span className="sf-spinner" />
              <p>Loading order details…</p>
            </div>
          ) : !order ? (
            <div className="sf-modal-error">
              Could not load order details. Please close and try again.
            </div>
          ) : (
            <>
              <div className="sf-modal-status">
                <div>
                  <span className="sf-eyebrow">CURRENT STATUS</span>
                  <p>{formatStatus(status)}</p>
                </div>
                <StatusBadge status={status} />
              </div>

              <section className="sf-modal-section">
                <h3>Delivery progress</h3>
                <DeliveryTimeline status={status} />
              </section>

              <section className="sf-modal-section">
                <h3>Items in your order</h3>

                {items.length ? (
                  items.map((item, index) => (
                    <ProductRow
                      key={item.id ?? item.product_id ?? index}
                      item={item}
                    />
                  ))
                ) : (
                  <p className="sf-muted">
                    No item details were returned by the server.
                  </p>
                )}
              </section>

              <section className="sf-modal-section sf-total-panel">
                <span>Order total</span>
                <strong>
                  {total != null
                    ? formatCurrency(total)
                    : "Unavailable"}
                </strong>
              </section>

              {(order.shipping_address ||
                order.delivery_address ||
                order.address) && (
                <section className="sf-modal-section">
                  <h3>Delivery address</h3>
                  <p className="sf-address">
                    {order.shipping_address ??
                      order.delivery_address ??
                      order.address}
                  </p>
                </section>
              )}
            </>
          )}
        </div>

        <footer className="sf-modal-footer">
          {order && (
            <button
              type="button"
              className="sf-btn sf-btn-secondary"
              onClick={() => onDownloadInvoice(getOrderId(order))}
            >
              📄 Download Invoice (PDF)
            </button>
          )}
          <button
            type="button"
            className="sf-btn sf-btn-primary"
            onClick={onClose}
          >
            Close details
          </button>
        </footer>
      </section>
    </div>
  );
}

export default function Orders() {
  const queryClient = useQueryClient();
  const [selectedOrderId, setSelectedOrderId] = useState(null);
  const [notification, setNotification] = useState(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [invoiceTask, setInvoiceTask] = useState(null);

  const handleDownloadInvoice = useCallback(async (orderId) => {
    try {
      const data = await generateInvoice(orderId);
      setInvoiceTask({
        taskId: data.task_id,
        orderId: orderId,
      });
    } catch (err) {
      console.error("Invoice generation error:", err);
      alert(err?.response?.data?.detail || "Could not generate invoice.");
    }
  }, []);

  const handleWebSocketMessage = useCallback((message) => {
    console.log("[Orders] Handler received:", message);
    if (!message || typeof message !== "object") return;

    const eventType = String(
      message.type ?? message.event ?? ""
    ).toLowerCase();

    if (
      !eventType.includes("order") &&
      !eventType.includes("status")
    ) {
      return;
    }

    queryClient.invalidateQueries({ queryKey: ["orders"] });

    const changedOrderId =
      message.order_id ?? message.order?.id ?? message.id;

    if (changedOrderId != null) {
      queryClient.invalidateQueries({
        queryKey: ["order", changedOrderId],
      });
    }

    const newStatus =
      message.status ??
      message.order?.status ??
      message.new_status;

    if (newStatus) {
  console.log("[Orders] Showing notification for status:", newStatus);

  setNotification({
        id: `${Date.now()}-${changedOrderId ?? ""}`,
        text: `Your order${changedOrderId != null ? ` #${changedOrderId}` : ""} status changed to ${formatStatus(newStatus)}.`,
      });
    }
  }, [queryClient]);

  // Keep the callback compatible with the project's WebSocket hook.
  // If your hook uses a different callback property, preserve that API.

const websocket = useWebSocket(handleWebSocketMessage);

  const ordersQuery = useQuery({
    queryKey: ["orders"],
    queryFn: fetchMyOrders,
    staleTime: 15_000,
    refetchOnWindowFocus: true,
  });

  const detailsQuery = useQuery({
    queryKey: ["order", selectedOrderId],
    queryFn: () => fetchOrderDetails(selectedOrderId),
    enabled: selectedOrderId != null,
    retry: 1,
  });

  const cancelMutation = useMutation({
    mutationFn: cancelOrderRequest,
    onSuccess: async (_data, orderId) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["orders"] }),
        queryClient.invalidateQueries({
          queryKey: ["order", orderId],
        }),
      ]);

      setNotification({
        id: `cancel-${Date.now()}`,
        text: `Order #${orderId} cancellation request completed.`,
      });
    },
  });

  useEffect(() => {
    if (!notification) return;

    const timeout = window.setTimeout(() => {
      setNotification(null);
    }, 6000);

    return () => window.clearTimeout(timeout);
  }, [notification]);

  const orders = useMemo(() => {
    const list = ordersQuery.data ?? [];

    return [...list].sort((a, b) => {
      const dateA = new Date(getOrderDate(a) ?? 0).getTime();
      const dateB = new Date(getOrderDate(b) ?? 0).getTime();
      return dateB - dateA;
    });
  }, [ordersQuery.data]);

  const filteredOrders = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return orders.filter((order) => {
      const id = String(getOrderId(order) ?? "").toLowerCase();
      const status = normalizeStatus(order.status);

      const matchesSearch =
        !normalizedSearch ||
        id.includes(normalizedSearch) ||
        getOrderItems(order).some((item) =>
          getProductName(item).toLowerCase().includes(normalizedSearch)
        );

      const matchesStatus =
        statusFilter === "all" || status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [orders, search, statusFilter]);

  const summary = useMemo(() => ({
    total: orders.length,
    active: orders.filter((order) =>
      ["pending", "confirmed", "processing", "shipped", "out_for_delivery"]
        .includes(normalizeStatus(order.status))
    ).length,
    delivered: orders.filter(
      (order) => normalizeStatus(order.status) === "delivered"
    ).length,
  }), [orders]);

  const handleViewDetails = useCallback((orderId) => {
    setSelectedOrderId(orderId);
  }, []);

  const closeDetails = useCallback(() => {
    setSelectedOrderId(null);
  }, []);

  function handleCancel(orderId) {
    const confirmed = window.confirm(
      `Are you sure you want to cancel order #${orderId}?`
    );

    if (confirmed) {
      cancelMutation.mutate(orderId);
    }
  }

  return (
    <main className="sf-orders-page">
      <div className="sf-orders-container">
        <header className="sf-page-header">
          <div className="sf-page-heading">
            <div className="sf-heading-icon" aria-hidden="true">
              ▤
            </div>
            <div>
              <p className="sf-eyebrow">YOUR SHOPPING ACTIVITY</p>
              <h1>Your orders<span>.</span></h1>
              <p className="sf-page-description">
                Everything you've ordered, all in one place.
              </p>
            </div>
          </div>

          <Link to="/products" className="sf-btn sf-btn-primary">
            <span aria-hidden="true">＋</span> Continue shopping
          </Link>
        </header>

        {notification && (
          <div className="sf-notification" role="status">
            <span className="sf-notification-icon">✓</span>
            <p>{notification.text}</p>
            <button
              type="button"
              onClick={() => setNotification(null)}
              aria-label="Dismiss notification"
            >
              ×
            </button>
          </div>
        )}

        {cancelMutation.isError && (
          <div className="sf-alert sf-alert-error" role="alert">
            Could not cancel this order.{" "}
            {cancelMutation.error?.response?.data?.detail ??
              "Please try again."}
          </div>
        )}

        <section className="sf-summary-grid" aria-label="Order summary">
          <div className="sf-summary-card sf-summary-total">
            <div className="sf-summary-card-top">
              <span className="sf-summary-icon">▤</span>
              <span className="sf-summary-caption">ALL TIME</span>
            </div>
            <p>Total orders</p>
            <strong>{summary.total}</strong>
          </div>

          <div className="sf-summary-card sf-summary-active">
            <div className="sf-summary-card-top">
              <span className="sf-summary-icon">↗</span>
              <span className="sf-summary-caption">IN PROGRESS</span>
            </div>
            <p>Active orders</p>
            <strong>{summary.active}</strong>
          </div>

          <div className="sf-summary-card sf-summary-delivered">
            <div className="sf-summary-card-top">
              <span className="sf-summary-icon">✓</span>
              <span className="sf-summary-caption">COMPLETED</span>
            </div>
            <p>Delivered orders</p>
            <strong>{summary.delivered}</strong>
          </div>
        </section>

        <section className="sf-orders-content">
          <div className="sf-orders-toolbar">
            <div>
              <h2>Order history</h2>
              <p>Track your purchases and manage your orders.</p>
            </div>

            <button
              type="button"
              className="sf-btn sf-btn-secondary"
              onClick={() =>
                queryClient.invalidateQueries({ queryKey: ["orders"] })
              }
              disabled={ordersQuery.isFetching}
            >
              <span className={ordersQuery.isFetching ? "sf-spin" : ""}>
                ↻
              </span>
              {ordersQuery.isFetching ? "Refreshing…" : "Refresh"}
            </button>
          </div>

          {!ordersQuery.isLoading && !ordersQuery.isError && orders.length > 0 && (
            <div className="sf-order-filters">
              <label className="sf-search-box">
                <span aria-hidden="true">⌕</span>
                <input
                  type="search"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search orders or products..."
                  aria-label="Search orders or products"
                />
              </label>

              <label className="sf-filter-box">
                <span>Status</span>
                <select
                  value={statusFilter}
                  onChange={(event) => setStatusFilter(event.target.value)}
                  aria-label="Filter orders by status"
                >
                  <option value="all">All orders</option>
                  <option value="pending">Pending</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="processing">Processing</option>
                  <option value="shipped">Shipped</option>
                  <option value="out_for_delivery">Out for delivery</option>
                  <option value="delivered">Delivered</option>
                  <option value="cancelled">Cancelled</option>
                  <option value="refunded">Refunded</option>
                </select>
              </label>
            </div>
          )}

          {ordersQuery.isLoading ? (
            <div className="sf-state-card">
              <span className="sf-spinner" />
              <h3>Loading your orders</h3>
              <p>Fetching your latest shopping activity…</p>
            </div>
          ) : ordersQuery.isError ? (
            <div className="sf-state-card sf-state-error">
              <span className="sf-state-icon">!</span>
              <h3>We couldn't load your orders</h3>
              <p>
                Check your connection and make sure you're signed in.
              </p>
              <button
                type="button"
                className="sf-btn sf-btn-primary"
                onClick={() => ordersQuery.refetch()}
              >
                Try again
              </button>
            </div>
          ) : orders.length === 0 ? (
            <div className="sf-state-card sf-empty-state">
              <div className="sf-empty-illustration">
                <span>▤</span>
                <i />
                <b />
              </div>
              <p className="sf-eyebrow">A LITTLE TOO QUIET HERE</p>
              <h3>Your next favorite is waiting.</h3>
              <p>
                You haven't placed any orders yet. Explore the store and
                find something you love.
              </p>
              <Link to="/products" className="sf-btn sf-btn-primary">
                Explore products <span aria-hidden="true">→</span>
              </Link>
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="sf-state-card">
              <span className="sf-state-icon">⌕</span>
              <h3>No matching orders</h3>
              <p>Try another search term or choose a different status.</p>
              <button
                type="button"
                className="sf-btn sf-btn-secondary"
                onClick={() => {
                  setSearch("");
                  setStatusFilter("all");
                }}
              >
                Clear filters
              </button>
            </div>
          ) : (
            <>
              <p className="sf-results-count">
                Showing <strong>{filteredOrders.length}</strong>{" "}
                {filteredOrders.length === 1 ? "order" : "orders"}
              </p>

              <div className="sf-orders-list">
                {filteredOrders.map((order) => (
                  <OrderCard
                    key={getOrderId(order)}
                    order={order}
                    onViewDetails={handleViewDetails}
                    onDownloadInvoice={handleDownloadInvoice}
                    onCancel={handleCancel}
                    cancelling={
                      cancelMutation.isPending &&
                      cancelMutation.variables === getOrderId(order)
                    }
                  />
                ))}
              </div>
            </>
          )}
        </section>

        <footer className="sf-orders-footer">
          <span>ShopFlow</span>
          <p>Your shopping, made simple.</p>
        </footer>
      </div>

      {selectedOrderId != null && (
        <OrderDetailsModal
          order={detailsQuery.data}
          loading={detailsQuery.isLoading}
          onClose={closeDetails}
          onDownloadInvoice={handleDownloadInvoice}
        />
      )}

      
      {invoiceTask && (
        <TaskProgressModal
          taskId={invoiceTask.taskId}
          title={`Order #${invoiceTask.orderId} Invoice`}
          description="Generating official PDF invoice in background using Celery task..."
          actionLabel="Download PDF Invoice"
          onAction={async () => {
            try {
              const blob = await downloadInvoice(invoiceTask.orderId);
              const url = URL.createObjectURL(blob);
              const link = document.createElement("a");

              link.href = url;
              link.download = `ShopFlow_Invoice_Order_${invoiceTask.orderId}.pdf`;
              document.body.appendChild(link);
              link.click();
              link.remove();

              setTimeout(() => URL.revokeObjectURL(url), 1000);
            } catch (err) {
              console.error("Invoice download error:", err);
              alert(
                err?.response?.data?.detail ||
                  "Could not download the invoice. Please try again."
              );
            }
          }}
          onClose={() => setInvoiceTask(null)}
        />
      )}
    </main>
  );
}
