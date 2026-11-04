import { useState, useEffect } from 'react'
import Button from '../../../components/common/Button'

const CONDITIONS = ['excellent', 'good', 'fair', 'poor']

const empty = {
  serial_number: '', barcode: '', purchase_date: '', purchase_price: '',
  supplier_id: '', condition: 'good', storage_location: '',
  warranty_expiry: '', last_maintenance_date: '', next_maintenance_date: '', notes: ''
}

export default function AssetForm({ initial, toolType, suppliers, onSubmit, onCancel, loading }) {
  const [form, setForm] = useState(empty)

  useEffect(() => {
    setForm(initial ? { ...empty, ...initial } : empty)
  }, [initial])

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handleSubmit = (e) => {
    e.preventDefault()
    onSubmit({ ...form, tool_type_id: toolType.id })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Tool type info (read only) */}
      <div className="bg-indigo-50 rounded-lg p-3 text-sm">
        <p className="font-medium text-indigo-700">{toolType?.name}</p>
        <p className="text-indigo-500 text-xs">{toolType?.brand} · {toolType?.category} · ₹{toolType?.default_daily_rate}/day</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Serial Number</label>
          <input value={form.serial_number} onChange={e => set('serial_number', e.target.value)}
            placeholder="Manufacturer serial number"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Barcode / QR Code</label>
          <input value={form.barcode} onChange={e => set('barcode', e.target.value)}
            placeholder="Barcode or QR string"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100" />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Purchase Date</label>
          <input type="date" value={form.purchase_date} onChange={e => set('purchase_date', e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Purchase Price (₹)</label>
          <input type="number" min="0" step="0.01" value={form.purchase_price}
            onChange={e => set('purchase_price', e.target.value)} placeholder="0.00"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100" />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Supplier</label>
          <select value={form.supplier_id} onChange={e => set('supplier_id', e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 bg-white">
            <option value="">Select supplier</option>
            {suppliers
              .filter(s => s.type === 'vendor' || s.type === 'both')
              .map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Condition</label>
          <select value={form.condition} onChange={e => set('condition', e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 bg-white">
            {CONDITIONS.map(c => <option key={c} value={c} className="capitalize">{c}</option>)}
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Storage Location</label>
        <input value={form.storage_location} onChange={e => set('storage_location', e.target.value)}
          placeholder="e.g. Warehouse Rack A2"
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Warranty Expiry</label>
          <input type="date" value={form.warranty_expiry} onChange={e => set('warranty_expiry', e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Last Maintenance</label>
          <input type="date" value={form.last_maintenance_date} onChange={e => set('last_maintenance_date', e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Next Maintenance</label>
          <input type="date" value={form.next_maintenance_date} onChange={e => set('next_maintenance_date', e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100" />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
        <textarea rows={2} value={form.notes} onChange={e => set('notes', e.target.value)}
          placeholder="Any specific notes for this unit"
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 resize-none" />
      </div>

      <div className="flex gap-3 justify-end pt-2 border-t border-gray-100">
        <Button variant="secondary" onClick={onCancel} type="button">Cancel</Button>
        <Button type="submit" disabled={loading}>{loading ? 'Saving…' : initial ? 'Update Asset' : 'Add Asset'}</Button>
      </div>
    </form>
  )
}
