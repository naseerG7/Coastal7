function AdminSupport() {
  const tickets = [
    {
      id: "TKT001",
      customer: "Rahul Sharma",
      subject: "Order delivery issue",
      category: "Delivery",
      priority: "High",
      date: "02 Oct 2026",
      status: "Open",
    },
    {
      id: "TKT002",
      customer: "Priya Kumar",
      subject: "Refund not received",
      category: "Refund",
      priority: "High",
      date: "02 Oct 2026",
      status: "In Progress",
    },
    {
      id: "TKT003",
      customer: "Arun Kumar",
      subject: "Product information",
      category: "Product",
      priority: "Low",
      date: "01 Oct 2026",
      status: "Resolved",
    },
    {
      id: "TKT004",
      customer: "Sneha Reddy",
      subject: "Payment failed",
      category: "Payment",
      priority: "Medium",
      date: "01 Oct 2026",
      status: "Open",
    },
    {
      id: "TKT005",
      customer: "Vikram Singh",
      subject: "Account access problem",
      category: "Account",
      priority: "Medium",
      date: "30 Sep 2026",
      status: "Resolved",
    },
  ];

  return (
    <div className="admin-content">
      <h1>Customer Service</h1>

      <p>
        Manage customer support tickets, complaints, requests and service
        performance.
      </p>

      <div className="dashboard-grid">
        <div className="dashboard-card">
          <h3>Total Tickets</h3>
          <div className="card-value">1,284</div>
          <div className="card-description">
            Total customer support tickets
          </div>
        </div>

        <div className="dashboard-card">
          <h3>Open Tickets</h3>
          <div className="card-value">86</div>
          <div className="card-description">
            Tickets awaiting response
          </div>
        </div>

        <div className="dashboard-card">
          <h3>In Progress</h3>
          <div className="card-value">124</div>
          <div className="card-description">
            Tickets currently being handled
          </div>
        </div>

        <div className="dashboard-card">
          <h3>Resolved</h3>
          <div className="card-value">1,074</div>
          <div className="card-description">
            Successfully resolved tickets
          </div>
        </div>
      </div>

      <h2>Support Tickets</h2>

      <div className="admin-table-container">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Ticket ID</th>
              <th>Customer</th>
              <th>Subject</th>
              <th>Category</th>
              <th>Priority</th>
              <th>Date</th>
              <th>Status</th>
            </tr>
          </thead>

          <tbody>
            {tickets.map((ticket) => (
              <tr key={ticket.id}>
                <td>
                  <strong>{ticket.id}</strong>
                </td>

                <td>{ticket.customer}</td>

                <td>{ticket.subject}</td>

                <td>{ticket.category}</td>

                <td>
                  <span
                    className={
                      ticket.priority === "High"
                        ? "status-danger"
                        : ticket.priority === "Medium"
                        ? "status-warning"
                        : "status-info"
                    }
                  >
                    {ticket.priority}
                  </span>
                </td>

                <td>{ticket.date}</td>

                <td>
                  <span
                    className={
                      ticket.status === "Resolved"
                        ? "status-success"
                        : ticket.status === "Open"
                        ? "status-danger"
                        : "status-warning"
                    }
                  >
                    {ticket.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h2>Support Categories</h2>

      <div className="dashboard-grid">
        <div className="dashboard-card">
          <h3>Delivery Issues</h3>
          <div className="card-value">284</div>
          <div className="card-description">
            Delivery-related support requests
          </div>
        </div>

        <div className="dashboard-card">
          <h3>Payment Issues</h3>
          <div className="card-value">218</div>
          <div className="card-description">
            Payment-related complaints
          </div>
        </div>

        <div className="dashboard-card">
          <h3>Refund Requests</h3>
          <div className="card-value">186</div>
          <div className="card-description">
            Refund-related support requests
          </div>
        </div>

        <div className="dashboard-card">
          <h3>Product Issues</h3>
          <div className="card-value">164</div>
          <div className="card-description">
            Product-related complaints
          </div>
        </div>
      </div>

      <h2>Customer Service Performance</h2>

      <div className="dashboard-grid">
        <div className="dashboard-card">
          <h3>Average Response Time</h3>
          <div className="card-value">18 min</div>
          <div className="card-description">
            Average first response time
          </div>
        </div>

        <div className="dashboard-card">
          <h3>Average Resolution Time</h3>
          <div className="card-value">4.2 hrs</div>
          <div className="card-description">
            Average ticket resolution time
          </div>
        </div>

        <div className="dashboard-card">
          <h3>Customer Satisfaction</h3>
          <div className="card-value">94%</div>
          <div className="card-description">
            Positive customer feedback
          </div>
        </div>

        <div className="dashboard-card">
          <h3>Escalated Tickets</h3>
          <div className="card-value">28</div>
          <div className="card-description">
            Tickets requiring management review
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminSupport;