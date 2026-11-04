import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import ProtectedRoute from './components/layout/ProtectedRoute'

// Layouts
import AdminLayout from './components/layout/AdminLayout'
import OpsLayout   from './components/layout/OpsLayout'

// Auth
import Login from './pages/auth/Login'

// Admin pages
import AdminDashboard   from './pages/admin/dashboard/Dashboard'
import AdminProducts    from './pages/admin/products/Products'
import AdminCustomers   from './pages/admin/customers/Customers'
import AdminCustomerDetail from './pages/admin/customers/CustomerDetail'
import AdminRentals     from './pages/admin/rentals/Rentals'
import AdminNewRental   from './pages/admin/rentals/NewRental'
import AdminRentalDetail from './pages/admin/rentals/RentalDetail'
import AdminPayments    from './pages/admin/payments/Payments'
import AdminStaff       from './pages/admin/staff/Staff'
import AdminSuppliers   from './pages/admin/suppliers/Suppliers'
import AdminMaintenance from './pages/admin/maintenance/Maintenance'
import AdminReports     from './pages/admin/reports/Reports'

// Ops pages
import OpsDashboard    from './pages/ops/dashboard/Dashboard'
import OpsCustomers    from './pages/ops/customers/Customers'
import OpsRentals      from './pages/ops/rentals/Rentals'
import OpsNewRental    from './pages/ops/rentals/NewRental'
import OpsRentalDetail from './pages/ops/rentals/RentalDetail'
import OpsPayments     from './pages/ops/payments/Payments'

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public */}
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<Navigate to="/login" replace />} />

          {/* Admin Portal — admin role only */}
          <Route path="/admin" element={
            <ProtectedRoute requiredRole="admin">
              <AdminLayout />
            </ProtectedRoute>
          }>
            <Route index              element={<AdminDashboard />} />
            <Route path="products"   element={<AdminProducts />} />
            <Route path="customers"  element={<AdminCustomers />} />
            <Route path="customers/:id" element={<AdminCustomerDetail />} />
            <Route path="rentals"    element={<AdminRentals />} />
            <Route path="rentals/new" element={<AdminNewRental />} />
            <Route path="rentals/:id" element={<AdminRentalDetail />} />
            <Route path="payments"   element={<AdminPayments />} />
            <Route path="staff"      element={<AdminStaff />} />
            <Route path="suppliers"  element={<AdminSuppliers />} />
            <Route path="maintenance" element={<AdminMaintenance />} />
            <Route path="reports"    element={<AdminReports />} />
          </Route>

          {/* Ops Portal — any authenticated user */}
          <Route path="/ops" element={
            <ProtectedRoute>
              <OpsLayout />
            </ProtectedRoute>
          }>
            <Route index               element={<OpsDashboard />} />
            <Route path="customers"    element={<OpsCustomers />} />
            <Route path="rentals"      element={<OpsRentals />} />
            <Route path="rentals/new"  element={<OpsNewRental />} />
            <Route path="rentals/:id"  element={<OpsRentalDetail />} />
            <Route path="payments"     element={<OpsPayments />} />
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}
