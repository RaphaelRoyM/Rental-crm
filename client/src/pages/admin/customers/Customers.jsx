import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Search, Users, Pencil, Trash2, Eye } from 'lucide-react'
import api from '../../../lib/api'
import PageHeader    from '../../../components/common/PageHeader'
import Button        from '../../../components/common/Button'
import Modal         from '../../../components/common/Modal'
import ConfirmDialog from '../../../components/common/ConfirmDialog'
import Spinner       from '../../../components/common/Spinner'
import Pagination    from '../../../components/common/Pagination'

const ID_TYPES = ['Passport', 'Driving License', 'National ID', 'Voter ID', 'Aadhaar', 'Other']
const empty    = { name: '', email: '', phone: '', address: '', id_proof_type: '', id_proof_number: '', notes: '' }
const LIMIT = 10

function CustomerForm({ initial, onSubmit, onCancel, loading }) {
  const [form, setForm] = useState(empty)
  useEffect(() => { setForm(initial ? { ...empty, ...initial } : empty) }, [initial])
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))
  return (
    <form onSubmit={e => { e.preventDefault(); onSubmit(form) }} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Full Name <span className="text-red-500">*</span></label>
          <input required value={form.name} onChange={e => set('name', e.target.value)} placeholder="John Doe"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Phone <span className="text-red-500">*</span></label>
          <input required value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="+91 9876543210"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100" />
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
        <input type="email" value={form.email} onChange={e => set('email', e.target.value)} placeholder="john@example.com"
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100" />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
        <textarea rows={2} value={form.address} onChange={e => set('address', e.target.value)} placeholder="Full address"
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 resize-none" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">ID Proof Type</label>
          <select value={form.id_proof_type} onChange={e => set('id_proof_type', e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-indigo-500 bg-white">
            <option value="">Select type</option>
            {ID_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">ID Number</label>
          <input value={form.id_proof_number} onChange={e => set('id_proof_number', e.target.value)} placeholder="ID number"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100" />
        </div>
      </div>
      <div className="flex gap-3 justify-end pt-2 border-t border-gray-100">
        <Button variant="secondary" onClick={onCancel} type="button">Cancel</Button>
        <Button type="submit" disabled={loading}>{loading ? 'Saving…' : initial ? 'Update' : 'Add Customer'}</Button>
      </div>
    </form>
  )
}

export default function AdminCustomers() {
  const [customers, setCustomers] = useState([])
  const [total, setTotal]         = useState(0)
  const [page, setPage]           = useState(1)
  const [loading, setLoading]     = useState(true)
  const [search, setSearch]       = useState('')
  const [modal, setModal]         = useState(false)
  const [editItem, setEditItem]   = useState(null)
  const [confirm, setConfirm]     = useState(null)
  const [saving, setSaving]       = useState(false)
  const [error, setError]         = useState('')
  const navigate = useNavigate()

  const fetch = async (p = page) => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ page: p, limit: LIMIT })
      if (search) params.append('search', search)
      const r = await api.get(`/customers?${params}`)
      setCustomers(r.data.data)
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

  const openAdd  = () => { setEditItem(null); setModal(true); setError('') }
  const openEdit = (c) => { setEditItem(c); setModal(true); setError('') }

  const save = async (form) => {
    setSaving(true); setError('')
    try {
      if (editItem) await api.put(`/customers/${editItem.id}`, form)
      else          await api.post('/customers', form)
      setModal(false); fetch(page)
    } catch (e) { setError(e.response?.data?.message || 'Failed') }
    finally { setSaving(false) }
  }

  const remove = async () => {
    try { await api.delete(`/customers/${confirm.id}`); fetch(page) }
    catch (e) { alert(e.response?.data?.message || 'Delete failed') }
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Customers" subtitle={`${total} registered customers`}
        actions={<Button onClick={openAdd}><Plus size={16} /> Add Customer</Button>} />

      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search by name, phone or email…"
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
                    {['Name', 'Phone', 'Email', 'ID Proof', 'Registered', ''].map(h => (
                      <th key={h} className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {customers.length === 0 ? (
                    <tr><td colSpan={6} className="px-5 py-16 text-center text-gray-400">
                      <Users size={32} className="mx-auto mb-2 text-gray-300" />No customers found
                    </td></tr>
                  ) : customers.map(c => (
                    <tr key={c.id} className="hover:bg-gray-50 transition">
                      <td className="px-5 py-3 font-medium text-gray-800">{c.name}</td>
                      <td className="px-5 py-3 text-gray-600">{c.phone}</td>
                      <td className="px-5 py-3 text-gray-500">{c.email || '—'}</td>
                      <td className="px-5 py-3 text-gray-500">
                        {c.id_proof_type ? `${c.id_proof_type}: ${c.id_proof_number || '—'}` : '—'}
                      </td>
                      <td className="px-5 py-3 text-gray-400">{new Date(c.created_at).toLocaleDateString()}</td>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-1">
                          <button onClick={() => navigate(`/admin/customers/${c.id}`)}
                            className="p-1.5 hover:bg-blue-50 rounded text-gray-400 hover:text-blue-600 transition"><Eye size={15} /></button>
                          <button onClick={() => openEdit(c)}
                            className="p-1.5 hover:bg-indigo-50 rounded text-gray-400 hover:text-indigo-600 transition"><Pencil size={15} /></button>
                          <button onClick={() => setConfirm(c)}
                            className="p-1.5 hover:bg-red-50 rounded text-gray-400 hover:text-red-500 transition"><Trash2 size={15} /></button>
                        </div>
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

      <Modal isOpen={modal} onClose={() => setModal(false)} title={editItem ? 'Edit Customer' : 'Add Customer'} size="lg">
        {error && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg mb-4">{error}</p>}
        <CustomerForm initial={editItem} onSubmit={save} onCancel={() => setModal(false)} loading={saving} />
      </Modal>
      <ConfirmDialog isOpen={!!confirm} onClose={() => setConfirm(null)} onConfirm={remove}
        title="Delete Customer" message={`Delete "${confirm?.name}"?`} />
    </div>
  )
}
