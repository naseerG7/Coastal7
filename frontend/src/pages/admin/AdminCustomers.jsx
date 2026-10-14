import { useQuery } from "@tanstack/react-query";
import api from "../../services/api";

function AdminCustomers() {
  const {
    data: customers = [],
    isLoading: loading,
    isError,
    error,
  } = useQuery({
    queryKey: ["admin", "customers"],
    queryFn: async () => {
      const response = await api.get("/admin/customers");
      return response.data;
    },
  });

  if (loading) {
    return (
      <>
        <h1>Customers</h1>
        <p>Loading customers...</p>
      </>
    );
  }

  if (isError) {
    console.error("Admin customers error:", error);

    const errorMessage =
      error.response?.data?.detail ||
      "Failed to load customers.";

    return (
      <>
        <h1>Customers</h1>
        <p className="status-danger">{errorMessage}</p>
      </>
    );
  }

  return (
    <>
      <h1>Customers</h1>
      <p>Manage registered customers.</p>

      <div className="admin-table-container">
        <table className="admin-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
            </tr>
          </thead>

          <tbody>
            {customers.length === 0 ? (
              <tr>
                <td colSpan="4">No customers found.</td>
              </tr>
            ) : (
              customers.map((customer) => (
                <tr key={customer.id}>
                  <td>{customer.id}</td>
                  <td>{customer.name}</td>
                  <td>{customer.email}</td>
                  <td>{customer.role}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}

export default AdminCustomers;
