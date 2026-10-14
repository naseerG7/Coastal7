function AdminRefunds() {
  const refunds = [
    {
      id: "REF001",
      order: "ORD005",
      customer: "Vikram Singh",
      reason: "Product damaged",
      amount: "₹6,250",
      date: "30 Sep 2026",
      status: "Completed",
    },
    {
      id: "REF002",
      order: "ORD008",
      customer: "Anita Rao",
      reason: "Wrong product",
      amount: "₹3,499",
      date: "01 Oct 2026",
      status: "Pending",
    },
    {
      id: "REF003",
      order: "ORD012",
      customer: "Kiran Kumar",
      reason: "Product not required",
      amount: "₹2,199",
      date: "01 Oct 2026",
      status: "Approved",
    },
    {
      id: "REF004",
      order: "ORD018",
      customer: "Meena Reddy",
      reason: "Product damaged",
      amount: "₹4,799",
      date: "02 Oct 2026",
      status: "Processing",
    },
    {
      id: "REF005",
      order: "ORD021",
      customer: "Suresh Kumar",
      reason: "Duplicate order",
      amount: "₹1,999",
      date: "02 Oct 2026",
      status: "Rejected",
    },
  ];

  return (
    <div className="admin-content">
      <h1>Refunds</h1>

      <p>
        Manage customer refund requests, approvals, processing and completed
        refunds.
      </p>

      <div className="dashboard-grid">
        <div className="dashboard-card">
          <h3>Total Refunds</h3>
          <div className="card-value">428</div>
          <div className="card-description">
            Total refund requests
          </div>
        </div>

        <div className="dashboard-card">
          <h3>Pending Refunds</h3>
          <div className="card-value">68</div>
          <div className="card-description">
            Awaiting admin review
          </div>
        </div>

        <div className="dashboard-card">
          <h3>Approved Refunds</h3>
          <div className="card-value">94</div>
          <div className="card-description">
            Approved for processing
          </div>
        </div>

        <div className="dashboard-card">
          <h3>Refunded Amount</h3>
          <div className="card-value">₹8.4L</div>
          <div className="card-description">
            Total amount refunded
          </div>
        </div>
      </div>

      <h2>Refund Requests</h2>

      <div className="admin-table-container">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Refund ID</th>
              <th>Order ID</th>
              <th>Customer</th>
              <th>Reason</th>
              <th>Amount</th>
              <th>Date</th>
              <th>Status</th>
            </tr>
          </thead>

          <tbody>
            {refunds.map((refund) => (
              <tr key={refund.id}>
                <td>
                  <strong>{refund.id}</strong>
                </td>

                <td>{refund.order}</td>

                <td>{refund.customer}</td>

                <td>{refund.reason}</td>

                <td>{refund.amount}</td>

                <td>{refund.date}</td>

                <td>
                  <span
                    className={
                      refund.status === "Completed"
                        ? "status-success"
                        : refund.status === "Pending" ||
                          refund.status === "Processing"
                        ? "status-warning"
                        : refund.status === "Rejected"
                        ? "status-danger"
                        : "status-info"
                    }
                  >
                    {refund.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h2>Refund Management</h2>

      <div className="dashboard-grid">
        <div className="dashboard-card">
          <h3>Today's Refunds</h3>
          <div className="card-value">18</div>
          <div className="card-description">
            Refund requests received today
          </div>
        </div>

        <div className="dashboard-card">
          <h3>Processing Refunds</h3>
          <div className="card-value">34</div>
          <div className="card-description">
            Refunds currently being processed
          </div>
        </div>

        <div className="dashboard-card">
          <h3>Completed Refunds</h3>
          <div className="card-value">326</div>
          <div className="card-description">
            Successfully completed refunds
          </div>
        </div>

        <div className="dashboard-card">
          <h3>Rejected Refunds</h3>
          <div className="card-value">24</div>
          <div className="card-description">
            Refund requests rejected
          </div>
        </div>
      </div>

      <h2>Refund Reasons</h2>

      <div className="admin-table-container">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Refund Reason</th>
              <th>Requests</th>
              <th>Percentage</th>
              <th>Total Amount</th>
            </tr>
          </thead>

          <tbody>
            <tr>
              <td>
                <strong>Product Damaged</strong>
              </td>
              <td>142</td>
              <td>33%</td>
              <td>₹2.86L</td>
            </tr>

            <tr>
              <td>
                <strong>Wrong Product</strong>
              </td>
              <td>96</td>
              <td>22%</td>
              <td>₹1.94L</td>
            </tr>

            <tr>
              <td>
                <strong>Product Not Required</strong>
              </td>
              <td>84</td>
              <td>20%</td>
              <td>₹1.62L</td>
            </tr>

            <tr>
              <td>
                <strong>Product Quality Issue</strong>
              </td>
              <td>72</td>
              <td>17%</td>
              <td>₹1.38L</td>
            </tr>

            <tr>
              <td>
                <strong>Other Reasons</strong>
              </td>
              <td>34</td>
              <td>8%</td>
              <td>₹60K</td>
            </tr>
          </tbody>
        </table>
      </div>

      <h2>Refund Payments</h2>

      <div className="dashboard-grid">
        <div className="dashboard-card">
          <h3>UPI Refunds</h3>
          <div className="card-value">₹2.8L</div>
          <div className="card-description">
            Refunds returned through UPI
          </div>
        </div>

        <div className="dashboard-card">
          <h3>Card Refunds</h3>
          <div className="card-value">₹3.4L</div>
          <div className="card-description">
            Refunds returned to cards
          </div>
        </div>

        <div className="dashboard-card">
          <h3>Net Banking Refunds</h3>
          <div className="card-value">₹1.6L</div>
          <div className="card-description">
            Refunds through net banking
          </div>
        </div>

        <div className="dashboard-card">
          <h3>COD Refunds</h3>
          <div className="card-value">₹60K</div>
          <div className="card-description">
            Cash-on-delivery refunds
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminRefunds;