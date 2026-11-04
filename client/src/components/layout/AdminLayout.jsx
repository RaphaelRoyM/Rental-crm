import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import TopBar from './TopBar'
import {
  LayoutDashboard, Package, Users, ClipboardList,
  UserCog, Truck, Wrench, BarChart3, CreditCard
} from 'lucide-react'

const navItems = [
  { section: 'Overview' },
  { to: '/admin',              label: 'Dashboard',    icon: LayoutDashboard, end: true },
  { section: 'Operations' },
  { to: '/admin/rentals',      label: 'Rentals',      icon: ClipboardList },
  { to: '/admin/customers',    label: 'Customers',    icon: Users },
  { to: '/admin/payments',     label: 'Payments',     icon: CreditCard },
  { section: 'Inventory' },
  { to: '/admin/products',     label: 'Products',     icon: Package },
  { to: '/admin/maintenance',  label: 'Maintenance',  icon: Wrench },
  { section: 'Management' },
  { to: '/admin/staff',        label: 'Staff',        icon: UserCog },
  { to: '/admin/suppliers',    label: 'Suppliers',    icon: Truck },
  { section: 'Analytics' },
  { to: '/admin/reports',      label: 'Reports',      icon: BarChart3 },
]

export default function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      <Sidebar navItems={navItems} isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} title="Admin Portal" accent="indigo" />
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <TopBar onMenuClick={() => setSidebarOpen(true)} title="Admin Portal" />
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
