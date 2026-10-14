function AdminReports() {
  return (
    <div className="admin-content">
      <h1>Reports & Analytics</h1>

      <p>
        Monitor sales, products, sellers, customers and delivery performance.
      </p>

      <div className="dashboard-grid">
        <div className="dashboard-card">
          <h3>Total Sales</h3>
          <div className="card-value">₹28.6L</div>
          <div className="card-description">
            Total sales this month
          </div>
        </div>

        <div className="dashboard-card">
          <h3>Total Orders</h3>
          <div className="card-value">3,842</div>
          <div className="card-description">
            Orders this month
          </div>
        </div>

        <div className="dashboard-card">
          <h3>Total Customers</h3>
          <div className="card-value">1,248</div>
          <div className="card-description">
            Registered customers
          </div>
        </div>

        <div className="dashboard-card">
          <h3>Total Products</h3>
          <div className="card-value">1,842</div>
          <div className="card-description">
            Products listed
          </div>
        </div>
      </div>

      <h2>Sales Report</h2>

      <div className="admin-table-container">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Period</th>
              <th>Orders</th>
              <th>Sales</th>
              <th>Average Order Value</th>
              <th>Growth</th>
            </tr>
          </thead>

          <tbody>
            <tr>
              <td><strong>Today</strong></td>
              <td>128</td>
              <td>₹2.48L</td>
              <td>₹1,938</td>
              <td className="status-success">+12%</td>
            </tr>

            <tr>
              <td><strong>This Week</strong></td>
              <td>846</td>
              <td>₹8.72L</td>
              <td>₹1,031</td>
              <td className="status-success">+9%</td>
            </tr>

            <tr>
              <td><strong>This Month</strong></td>
              <td>3,842</td>
              <td>₹28.6L</td>
              <td>₹744</td>
              <td className="status-success">+15%</td>
            </tr>
          </tbody>
        </table>
      </div>

      <h2>Product Performance</h2>

      <div className="dashboard-grid">
        <div className="dashboard-card">
          <h3>Best Selling Product</h3>
          <div className="card-value">Wireless Headphones</div>
          <div className="card-description">
            428 units sold
          </div>
        </div>

        <div className="dashboard-card">
          <h3>Top Category</h3>
          <div className="card-value">Electronics</div>
          <div className="card-description">
            Highest category sales
          </div>
        </div>

        <div className="dashboard-card">
          <h3>Low Stock Products</h3>
          <div className="card-value">86</div>
          <div className="card-description">
            Products requiring restocking
          </div>
        </div>

        <div className="dashboard-card">
          <h3>Out of Stock</h3>
          <div className="card-value">72</div>
          <div className="card-description">
            Products currently unavailable
          </div>
        </div>
      </div>

      <h2>Seller Performance</h2>

      <div className="admin-table-container">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Seller</th>
              <th>Products</th>
              <th>Orders</th>
              <th>Sales</th>
              <th>Performance</th>
            </tr>
          </thead>

          <tbody>
            <tr>
              <td><strong>Tech World</strong></td>
              <td>48</td>
              <td>842</td>
              <td>₹4.8L</td>
              <td className="status-success">Excellent</td>
            </tr>

            <tr>
              <td><strong>Fashion Hub</strong></td>
              <td>72</td>
              <td>684</td>
              <td>₹3.6L</td>
              <td className="status-success">Excellent</td>
            </tr>

            <tr>
              <td><strong>Home Store</strong></td>
              <td>35</td>
              <td>428</td>
              <td>₹2.4L</td>
              <td className="status-info">Good</td>
            </tr>

            <tr>
              <td><strong>Gadget Point</strong></td>
              <td>21</td>
              <td>286</td>
              <td>₹1.8L</td>
              <td className="status-warning">Average</td>
            </tr>
          </tbody>
        </table>
      </div>

      <h2>Delivery Performance</h2>

      <div className="dashboard-grid">
        <div className="dashboard-card">
          <h3>On-Time Delivery</h3>
          <div className="card-value">94%</div>
          <div className="card-description">
            Orders delivered on time
          </div>
        </div>

        <div className="dashboard-card">
          <h3>Delayed Deliveries</h3>
          <div className="card-value">68</div>
          <div className="card-description">
            Deliveries delayed
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
          <h3>Cancellation Rate</h3>
          <div className="card-value">7.4%</div>
          <div className="card-description">
            Percentage of cancelled orders
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminReports;