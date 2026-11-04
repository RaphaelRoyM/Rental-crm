import { useEffect, useState, useCallback } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, LineChart, Line, ResponsiveContainer
} from 'recharts'
import { AlertTriangle, TrendingUp, Package, Users, Calendar } from 'lucide-react'
import api from '../../../lib/api'
import PageHeader from '../../../components/common/PageHeader'
import Spinner    from '../../../components/common/Spinner'
import Badge      from '../../../components/common/Badge'

const getAllTime = () => ({ from: '2026-01-01', to: new Date().toISOString().split('T')[0] })
const getThisMonth = () => {
  const now = new Date()
  return {
    from: new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0],
    to:   new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0],
  }
}
const getThisYear = () => ({
  from: `${new Date().getFullYear()}-01-01`,
  to:   new Date().toISOString().split('T')[0],
})

export default function AdminReports() {
  const [revenue, setRevenue]           = useState([])
  const [utilization, setUtilization]   = useState([])
  const [overdue, setOverdue]           = useState([])
  const [topCustomers, setTopCustomers] = useState([])
  const [loading, setLoading]           = useState(true)
  const [revLoading, setRevLoading]     = useState(false)
  const [tab, setTab]                   = useState('revenue')
  const [dateRange, setDateRange]       = useState(getAllTime())

  // Fetch non-revenue data once
  useEffect(() => {
    ;(async () => {
      try {
        const [u, o, c] = await Promise.all([
          api.get('/reports/utilization'),
          api.get('/reports/overdue'),
          api.get('/reports/top-customers'),
        ])
        setUtilization(u.data)
        setOverdue(o.data)
        setTopCustomers(c.data)
      } catch (e) { console.error(e) }
      finally { setLoading(false) }
    })()
  }, [])

  // Fetch revenue on date change
  useEffect(() => {
    ;(async () => {
      setRevLoading(true)
      try {
        const r = await api.get(`/reports/revenue?from=${dateRange.from}&to=${dateRange.to}`)
        setRevenue(r.data.map(d => ({
          month:      new Date(d.month).toLocaleString('default', { month: 'short', year: '2-digit' }),
          Rent:       parseFloat(d.rent_revenue       || 0),
          'Late Fee': parseFloat(d.late_fee_revenue   || 0),
          Damage:     parseFloat(d.damage_fee_revenue || 0),
          total:      parseFloat(d.total_revenue      || 0),
        })))
      } catch (e) { console.error(e) }
      finally { setRevLoading(false) }
    })()
  }, [dateRange])

  const totalRev    = revenue.reduce((s, r) => s + r.total, 0)
  const totalRent   = revenue.reduce((s, r) => s + r.Rent, 0)
  const totalLate   = revenue.reduce((s, r) => s + r['Late Fee'], 0)
  const totalDamage = revenue.reduce((s, r) => s + r.Damage, 0)

  const tabs = [
    { id: 'revenue',     label: 'Revenue',       icon: TrendingUp },
    { id: 'utilization', label: 'Utilization',   icon: Package },
    { id: 'overdue',     label: 'Overdue',        icon: AlertTriangle },
    { id: 'customers',   label: 'Top Customers',  icon: Users },
  ]

  if (loading) return <div className="flex items-center justify-center h-64"><Spinner size="lg" /></div>

  return (
    <div className="space-y-6">
      <PageHeader title="Reports & Analytics" subtitle="Business performance overview" />

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit flex-wrap">
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition
              ${tab === t.id ? 'bg-white text-indigo-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
            <t.icon size={15} />{t.label}
          </button>
        ))}
      </div>

      {/* ── REVENUE TAB ─────────────────────────────────────── */}
      {tab === 'revenue' && (
        <div className="space-y-4">
          {/* Summary cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Total Revenue', value: totalRev,    color: 'text-indigo-700 bg-indigo-50' },
              { label: 'Rent',          value: totalRent,   color: 'text-indigo-600 bg-indigo-50' },
              { label: 'Late Fees',     value: totalLate,   color: 'text-amber-600 bg-amber-50'   },
              { label: 'Damage Fees',   value: totalDamage, color: 'text-red-600 bg-red-50'       },
            ].map(c => (
              <div key={c.label} className={`rounded-xl p-4 ${c.color}`}>
                <p className="text-xs font-medium opacity-70">{c.label}</p>
                <p className="text-xl font-bold mt-1">₹{c.value.toLocaleString('en-IN')}</p>
              </div>
            ))}
          </div>

          {/* Chart card */}
          <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm">
            {/* Header + date controls */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div>
                <h3 className="font-semibold text-gray-700">Revenue Breakdown</h3>
                <p className="text-xs text-gray-400 mt-0.5">{revenue.length} month{revenue.length !== 1 ? 's' : ''} of data</p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {/* Quick filters */}
                {[
                  { label: 'This Month', fn: getThisMonth },
                  { label: 'This Year',  fn: getThisYear  },
                  { label: 'All Time',   fn: getAllTime    },
                ].map(q => (
                  <button key={q.label} onClick={() => setDateRange(q.fn())}
                    className="px-3 py-1.5 text-xs rounded-lg border border-gray-200 text-gray-600 hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-200 transition">
                    {q.label}
                  </button>
                ))}
                {/* Custom range */}
                <div className="flex items-center gap-1.5 text-xs">
                  <Calendar size={13} className="text-gray-400" />
                  <input type="date" value={dateRange.from}
                    onChange={e => setDateRange(p => ({ ...p, from: e.target.value }))}
                    className="border border-gray-200 rounded-lg px-2 py-1.5 text-xs outline-none focus:border-indigo-400" />
                  <span className="text-gray-400">–</span>
                  <input type="date" value={dateRange.to}
                    onChange={e => setDateRange(p => ({ ...p, to: e.target.value }))}
                    className="border border-gray-200 rounded-lg px-2 py-1.5 text-xs outline-none focus:border-indigo-400" />
                </div>
              </div>
            </div>

            {revLoading ? (
              <div className="flex items-center justify-center h-72"><Spinner /></div>
            ) : revenue.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-72 text-gray-400">
                <TrendingUp size={40} className="mb-3 text-gray-300" />
                <p className="text-sm">No revenue data for selected period</p>
                <button onClick={() => setDateRange(getAllTime())}
                  className="text-xs text-indigo-500 hover:underline mt-2">View all time</button>
              </div>
            ) : (
              <div className="flex">
                {/* Fixed Y-axis */}
                <div className="shrink-0">
                  <BarChart width={62} height={300} data={revenue}
                    margin={{ top: 4, right: 0, left: 0, bottom: 20 }} barSize={0}>
                    <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} width={58}
                      tickFormatter={v => `₹${(v/1000).toFixed(0)}k`} />
                    <Bar dataKey="Rent" stackId="a" fill="transparent" />
                  </BarChart>
                </div>

                {/* Scrollable bars */}
                <div className="flex-1 overflow-x-auto chart-scroll">
                  <div style={{ minWidth: Math.max(420, revenue.length * 68) }}>
                    <BarChart
                      width={Math.max(420, revenue.length * 68)}
                      height={300}
                      data={revenue}
                      margin={{ top: 4, right: 20, left: 0, bottom: 0 }}
                      barSize={32}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                      <XAxis dataKey="month" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                      <YAxis hide />
                      <Tooltip
                        cursor={{ fill: '#f8fafc' }}
                        formatter={(val, name) => [`₹${val.toLocaleString('en-IN')}`, name]}
                        contentStyle={{ borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 12 }}
                      />
                      <Legend
                        wrapperStyle={{ fontSize: 12, paddingTop: 12 }}
                        formatter={(value) => <span style={{ color: '#6b7280' }}>{value}</span>}
                      />
                      <Bar dataKey="Rent"      stackId="a" fill="#6366f1" />
                      <Bar dataKey="Late Fee"  stackId="a" fill="#f59e0b" />
                      <Bar dataKey="Damage"    stackId="a" fill="#ef4444" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── UTILIZATION TAB ─────────────────────────────────── */}
      {tab === 'utilization' && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100">
            <h3 className="font-semibold text-gray-700">Product Utilization</h3>
            <p className="text-xs text-gray-400 mt-0.5">Rental frequency and revenue per asset</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  {['Tool', 'Asset ID', 'Category', 'Status', 'Rentals', 'Days Rented', 'Revenue'].map(h => (
                    <th key={h} className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {utilization.length === 0 ? (
                  <tr><td colSpan={7} className="px-5 py-8 text-center text-gray-400">No data</td></tr>
                ) : utilization.map((u, i) => (
                  <tr key={i} className="hover:bg-gray-50">
                    <td className="px-5 py-3 font-medium text-gray-800">{u.tool_name}</td>
                    <td className="px-5 py-3 font-mono text-xs text-indigo-600">{u.asset_id}</td>
                    <td className="px-5 py-3 text-gray-500">{u.category}</td>
                    <td className="px-5 py-3"><Badge label={u.status} /></td>
                    <td className="px-5 py-3 text-center font-semibold text-gray-700">{u.total_rentals}</td>
                    <td className="px-5 py-3 text-center text-gray-600">{u.total_days_rented}</td>
                    <td className="px-5 py-3 font-semibold text-green-600">
                      ₹{parseFloat(u.total_revenue).toLocaleString('en-IN')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── OVERDUE TAB ─────────────────────────────────────── */}
      {tab === 'overdue' && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 bg-red-50">
            <h3 className="font-semibold text-red-700 flex items-center gap-2">
              <AlertTriangle size={16} /> Overdue Rentals ({overdue.length})
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  {['Rental #', 'Customer', 'Phone', 'Due Date', 'Days Overdue', 'Amount Due'].map(h => (
                    <th key={h} className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {overdue.length === 0 ? (
                  <tr><td colSpan={6} className="px-5 py-8 text-center text-green-500">No overdue rentals 🎉</td></tr>
                ) : overdue.map(r => (
                  <tr key={r.id} className="hover:bg-red-50 transition">
                    <td className="px-5 py-3 font-medium text-indigo-600">{r.rental_number}</td>
                    <td className="px-5 py-3 text-gray-800">{r.customer_name}</td>
                    <td className="px-5 py-3 text-gray-500">{r.customer_phone}</td>
                    <td className="px-5 py-3 text-gray-500">{new Date(r.expected_end_date).toLocaleDateString('en-IN')}</td>
                    <td className="px-5 py-3 font-bold text-red-600">{r.days_overdue} days</td>
                    <td className="px-5 py-3 font-bold text-red-600">₹{parseFloat(r.amount_due || 0).toLocaleString('en-IN')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── TOP CUSTOMERS TAB ───────────────────────────────── */}
      {tab === 'customers' && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100">
            <h3 className="font-semibold text-gray-700">Top 10 Customers by Spend</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  {['#', 'Customer', 'Phone', 'Email', 'Rentals', 'Total Spent'].map(h => (
                    <th key={h} className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {topCustomers.map((c, i) => (
                  <tr key={c.id} className="hover:bg-gray-50">
                    <td className="px-5 py-3">
                      <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold
                        ${i === 0 ? 'bg-yellow-100 text-yellow-700' : i === 1 ? 'bg-gray-100 text-gray-600' : i === 2 ? 'bg-orange-100 text-orange-600' : 'text-gray-400'}`}>
                        {i + 1}
                      </span>
                    </td>
                    <td className="px-5 py-3 font-medium text-gray-800">{c.name}</td>
                    <td className="px-5 py-3 text-gray-500">{c.phone}</td>
                    <td className="px-5 py-3 text-gray-500">{c.email || '—'}</td>
                    <td className="px-5 py-3 text-center text-gray-600 font-medium">{c.total_rentals}</td>
                    <td className="px-5 py-3 font-bold text-green-600">₹{parseFloat(c.total_spent).toLocaleString('en-IN')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
