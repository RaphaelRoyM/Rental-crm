import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, ClipboardList, Plus, Download } from 'lucide-react'
import * as XLSX from 'xlsx'
import api        from '../../../lib/api'
import PageHeader  from '../../../components/common/PageHeader'
import Badge       from '../../../components/common/Badge'
import Spinner     from '../../../components/common/Spinner'
import Button      from '../../../components/common/Button'
import Pagination  from '../../../components/common/Pagination'

const STATUSES = ['', 'reserved', 'active', 'returned', 'cancelled']
const LIMIT = 10

const exportToExcel = async (status, search) => {
  try {
    const params = new URLSearchParams()
    if (status) params.append('status', status)
    if (search) params.append('search', search)
    const r = await api.get(`/rentals/export?${params}`)
    const rows = r.data

    // Format rows for Excel
    const data = rows.map(r => ({
      'Rental #':          r.rental_number,
      'Customer':          r.customer_name,
      'Phone':             r.customer_phone,
      'Email':             r.customer_email || '',
      'Start Date':        r.start_date ? new Date(r.start_date).toLocaleDateString('en-IN') : '',
      'Expected Return':   r.expected_end_date ? new Date(r.expected_end_date).toLocaleDateString('en-IN') : '',
      'Actual Return':     r.actual_end_date ? new Date(r.actual_end_date).toLocaleDateString('en-IN') : '',
      'Status':            r.status,
      'Subtotal (₹)':      parseFloat(r.subtotal || 0),
      'Late Fee (₹)':      parseFloat(r.late_fee || 0),
      'Damage Fee (₹)':    parseFloat(r.damage_fee || 0),
      'Total Amount (₹)':  parseFloat(r.total_amount || 0),
      'Deposit (₹)':       parseFloat(r.deposit_amount || 0),
      'Rent Collected (₹)':parseFloat(r.rent_paid || 0),
      'Balance (₹)':       parseFloat(r.balance || 0),
      'Tally':             r.tally_status || '',
      'Created By':        r.created_by,
      'Created At':        r.created_at ? new Date(r.created_at).toLocaleDateString('en-IN') : '',
      'Notes':             r.notes || '',
    }))

    const ws = XLSX.utils.json_to_sheet(data)

    // Auto column widths
    const colWidths = Object.keys(data[0] || {}).map(key => ({
      wch: Math.max(key.length, ...data.map(row => String(row[key] || '').length)) + 2
    }))
    ws['!cols'] = colWidths

    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Rentals')

    const fileName = `Rentals_${new Date().toISOString().split('T')[0]}.xlsx`
    XLSX.writeFile(wb, fileName)
  } catch (e) {
    console.error('Export failed:', e)
    alert('Export failed. Please try again.')
  }
}

export default function AdminRentals() {
  const [rentals, setRentals] = useState([])
  const [total, setTotal]     = useState(0)
  const [page, setPage]       = useState(1)
  const [loading, setLoading] = useState(true)
  const [exporting, setExporting] = useState(false)
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
      setRentals(r.data.data)
      setTotal(r.data.total)
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }

  useEffect(() => { setPage(1); fetch(1) }, [status])
  useEffect(() => {
    const t = setTimeout(() => { setPage(1); fetch(1) }, 350)
    return () => clearTimeout(t)
  }, [search])
  useEffect(() => { fetch(page) }, [page])

  return (
    <div className="space-y-6">
      <PageHeader title="Rentals" subtitle={`${total} rentals`}
        actions={
          <div className="flex gap-2">
            <Button variant="secondary" onClick={async () => { setExporting(true); await exportToExcel(status, search); setExporting(false) }} disabled={exporting}>
              <Download size={16} />{exporting ? 'Exporting…' : 'Export'}
            </Button>
            <Button onClick={() => navigate('/admin/rentals/new')}><Plus size={16} /> New Rental</Button>
          </div>
        }
      />

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
                    {['Rental #', 'Customer', 'Start', 'Due Date', 'Return', 'Status', 'Amount', 'Tally'].map(h => (
                      <th key={h} className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {rentals.length === 0 ? (
                    <tr><td colSpan={8} className="px-5 py-16 text-center text-gray-400">
                      <ClipboardList size={32} className="mx-auto mb-2 text-gray-300" />No rentals found
                    </td></tr>
                  ) : rentals.map(r => {
                    const isOverdue = r.status === 'active' &&
                      new Date(r.expected_end_date).toDateString() !== new Date().toDateString() &&
                      new Date(r.expected_end_date) < new Date(new Date().toDateString())
                    return (
                      <tr key={r.id} onClick={() => navigate(`/admin/rentals/${r.id}`)}
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
                        <td className="px-5 py-3 text-gray-500 whitespace-nowrap">
                          {r.actual_end_date ? new Date(r.actual_end_date).toLocaleDateString('en-IN') : '—'}
                        </td>
                        <td className="px-5 py-3"><Badge label={r.status} /></td>
                        <td className="px-5 py-3 font-medium text-gray-700">₹{parseFloat(r.total_amount || 0).toLocaleString('en-IN')}</td>
                        <td className="px-5 py-3">
                          {r.tally_status ? <Badge label={r.tally_status} /> : <span className="text-gray-300 text-xs">—</span>}
                        </td>
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
