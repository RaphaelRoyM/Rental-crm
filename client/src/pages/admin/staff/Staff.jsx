import { useEffect, useState } from 'react'
import { Plus, Pencil, UserX, UserCheck, KeyRound } from 'lucide-react'
import api from '../../../lib/api'
import PageHeader    from '../../../components/common/PageHeader'
import Button        from '../../../components/common/Button'
import Badge         from '../../../components/common/Badge'
import Modal         from '../../../components/common/Modal'
import Spinner       from '../../../components/common/Spinner'
import Pagination    from '../../../components/common/Pagination'
import bcrypt from 'bcryptjs'

const LIMIT = 10

function StaffForm({ initial, onSubmit, onCancel, loading }) {
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'staff', phone: '' })
  useEffect(() => { setForm(initial ? { name: initial.name, email: initial.email, password: '', role: initial.role, phone: initial.phone || '' } : { name: '', email: '', password: '', role: 'staff', phone: '' }) }, [initial])
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))
  return (
    <form onSubmit={e => { e.preventDefault(); onSubmit(form) }} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Full Name <span className="text-red-500">*</span></label>
          <input required value={form.name} onChange={e => set('name', e.target.value)} placeholder="Staff name"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Email <span className="text-red-500">*</span></label>
          <input required type="email" value={form.email} onChange={e => set('email', e.target.value)} placeholder="staff@company.com"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
          <input value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="Phone"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Role <span className="text-red-500">*</span></label>
          <select required value={form.role} onChange={e => set('role', e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-indigo-500 bg-white">
            <option value="staff">Staff</option>
            <option value="admin">Admin</option>
          </select>
        </div>
      </div>
      {!initial && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Password <span className="text-red-500">*</span></label>
          <input required type="password" value={form.password} onChange={e => set('password', e.target.value)} placeholder="Min 6 characters"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100" />
        </div>
      )}
      <div className="flex gap-3 justify-end pt-2 border-t border-gray-100">
        <Button variant="secondary" onClick={onCancel} type="button">Cancel</Button>
        <Button type="submit" disabled={loading}>{loading ? 'Saving…' : initial ? 'Update' : 'Create Account'}</Button>
      </div>
    </form>
  )
}

function ResetPwForm({ onSubmit, onCancel, loading }) {
  const [pw, setPw]  = useState('')
  const [cn, setCn]  = useState('')
  const [err, setErr] = useState('')
  const submit = (e) => {
    e.preventDefault()
    if (pw !== cn) { setErr('Passwords do not match'); return }
    if (pw.length < 6) { setErr('Minimum 6 characters'); return }
    onSubmit(pw)
  }
  return (
    <form onSubmit={submit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
        <input required type="password" value={pw} onChange={e => setPw(e.target.value)} placeholder="New password"
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100" />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password</label>
        <input required type="password" value={cn} onChange={e => setCn(e.target.value)} placeholder="Confirm"
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100" />
      </div>
      {err && <p className="text-sm text-red-600">{err}</p>}
      <div className="flex gap-3 justify-end pt-2 border-t border-gray-100">
        <Button variant="secondary" onClick={onCancel} type="button">Cancel</Button>
        <Button type="submit" disabled={loading}>{loading ? 'Saving…' : 'Reset Password'}</Button>
      </div>
    </form>
  )
}

export default function AdminStaff() {
  const [staff, setStaff]       = useState([])
  const [total, setTotal]       = useState(0)
  const [page, setPage]         = useState(1)
  const [loading, setLoading]   = useState(true)
  const [modal, setModal]       = useState(false)
  const [pwModal, setPwModal]   = useState(false)
  const [editItem, setEditItem] = useState(null)
  const [saving, setSaving]     = useState(false)
  const [error, setError]       = useState('')

  const fetch = async (p = page) => {
    setLoading(true)
    try {
      const r = await api.get(`/users?page=${p}&limit=${LIMIT}`)
      setStaff(r.data.data)
      setTotal(r.data.total)
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }

  useEffect(() => { fetch() }, [])
  useEffect(() => { fetch(page) }, [page])

  const save = async (form) => {
    setSaving(true); setError('')
    try {
      if (editItem) await api.put(`/users/${editItem.id}`, form)
      else          await api.post('/users', form)
      setModal(false); fetch(page)
    } catch (e) { setError(e.response?.data?.message || 'Failed') }
    finally { setSaving(false) }
  }

  const resetPw = async (password) => {
    setSaving(true)
    try { await api.put(`/users/${editItem.id}/password`, { password }); setPwModal(false) }
    catch (e) { alert(e.response?.data?.message || 'Failed') }
    finally { setSaving(false) }
  }

  const toggleActive = async (u) => {
    try { await api.put(`/users/${u.id}`, { is_active: !u.is_active }); fetch(page) }
    catch (e) { alert('Failed') }
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Staff Management" subtitle={`${total} accounts`}
        actions={<Button onClick={() => { setEditItem(null); setModal(true); setError('') }}><Plus size={16} /> Add Staff</Button>} />

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16"><Spinner size="lg" /></div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    {['Name', 'Email', 'Phone', 'Role', 'Status', 'Joined', ''].map(h => (
                      <th key={h} className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {staff.map(u => (
                    <tr key={u.id} className="hover:bg-gray-50 transition">
                      <td className="px-5 py-3 font-medium text-gray-800">{u.name}</td>
                      <td className="px-5 py-3 text-gray-600">{u.email}</td>
                      <td className="px-5 py-3 text-gray-500">{u.phone || '—'}</td>
                      <td className="px-5 py-3"><Badge label={u.role} /></td>
                      <td className="px-5 py-3">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${u.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                          {u.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-gray-400">{new Date(u.created_at).toLocaleDateString()}</td>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-1">
                          <button onClick={() => { setEditItem(u); setModal(true); setError('') }}
                            className="p-1.5 hover:bg-indigo-50 rounded text-gray-400 hover:text-indigo-600 transition"><Pencil size={15} /></button>
                          <button onClick={() => { setEditItem(u); setPwModal(true) }}
                            className="p-1.5 hover:bg-yellow-50 rounded text-gray-400 hover:text-yellow-600 transition"><KeyRound size={15} /></button>
                          <button onClick={() => toggleActive(u)}
                            className={`p-1.5 rounded transition ${u.is_active ? 'hover:bg-red-50 text-gray-400 hover:text-red-500' : 'hover:bg-green-50 text-gray-400 hover:text-green-600'}`}>
                            {u.is_active ? <UserX size={15} /> : <UserCheck size={15} />}
                          </button>
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

      <Modal isOpen={modal} onClose={() => setModal(false)} title={editItem ? 'Edit Staff' : 'Add Staff Account'}>
        {error && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg mb-4">{error}</p>}
        <StaffForm initial={editItem} onSubmit={save} onCancel={() => setModal(false)} loading={saving} />
      </Modal>
      <Modal isOpen={pwModal} onClose={() => setPwModal(false)} title={`Reset Password — ${editItem?.name}`} size="sm">
        <ResetPwForm onSubmit={resetPw} onCancel={() => setPwModal(false)} loading={saving} />
      </Modal>
    </div>
  )
}
