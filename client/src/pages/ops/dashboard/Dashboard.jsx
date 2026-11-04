import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ClipboardList, AlertTriangle, Users, Plus } from 'lucide-react'
import api from '../../../lib/api'
import StatCard  from '../../../components/common/StatCard'
import Badge     from '../../../components/common/Badge'
import Spinner   from '../../../components/common/Spinner'

export default function OpsDashboard() {
  const [activeRentals, setActiveRentals] = useState([])
  const [overdue, setOverdue]             = useState([])
  const [loading, setLoading]             = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    ;(async () => {
      try {
        const [active, ov] = await Promise.all([
          api.get('/rentals?status=active'),
          api.get('/rentals/overdue'),
        ])
        setActiveRentals(active.data.data || active.data)
        setOverdue(ov.data)
      } catch (e) { console.error(e) }
      finally { setLoading(false) }
    })()
  }, [])

  if (loading) return <div className="flex items-center justify-center h-64"><Spinner size="lg" /></div>

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Front Desk</h1>
        <p className="text-sm text-gray-500 mt-1">Manage daily rental operations</p>
      </div>

      {/* Quick action buttons */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <button onClick={() => navigate('/ops/rentals/new')}
          className="flex items-center gap-3 p-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl transition text-left">
          <Plus size={22} />
          <div>
            <p className="font-semibold">New Rental</p>
            <p className="text-xs text-indigo-200">Create a booking</p>
          </div>
        </button>
        <button onClick={() => navigate('/ops/customers')}
          className="flex items-center gap-3 p-4 bg-white border border-gray-200 hover:bg-gray-50 rounded-xl transition text-left">
          <Users size={22} className="text-indigo-600" />
          <div>
            <p className="font-semibold text-gray-800">Customers</p>
            <p className="text-xs text-gray-500">Search or register</p>
          </div>
        </button>
        <button onClick={() => navigate('/ops/rentals')}
          className="flex items-center gap-3 p-4 bg-white border border-gray-200 hover:bg-gray-50 rounded-xl transition text-left">
          <ClipboardList size={22} className="text-indigo-600" />
          <div>
            <p className="font-semibold text-gray-800">All Rentals</p>
            <p className="text-xs text-gray-500">View & manage</p>
          </div>
        </button>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <StatCard title="Active Rentals" value={activeRentals.length} icon={ClipboardList} color="blue" />
        <StatCard title="Overdue"        value={overdue.length}       icon={AlertTriangle} color="red" />
        <StatCard title="Today's Returns"
          value={activeRentals.filter(r => new Date(r.expected_end_date).toDateString() === new Date().toDateString()).length}
          icon={ClipboardList} color="indigo" sub="due today" />
      </div>

      {/* Overdue alerts */}
      {overdue.length > 0 && (
        <div className="bg-red-50 border border-red-100 rounded-xl p-4">
          <h3 className="font-semibold text-red-700 flex items-center gap-2 mb-3">
            <AlertTriangle size={16} /> {overdue.length} Overdue Rental{overdue.length > 1 ? 's' : ''}
          </h3>
          <div className="space-y-2">
            {overdue.map(r => (
              <div key={r.id} onClick={() => navigate(`/ops/rentals/${r.id}`)}
                className="flex items-center justify-between bg-white rounded-lg px-4 py-2.5 cursor-pointer hover:bg-red-50 transition border border-red-100">
                <div>
                  <p className="text-sm font-medium text-gray-800">{r.customer_name}</p>
                  <p className="text-xs text-gray-500">{r.rental_number} · {r.customer_phone}</p>
                </div>
                <span className="text-xs font-bold text-red-600">{r.days_overdue}d late</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Active rentals */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex justify-between items-center">
          <h3 className="font-semibold text-gray-700">Active Rentals ({activeRentals.length})</h3>
          <button onClick={() => navigate('/ops/rentals')} className="text-sm text-indigo-600 hover:underline">View all</button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                {['Rental #', 'Customer', 'Due Date', 'Status'].map(h => (
                  <th key={h} className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {activeRentals.length === 0 ? (
                <tr><td colSpan={4} className="px-5 py-8 text-center text-gray-400">No active rentals</td></tr>
              ) : activeRentals.map(r => {
                const isOverdue = new Date(r.expected_end_date).toDateString() !== new Date().toDateString() && new Date(r.expected_end_date) < new Date(new Date().toDateString())
                return (
                  <tr key={r.id} onClick={() => navigate(`/ops/rentals/${r.id}`)}
                    className={`cursor-pointer transition ${isOverdue ? 'bg-red-50 hover:bg-red-100' : 'hover:bg-gray-50'}`}>
                    <td className="px-5 py-3 font-medium text-indigo-600">{r.rental_number}</td>
                    <td className="px-5 py-3 text-gray-700">{r.customer_name}</td>
                    <td className={`px-5 py-3 ${isOverdue ? 'text-red-600 font-semibold' : 'text-gray-500'}`}>
                      {new Date(r.expected_end_date).toLocaleDateString('en-IN')}
                      {isOverdue && <span className="ml-1 text-xs">(Overdue)</span>}
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
