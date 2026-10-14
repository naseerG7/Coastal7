import { NavLink } from "react-router-dom";

function AdminSidebar() {
  return (
    <aside className="admin-sidebar">

      <div className="admin-sidebar-title">
        <h2>ShopFlow</h2>
        <p>Admin Panel</p>
      </div>

      <nav>

        <NavLink to="/admin/dashboard">
          Dashboard
        </NavLink>

        <NavLink to="/admin/customers">
          Customers
        </NavLink>

        <NavLink to="/admin/sellers">
          Sellers
        </NavLink>

        <NavLink to="/admin/products">
          Products
        </NavLink>

        <NavLink to="/admin/warehouse">
          Warehouse
        </NavLink>

        <NavLink to="/admin/orders">
          Orders
        </NavLink>

        <NavLink to="/admin/delivery">
          Delivery
        </NavLink>

        <NavLink to="/admin/payments">
          Payments
        </NavLink>

        <NavLink to="/admin/refunds">
          Refunds
        </NavLink>

        <NavLink to="/admin/cancellations">
          Cancellations
        </NavLink>

        <NavLink to="/admin/discounts">
          Discounts
        </NavLink>

        <NavLink to="/admin/support">
          Customer Service
        </NavLink>

        <NavLink to="/admin/reports">
          Reports
        </NavLink>

        <NavLink to="/admin/settings">
          Settings
        </NavLink>

      </nav>

    </aside>
  );
}

export default AdminSidebar;