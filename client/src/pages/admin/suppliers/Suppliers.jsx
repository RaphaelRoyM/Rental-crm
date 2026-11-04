import { useEffect, useState } from 'react'
import { Plus, Pencil, Trash2, Truck, Search } from 'lucide-react'
import api from '../../../lib/api'
import PageHeader    from '../../../components/common/PageHeader'
import Button        from '../../../components/common/Button'
import Badge         from '../../../components/common/Badge'
import Modal         from '../../../components/common/Modal'
import ConfirmDialog from '../../../components/common/ConfirmDialog'
import Spinner       from '../../../components/common/Spinner'
import Pagination    from '../../../components/common/Pagination'

const LIMIT = 10
const empty = { name: '', contact_person: '', phone: '', email: '', address: '', type: 'vendor', notes: '' }

function SupplierForm({ initial, onSubmit, onCancel, loading }) {
  const [form, setForm] = useState(empty)
  useEffect(() => { setForm(initial ? { ...empty, ...initial } : empty) }, [initial])
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))
  return (
    <form onSubmit={e => { e.preventDefault(); onSubmit(form) }} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Company Name <span className="text-red-500">*</span></label>
          <input required value={form.name} onChange={e => set('name', e.target.value)} placeholder="Company name"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Type <span className="text-red-500">*</span></label>
          <select required value={form.type} onChange={e => set('type', e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-indigo-500 bg-white">
            <option value="vendor">Vendor (sells equipment)</option>
            <option value="service">Service (repairs/maintenance only)</option>
            <option value="both">Both (vendor & service)</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Contact Person</label>
          <input value={form.contact_person} onChange={e => set('contact_person', e.target.value)} placeholder="Contact name"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
          <input value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="Phone number"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100" />
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
        <input type="email" value={form.email} onChange={e => set('email', e.target.value)} placeholder="supplier@company.com"
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100" />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
        <textarea rows={2} value={form.address} onChange={e => set('address', e.target.value)} placeholder="Address"
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 resize-none" />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
        <input value={form.notes} onChange={e => set('notes', e.target.value)} placeholder="Additional notes"
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100" />
      </div>
      <div className="flex gap-3 justify-end pt-2 border-t border-gray-100">
        <Button variant="secondary" onClick={onCancel} type="button">Cancel</Button>
        <Button type="submit" disabled={loading}>{loading ? 'Saving…' : initial ? 'Update' : 'Add Supplier'}</Button>
      </div>
    </form>
  )
}

export default function AdminSuppliers() {
  const [suppliers, setSuppliers] = useState([])
  const [total, setTotal]         = useState(0)
  const [page, setPage]           = useState(1)
  const [search, setSearch]       = useState('')
  const [loading, setLoading]     = useState(true)
  const [modal, setModal]         = useState(false)
  const [editItem, setEditItem]   = useState(null)
  const [confirm, setConfirm]     = useState(null)
  const [saving, setSaving]       = useState(false)
  const [error, setError]         = useState('')

  const fetch = async (p = page) => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ page: p, limit: LIMIT })
      if (search) params.append('search', search)
      const r = await api.get(`/suppliers?${params}`)
      setSuppliers(r.data.data); setTotal(r.data.total)
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }
  useEffect(() => { fetch() }, [])
  useEffect(() => { const t = setTimeout(() => { setPage(1); fetch(1) }, 350); return () => clearTimeout(t) }, [search])
  useEffect(() => { fetch(page) }, [page])

  const save = async (form) => {
    setSaving(true); setError('')
    try {
      if (editItem) await api.put(`/suppliers/${editItem.id}`, form)
      else          await api.post('/suppliers', form)
      setModal(false); fetch(page)
    } catch (e) { setError(e.response?.data?.message || 'Failed') }
    finally { setSaving(false) }
  }

  const remove = async () => {
    try { await api.delete(`/suppliers/${confirm.id}`); fetch(page) }
    catch (e) { alert(e.response?.data?.message || 'Delete failed') }
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Suppliers" subtitle={`${total} suppliers`}
        actions={<Button onClick={() => { setEditItem(null); setModal(true); setError('') }}><Plus size={16} /> Add Supplier</Button>} />

      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name or contact…"
          className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100" />
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16"><Spinner size="lg" /></div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {suppliers.length === 0 ? (
              <div className="col-span-3 text-center py-16 bg-white rounded-xl border border-dashed border-gray-200">
                <Truck size={36} className="mx-auto text-gray-300 mb-2" />
                <p className="text-gray-400">No suppliers found</p>
              </div>
            ) : suppliers.map(s => (
              <div key={s.id} className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-semibold text-gray-800">{s.name}</h3>
                    {s.contact_person && <p className="text-sm text-gray-500">{s.contact_person}</p>}
                  </div>
                  <Badge label={s.type === 'both' ? 'vendor & service' : s.type} />
                </div>
                <div className="space-y-1 text-sm text-gray-500">
                  {s.phone && <p>📞 {s.phone}</p>}
                  {s.email && <p>✉️ {s.email}</p>}
                  {s.address && <p className="truncate">📍 {s.address}</p>}
                </div>
                {s.notes && <p className="mt-3 text-xs text-gray-400 border-t border-gray-100 pt-2">{s.notes}</p>}
                <div className="flex gap-2 mt-4">
                  <Button size="sm" variant="secondary" onClick={() => { setEditItem(s); setModal(true); setError('') }}>
                    <Pencil size={13} /> Edit
                  </Button>
                  <Button size="sm" variant="danger" onClick={() => setConfirm(s)}>
                    <Trash2 size={13} /> Delete
                  </Button>
                </div>
              </div>
            ))}
          </div>
          <Pagination page={page} total={total} limit={LIMIT} onPageChange={setPage} />
        </>
      )}

      <Modal isOpen={modal} onClose={() => setModal(false)} title={editItem ? 'Edit Supplier' : 'Add Supplier'}>
        {error && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg mb-4">{error}</p>}
        <SupplierForm initial={editItem} onSubmit={save} onCancel={() => setModal(false)} loading={saving} />
      </Modal>
      <ConfirmDialog isOpen={!!confirm} onClose={() => setConfirm(null)} onConfirm={remove}
        title="Delete Supplier" message={`Delete "${confirm?.name}"?`} />
    </div>
  )
}
