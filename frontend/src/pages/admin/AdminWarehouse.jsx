function AdminWarehouse() {
  const inventory = [
    {
      id: "WH001",
      product: "Wireless Headphones",
      warehouse: "Hyderabad Warehouse",
      stock: 42,
      reserved: 8,
      available: 34,
      status: "In Stock",
    },
    {
      id: "WH002",
      product: "Smart Watch",
      warehouse: "Bangalore Warehouse",
      stock: 18,
      reserved: 5,
      available: 13,
      status: "In Stock",
    },
    {
      id: "WH003",
      product: "Bluetooth Speaker",
      warehouse: "Hyderabad Warehouse",
      stock: 7,
      reserved: 3,
      available: 4,
      status: "Low Stock",
    },
    {
      id: "WH004",
      product: "Laptop Backpack",
      warehouse: "Chennai Warehouse",
      stock: 0,
      reserved: 0,
      available: 0,
      status: "Out of Stock",
    },
  ];

  return (
    <div className="admin-content">
      <h1>Warehouse & Inventory</h1>
      <p>
        Manage warehouse locations, stock levels, reserved inventory and
        product availability.
      </p>

      <div className="dashboard-grid">
        <div className="dashboard-card">
          <h3>Total Warehouses</h3>
          <div className="card-value">6</div>
          <div className="card-description">Active warehouse locations</div>
        </div>

        <div className="dashboard-card">
          <h3>Total Stock</h3>
          <div className="card-value">12,486</div>
          <div className="card-description">Products currently in stock</div>
        </div>

        <div className="dashboard-card">
          <h3>Low Stock Items</h3>
          <div className="card-value">86</div>
          <div className="card-description">Products need restocking</div>
        </div>

        <div className="dashboard-card">
          <h3>Out of Stock</h3>
          <div className="card-value">72</div>
          <div className="card-description">Products unavailable</div>
        </div>
      </div>

      <h2>Inventory Overview</h2>

      <div className="admin-table-container">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Inventory ID</th>
              <th>Product</th>
              <th>Warehouse</th>
              <th>Total Stock</th>
              <th>Reserved</th>
              <th>Available</th>
              <th>Status</th>
            </tr>
          </thead>

          <tbody>
            {inventory.map((item) => (
              <tr key={item.id}>
                <td>{item.id}</td>

                <td>
                  <strong>{item.product}</strong>
                </td>

                <td>{item.warehouse}</td>

                <td>{item.stock}</td>

                <td>{item.reserved}</td>

                <td>{item.available}</td>

                <td>
                  <span
                    className={
                      item.status === "In Stock"
                        ? "status-success"
                        : item.status === "Low Stock"
                        ? "status-warning"
                        : "status-danger"
                    }
                  >
                    {item.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h2>Warehouse Management</h2>

      <div className="dashboard-grid">
        <div className="dashboard-card">
          <h3>Main Warehouse</h3>
          <div className="card-value">4,286</div>
          <div className="card-description">
            Products stored in main warehouse
          </div>
        </div>

        <div className="dashboard-card">
          <h3>Reserved Stock</h3>
          <div className="card-value">684</div>
          <div className="card-description">
            Stock reserved for customer orders
          </div>
        </div>

        <div className="dashboard-card">
          <h3>Pending Restock</h3>
          <div className="card-value">128</div>
          <div className="card-description">
            Products waiting for restocking
          </div>
        </div>

        <div className="dashboard-card">
          <h3>Warehouse Capacity</h3>
          <div className="card-value">78%</div>
          <div className="card-description">
            Current warehouse utilization
          </div>
        </div>
      </div>

      <h2>Warehouse Locations</h2>

      <div className="admin-table-container">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Warehouse ID</th>
              <th>Location</th>
              <th>Manager</th>
              <th>Products</th>
              <th>Capacity</th>
              <th>Status</th>
            </tr>
          </thead>

          <tbody>
            <tr>
              <td>WH001</td>
              <td>
                <strong>Hyderabad</strong>
              </td>
              <td>Ravi Kumar</td>
              <td>4,286</td>
              <td>82%</td>
              <td>
                <span className="status-success">Active</span>
              </td>
            </tr>

            <tr>
              <td>WH002</td>
              <td>
                <strong>Bangalore</strong>
              </td>
              <td>Arun Sharma</td>
              <td>3,142</td>
              <td>76%</td>
              <td>
                <span className="status-success">Active</span>
              </td>
            </tr>

            <tr>
              <td>WH003</td>
              <td>
                <strong>Chennai</strong>
              </td>
              <td>Priya Reddy</td>
              <td>2,864</td>
              <td>71%</td>
              <td>
                <span className="status-success">Active</span>
              </td>
            </tr>

            <tr>
              <td>WH004</td>
              <td>
                <strong>Vijayawada</strong>
              </td>
              <td>Suresh Kumar</td>
              <td>2,194</td>
              <td>64%</td>
              <td>
                <span className="status-success">Active</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default AdminWarehouse;