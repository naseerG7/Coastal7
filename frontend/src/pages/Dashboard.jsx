import { NavLink, Outlet } from 'react-router-dom'

function Dashboard() {
  return (
    <section>
      <h1>Dashboard</h1>
      <div className="dashboard-layout">
        <aside className="sidebar">
          <NavLink to="/dashboard" end>Profile</NavLink>
          <NavLink to="/dashboard/products">Manage Products</NavLink>
        </aside>
        <div className="dashboard-content">
          <Outlet />
        </div>
      </div>
    </section>
  )
}

export default Dashboard