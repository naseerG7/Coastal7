import { useMemo, useState } from "react";
import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import api from "../../services/api";

function AdminOrders() {
  const queryClient = useQueryClient();

  // ============================================================
  // LOAD ORDERS WITH TANSTACK QUERY
  // ============================================================

  const {
    data: orders = [],
    isLoading: loading,
    isError,
    error: queryError,
  } = useQuery({
    queryKey: ["admin", "orders"],
    queryFn: async () => {
      const response = await api.get("/admin/orders");
      return response.data;
    },
  });

  // ============================================================
  // UPDATE ORDER STATUS WITH TANSTACK MUTATION
  // ============================================================

  const [updatingOrderId, setUpdatingOrderId] =
    useState(null);

  const updateOrderStatusMutation = useMutation({
    mutationFn: async ({
      orderId,
      newStatus,
    }) => {
      const response = await api.put(
        `/admin/orders/${orderId}/status`,
        {
          status: newStatus,
        }
      );

      return response.data;
    },

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["admin", "orders"],
      });
    },
  });

  // ============================================================
  // ERROR MESSAGE
  // ============================================================

  const [error, setError] = useState("");

  // ============================================================
  // UPDATE ORDER STATUS
  // ============================================================

  const handleStatusChange = async (
    orderId,
    newStatus
  ) => {
    try {
      setUpdatingOrderId(orderId);
      setError("");

      await updateOrderStatusMutation.mutateAsync({
        orderId,
        newStatus,
      });
    } catch (err) {
      console.error(
        "Failed to update order status:",
        err
      );

      const detail =
        err.response?.data?.detail;

      setError(
        typeof detail === "object"
          ? detail.message ||
              "Unable to update order status."
          : detail ||
              "Unable to update order status."
      );
    } finally {
      setUpdatingOrderId(null);
    }
  };

  // ============================================================
  // FORMAT DATE
  // ============================================================

  const formatDate = (date) => {
    if (!date) return "-";

    return new Date(date).toLocaleString(
      "en-IN",
      {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }
    );
  };

  // ============================================================
  // FORMAT CURRENCY
  // ============================================================

  const formatCurrency = (amount) => {
    return `₹${Number(amount || 0).toLocaleString(
      "en-IN",
      {
        maximumFractionDigits: 2,
      }
    )}`;
  };

  // ============================================================
  // STATUS DISPLAY NAME
  // ============================================================

  const getStatusLabel = (status) => {
    const labels = {
      pending: "Pending",
      confirmed: "Confirmed",
      processing: "Processing",
      shipped: "Shipped",
      out_for_delivery:
        "Out for Delivery",
      delivered: "Delivered",
      cancelled: "Cancelled",
    };

    return labels[status] || status;
  };

  // ============================================================
  // STATUS CSS CLASS
  // ============================================================

  const getStatusClass = (status) => {
    switch (status) {
      case "delivered":
        return "status-success";

      case "cancelled":
        return "status-danger";

      case "pending":
        return "status-warning";

      case "confirmed":
      case "processing":
      case "shipped":
      case "out_for_delivery":
        return "status-info";

      default:
        return "status-info";
    }
  };

  // ============================================================
  // ORDER STATISTICS
  // ============================================================

  const statistics = useMemo(() => {
    const total = orders.length;

    const pending = orders.filter(
      (order) =>
        order.status === "pending"
    ).length;

    const processing = orders.filter(
      (order) =>
        order.status === "processing"
    ).length;

    const completed = orders.filter(
      (order) =>
        order.status === "delivered"
    ).length;

    const cancelled = orders.filter(
      (order) =>
        order.status === "cancelled"
    ).length;

    const shipped = orders.filter(
      (order) =>
        order.status === "shipped" ||
        order.status ===
          "out_for_delivery"
    ).length;

    const outForDelivery = orders.filter(
      (order) =>
        order.status ===
        "out_for_delivery"
    ).length;

    const activeOrders = orders.filter(
      (order) =>
        ![
          "delivered",
          "cancelled",
        ].includes(order.status)
    ).length;

    const totalRevenue = orders
      .filter(
        (order) =>
          order.status !== "cancelled"
      )
      .reduce(
        (total, order) =>
          total +
          Number(
            order.total_amount || 0
          ),
        0
      );

    const cancelledValue = orders
      .filter(
        (order) =>
          order.status === "cancelled"
      )
      .reduce(
        (total, order) =>
          total +
          Number(
            order.total_amount || 0
          ),
        0
      );

    const averageOrderValue =
      total > 0
        ? totalRevenue / total
        : 0;

    return {
      total,
      pending,
      processing,
      completed,
      cancelled,
      shipped,
      outForDelivery,
      activeOrders,
      totalRevenue,
      cancelledValue,
      averageOrderValue,
    };
  }, [orders]);

  // ============================================================
  // REFRESH ORDERS
  // ============================================================

  const handleRefreshOrders = () => {
    setError("");

    queryClient.invalidateQueries({
      queryKey: ["admin", "orders"],
    });
  };

  // ============================================================
  // LOADING SCREEN
  // ============================================================

  if (loading) {
    return (
      <div className="admin-content">
        <h1>Orders</h1>

        <div className="dashboard-card">
          <h3>Loading Orders...</h3>

          <p>
            Please wait while we load the latest
            orders.
          </p>
        </div>
      </div>
    );
  }

  // ============================================================
  // QUERY ERROR
  // ============================================================

  if (isError && orders.length === 0) {
    const errorMessage =
      queryError?.response?.data?.detail ||
      "Unable to load orders. Please try again.";

    return (
      <div className="admin-content">
        <h1>Orders</h1>

        <div className="status-danger">
          {errorMessage}
        </div>

        <div
          style={{
            marginTop: "20px",
          }}
        >
          <button
            type="button"
            onClick={handleRefreshOrders}
            className="admin-button"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // ============================================================
  // PAGE
  // ============================================================

  return (
    <div className="admin-content">

      {/* ======================================================
          PAGE HEADER
      ====================================================== */}

      <div>
        <h1>Orders</h1>

        <p>
          Manage customer orders, payments,
          shipping and order status.
        </p>
      </div>

      {/* ======================================================
          ERROR MESSAGE
      ====================================================== */}

      {(error || isError) && (
        <div
          className="status-danger"
          style={{
            marginBottom: "20px",
            padding: "12px 16px",
            borderRadius: "8px",
          }}
        >
          {error ||
            queryError?.response?.data?.detail ||
            "Unable to load orders."}
        </div>
      )}

      {/* ======================================================
          ORDER STATISTICS
      ====================================================== */}

      <div className="dashboard-grid">

        <div className="dashboard-card">
          <h3>Total Orders</h3>

          <div className="card-value">
            {statistics.total}
          </div>

          <div className="card-description">
            Total orders in the system
          </div>
        </div>

        <div className="dashboard-card">
          <h3>Pending Orders</h3>

          <div className="card-value">
            {statistics.pending}
          </div>

          <div className="card-description">
            Orders waiting for processing
          </div>
        </div>

        <div className="dashboard-card">
          <h3>Processing Orders</h3>

          <div className="card-value">
            {statistics.processing}
          </div>

          <div className="card-description">
            Orders currently processing
          </div>
        </div>

        <div className="dashboard-card">
          <h3>Completed Orders</h3>

          <div className="card-value">
            {statistics.completed}
          </div>

          <div className="card-description">
            Successfully delivered orders
          </div>
        </div>

      </div>

      {/* ======================================================
          ORDER LIST
      ====================================================== */}

      <h2>Order List</h2>

      {orders.length === 0 ? (
        <div className="dashboard-card">
          <h3>No Orders Found</h3>

          <p>
            There are currently no customer
            orders.
          </p>
        </div>
      ) : (
        <div className="admin-table-container">

          <table className="admin-table">

            <thead>
              <tr>
                <th>Order ID</th>
                <th>Customer</th>
                <th>Date</th>
                <th>Items</th>
                <th>Amount</th>
                <th>Payment</th>
                <th>Order Status</th>
              </tr>
            </thead>

            <tbody>

              {orders.map((order) => {

                const itemCount =
                  order.items?.reduce(
                    (total, item) =>
                      total +
                      Number(
                        item.quantity || 0
                      ),
                    0
                  ) || 0;

                return (
                  <tr
                    key={order.id}
                  >

                    <td>
                      <strong>
                        #{order.id}
                      </strong>
                    </td>

                    <td>
                      <div>
                        <strong>
                          {
                            order.customer_name
                          }
                        </strong>
                      </div>

                      <small>
                        {
                          order.customer_email
                        }
                      </small>
                    </td>

                    <td>
                      {formatDate(
                        order.created_at
                      )}
                    </td>

                    <td>
                      {itemCount}
                    </td>

                    <td>
                      <strong>
                        {formatCurrency(
                          order.total_amount
                        )}
                      </strong>
                    </td>

                    <td>
                      <span className="status-success">
                        Order Created
                      </span>
                    </td>

                    <td>

                      <select
                        className="admin-order-status-select"
                        value={
                          order.status
                        }
                        disabled={
                          updatingOrderId ===
                          order.id
                        }
                        onChange={(event) =>
                          handleStatusChange(
                            order.id,
                            event.target.value
                          )
                        }
                      >

                        <option value="pending">
                          Pending
                        </option>

                        <option value="confirmed">
                          Confirmed
                        </option>

                        <option value="processing">
                          Processing
                        </option>

                        <option value="shipped">
                          Shipped
                        </option>

                        <option value="out_for_delivery">
                          Out for Delivery
                        </option>

                        <option value="delivered">
                          Delivered
                        </option>

                        <option value="cancelled">
                          Cancelled
                        </option>

                      </select>

                      <div
                        style={{
                          marginTop: "6px",
                        }}
                      >
                        <span
                          className={getStatusClass(
                            order.status
                          )}
                        >
                          {getStatusLabel(
                            order.status
                          )}
                        </span>
                      </div>

                    </td>

                  </tr>
                );
              })}

            </tbody>

          </table>

        </div>
      )}

      {/* ======================================================
          ORDER MANAGEMENT
      ====================================================== */}

      <h2>Order Management</h2>

      <div className="dashboard-grid">

        <div className="dashboard-card">
          <h3>Orders to Ship</h3>

          <div className="card-value">
            {statistics.shipped}
          </div>

          <div className="card-description">
            Orders shipped or ready for delivery
          </div>
        </div>

        <div className="dashboard-card">
          <h3>Out for Delivery</h3>

          <div className="card-value">
            {statistics.outForDelivery}
          </div>

          <div className="card-description">
            Orders currently being delivered
          </div>
        </div>

        <div className="dashboard-card">
          <h3>Cancelled Orders</h3>

          <div className="card-value">
            {statistics.cancelled}
          </div>

          <div className="card-description">
            Cancelled customer orders
          </div>
        </div>

        <div className="dashboard-card">
          <h3>Delivered Orders</h3>

          <div className="card-value">
            {statistics.completed}
          </div>

          <div className="card-description">
            Successfully delivered orders
          </div>
        </div>

      </div>

      {/* ======================================================
          ORDER REVENUE
      ====================================================== */}

      <h2>Order Revenue</h2>

      <div className="dashboard-grid">

        <div className="dashboard-card">
          <h3>Total Revenue</h3>

          <div className="card-value">
            {formatCurrency(
              statistics.totalRevenue
            )}
          </div>

          <div className="card-description">
            Revenue from non-cancelled orders
          </div>
        </div>

        <div className="dashboard-card">
          <h3>Average Order Value</h3>

          <div className="card-value">
            {formatCurrency(
              statistics.averageOrderValue
            )}
          </div>

          <div className="card-description">
            Average value per order
          </div>
        </div>

        <div className="dashboard-card">
          <h3>Cancelled Value</h3>

          <div className="card-value">
            {formatCurrency(
              statistics.cancelledValue
            )}
          </div>

          <div className="card-description">
            Value of cancelled orders
          </div>
        </div>

        <div className="dashboard-card">
          <h3>Active Orders</h3>

          <div className="card-value">
            {statistics.activeOrders}
          </div>

          <div className="card-description">
            Orders currently in progress
          </div>
        </div>

      </div>

      {/* ======================================================
          REFRESH BUTTON
      ====================================================== */}

      <div
        style={{
          marginTop: "25px",
          marginBottom: "30px",
        }}
      >

        <button
          type="button"
          onClick={handleRefreshOrders}
          className="admin-button"
          disabled={
            loading ||
            updateOrderStatusMutation.isPending
          }
        >
          {updateOrderStatusMutation.isPending
            ? "Updating..."
            : "Refresh Orders"}
        </button>

      </div>

    </div>
  );
}

export default AdminOrders;

