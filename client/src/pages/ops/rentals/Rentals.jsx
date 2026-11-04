import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, ClipboardList, Plus } from 'lucide-react'
import api        from '../../../lib/api'
import PageHeader  from '../../../components/common/PageHeader'
import Badge       from '../../../components/common/Badge'
import Button      from '../../../components/common/Button'
import Spinner     from '../../../components/common/Spinner'
import Pagination  from '../../../components/common/Pagination'

const STATUSES = ['', 'reserved', 'active', 'returned', 'cancelled']
const LIMIT = 10

export default function OpsRentals() {
  const [rentals, setRentals] = useState([])
  const [total, setTotal]     = useState(0)
  const [page, setPage]       = useState(1)
  const [loading, setLoading] = useState(true)
  const [search, setSearch]   = useState('')
  const [status, setStatus]   = useState('')
  const navigate = useNavigate()

  const fetch = async (p = page) => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ page: p, limit: LIMIT })
      if (status) params.append('status', status)
      if (search) params.append('search', search)
      const r = await api.get(`/rentals?${params}`)
      setRentals(r.data.data); setTotal(r.data.total)
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }

  useEffect(() => { setPage(1); fetch(1) }, [status])
  useEffect(() => { const t = setTimeout(() => { setPage(1); fetch(1) }, 300); return () => clearTimeout(t) }, [search])
  useEffect(() => { fetch(page) }, [page])

  return (
    <div className="space-y-6">
      <PageHeader title="Rentals" subtitle={`${total} rentals`}
        actions={<Button onClick={() => navigate('/ops/rentals/new')}><Plus size={16} /> New Rental</Button>} />

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search by rental number, customer or phone…"
            className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100" />
        </div>
        <select value={status} onChange={e => setStatus(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-indigo-500 bg-white min-w-36">
          {STATUSES.map(s => <option key={s} value={s}>{s ? s.charAt(0).toUpperCase() + s.slice(1) : 'All Statuses'}</option>)}
        </select>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16"><Spinner size="lg" /></div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    {['Rental #', 'Customer', 'Start', 'Due', 'Status', 'Amount'].map(h => (
                      <th key={h} className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {rentals.length === 0 ? (
                    <tr><td colSpan={6} className="px-5 py-16 text-center text-gray-400">
                      <ClipboardList size={32} className="mx-auto mb-2 text-gray-300" />No rentals found
                    </td></tr>
                  ) : rentals.map(r => {
                    const isOverdue = r.status === 'active' &&
                      new Date(r.expected_end_date).toDateString() !== new Date().toDateString() &&
                      new Date(r.expected_end_date) < new Date(new Date().toDateString())
                    return (
                      <tr key={r.id} onClick={() => navigate(`/ops/rentals/${r.id}`)}
                        className={`cursor-pointer transition ${isOverdue ? 'bg-red-50 hover:bg-red-100' : 'hover:bg-gray-50'}`}>
                        <td className="px-5 py-3 font-medium text-indigo-600">{r.rental_number}</td>
                        <td className="px-5 py-3">
                          <p className="font-medium text-gray-800">{r.customer_name}</p>
                          <p className="text-xs text-gray-400">{r.customer_phone}</p>
                        </td>
                        <td className="px-5 py-3 text-gray-500 whitespace-nowrap">{new Date(r.start_date).toLocaleDateString('en-IN')}</td>
                        <td className={`px-5 py-3 whitespace-nowrap ${isOverdue ? 'text-red-600 font-semibold' : 'text-gray-500'}`}>
                          {new Date(r.expected_end_date).toLocaleDateString('en-IN')}
                          {isOverdue && <span className="ml-1 text-xs">(Overdue)</span>}
                        </td>
                        <td className="px-5 py-3"><Badge label={r.status} /></td>
                        <td className="px-5 py-3 font-medium text-gray-700">₹{parseFloat(r.total_amount || 0).toLocaleString('en-IN')}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
            <div className="border-t border-gray-100 px-5">
              <Pagination page={page} total={total} limit={LIMIT} onPageChange={setPage} />
            </div>
          </>
        )}
      </div>
    </div>
  )
}
