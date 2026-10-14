function AdminCancellations() {
  const cancellations = [
    {
      id: "CAN001",
      order: "ORD005",
      customer: "Vikram Singh",
      reason: "Changed mind",
      amount: "₹6,250",
      date: "30 Sep 2026",
      status: "Completed",
    },
    {
      id: "CAN002",
      order: "ORD009",
      customer: "Anita Rao",
      reason: "Found better price",
      amount: "₹3,499",
      date: "01 Oct 2026",
      status: "Approved",
    },
    {
      id: "CAN003",
      order: "ORD014",
      customer: "Kiran Kumar",
      reason: "Ordered by mistake",
      amount: "₹2,199",
      date: "01 Oct 2026",
      status: "Pending",
    },
    {
      id: "CAN004",
      order: "ORD019",
      customer: "Meena Reddy",
      reason: "Delivery taking too long",
      amount: "₹4,799",
      date: "02 Oct 2026",
      status: "Processing",
    },
    {
      id: "CAN005",
      order: "ORD023",
      customer: "Suresh Kumar",
      reason: "Duplicate order",
      amount: "₹1,999",
      date: "02 Oct 2026",
      status: "Rejected",
    },
  ];

  return (
    <div className="admin-content">
      <h1>Cancellations</h1>

      <p>
        Manage customer cancellation requests, approvals, cancelled orders and
        cancellation reasons.
      </p>

      <div className="dashboard-grid">
        <div className="dashboard-card">
          <h3>Total Cancellations</h3>
          <div className="card-value">284</div>
          <div className="card-description">
            Total cancellation requests
          </div>
        </div>

        <div className="dashboard-card">
          <h3>Pending Requests</h3>
          <div className="card-value">38</div>
          <div className="card-description">
            Awaiting admin review
          </div>
        </div>

        <div className="dashboard-card">
          <h3>Approved Cancellations</h3>
          <div className="card-value">218</div>
          <div className="card-description">
            Successfully approved
          </div>
        </div>

        <div className="dashboard-card">
          <h3>Cancelled Order Value</h3>
          <div className="card-value">₹6.8L</div>
          <div className="card-description">
            Total value of cancelled orders
          </div>
        </div>
      </div>

      <h2>Cancellation Requests</h2>

      <div className="admin-table-container">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Cancellation ID</th>
              <th>Order ID</th>
              <th>Customer</th>
              <th>Reason</th>
              <th>Amount</th>
              <th>Date</th>
              <th>Status</th>
            </tr>
          </thead>

          <tbody>
            {cancellations.map((cancellation) => (
              <tr key={cancellation.id}>
                <td>
                  <strong>{cancellation.id}</strong>
                </td>

                <td>{cancellation.order}</td>

                <td>{cancellation.customer}</td>

                <td>{cancellation.reason}</td>

                <td>{cancellation.amount}</td>

                <td>{cancellation.date}</td>

                <td>
                  <span
                    className={
                      cancellation.status === "Completed" ||
                      cancellation.status === "Approved"
                        ? "status-success"
                        : cancellation.status === "Pending" ||
                          cancellation.status === "Processing"
                        ? "status-warning"
                        : "status-danger"
                    }
                  >
                    {cancellation.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h2>Cancellation Management</h2>

      <div className="dashboard-grid">
        <div className="dashboard-card">
          <h3>Today's Cancellations</h3>
          <div className="card-value">14</div>
          <div className="card-description">
            Cancellation requests received today
          </div>
        </div>

        <div className="dashboard-card">
          <h3>Processing Requests</h3>
          <div className="card-value">22</div>
          <div className="card-description">
            Requests currently being reviewed
          </div>
        </div>

        <div className="dashboard-card">
          <h3>Completed Cancellations</h3>
          <div className="card-value">218</div>
          <div className="card-description">
            Successfully cancelled orders
          </div>
        </div>

        <div className="dashboard-card">
          <h3>Rejected Requests</h3>
          <div className="card-value">28</div>
          <div className="card-description">
            Cancellation requests rejected
          </div>
        </div>
      </div>

      <h2>Cancellation Reasons</h2>

      <div className="admin-table-container">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Cancellation Reason</th>
              <th>Requests</th>
              <th>Percentage</th>
              <th>Total Order Value</th>
            </tr>
          </thead>

          <tbody>
            <tr>
              <td>
                <strong>Changed Mind</strong>
              </td>
              <td>82</td>
              <td>29%</td>
              <td>₹1.94L</td>
            </tr>

            <tr>
              <td>
                <strong>Found Better Price</strong>
              </td>
              <td>54</td>
              <td>19%</td>
              <td>₹1.28L</td>
            </tr>

            <tr>
              <td>
                <strong>Ordered by Mistake</strong>
              </td>
              <td>48</td>
              <td>17%</td>
              <td>₹1.06L</td>
            </tr>

            <tr>
              <td>
                <strong>Delivery Delay</strong>
              </td>
              <td>42</td>
              <td>15%</td>
              <td>₹98K</td>
            </tr>

            <tr>
              <td>
                <strong>Duplicate Order</strong>
              </td>
              <td>34</td>
              <td>12%</td>
              <td>₹76K</td>
            </tr>

            <tr>
              <td>
                <strong>Other Reasons</strong>
              </td>
              <td>24</td>
              <td>8%</td>
              <td>₹58K</td>
            </tr>
          </tbody>
        </table>
      </div>

      <h2>Cancellation Impact</h2>

      <div className="dashboard-grid">
        <div className="dashboard-card">
          <h3>Cancelled Revenue</h3>
          <div className="card-value">₹6.8L</div>
          <div className="card-description">
            Revenue lost from cancellations
          </div>
        </div>

        <div className="dashboard-card">
          <h3>Refund Required</h3>
          <div className="card-value">₹5.9L</div>
          <div className="card-description">
            Amount requiring customer refunds
          </div>
        </div>

        <div className="dashboard-card">
          <h3>Cancellation Rate</h3>
          <div className="card-value">7.4%</div>
          <div className="card-description">
            Percentage of total orders cancelled
          </div>
        </div>

        <div className="dashboard-card">
          <h3>Successful Retention</h3>
          <div className="card-value">92.6%</div>
          <div className="card-description">
            Orders successfully retained
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminCancellations;