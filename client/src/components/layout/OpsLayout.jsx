import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import TopBar from './TopBar'
import { LayoutDashboard, Users, ClipboardList, Plus, CreditCard } from 'lucide-react'

const navItems = [
  { section: 'Overview' },
  { to: '/ops',              label: 'Dashboard',   icon: LayoutDashboard, end: true },
  { section: 'Rentals' },
  { to: '/ops/rentals/new', label: 'New Rental',   icon: Plus },
  { to: '/ops/rentals',     label: 'All Rentals',  icon: ClipboardList },
  { section: 'Customers' },
  { to: '/ops/customers',   label: 'Customers',    icon: Users },
  { section: 'Payments' },
  { to: '/ops/payments',    label: 'Payments',     icon: CreditCard },
]

export default function OpsLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      <Sidebar navItems={navItems} isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} title="Front Desk" accent="teal" />
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <TopBar onMenuClick={() => setSidebarOpen(true)} title="Operations Portal" />
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
