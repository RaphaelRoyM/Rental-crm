import { useState, useEffect } from 'react'
import { Plus, X } from 'lucide-react'
import Button from '../../../components/common/Button'
import api    from '../../../lib/api'

const POWER_TYPES = ['electric', 'battery', 'petrol', 'manual', 'other']

const empty = {
  name: '', brand: '', model_number: '', category: '',
  description: '', power_type: '', specifications: '',
  default_daily_rate: '', default_weekly_rate: '', security_deposit: '',
  accessories: '', notes: '', is_active: true
}

export default function ToolTypeForm({ initial, onSubmit, onCancel, loading }) {
  const [form, setForm]           = useState(empty)
  const [categories, setCategories] = useState([])
  const [showAddCat, setShowAddCat] = useState(false)
  const [newCat, setNewCat]       = useState('')
  const [addingCat, setAddingCat] = useState(false)
  const [catError, setCatError]   = useState('')

  useEffect(() => {
    setForm(initial ? { ...empty, ...initial } : empty)
  }, [initial])

  useEffect(() => {
    api.get('/categories')
      .then(r => setCategories(r.data))
      .catch(console.error)
  }, [])

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const addCategory = async () => {
    if (!newCat.trim()) return
    setAddingCat(true); setCatError('')
    try {
      const r = await api.post('/categories', { name: newCat.trim() })
      setCategories(prev => [...prev, r.data].sort((a, b) => a.name.localeCompare(b.name)))
      set('category', r.data.name)
      setNewCat('')
      setShowAddCat(false)
    } catch (e) {
      setCatError(e.response?.data?.message || 'Failed to add category')
    } finally {
      setAddingCat(false)
    }
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    onSubmit(form)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Row 1 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Tool Name <span className="text-red-500">*</span></label>
          <input required value={form.name} onChange={e => set('name', e.target.value)}
            placeholder="e.g. Angle Grinder"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Brand</label>
          <input value={form.brand} onChange={e => set('brand', e.target.value)}
            placeholder="e.g. Bosch"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100" />
        </div>
      </div>

      {/* Row 2 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Model Number</label>
          <input value={form.model_number} onChange={e => set('model_number', e.target.value)}
            placeholder="e.g. GWS 750-100"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100" />
        </div>

        {/* Dynamic Category */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-sm font-medium text-gray-700">Category <span className="text-red-500">*</span></label>
            <button type="button" onClick={() => { setShowAddCat(!showAddCat); setCatError('') }}
              className="text-xs text-indigo-600 hover:underline flex items-center gap-1">
              {showAddCat ? <><X size={12} /> Cancel</> : <><Plus size={12} /> Add new</>}
            </button>
          </div>

          {showAddCat ? (
            <div className="space-y-1.5">
              <div className="flex gap-2">
                <input
                  value={newCat}
                  onChange={e => setNewCat(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addCategory())}
                  placeholder="New category name"
                  className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100" />
                <Button size="sm" type="button" onClick={addCategory} disabled={addingCat || !newCat.trim()}>
                  {addingCat ? '…' : 'Add'}
                </Button>
              </div>
              {catError && <p className="text-xs text-red-500">{catError}</p>}
            </div>
          ) : (
            <select required value={form.category} onChange={e => set('category', e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 bg-white">
              <option value="">Select category</option>
              {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
            </select>
          )}
        </div>
      </div>

      {/* Row 3 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Power Type</label>
          <select value={form.power_type} onChange={e => set('power_type', e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 bg-white">
            <option value="">Select power type</option>
            {POWER_TYPES.map(p => <option key={p} value={p} className="capitalize">{p}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Specifications</label>
          <input value={form.specifications} onChange={e => set('specifications', e.target.value)}
            placeholder="e.g. 750W, 11000 RPM"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100" />
        </div>
      </div>

      {/* Rates */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Daily Rate (₹) <span className="text-red-500">*</span></label>
          <input required type="number" min="0" step="0.01" value={form.default_daily_rate}
            onChange={e => set('default_daily_rate', e.target.value)} placeholder="0.00"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Weekly Rate (₹)</label>
          <input type="number" min="0" step="0.01" value={form.default_weekly_rate}
            onChange={e => set('default_weekly_rate', e.target.value)} placeholder="0.00"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Security Deposit (₹)</label>
          <input type="number" min="0" step="0.01" value={form.security_deposit}
            onChange={e => set('security_deposit', e.target.value)} placeholder="0.00"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100" />
        </div>
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
        <textarea rows={2} value={form.description} onChange={e => set('description', e.target.value)}
          placeholder="Tool specifications and details"
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 resize-none" />
      </div>

      {/* Accessories & Notes */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Accessories Included</label>
          <input value={form.accessories} onChange={e => set('accessories', e.target.value)}
            placeholder="e.g. Side handle, spanner"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
          <input value={form.notes} onChange={e => set('notes', e.target.value)}
            placeholder="Additional notes"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100" />
        </div>
      </div>

      {/* Active toggle (edit mode only) */}
      {initial && (
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" checked={form.is_active} onChange={e => set('is_active', e.target.checked)}
            className="w-4 h-4 rounded accent-indigo-600" />
          <span className="text-sm text-gray-700">Active (available for rental bookings)</span>
        </label>
      )}

      <div className="flex gap-3 justify-end pt-2 border-t border-gray-100">
        <Button variant="secondary" onClick={onCancel} type="button">Cancel</Button>
        <Button type="submit" disabled={loading}>{loading ? 'Saving…' : initial ? 'Update Tool' : 'Add Tool'}</Button>
      </div>
    </form>
  )
}
