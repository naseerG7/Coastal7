function AdminSettings() {
  return (
    <div className="admin-layout">
      <main className="admin-content">

        <h1>Admin Settings</h1>

        <p>
          Manage ShopFlow administration settings and system preferences.
        </p>

        {/* Store Settings */}
        <h2>Store Settings</h2>

        <div className="admin-table-container">
          <table className="admin-table">
            <tbody>
              <tr>
                <td><strong>Store Name</strong></td>
                <td>ShopFlow</td>
              </tr>

              <tr>
                <td><strong>Currency</strong></td>
                <td>Indian Rupee (₹)</td>
              </tr>

              <tr>
                <td><strong>Store Status</strong></td>
                <td className="status-success">Active</td>
              </tr>

              <tr>
                <td><strong>Default Language</strong></td>
                <td>English</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Order Settings */}
        <h2>Order Settings</h2>

        <div className="admin-table-container">
          <table className="admin-table">
            <tbody>
              <tr>
                <td><strong>Allow Order Cancellation</strong></td>
                <td className="status-success">Enabled</td>
              </tr>

              <tr>
                <td><strong>Allow Refund Requests</strong></td>
                <td className="status-success">Enabled</td>
              </tr>

              <tr>
                <td><strong>Automatic Order Confirmation</strong></td>
                <td className="status-success">Enabled</td>
              </tr>

              <tr>
                <td><strong>Order Processing Time</strong></td>
                <td>1–2 Business Days</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Payment Settings */}
        <h2>Payment Settings</h2>

        <div className="admin-table-container">
          <table className="admin-table">
            <tbody>
              <tr>
                <td><strong>Online Payments</strong></td>
                <td className="status-success">Enabled</td>
              </tr>

              <tr>
                <td><strong>Cash on Delivery</strong></td>
                <td className="status-success">Enabled</td>
              </tr>

              <tr>
                <td><strong>Refund Processing</strong></td>
                <td>Manual Review</td>
              </tr>

              <tr>
                <td><strong>Payment Verification</strong></td>
                <td className="status-success">Enabled</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Delivery Settings */}
        <h2>Delivery Settings</h2>

        <div className="admin-table-container">
          <table className="admin-table">
            <tbody>
              <tr>
                <td><strong>Delivery Tracking</strong></td>
                <td className="status-success">Enabled</td>
              </tr>

              <tr>
                <td><strong>Delayed Delivery Alerts</strong></td>
                <td className="status-success">Enabled</td>
              </tr>

              <tr>
                <td><strong>Average Delivery Target</strong></td>
                <td>3–5 Days</td>
              </tr>

              <tr>
                <td><strong>Delivery Notifications</strong></td>
                <td className="status-success">Enabled</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Notification Settings */}
        <h2>Notification Settings</h2>

        <div className="admin-table-container">
          <table className="admin-table">
            <tbody>
              <tr>
                <td><strong>Email Notifications</strong></td>
                <td className="status-success">Enabled</td>
              </tr>

              <tr>
                <td><strong>Order Notifications</strong></td>
                <td className="status-success">Enabled</td>
              </tr>

              <tr>
                <td><strong>Payment Notifications</strong></td>
                <td className="status-success">Enabled</td>
              </tr>

              <tr>
                <td><strong>Customer Service Alerts</strong></td>
                <td className="status-success">Enabled</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Admin Account */}
        <h2>Admin Account</h2>

        <div className="admin-table-container">
          <table className="admin-table">
            <tbody>
              <tr>
                <td><strong>Role</strong></td>
                <td>Administrator</td>
              </tr>

              <tr>
                <td><strong>Access Level</strong></td>
                <td className="status-success">Full Access</td>
              </tr>

              <tr>
                <td><strong>Authentication</strong></td>
                <td className="status-success">JWT Authentication</td>
              </tr>

              <tr>
                <td><strong>Account Status</strong></td>
                <td className="status-success">Active</td>
              </tr>
            </tbody>
          </table>
        </div>

      </main>
    </div>
  );
}

export default AdminSettings;