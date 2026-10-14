function AdminPayments() {
  const payments = [
    {
      id: "PAY001",
      order: "ORD001",
      customer: "Rahul Sharma",
      method: "UPI",
      amount: "₹5,998",
      date: "02 Oct 2026",
      status: "Successful",
    },
    {
      id: "PAY002",
      order: "ORD002",
      customer: "Priya Kumar",
      method: "Credit Card",
      amount: "₹4,799",
      date: "02 Oct 2026",
      status: "Successful",
    },
    {
      id: "PAY003",
      order: "ORD003",
      customer: "Arun Kumar",
      method: "Net Banking",
      amount: "₹8,450",
      date: "01 Oct 2026",
      status: "Successful",
    },
    {
      id: "PAY004",
      order: "ORD004",
      customer: "Sneha Reddy",
      method: "UPI",
      amount: "₹1,999",
      date: "01 Oct 2026",
      status: "Pending",
    },
    {
      id: "PAY005",
      order: "ORD005",
      customer: "Vikram Singh",
      method: "Debit Card",
      amount: "₹6,250",
      date: "30 Sep 2026",
      status: "Failed",
    },
  ];

  return (
    <div className="admin-content">
      <h1>Payments</h1>

      <p>
        Manage customer payments, transactions, payment methods and payment
        status.
      </p>

      <div className="dashboard-grid">
        <div className="dashboard-card">
          <h3>Total Payments</h3>
          <div className="card-value">₹32.8L</div>
          <div className="card-description">
            Total payment value
          </div>
        </div>

        <div className="dashboard-card">
          <h3>Successful Payments</h3>
          <div className="card-value">3,428</div>
          <div className="card-description">
            Successfully completed
          </div>
        </div>

        <div className="dashboard-card">
          <h3>Pending Payments</h3>
          <div className="card-value">86</div>
          <div className="card-description">
            Payments awaiting confirmation
          </div>
        </div>

        <div className="dashboard-card">
          <h3>Failed Payments</h3>
          <div className="card-value">42</div>
          <div className="card-description">
            Payment transactions failed
          </div>
        </div>
      </div>

      <h2>Payment Transactions</h2>

      <div className="admin-table-container">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Payment ID</th>
              <th>Order ID</th>
              <th>Customer</th>
              <th>Method</th>
              <th>Amount</th>
              <th>Date</th>
              <th>Status</th>
            </tr>
          </thead>

          <tbody>
            {payments.map((payment) => (
              <tr key={payment.id}>
                <td>
                  <strong>{payment.id}</strong>
                </td>

                <td>{payment.order}</td>

                <td>{payment.customer}</td>

                <td>{payment.method}</td>

                <td>{payment.amount}</td>

                <td>{payment.date}</td>

                <td>
                  <span
                    className={
                      payment.status === "Successful"
                        ? "status-success"
                        : payment.status === "Pending"
                        ? "status-warning"
                        : "status-danger"
                    }
                  >
                    {payment.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h2>Payment Methods</h2>

      <div className="dashboard-grid">
        <div className="dashboard-card">
          <h3>UPI Payments</h3>
          <div className="card-value">₹12.4L</div>
          <div className="card-description">
            38% of total payments
          </div>
        </div>

        <div className="dashboard-card">
          <h3>Credit Card</h3>
          <div className="card-value">₹8.6L</div>
          <div className="card-description">
            26% of total payments
          </div>
        </div>

        <div className="dashboard-card">
          <h3>Debit Card</h3>
          <div className="card-value">₹6.2L</div>
          <div className="card-description">
            19% of total payments
          </div>
        </div>

        <div className="dashboard-card">
          <h3>Net Banking</h3>
          <div className="card-value">₹5.6L</div>
          <div className="card-description">
            17% of total payments
          </div>
        </div>
      </div>

      <h2>Payment Gateway Performance</h2>

      <div className="admin-table-container">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Gateway</th>
              <th>Transactions</th>
              <th>Successful</th>
              <th>Failed</th>
              <th>Success Rate</th>
              <th>Status</th>
            </tr>
          </thead>

          <tbody>
            <tr>
              <td>
                <strong>Razorpay</strong>
              </td>
              <td>2,184</td>
              <td>2,116</td>
              <td>68</td>
              <td>96.9%</td>
              <td className="status-success">Active</td>
            </tr>

            <tr>
              <td>
                <strong>Stripe</strong>
              </td>
              <td>1,426</td>
              <td>1,384</td>
              <td>42</td>
              <td>97.1%</td>
              <td className="status-success">Active</td>
            </tr>

            <tr>
              <td>
                <strong>PayU</strong>
              </td>
              <td>684</td>
              <td>646</td>
              <td>38</td>
              <td>94.4%</td>
              <td className="status-success">Active</td>
            </tr>

            <tr>
              <td>
                <strong>Cash on Delivery</strong>
              </td>
              <td>428</td>
              <td>428</td>
              <td>0</td>
              <td>100%</td>
              <td className="status-success">Active</td>
            </tr>
          </tbody>
        </table>
      </div>

      <h2>Payment Management</h2>

      <div className="dashboard-grid">
        <div className="dashboard-card">
          <h3>Today's Payments</h3>
          <div className="card-value">₹2.48L</div>
          <div className="card-description">
            Payments received today
          </div>
        </div>

        <div className="dashboard-card">
          <h3>Pending Amount</h3>
          <div className="card-value">₹42K</div>
          <div className="card-description">
            Payments awaiting confirmation
          </div>
        </div>

        <div className="dashboard-card">
          <h3>Failed Amount</h3>
          <div className="card-value">₹18K</div>
          <div className="card-description">
            Failed payment transactions
          </div>
        </div>

        <div className="dashboard-card">
          <h3>Refunded Amount</h3>
          <div className="card-value">₹84K</div>
          <div className="card-description">
            Payments refunded to customers
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminPayments;