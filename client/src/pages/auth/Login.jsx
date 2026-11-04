import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { Eye, EyeOff, Wrench, ArrowRight } from 'lucide-react'

export default function Login() {
  const { login } = useAuth()
  const navigate  = useNavigate()
  const [form, setForm]         = useState({ email: '', password: '' })
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError]       = useState('')
  const [loading, setLoading]   = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const user = await login(form.email, form.password)
      navigate(user.role === 'admin' ? '/admin' : '/ops', { replace: true })
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid username or password')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex">

      {/* ── Left panel — branding ───────────────────────────── */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-gray-950 flex-col justify-between p-12">
        {/* Background grid */}
        <div className="absolute inset-0"
          style={{
            backgroundImage: `linear-gradient(rgba(99,102,241,0.07) 1px, transparent 1px),
                              linear-gradient(90deg, rgba(99,102,241,0.07) 1px, transparent 1px)`,
            backgroundSize: '48px 48px'
          }}
        />
        {/* Glow blobs */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 w-72 h-72 bg-violet-600/15 rounded-full blur-3xl pointer-events-none" />

        {/* Logo */}
        <div className="relative flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/30">
            <Wrench size={20} className="text-white" />
          </div>
          <div>
            <p className="text-white font-bold text-lg leading-tight">Rental CRM</p>
            <p className="text-indigo-400 text-xs">Equipment & Tool Management</p>
          </div>
        </div>

        {/* Headline */}
        <div className="relative space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-indigo-500/10 border border-indigo-500/20 rounded-full">
            <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-pulse" />
            <span className="text-indigo-300 text-xs font-medium">Rental Management System</span>
          </div>
          <h1 className="text-4xl font-bold text-white leading-snug">
            Manage your rental<br />
            <span className="text-indigo-400">fleet with ease.</span>
          </h1>
          <p className="text-gray-400 text-base leading-relaxed max-w-sm">
            Track tools, manage customers, handle rentals from reservation to return — all in one place.
          </p>

          {/* Feature pills */}
          <div className="flex flex-wrap gap-2 pt-2">
            {['Asset Tracking', 'Auto Late Fees', 'Damage Inspection', 'Revenue Reports'].map(f => (
              <span key={f} className="px-3 py-1 bg-white/5 border border-white/10 rounded-full text-xs text-gray-300">
                {f}
              </span>
            ))}
          </div>
        </div>

        {/* Bottom note */}
        <p className="relative text-gray-600 text-xs">
          © 2026 Rental CRM. All rights reserved.
        </p>
      </div>

      {/* ── Right panel — login form ─────────────────────────── */}
      <div className="flex-1 flex items-center justify-center p-6 bg-gray-950 relative overflow-hidden">
        {/* Same background grid as left */}
        <div className="absolute inset-0"
          style={{
            backgroundImage: `linear-gradient(rgba(99,102,241,0.07) 1px, transparent 1px),
                              linear-gradient(90deg, rgba(99,102,241,0.07) 1px, transparent 1px)`,
            backgroundSize: '48px 48px'
          }}
        />
        {/* Glow blobs */}
        <div className="absolute top-1/3 right-1/4 w-80 h-80 bg-indigo-600/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-1/4 left-1/4 w-64 h-64 bg-violet-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative w-full max-w-md">

          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-3 mb-10">
            <div className="w-9 h-9 bg-indigo-600 rounded-xl flex items-center justify-center">
              <Wrench size={18} className="text-white" />
            </div>
            <p className="font-bold text-white text-lg">Rental CRM</p>
          </div>

          {/* Card */}
          <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl shadow-black/40 border border-white/10 p-8">
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900">Welcome back</h2>
              <p className="text-gray-500 text-sm mt-1">Sign in to your workspace</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Email */}
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-gray-700">Email address</label>
                <input
                  type="email" required
                  value={form.email}
                  onChange={e => setForm({ ...form, email: e.target.value })}
                  placeholder="you@company.com"
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 outline-none transition-all
                    focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10"
                />
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-gray-700">Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'} required
                    value={form.password}
                    onChange={e => setForm({ ...form, password: e.target.value })}
                    placeholder="Enter your password"
                    className="w-full px-4 py-3 pr-12 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 outline-none transition-all
                      focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10"
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition">
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {/* Error */}
              {error && (
                <div className="flex items-center gap-2.5 px-4 py-3 bg-red-50 border border-red-100 rounded-xl">
                  <div className="w-1.5 h-1.5 bg-red-500 rounded-full shrink-0" />
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}

              {/* Submit */}
              <button
                type="submit" disabled={loading}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-indigo-600 hover:bg-indigo-700 
                  text-white text-sm font-semibold rounded-xl transition-all duration-200
                  shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40
                  disabled:opacity-60 disabled:cursor-not-allowed disabled:shadow-none
                  active:scale-[0.98]"
              >
                {loading ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Signing in…
                  </>
                ) : (
                  <>Sign in <ArrowRight size={16} /></>
                )}
              </button>
            </form>
          </div>

          {/* Footer */}
          <p className="text-center text-xs text-gray-500 mt-6">
            Contact your administrator for access
          </p>
        </div>
      </div>

    </div>
  )
}
