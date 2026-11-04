import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, Plus, Users } from 'lucide-react'
import api        from '../../../lib/api'
import PageHeader  from '../../../components/common/PageHeader'
import Button      from '../../../components/common/Button'
import Modal       from '../../../components/common/Modal'
import Spinner     from '../../../components/common/Spinner'
import Pagination  from '../../../components/common/Pagination'

const ID_TYPES = ['Passport','Driving License','Aadhaar','Voter ID','National ID','Other']
const LIMIT = 10

function QuickRegisterForm({ onSubmit, onCancel, loading }) {
  const [form, setForm] = useState({ name: '', phone: '', email: '', id_proof_type: '', id_proof_number: '' })
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))
  return (
    <form onSubmit={e => { e.preventDefault(); onSubmit(form) }} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Name <span className="text-red-500">*</span></label>
          <input required value={form.name} onChange={e => set('name', e.target.value)} placeholder="Full name"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Phone <span className="text-red-500">*</span></label>
          <input required value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="+91 9876543210"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
          <input type="email" value={form.email} onChange={e => set('email', e.target.value)} placeholder="Optional"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">ID Proof Type</label>
          <select value={form.id_proof_type} onChange={e => set('id_proof_type', e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-indigo-500 bg-white">
            <option value="">Select</option>
            {ID_TYPES.map(t => <option key={t}>{t}</option>)}
          </select>
        </div>
        <div className="sm:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">ID Number</label>
          <input value={form.id_proof_number} onChange={e => set('id_proof_number', e.target.value)} placeholder="ID number"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100" />
        </div>
      </div>
      <div className="flex gap-3 justify-end pt-2 border-t border-gray-100">
        <Button variant="secondary" onClick={onCancel} type="button">Cancel</Button>
        <Button type="submit" disabled={loading}>{loading ? 'Registering…' : 'Register Customer'}</Button>
      </div>
    </form>
  )
}

export default function OpsCustomers() {
  const [customers, setCustomers] = useState([])
  const [total, setTotal]         = useState(0)
  const [page, setPage]           = useState(1)
  const [loading, setLoading]     = useState(true)
  const [search, setSearch]       = useState('')
  const [modal, setModal]         = useState(false)
  const [saving, setSaving]       = useState(false)
  const [error, setError]         = useState('')
  const navigate = useNavigate()

  const fetch = async (p = page) => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ page: p, limit: LIMIT })
      if (search) params.append('search', search)
      const r = await api.get(`/customers?${params}`)
      setCustomers(r.data.data); setTotal(r.data.total)
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }

  useEffect(() => { fetch() }, [])
  useEffect(() => { const t = setTimeout(() => { setPage(1); fetch(1) }, 300); return () => clearTimeout(t) }, [search])
  useEffect(() => { fetch(page) }, [page])

  const register = async (form) => {
    setSaving(true); setError('')
    try {
      await api.post('/customers', form)
      setModal(false); fetch(page)
    } catch (e) { setError(e.response?.data?.message || 'Failed') }
    finally { setSaving(false) }
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Customers" subtitle={`${total} customers`}
        actions={<Button onClick={() => { setModal(true); setError('') }}><Plus size={16} /> Register New</Button>} />

      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search by name, phone or email…"
          className="w-full pl-9 pr-3 py-2.5 border border-gray-300 rounded-lg text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100" />
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
                    {['Name', 'Phone', 'Email', 'ID Proof', ''].map(h => (
                      <th key={h} className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {customers.length === 0 ? (
                    <tr><td colSpan={5} className="px-5 py-16 text-center text-gray-400">
                      <Users size={32} className="mx-auto mb-2 text-gray-300" />
                      {search ? 'No customers found' : 'No customers yet'}
                    </td></tr>
                  ) : customers.map(c => (
                    <tr key={c.id} className="hover:bg-gray-50 transition">
                      <td className="px-5 py-3 font-medium text-gray-800">{c.name}</td>
                      <td className="px-5 py-3 text-gray-600">{c.phone}</td>
                      <td className="px-5 py-3 text-gray-500">{c.email || '—'}</td>
                      <td className="px-5 py-3 text-gray-500 text-xs">
                        {c.id_proof_type ? `${c.id_proof_type}: ${c.id_proof_number || '—'}` : '—'}
                      </td>
                      <td className="px-5 py-3">
                        <button
                          onClick={() => navigate(`/ops/rentals/new?customer_id=${c.id}&customer_name=${encodeURIComponent(c.name)}&customer_phone=${encodeURIComponent(c.phone)}`)}
                          className="text-xs text-indigo-600 hover:underline font-medium">
                          New Rental
                        </button>
                      </td>
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

      <Modal isOpen={modal} onClose={() => setModal(false)} title="Register New Customer">
        {error && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg mb-4">{error}</p>}
        <QuickRegisterForm onSubmit={register} onCancel={() => setModal(false)} loading={saving} />
      </Modal>
    </div>
  )
}
