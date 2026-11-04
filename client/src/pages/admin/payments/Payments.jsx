import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, CreditCard } from 'lucide-react'
import api        from '../../../lib/api'
import PageHeader  from '../../../components/common/PageHeader'
import Badge       from '../../../components/common/Badge'
import Spinner     from '../../../components/common/Spinner'
import Pagination  from '../../../components/common/Pagination'

const LIMIT = 10

export default function AdminPayments() {
  const [payments, setPayments] = useState([])
  const [total, setTotal]       = useState(0)
  const [page, setPage]         = useState(1)
  const [loading, setLoading]   = useState(true)
  const [search, setSearch]     = useState('')
  const navigate = useNavigate()

  const fetch = async (p = page) => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ page: p, limit: LIMIT })
      if (search) params.append('search', search)
      const r = await api.get(`/payments?${params}`)
      setPayments(r.data.data)
      setTotal(r.data.total)
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }

  useEffect(() => { fetch() }, [])
  useEffect(() => {
    const t = setTimeout(() => { setPage(1); fetch(1) }, 350)
    return () => clearTimeout(t)
  }, [search])
  useEffect(() => { fetch(page) }, [page])

  const income = payments.filter(p => p.type !== 'deposit_refund').reduce((s, p) => s + parseFloat(p.amount), 0)

  return (
    <div className="space-y-6">
      <PageHeader title="Payments" subtitle={`${total} transactions · ₹${income.toLocaleString('en-IN')} shown`} />

      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search by rental number or staff name…"
          className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100" />
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
                    {['Date', 'Rental #', 'Type', 'Method', 'Amount', 'Received By'].map(h => (
                      <th key={h} className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {payments.length === 0 ? (
                    <tr><td colSpan={6} className="px-5 py-16 text-center text-gray-400">
                      <CreditCard size={32} className="mx-auto mb-2 text-gray-300" />No payments found
                    </td></tr>
                  ) : payments.map(p => (
                    <tr key={p.id} onClick={() => navigate(`/admin/rentals/${p.rental_id}`)}
                      className="hover:bg-gray-50 cursor-pointer transition">
                      <td className="px-5 py-3 text-gray-500 whitespace-nowrap">{new Date(p.paid_at).toLocaleDateString('en-IN')}</td>
                      <td className="px-5 py-3 font-medium text-indigo-600">{p.rental_number}</td>
                      <td className="px-5 py-3"><Badge label={p.type} /></td>
                      <td className="px-5 py-3 text-gray-500 capitalize">{p.method.replace('_', ' ')}</td>
                      <td className={`px-5 py-3 font-semibold ${p.type === 'deposit_refund' ? 'text-red-500' : 'text-green-600'}`}>
                        {p.type === 'deposit_refund' ? '−' : '+'} ₹{parseFloat(p.amount).toLocaleString('en-IN')}
                      </td>
                      <td className="px-5 py-3 text-gray-500">{p.received_by_name}</td>
                    </tr>
                  ))}
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
