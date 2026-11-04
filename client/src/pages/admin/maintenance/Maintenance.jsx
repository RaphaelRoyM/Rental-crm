import { useEffect, useState } from 'react'
import { Plus, Pencil, Trash2, Wrench, Search } from 'lucide-react'
import api from '../../../lib/api'
import PageHeader    from '../../../components/common/PageHeader'
import Button        from '../../../components/common/Button'
import Badge         from '../../../components/common/Badge'
import Modal         from '../../../components/common/Modal'
import ConfirmDialog from '../../../components/common/ConfirmDialog'
import Spinner       from '../../../components/common/Spinner'
import Pagination    from '../../../components/common/Pagination'

const empty = { asset_id: '', supplier_id: '', type: 'repair', description: '', cost: '', start_date: '', end_date: '', status: 'ongoing' }

function MaintenanceForm({ initial, assets, suppliers, onSubmit, onCancel, loading }) {
  const [form, setForm] = useState(empty)
  useEffect(() => { setForm(initial ? { ...empty, ...initial } : empty) }, [initial])
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  return (
    <form onSubmit={e => { e.preventDefault(); onSubmit(form) }} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Asset <span className="text-red-500">*</span></label>
        <select required value={form.asset_id} onChange={e => set('asset_id', e.target.value)}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-indigo-500 bg-white">
          <option value="">Select asset</option>
          {assets.map(a => <option key={a.id} value={a.id}>{a.tool_name} — {a.asset_id} {a.serial_number ? `(${a.serial_number})` : ''}</option>)}
        </select>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Type <span className="text-red-500">*</span></label>
          <select required value={form.type} onChange={e => set('type', e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-indigo-500 bg-white">
            {['repair', 'service', 'inspection'].map(t => <option key={t} value={t} className="capitalize">{t}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Service Provider</label>
          <select value={form.supplier_id} onChange={e => set('supplier_id', e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-indigo-500 bg-white">
            <option value="">Select supplier</option>
            {suppliers
              .filter(s => s.type === 'service' || s.type === 'both')
              .map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
        <textarea rows={2} value={form.description} onChange={e => set('description', e.target.value)}
          placeholder="What needs to be done"
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 resize-none" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Cost (₹)</label>
          <input type="number" min="0" step="0.01" value={form.cost} onChange={e => set('cost', e.target.value)} placeholder="0.00"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Start Date <span className="text-red-500">*</span></label>
          <input required type="date" value={form.start_date} onChange={e => set('start_date', e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
          <input type="date" value={form.end_date} onChange={e => set('end_date', e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100" />
        </div>
      </div>
      {initial && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
          <select value={form.status} onChange={e => set('status', e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-indigo-500 bg-white">
            <option value="ongoing">Ongoing</option>
            <option value="completed">Completed</option>
          </select>
        </div>
      )}
      <div className="flex gap-3 justify-end pt-2 border-t border-gray-100">
        <Button variant="secondary" onClick={onCancel} type="button">Cancel</Button>
        <Button type="submit" disabled={loading}>{loading ? 'Saving…' : initial ? 'Update' : 'Add Log'}</Button>
      </div>
    </form>
  )
}

export default function AdminMaintenance() {
  const [logs, setLogs]         = useState([])
  const [total, setTotal]       = useState(0)
  const [page, setPage]         = useState(1)
  const [assets, setAssets]     = useState([])
  const [suppliers, setSuppliers] = useState([])
  const [loading, setLoading]   = useState(true)
  const [statusFilter, setStatusFilter] = useState('')
  const [search, setSearch]     = useState('')
  const [modal, setModal]       = useState(false)
  const [editItem, setEditItem] = useState(null)
  const [confirm, setConfirm]   = useState(null)
  const [saving, setSaving]     = useState(false)
  const [error, setError]       = useState('')
  const LIMIT = 10

  const fetchAll = async (p = page) => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ page: p, limit: LIMIT })
      if (statusFilter) params.append('status', statusFilter)
      if (search) params.append('search', search)
      const [l, a, s] = await Promise.all([
        api.get(`/maintenance?${params}`),
        api.get('/assets'),
        api.get('/suppliers'),
      ])
      setLogs(l.data.data); setTotal(l.data.total)
      setAssets(a.data.data || a.data)
      setSuppliers(s.data.data || s.data)
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }
  useEffect(() => { setPage(1); fetchAll(1) }, [statusFilter])
  useEffect(() => { const t = setTimeout(() => { setPage(1); fetchAll(1) }, 350); return () => clearTimeout(t) }, [search])
  useEffect(() => { fetchAll(page) }, [page])

  const save = async (form) => {
    setSaving(true); setError('')
    try {
      if (editItem) await api.put(`/maintenance/${editItem.id}`, form)
      else          await api.post('/maintenance', form)
      setModal(false); fetchAll(page)
    } catch (e) {
      setError(e.response?.data?.message || 'Failed')
    } finally { setSaving(false) }
  }

  const remove = async () => {
    try { await api.delete(`/maintenance/${confirm.id}`); fetchAll(page) }
    catch (e) { alert('Delete failed') }
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Maintenance" subtitle={`${total} logs`}
        actions={<Button onClick={() => { setEditItem(null); setModal(true); setError('') }}><Plus size={16} /> Add Log</Button>} />

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by tool name or asset ID…"
            className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100" />
        </div>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-indigo-500 bg-white min-w-36">
          <option value="">All Statuses</option>
          <option value="ongoing">Ongoing</option>
          <option value="completed">Completed</option>
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
                    {['Asset', 'Type', 'Description', 'Supplier', 'Cost', 'Start', 'Status', ''].map(h => (
                      <th key={h} className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {logs.length === 0 ? (
                    <tr><td colSpan={8} className="px-5 py-16 text-center text-gray-400">
                      <Wrench size={32} className="mx-auto mb-2 text-gray-300" />No maintenance logs
                    </td></tr>
                  ) : logs.map(l => (
                    <tr key={l.id} className="hover:bg-gray-50 transition">
                      <td className="px-5 py-3">
                        <p className="font-medium text-gray-800">{l.tool_name}</p>
                        <p className="text-xs text-gray-400">{l.asset_code} {l.serial_number ? `· ${l.serial_number}` : ''}</p>
                      </td>
                      <td className="px-5 py-3 capitalize text-gray-600">{l.type}</td>
                      <td className="px-5 py-3 text-gray-500 max-w-xs truncate">{l.description || '—'}</td>
                      <td className="px-5 py-3 text-gray-500">{l.supplier_name || '—'}</td>
                      <td className="px-5 py-3 text-gray-600">₹{parseFloat(l.cost).toLocaleString('en-IN')}</td>
                      <td className="px-5 py-3 text-gray-500">{new Date(l.start_date).toLocaleDateString('en-IN')}</td>
                      <td className="px-5 py-3"><Badge label={l.status} /></td>
                      <td className="px-5 py-3">
                        <div className="flex gap-1">
                          <button onClick={() => { setEditItem(l); setModal(true); setError('') }}
                            className="p-1.5 hover:bg-indigo-50 rounded text-gray-400 hover:text-indigo-600 transition"><Pencil size={14} /></button>
                          <button onClick={() => setConfirm(l)}
                            className="p-1.5 hover:bg-red-50 rounded text-gray-400 hover:text-red-500 transition"><Trash2 size={14} /></button>
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

      <Modal isOpen={modal} onClose={() => setModal(false)} title={editItem ? 'Edit Maintenance Log' : 'Add Maintenance Log'} size="lg">
        {error && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg mb-4">{error}</p>}
        <MaintenanceForm initial={editItem} assets={assets} suppliers={suppliers}
          onSubmit={save} onCancel={() => setModal(false)} loading={saving} />
      </Modal>

      <ConfirmDialog isOpen={!!confirm} onClose={() => setConfirm(null)} onConfirm={remove}
        title="Delete Log" message="Delete this maintenance log?" />
    </div>
  )
}
