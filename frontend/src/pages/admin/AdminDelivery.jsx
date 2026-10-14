function AdminDelivery() {
  const deliveries = [
    {
      id: "DEL001",
      order: "ORD001",
      customer: "Rahul Sharma",
      partner: "Delhivery",
      location: "Hyderabad",
      expected: "04 Oct 2026",
      status: "Delivered",
    },
    {
      id: "DEL002",
      order: "ORD002",
      customer: "Priya Kumar",
      partner: "Blue Dart",
      location: "Bangalore",
      expected: "05 Oct 2026",
      status: "In Transit",
    },
    {
      id: "DEL003",
      order: "ORD003",
      customer: "Arun Kumar",
      partner: "DTDC",
      location: "Chennai",
      expected: "05 Oct 2026",
      status: "Out for Delivery",
    },
    {
      id: "DEL004",
      order: "ORD004",
      customer: "Sneha Reddy",
      partner: "Delhivery",
      location: "Vijayawada",
      expected: "06 Oct 2026",
      status: "Delayed",
    },
    {
      id: "DEL005",
      order: "ORD005",
      customer: "Vikram Singh",
      partner: "Ecom Express",
      location: "Mumbai",
      expected: "Cancelled",
      status: "Cancelled",
    },
  ];

  return (
    <div className="admin-content">
      <h1>Delivery</h1>

      <p>
        Manage deliveries, shipment tracking, delivery partners and delivery
        performance.
      </p>

      <div className="dashboard-grid">
        <div className="dashboard-card">
          <h3>Total Deliveries</h3>
          <div className="card-value">3,428</div>
          <div className="card-description">
            Total shipments created
          </div>
        </div>

        <div className="dashboard-card">
          <h3>In Transit</h3>
          <div className="card-value">428</div>
          <div className="card-description">
            Shipments currently moving
          </div>
        </div>

        <div className="dashboard-card">
          <h3>Out for Delivery</h3>
          <div className="card-value">186</div>
          <div className="card-description">
            Deliveries arriving today
          </div>
        </div>

        <div className="dashboard-card">
          <h3>Delivered</h3>
          <div className="card-value">2,684</div>
          <div className="card-description">
            Successfully delivered
          </div>
        </div>
      </div>

      <h2>Delivery Tracking</h2>

      <div className="admin-table-container">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Delivery ID</th>
              <th>Order ID</th>
              <th>Customer</th>
              <th>Partner</th>
              <th>Location</th>
              <th>Expected Delivery</th>
              <th>Status</th>
            </tr>
          </thead>

          <tbody>
            {deliveries.map((delivery) => (
              <tr key={delivery.id}>
                <td>
                  <strong>{delivery.id}</strong>
                </td>

                <td>{delivery.order}</td>

                <td>{delivery.customer}</td>

                <td>{delivery.partner}</td>

                <td>{delivery.location}</td>

                <td>{delivery.expected}</td>

                <td>
                  <span
                    className={
                      delivery.status === "Delivered"
                        ? "status-success"
                        : delivery.status === "Delayed" ||
                          delivery.status === "Cancelled"
                        ? "status-danger"
                        : delivery.status === "Out for Delivery"
                        ? "status-warning"
                        : "status-info"
                    }
                  >
                    {delivery.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h2>Delivery Performance</h2>

      <div className="dashboard-grid">
        <div className="dashboard-card">
          <h3>On-Time Delivery</h3>
          <div className="card-value">94%</div>
          <div className="card-description">
            Deliveries completed on time
          </div>
        </div>

        <div className="dashboard-card">
          <h3>Delayed Deliveries</h3>
          <div className="card-value">68</div>
          <div className="card-description">
            Shipments delayed
          </div>
        </div>

        <div className="dashboard-card">
          <h3>Failed Deliveries</h3>
          <div className="card-value">24</div>
          <div className="card-description">
            Delivery attempts failed
          </div>
        </div>

        <div className="dashboard-card">
          <h3>Average Delivery Time</h3>
          <div className="card-value">3.8 Days</div>
          <div className="card-description">
            Average delivery duration
          </div>
        </div>
      </div>

      <h2>Delivery Partners</h2>

      <div className="admin-table-container">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Partner</th>
              <th>Total Shipments</th>
              <th>Delivered</th>
              <th>In Transit</th>
              <th>Delayed</th>
              <th>Performance</th>
            </tr>
          </thead>

          <tbody>
            <tr>
              <td>
                <strong>Delhivery</strong>
              </td>
              <td>1,284</td>
              <td>1,056</td>
              <td>182</td>
              <td>46</td>
              <td className="status-success">95%</td>
            </tr>

            <tr>
              <td>
                <strong>Blue Dart</strong>
              </td>
              <td>842</td>
              <td>694</td>
              <td>126</td>
              <td>22</td>
              <td className="status-success">94%</td>
            </tr>

            <tr>
              <td>
                <strong>DTDC</strong>
              </td>
              <td>724</td>
              <td>582</td>
              <td>112</td>
              <td>30</td>
              <td className="status-success">92%</td>
            </tr>

            <tr>
              <td>
                <strong>Ecom Express</strong>
              </td>
              <td>578</td>
              <td>438</td>
              <td>94</td>
              <td>46</td>
              <td className="status-warning">88%</td>
            </tr>
          </tbody>
        </table>
      </div>

      <h2>Delivery Management</h2>

      <div className="dashboard-grid">
        <div className="dashboard-card">
          <h3>Today's Deliveries</h3>
          <div className="card-value">186</div>
          <div className="card-description">
            Deliveries scheduled today
          </div>
        </div>

        <div className="dashboard-card">
          <h3>Delayed Shipments</h3>
          <div className="card-value">68</div>
          <div className="card-description">
            Require attention
          </div>
        </div>

        <div className="dashboard-card">
          <h3>Delivery Complaints</h3>
          <div className="card-value">17</div>
          <div className="card-description">
            Customer delivery complaints
          </div>
        </div>

        <div className="dashboard-card">
          <h3>Tracking Updates</h3>
          <div className="card-value">1,482</div>
          <div className="card-description">
            Tracking events today
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminDelivery;