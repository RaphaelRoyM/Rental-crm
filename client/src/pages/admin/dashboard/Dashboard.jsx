import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  DollarSign, ClipboardList, AlertTriangle,
  Package, Users, CheckCircle, Calendar
} from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend
} from 'recharts'
import api from '../../../lib/api'
import StatCard   from '../../../components/common/StatCard'
import Badge      from '../../../components/common/Badge'
import Spinner    from '../../../components/common/Spinner'
import PageHeader from '../../../components/common/PageHeader'

// Default: show all time for a good looking chart
const getAllTimeRange = () => ({
  from: '2026-01-01',
  to: new Date().toISOString().split('T')[0]
})

// Current month range
const getCurrentMonthRange = () => {
  const now = new Date()
  const from = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]
  const to   = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0]
  return { from, to }
}

export default function AdminDashboard() {
  const [stats, setStats]     = useState(null)
  const [revenue, setRevenue] = useState([])
  const [rentals, setRentals] = useState([])
  const [overdue, setOverdue] = useState([])
  const [loading, setLoading] = useState(true)
  const [revLoading, setRevLoading] = useState(false)
  const [dateRange, setDateRange]   = useState(getAllTimeRange())
  const navigate = useNavigate()

  // Fetch KPI stats + rentals + overdue once
  useEffect(() => {
    ;(async () => {
      try {
        const [s, ren, ov] = await Promise.all([
          api.get('/reports/dashboard'),
          api.get('/rentals?status=active'),
          api.get('/rentals/overdue'),
        ])
        setStats(s.data)
        setRentals(ren.data.slice(0, 6))
        setOverdue(ov.data.slice(0, 5))
      } catch (e) { console.error(e) }
      finally { setLoading(false) }
    })()
  }, [])

  // Fetch revenue whenever date range changes
  useEffect(() => {
    ;(async () => {
      setRevLoading(true)
      try {
        const r = await api.get(`/reports/revenue?from=${dateRange.from}&to=${dateRange.to}`)
        setRevenue(r.data.map(d => ({
          month:      new Date(d.month).toLocaleString('default', { month: 'short', year: '2-digit' }),
          Rent:       parseFloat(d.rent_revenue      || 0),
          'Late Fee': parseFloat(d.late_fee_revenue  || 0),
          Damage:     parseFloat(d.damage_fee_revenue|| 0),
          total:      parseFloat(d.total_revenue     || 0),
        })))
      } catch (e) { console.error(e) }
      finally { setRevLoading(false) }
    })()
  }, [dateRange])

  const totalRevInRange = revenue.reduce((s, r) => s + r.total, 0)

  if (loading) return <div className="flex items-center justify-center h-64"><Spinner size="lg" /></div>

  return (
    <div className="space-y-6">
      <PageHeader title="Dashboard" subtitle="Overview of your rental business" />

      {/* ── KPI Cards ── */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
        <StatCard
          title="Total Revenue"
          value={`₹${(stats?.total_revenue ?? 0).toLocaleString('en-IN')}`}
          icon={DollarSign} color="green"
          sub="all time"
        />
        <StatCard
          title="Active Rentals"
          value={stats?.active_rentals ?? 0}
          icon={ClipboardList} color="blue"
        />
        <StatCard
          title="Overdue"
          value={stats?.overdue_rentals ?? 0}
          icon={AlertTriangle} color="red"
        />
        <StatCard
          title="Total Assets"
          value={stats?.total_assets ?? 0}
          icon={Package} color="indigo"
        />
        <StatCard
          title="Available"
          value={stats?.available_assets ?? 0}
          icon={CheckCircle} color="green"
        />
        <StatCard
          title="Customers"
          value={stats?.total_customers ?? 0}
          icon={Users} color="purple"
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* ── Revenue Chart ── */}
        <div className="xl:col-span-2 bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
          {/* Header with date filter */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <div>
              <h3 className="font-semibold text-gray-700">Revenue</h3>
              {revenue.length > 0 && (
                <p className="text-xs text-gray-400 mt-0.5">
                  ₹{totalRevInRange.toLocaleString('en-IN')} in selected period
                </p>
              )}
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Calendar size={14} className="text-gray-400" />
              <input
                type="date"
                value={dateRange.from}
                onChange={e => setDateRange(p => ({ ...p, from: e.target.value }))}
                className="border border-gray-200 rounded-lg px-2 py-1 text-xs outline-none focus:border-indigo-400"
              />
              <span className="text-gray-400">to</span>
              <input
                type="date"
                value={dateRange.to}
                onChange={e => setDateRange(p => ({ ...p, to: e.target.value }))}
                className="border border-gray-200 rounded-lg px-2 py-1 text-xs outline-none focus:border-indigo-400"
              />
              <button
                onClick={() => setDateRange(getCurrentMonthRange())}
                className="text-xs text-indigo-600 hover:underline px-1"
              >
                This month
              </button>
              <button
                onClick={() => setDateRange(getAllTimeRange())}
                className="text-xs text-gray-500 hover:underline px-1"
              >
                All time
              </button>
            </div>
          </div>

          {revLoading ? (
            <div className="flex justify-center items-center h-56"><Spinner /></div>
          ) : revenue.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-56 text-gray-400">
              <p className="text-sm">No revenue data for selected period</p>
              <button
                onClick={() => setDateRange(getAllTimeRange())}
                className="text-xs text-indigo-500 hover:underline mt-2"
              >
                View all time
              </button>
            </div>
          ) : (
            <div className="flex">
              {/* ── Fixed Y-axis ── */}
              <div className="shrink-0">
                <BarChart
                  width={58}
                  height={240}
                  data={revenue}
                  margin={{ top: 4, right: 0, left: 0, bottom: 20 }}
                  barSize={0}
                >
                  <YAxis
                    tick={{ fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={v => `₹${(v/1000).toFixed(0)}k`}
                    width={54}
                  />
                  <Bar dataKey="Rent" stackId="a" fill="transparent" />
                </BarChart>
              </div>

              {/* ── Scrollable bars ── */}
              <div className="overflow-x-auto flex-1 chart-scroll">
                <div style={{ minWidth: Math.max(400, revenue.length * 60) }}>
                  <BarChart
                    width={Math.max(400, revenue.length * 60)}
                    height={240}
                    data={revenue}
                    margin={{ top: 4, right: 16, left: 0, bottom: 0 }}
                    barSize={28}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                    <XAxis dataKey="month" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis hide />
                    <Tooltip
                      cursor={{ fill: '#f8fafc' }}
                      formatter={(val, name) => [`₹${val.toLocaleString('en-IN')}`, name]}
                    />
                    <Legend wrapperStyle={{ fontSize: 12, paddingTop: 8 }} />
                    <Bar dataKey="Rent"     stackId="a" fill="#6366f1" />
                    <Bar dataKey="Late Fee" stackId="a" fill="#f59e0b" />
                    <Bar dataKey="Damage"   stackId="a" fill="#ef4444" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ── Overdue Panel ── */}
        <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
          <h3 className="font-semibold text-gray-700 mb-4 flex items-center gap-2">
            <AlertTriangle size={15} className="text-red-500" /> Overdue Rentals
          </h3>
          {overdue.length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-10">No overdue rentals 🎉</p>
          ) : (
            <div className="space-y-2">
              {overdue.map(r => (
                <div key={r.id} onClick={() => navigate(`/admin/rentals/${r.id}`)}
                  className="p-3 bg-red-50 rounded-lg cursor-pointer hover:bg-red-100 transition">
                  <div className="flex justify-between">
                    <p className="text-sm font-medium text-gray-700">{r.customer_name}</p>
                    <span className="text-xs text-red-600 font-bold">{r.days_overdue}d late</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">{r.rental_number} · {r.customer_phone}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Active Rentals Table ── */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex justify-between items-center">
          <h3 className="font-semibold text-gray-700">Active Rentals</h3>
          <button onClick={() => navigate('/admin/rentals')} className="text-sm text-indigo-600 hover:underline">View all</button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                {['Rental #', 'Customer', 'Start', 'Due', 'Status'].map(h => (
                  <th key={h} className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {rentals.length === 0 ? (
                <tr><td colSpan={5} className="px-5 py-10 text-center text-gray-400">No active rentals</td></tr>
              ) : rentals.map(r => {
                const isOverdue = new Date(r.expected_end_date).toDateString() !== new Date().toDateString() && new Date(r.expected_end_date) < new Date(new Date().toDateString())
                return (
                  <tr key={r.id} onClick={() => navigate(`/admin/rentals/${r.id}`)}
                    className={`cursor-pointer transition ${isOverdue ? 'bg-red-50 hover:bg-red-100' : 'hover:bg-gray-50'}`}>
                    <td className="px-5 py-3 font-medium text-indigo-600">{r.rental_number}</td>
                    <td className="px-5 py-3 text-gray-700">{r.customer_name}</td>
                    <td className="px-5 py-3 text-gray-500">{new Date(r.start_date).toLocaleDateString('en-IN')}</td>
                    <td className={`px-5 py-3 ${isOverdue ? 'text-red-600 font-semibold' : 'text-gray-500'}`}>
                      {new Date(r.expected_end_date).toLocaleDateString('en-IN')}
                    </td>
                    <td className="px-5 py-3"><Badge label={r.status} /></td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
