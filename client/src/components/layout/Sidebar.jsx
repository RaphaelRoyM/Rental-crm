import { NavLink } from 'react-router-dom'
import { X } from 'lucide-react'

export default function Sidebar({ navItems, isOpen, onClose, title, accent = 'indigo' }) {
  const activeClass = accent === 'teal'
    ? 'bg-teal-50 text-teal-700 font-semibold'
    : 'bg-indigo-50 text-indigo-700 font-semibold'

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-20 bg-black/40 lg:hidden" onClick={onClose} />
      )}

      <aside className={`
        fixed top-0 left-0 z-30 h-full w-64 bg-white border-r border-gray-200
        flex flex-col transition-transform duration-300
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0 lg:static lg:z-auto
      `}>
        {/* Brand */}
        <div className="flex items-center justify-between px-5 h-14 border-b border-gray-100 shrink-0">
          <div>
            <p className="font-bold text-gray-800 text-sm leading-tight">{title}</p>
            <p className="text-xs text-gray-400">Rental CRM</p>
          </div>
          <button onClick={onClose} className="lg:hidden p-1.5 rounded-lg hover:bg-gray-100">
            <X size={18} className="text-gray-500" />
          </button>
        </div>

        {/* Nav links */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-0.5">
          {navItems.map((item, i) =>
            item.section
              ? (
                <p key={i} className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-3 pt-5 pb-1 first:pt-1">
                  {item.section}
                </p>
              ) : (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  onClick={onClose}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors
                    ${isActive ? activeClass : 'text-gray-600 hover:bg-gray-100 hover:text-gray-800'}`
                  }
                >
                  <item.icon size={17} />
                  {item.label}
                </NavLink>
              )
          )}
        </nav>
      </aside>
    </>
  )
}
