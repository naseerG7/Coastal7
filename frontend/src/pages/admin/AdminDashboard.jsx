import { useMemo } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import api from "../../services/api";

const formatNumber = (value) =>
  Number(value ?? 0).toLocaleString("en-IN");

const formatCurrency = (value) =>
  `₹${Number(value ?? 0).toLocaleString("en-IN", {
    maximumFractionDigits: 2,
  })}`;

const formatDate = (value) => {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "—";

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const statusLabel = (status) =>
  String(status ?? "pending")
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());

function AdminDashboard() {
  const {
    data: dashboard,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ["admin", "dashboard"],
    queryFn: async () => {
      const response = await api.get("/admin/dashboard");
      return response.data;
    },
  });

  const {
    data: orders = [],
    isLoading: ordersLoading,
    isError: ordersError,
    refetch: refetchOrders,
  } = useQuery({
    queryKey: ["admin", "orders"],
    queryFn: async () => {
      const response = await api.get("/admin/orders");
      return Array.isArray(response.data) ? response.data : [];
    },
  });

  const recentOrders = useMemo(
    () =>
      [...orders]
        .sort(
          (a, b) =>
            new Date(b.created_at ?? 0).getTime() -
            new Date(a.created_at ?? 0).getTime()
        )
        .slice(0, 6),
    [orders]
  );

  const statusSummary = useMemo(() => {
    const counts = {};

    orders.forEach((order) => {
      const status = String(order.status ?? "pending")
        .toLowerCase()
        .replaceAll(" ", "_");

      counts[status] = (counts[status] ?? 0) + 1;
    });

    return [
      { key: "delivered", label: "Delivered", color: "#10b981" },
      { key: "processing", label: "Processing", color: "#6366f1" },
      { key: "shipped", label: "Shipped", color: "#f59e0b" },
      {
        key: "out_for_delivery",
        label: "Out for delivery",
        color: "#0ea5e9",
      },
      { key: "pending", label: "Pending", color: "#8b5cf6" },
      { key: "cancelled", label: "Cancelled", color: "#f87171" },
      { key: "confirmed", label: "Confirmed", color: "#14b8a6" },
    ].map((item) => ({
      ...item,
      count: counts[item.key] ?? 0,
    }));
  }, [orders]);

  const revenueHistory = useMemo(() => {
    const totals = {};

    orders.forEach((order) => {
      if (!order.created_at) return;

      const date = new Date(order.created_at);

      if (Number.isNaN(date.getTime())) return;

      const key = [
        date.getFullYear(),
        String(date.getMonth() + 1).padStart(2, "0"),
        String(date.getDate()).padStart(2, "0"),
      ].join("-");

      totals[key] =
        (totals[key] ?? 0) + Number(order.total_amount ?? 0);
    });

    return Object.entries(totals)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-10)
      .map(([date, amount]) => ({ date, amount }));
  }, [orders]);

  const chartPoints = useMemo(() => {
    if (revenueHistory.length < 2) return "";

    const values = revenueHistory.map((item) => item.amount);
    const max = Math.max(...values, 1);
    const min = Math.min(...values, 0);
    const range = max - min || 1;

    return values
      .map((value, index) => {
        const x =
          12 + (index / (values.length - 1)) * 576;
        const y =
          160 - ((value - min) / range) * 130;

        return `${x},${y}`;
      })
      .join(" ");
  }, [revenueHistory]);

  const cards = [
    {
      label: "Total Customers",
      value: formatNumber(dashboard?.total_customers),
      icon: "♙",
      tone: "violet",
      detail: "Registered customers",
    },
    {
      label: "Total Products",
      value: formatNumber(dashboard?.total_products),
      icon: "◇",
      tone: "teal",
      detail: "Products in your catalog",
    },
    {
      label: "Total Orders",
      value: formatNumber(dashboard?.total_orders),
      icon: "▤",
      tone: "orange",
      detail: "Orders placed in your store",
    },
    {
      label: "Total Revenue",
      value: formatCurrency(dashboard?.total_revenue),
      icon: "₹",
      tone: "purple",
      detail: "All-time order revenue",
    },
  ];

  if (isLoading) {
    return (
      <section className="sf-executive">
        <div className="sf-loading-card">
          <span className="sf-loading-spinner" />
          Loading your ShopFlow analytics...
        </div>
      </section>
    );
  }

  if (isError) {
    return (
      <section className="sf-executive">
        <div className="sf-dashboard-error" role="alert">
          <h2>Unable to load your dashboard</h2>
          <p>
            {error?.response?.data?.detail ??
              "Please check your backend connection and admin login."}
          </p>
          <button onClick={() => refetch()}>
            Try again
          </button>
        </div>
      </section>
    );
  }

  const totalStatusOrders = statusSummary.reduce(
    (sum, item) => sum + item.count,
    0
  );

  return (
    <section className="sf-executive">
      <header className="sf-executive-header">
        <div>
          <p className="sf-eyebrow">SHOPFLOW / ANALYTICS</p>
          <h1>Executive Dashboard</h1>
          <p className="sf-muted">
            Here's what's happening with your store.
          </p>
        </div>

        <div className="sf-header-actions">
          <span className="sf-live-indicator">
            <span />
            Live store data
          </span>

          <button
            className="sf-refresh-button"
            onClick={() => {
              refetch();
              refetchOrders();
            }}
          >
            ↻ Refresh
          </button>
        </div>
      </header>

      <div className="sf-executive-section-title">
        <div>
          <h2>Store performance</h2>
          <p>Key metrics from your ShopFlow database</p>
        </div>
        <span className="sf-period-chip">All time</span>
      </div>

      <div className="sf-executive-kpis">
        {cards.map((card) => (
          <article className="sf-kpi-card" key={card.label}>
            <div className="sf-kpi-top">
              <span>{card.label}</span>
              <span className={`sf-kpi-icon ${card.tone}`}>
                {card.icon}
              </span>
            </div>
            <strong>{card.value}</strong>
            <p>{card.detail}</p>
          </article>
        ))}
      </div>

      <div className="sf-executive-middle">
        <section className="sf-panel sf-revenue-panel">
          <div className="sf-panel-heading">
            <div>
              <h2>Revenue overview</h2>
              <p>Order totals grouped by order date</p>
            </div>
            <span className="sf-chart-legend">
              <span />
              Revenue
            </span>
          </div>

          {ordersLoading ? (
            <div className="sf-chart-empty">
              Loading order analytics...
            </div>
          ) : ordersError ? (
            <div className="sf-chart-empty">
              Unable to load revenue history.
            </div>
          ) : revenueHistory.length < 2 ? (
            <div className="sf-chart-empty">
              <span>⌁</span>
              <strong>Not enough order history yet</strong>
              <p>
                At least two different order dates are needed
                to draw a revenue trend.
              </p>
            </div>
          ) : (
            <>
              <div className="sf-chart-summary">
                <strong>
                  {formatCurrency(
                    revenueHistory.reduce(
                      (sum, item) => sum + item.amount,
                      0
                    )
                  )}
                </strong>
                <span>Revenue across displayed order dates</span>
              </div>

              <div className="sf-chart-wrap">
                <svg
                  viewBox="0 0 600 190"
                  role="img"
                  aria-label="Revenue by order date"
                  preserveAspectRatio="none"
                >
                  <defs>
                    <linearGradient
                      id="sfRevenueFill"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop
                        offset="0%"
                        stopColor="#6558f5"
                        stopOpacity="0.24"
                      />
                      <stop
                        offset="100%"
                        stopColor="#6558f5"
                        stopOpacity="0.01"
                      />
                    </linearGradient>
                  </defs>

                  {[30, 73, 116, 160].map((y) => (
                    <line
                      key={y}
                      x1="12"
                      y1={y}
                      x2="588"
                      y2={y}
                      stroke="#edf0f7"
                      strokeDasharray="4 5"
                    />
                  ))}

                  <polygon
                    points={`12,180 ${chartPoints} 588,180`}
                    fill="url(#sfRevenueFill)"
                  />

                  <polyline
                    points={chartPoints}
                    fill="none"
                    stroke="#6558f5"
                    strokeWidth="3.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />

                  {revenueHistory.map((item, index) => {
                    const values = revenueHistory.map(
                      (entry) => entry.amount
                    );
                    const max = Math.max(...values, 1);
                    const min = Math.min(...values, 0);
                    const range = max - min || 1;
                    const x =
                      12 +
                      (index / (values.length - 1)) * 576;
                    const y =
                      160 -
                      ((item.amount - min) / range) * 130;

                    return (
                      <circle
                        key={item.date}
                        cx={x}
                        cy={y}
                        r="4"
                        fill="#ffffff"
                        stroke="#6558f5"
                        strokeWidth="2.5"
                      >
                        <title>
                          {formatDate(item.date)}:{" "}
                          {formatCurrency(item.amount)}
                        </title>
                      </circle>
                    );
                  })}
                </svg>
              </div>

              <div className="sf-chart-dates">
                <span>{formatDate(revenueHistory[0].date)}</span>
                <span>
                  {formatDate(
                    revenueHistory[revenueHistory.length - 1].date
                  )}
                </span>
              </div>
            </>
          )}
        </section>

        <section className="sf-panel sf-status-panel">
          <div className="sf-panel-heading">
            <div>
              <h2>Order analytics</h2>
              <p>Orders by current status</p>
            </div>
          </div>

          <div className="sf-status-total">
            <strong>{formatNumber(totalStatusOrders)}</strong>
            <span>Orders found</span>
          </div>

          <div className="sf-status-list">
            {statusSummary
              .filter((item) => item.count > 0)
              .map((item) => (
                <div className="sf-status-row" key={item.key}>
                  <span
                    className="sf-status-dot"
                    style={{ background: item.color }}
                  />
                  <span className="sf-status-name">
                    {item.label}
                  </span>
                  <strong>{formatNumber(item.count)}</strong>
                  <span className="sf-status-percent">
                    {totalStatusOrders
                      ? Math.round(
                          (item.count / totalStatusOrders) * 100
                        )
                      : 0}
                    %
                  </span>
                </div>
              ))}

            {!ordersLoading &&
              !ordersError &&
              totalStatusOrders === 0 && (
                <p className="sf-muted">
                  No orders are available yet.
                </p>
              )}
          </div>
        </section>
      </div>

      <section className="sf-panel sf-orders-panel">
        <div className="sf-panel-heading">
          <div>
            <h2>Recent orders</h2>
            <p>Latest orders recorded in your store</p>
          </div>
          <Link className="sf-text-link" to="/admin/orders">
            View all orders →
          </Link>
        </div>

        {ordersLoading ? (
          <div className="sf-table-message">Loading orders...</div>
        ) : ordersError ? (
          <div className="sf-table-message sf-table-error">
            Could not load recent orders. Check the admin orders API.
          </div>
        ) : recentOrders.length === 0 ? (
          <div className="sf-table-message">
            No orders found. Orders will appear here when customers
            place them.
          </div>
        ) : (
          <div className="sf-table-scroll">
            <table className="sf-orders-table">
              <thead>
                <tr>
                  <th>Order ID</th>
                  <th>Customer</th>
                  <th>Items</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Date</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.map((order) => (
                  <tr key={order.id}>
                    <td className="sf-order-id">
                      #{order.id}
                    </td>
                    <td>
                      <div className="sf-customer-cell">
                        <span className="sf-customer-avatar">
                          {String(
                            order.customer_name ?? "C"
                          )
                            .charAt(0)
                            .toUpperCase()}
                        </span>
                        <div>
                          <strong>
                            {order.customer_name ?? "Customer"}
                          </strong>
                          <small>
                            {order.customer_email ?? "—"}
                          </small>
                        </div>
                      </div>
                    </td>
                    <td>
                      {(order.items ?? []).reduce(
                        (sum, item) =>
                          sum + Number(item.quantity ?? 0),
                        0
                      )}
                    </td>
                    <td className="sf-order-amount">
                      {formatCurrency(order.total_amount)}
                    </td>
                    <td>
                      <span
                        className={`sf-order-status status-${String(
                          order.status ?? "pending"
                        )
                          .toLowerCase()
                          .replaceAll("_", "-")}`}
                      >
                        {statusLabel(order.status)}
                      </span>
                    </td>
                    <td>{formatDate(order.created_at)}</td>
                    <td>
                      <Link
                        className="sf-view-order"
                        to={`/admin/orders`}
                        aria-label={`View order ${order.id}`}
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <div className="sf-executive-footer">
        <span>ShopFlow Executive Analytics</span>
        <span>
          Figures reflect data returned by your backend APIs.
        </span>
      </div>
    </section>
  );
}

export default AdminDashboard;