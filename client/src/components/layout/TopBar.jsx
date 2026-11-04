import { useState, useRef, useEffect } from 'react'
import { Menu, LogOut, User, ChevronDown, Shield } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

function LogoutConfirmModal({ onConfirm, onCancel }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onCancel} />
      <div className="relative bg-white rounded-xl shadow-xl w-full max-w-sm p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-red-100 rounded-lg">
            <LogOut size={18} className="text-red-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-800">Sign out</h3>
        </div>
        <p className="text-sm text-gray-500 mb-6">
          Are you sure you want to sign out? Any unsaved changes will be lost.
        </p>
        <div className="flex gap-3 justify-end">
          <button onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition">
            Cancel
          </button>
          <button onClick={onConfirm}
            className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition">
            Sign out
          </button>
        </div>
      </div>
    </div>
  )
}

export default function TopBar({ onMenuClick, title }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [open, setOpen]             = useState(false)
  const [showLogoutModal, setShowLogoutModal] = useState(false)
  const dropdownRef = useRef(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleLogoutConfirm = () => {
    logout()
    navigate('/login')
  }

  // Get initials from name
  const initials = user?.name
    ? user.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
    : '??'

  const roleColor = user?.role === 'admin'
    ? 'bg-indigo-600'
    : 'bg-teal-600'

  return (
    <>
      <header className="h-14 bg-white border-b border-gray-200 flex items-center justify-between px-4 shrink-0 sticky top-0 z-10">
        {/* Left — hamburger + title */}
        <div className="flex items-center gap-3">
          <button onClick={onMenuClick}
            className="lg:hidden p-2 rounded-lg hover:bg-gray-100 text-gray-500">
            <Menu size={20} />
          </button>
          <span className="font-semibold text-gray-700 text-sm hidden sm:block">{title}</span>
        </div>

        {/* Right — avatar dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setOpen(o => !o)}
            className="flex items-center gap-2 pl-1.5 pr-3 py-1.5 rounded-full hover:bg-gray-100 transition"
          >
            {/* Avatar circle */}
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0 ${roleColor}`}>
              {initials}
            </div>
            <span className="hidden sm:block text-sm font-medium text-gray-700 max-w-28 truncate">
              {user?.name}
            </span>
            <ChevronDown size={14} className={`text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`} />
          </button>

          {/* Dropdown panel */}
          {open && (
            <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-xl shadow-lg border border-gray-100 z-40 overflow-hidden">
              {/* User info header */}
              <div className="px-4 py-3 border-b border-gray-100">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0 ${roleColor}`}>
                    {initials}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-gray-800 truncate">{user?.name}</p>
                    <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                  </div>
                </div>
                {/* Role badge */}
                <div className="mt-2">
                  <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium
                    ${user?.role === 'admin' ? 'bg-indigo-50 text-indigo-700' : 'bg-teal-50 text-teal-700'}`}>
                    <Shield size={10} />
                    {user?.role === 'admin' ? 'Administrator' : 'Staff'}
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div className="p-1.5">
                <button
                  onClick={() => { setOpen(false); setShowLogoutModal(true) }}
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-red-600 hover:bg-red-50 transition"
                >
                  <LogOut size={15} />
                  Sign out
                </button>
              </div>
            </div>
          )}
        </div>
      </header>

      {showLogoutModal && (
        <LogoutConfirmModal
          onConfirm={handleLogoutConfirm}
          onCancel={() => setShowLogoutModal(false)}
        />
      )}
    </>
  )
}
