import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Truck, RotateCcw, XCircle, Plus, AlertTriangle } from 'lucide-react'
import api from '../../../lib/api'
import Badge   from '../../../components/common/Badge'
import Button  from '../../../components/common/Button'
import Modal   from '../../../components/common/Modal'
import Spinner from '../../../components/common/Spinner'

function ReturnModal({ rental, onClose, onDone }) {
  const [form, setForm]   = useState({ actual_end_date: new Date().toISOString().split('T')[0], damage_fee: '', notes: '' })
  const [itemDamages, setItemDamages] = useState(
    () => (rental.items || []).map(item => ({
      asset_id: item.asset_uuid, asset_code: item.asset_code,
      tool_name: item.tool_name, serial: item.serial_number,
      damaged: false, condition: 'good', description: '',
    }))
  )
  const [saving, setSaving] = useState(false)
  const [error, setError]   = useState('')

  const ret      = new Date(form.actual_end_date)
  const due      = new Date(rental.expected_end_date)
  const daysLate = Math.max(0, Math.ceil((ret - due) / 86400000))
  const anyDamaged = itemDamages.some(i => i.damaged)

  const setDmg = (idx, k, v) => setItemDamages(p => p.map((x, i) => i === idx ? { ...x, [k]: v } : x))

  const submit = async (e) => {
    e.preventDefault(); setSaving(true); setError('')
    try {
      await api.put(`/rentals/${rental.id}/return`, form)
      for (const item of itemDamages) {
        if (item.damaged && item.asset_id) {
          await api.put(`/assets/${item.asset_id}`, { condition: item.condition })
          if (item.description) {
            await api.post('/damage', { rental_id: rental.id, asset_id: item.asset_id, image_url: 'pending-upload', description: item.description })
          }
        }
      }
      onDone()
    } catch (err) { setError(err.response?.data?.message || 'Failed') }
    finally { setSaving(false) }
  }

  return (
    <form onSubmit={submit} className="space-y-5">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Return Date <span className="text-red-500">*</span></label>
        <input type="date" required value={form.actual_end_date}
          onChange={e => setForm(f => ({ ...f, actual_end_date: e.target.value }))}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100" />
      </div>
      {daysLate > 0 && (
        <div className="bg-orange-50 border border-orange-100 rounded-lg p-3 text-sm text-orange-700 flex items-start gap-2">
          <AlertTriangle size={15} className="shrink-0 mt-0.5" />
          <span>{daysLate} day(s) late — late fee auto-calculated at 1.5× daily rate</span>
        </div>
      )}
      <div>
        <p className="text-sm font-semibold text-gray-700 mb-2">Damage Inspection</p>
        {itemDamages.map((item, idx) => (
          <div key={idx} className={`border rounded-xl p-4 mb-2 ${item.damaged ? 'border-red-200 bg-red-50' : 'border-gray-200 bg-gray-50'}`}>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-700">
                <span className="font-mono text-xs text-indigo-600 mr-2">{item.asset_code}</span>{item.tool_name}
              </span>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={item.damaged} onChange={e => setDmg(idx, 'damaged', e.target.checked)} className="w-4 h-4 accent-red-500" />
                <span className="text-sm font-medium text-red-600">Damaged</span>
              </label>
            </div>
            {item.damaged && (
              <div className="mt-3 space-y-2">
                <select value={item.condition} onChange={e => setDmg(idx, 'condition', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm outline-none bg-white">
                  <option value="good">Good (minor scratch)</option>
                  <option value="fair">Fair (visible damage)</option>
                  <option value="poor">Poor (major damage)</option>
                </select>
                <input value={item.description} onChange={e => setDmg(idx, 'description', e.target.value)}
                  placeholder="Describe the damage"
                  className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm outline-none" />
              </div>
            )}
          </div>
        ))}
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Damage Fee (₹){anyDamaged && <span className="text-red-500"> *</span>}</label>
        <input type="number" min="0" step="0.01" value={form.damage_fee}
          onChange={e => setForm(f => ({ ...f, damage_fee: e.target.value }))} placeholder="0.00"
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100" />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
        <textarea rows={2} value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100 resize-none" />
      </div>
      {error && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}
      <div className="flex gap-3 justify-end pt-2 border-t border-gray-100">
        <Button variant="secondary" onClick={onClose} type="button">Cancel</Button>
        <Button type="submit" variant="success" disabled={saving}>{saving ? 'Processing…' : 'Confirm Return'}</Button>
      </div>
    </form>
  )
}

function PaymentModal({ rentalId, depositHeld, onClose, onDone }) {
  const [form, setForm] = useState({ amount: '', type: 'rent', method: 'cash', notes: '' })
  const [saving, setSaving] = useState(false)
  const [error, setError]   = useState('')

  const TYPES = [
    { value: 'rent',              label: 'Rent',             dir: '← from customer' },
    { value: 'late_fee',          label: 'Late Fee',         dir: '← from customer' },
    { value: 'damage_fee',        label: 'Damage Fee',       dir: '← from customer' },
    { value: 'deposit',           label: 'Deposit',          dir: '← from customer' },
    { value: 'deposit_refund',    label: 'Deposit Refund',   dir: '→ to customer' },
    { value: 'deposit_deduction', label: 'Deposit Deduction',dir: '← from deposit' },
  ]

  const submit = async (e) => {
    e.preventDefault(); setError(''); setSaving(true)
    try { await api.post('/payments', { ...form, rental_id: rentalId }); onDone() }
    catch (err) { setError(err.response?.data?.message || 'Failed') }
    finally { setSaving(false) }
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Amount (₹) <span className="text-red-500">*</span></label>
          <input required type="number" min="0.01" step="0.01" value={form.amount}
            onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} placeholder="0.00"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
          <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-teal-500 bg-white">
            {TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
        </div>
      </div>
      <div className={`text-xs px-3 py-2 rounded-lg font-medium ${form.type === 'deposit_refund' ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-700'}`}>
        {TYPES.find(t => t.value === form.type)?.dir}
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Method</label>
        <select value={form.method} onChange={e => setForm(f => ({ ...f, method: e.target.value }))}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-teal-500 bg-white">
          {['cash','card','bank_transfer','online'].map(m => <option key={m} value={m}>{m.replace('_',' ')}</option>)}
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
        <input value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Optional"
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100" />
      </div>
      {error && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}
      <div className="flex gap-3 justify-end pt-2 border-t border-gray-100">
        <Button variant="secondary" onClick={onClose} type="button">Cancel</Button>
        <Button type="submit" disabled={saving}>{saving ? 'Saving…' : 'Record Payment'}</Button>
      </div>
    </form>
  )
}

export default function OpsRentalDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [rental, setRental]         = useState(null)
  const [loading, setLoading]       = useState(true)
  const [returnModal, setReturnModal] = useState(false)
  const [payModal, setPayModal]     = useState(false)

  const fetch = async () => {
    try { const r = await api.get(`/rentals/${id}`); setRental(r.data) }
    catch (e) { console.error(e) }
    finally { setLoading(false) }
  }
  useEffect(() => { fetch() }, [id])

  const dispatch = async () => {
    try { await api.put(`/rentals/${id}/dispatch`); fetch() }
    catch (e) { alert(e.response?.data?.message || 'Failed') }
  }

  const cancel = async () => {
    if (!window.confirm('Cancel this rental?')) return
    try { await api.put(`/rentals/${id}/cancel`); fetch() }
    catch (e) { alert(e.response?.data?.message || 'Failed') }
  }

  if (loading) return <div className="flex items-center justify-center h-64"><Spinner size="lg" /></div>
  if (!rental)  return <div className="p-6 text-gray-400">Rental not found</div>

  const totalPaid       = rental.payments?.filter(p => !['deposit','deposit_refund','deposit_deduction'].includes(p.type)).reduce((s, p) => s + parseFloat(p.amount), 0) || 0
  const depositPaid     = rental.payments?.filter(p => p.type === 'deposit').reduce((s, p) => s + parseFloat(p.amount), 0) || 0
  const depositRefunded = rental.payments?.filter(p => p.type === 'deposit_refund').reduce((s, p) => s + parseFloat(p.amount), 0) || 0
  const depositDeducted = rental.payments?.filter(p => p.type === 'deposit_deduction').reduce((s, p) => s + parseFloat(p.amount), 0) || 0
  const effectivePaid   = totalPaid + depositDeducted
  const balance         = parseFloat(rental.total_amount || 0) - effectivePaid
  const depositBalance  = depositPaid - depositRefunded - depositDeducted

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-100 rounded-lg text-gray-500 transition"><ArrowLeft size={18} /></button>
          <div>
            <div className="flex items-center gap-2"><h1 className="text-2xl font-bold text-gray-800">{rental.rental_number}</h1><Badge label={rental.status} /></div>
            <p className="text-sm text-gray-400">{rental.customer_name} · {rental.customer_phone}</p>
          </div>
        </div>
        <div className="flex gap-2 flex-wrap">
          {rental.status === 'reserved' && (
            <>
              <Button variant="success" onClick={dispatch}><Truck size={15} /> Dispatch</Button>
              <Button variant="danger" onClick={cancel}><XCircle size={15} /> Cancel</Button>
            </>
          )}
          {rental.status === 'active' && (
            <Button variant="warning" onClick={() => setReturnModal(true)}><RotateCcw size={15} /> Process Return</Button>
          )}
          {['active','returned'].includes(rental.status) && (
            <Button variant="secondary" onClick={() => setPayModal(true)}><Plus size={15} /> Add Payment</Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          {/* Rental info */}
          <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
            <h3 className="font-semibold text-gray-700 mb-4">Rental Details</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div><p className="text-gray-400">Start</p><p className="font-medium">{new Date(rental.start_date).toLocaleDateString('en-IN')}</p></div>
              <div><p className="text-gray-400">Expected Return</p><p className="font-medium">{new Date(rental.expected_end_date).toLocaleDateString('en-IN')}</p></div>
              {rental.actual_end_date && <div><p className="text-gray-400">Actual Return</p><p className="font-medium">{new Date(rental.actual_end_date).toLocaleDateString('en-IN')}</p></div>}
              {rental.notes && <div className="col-span-2"><p className="text-gray-400">Notes</p><p>{rental.notes}</p></div>}
            </div>
          </div>

          {/* Items */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100">
              <h3 className="font-semibold text-gray-700">Tools ({rental.items?.length || 0})</h3>
            </div>
            <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>{['Asset', 'Tool', 'Serial', 'Rate', 'Days', 'Subtotal'].map(h => (
                  <th key={h} className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase whitespace-nowrap">{h}</th>
                ))}</tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {rental.items?.map(item => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-5 py-3 font-mono text-xs text-indigo-600 whitespace-nowrap">{item.asset_code}</td>
                    <td className="px-5 py-3"><p className="font-medium text-gray-800">{item.tool_name}</p><p className="text-xs text-gray-400">{item.category}</p></td>
                    <td className="px-5 py-3 text-gray-500 whitespace-nowrap">{item.serial_number || '—'}</td>
                    <td className="px-5 py-3 text-gray-600 whitespace-nowrap">₹{item.daily_rate}</td>
                    <td className="px-5 py-3 text-gray-600">{item.days_rented ?? '—'}</td>
                    <td className="px-5 py-3 font-medium text-gray-700 whitespace-nowrap">₹{parseFloat(item.subtotal || 0).toLocaleString('en-IN')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
          </div>

          {/* Payments */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100">
              <h3 className="font-semibold text-gray-700">Payments ({rental.payments?.length || 0})</h3>
            </div>
            {!rental.payments?.length ? (
              <p className="px-5 py-6 text-gray-400 text-sm">No payments recorded</p>
            ) : (
              <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>{['Date','Type','Method','Amount','By'].map(h => (
                    <th key={h} className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase whitespace-nowrap">{h}</th>
                  ))}</tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {rental.payments.map(p => (
                    <tr key={p.id} className="hover:bg-gray-50">
                      <td className="px-5 py-3 text-gray-500 whitespace-nowrap">{new Date(p.paid_at).toLocaleDateString('en-IN')}</td>
                      <td className="px-5 py-3"><Badge label={p.type} /></td>
                      <td className="px-5 py-3 text-gray-500 capitalize whitespace-nowrap">{p.method.replace('_',' ')}</td>
                      <td className={`px-5 py-3 font-medium whitespace-nowrap ${p.type === 'deposit_refund' ? 'text-red-500' : 'text-green-600'}`}>
                        {p.type === 'deposit_refund' ? '−' : '+'} ₹{parseFloat(p.amount).toLocaleString('en-IN')}
                      </td>
                      <td className="px-5 py-3 text-gray-500 whitespace-nowrap">{p.received_by_name}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              </div>
            )}
          </div>
        </div>

        {/* Summary */}
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-gray-700">Financial Summary</h3>
              {rental.status === 'returned' && (() => {
                if (balance > 0) return <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-700">Underpaid</span>
                if (balance < 0 || depositBalance > 0) return <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-700">Overpaid</span>
                return <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-green-100 text-green-700">✓ Balanced</span>
              })()}
            </div>
            <div className="space-y-2 text-sm">
              <p className="text-xs font-semibold text-gray-400 uppercase">Rental Bill</p>
              <div className="flex justify-between"><span className="text-gray-500">Subtotal</span><span>₹{parseFloat(rental.subtotal||0).toLocaleString('en-IN')}</span></div>
              {parseFloat(rental.late_fee)>0 && <div className="flex justify-between text-orange-600"><span>Late Fee</span><span>₹{parseFloat(rental.late_fee).toLocaleString('en-IN')}</span></div>}
              {parseFloat(rental.damage_fee)>0 && <div className="flex justify-between text-red-600"><span>Damage Fee</span><span>₹{parseFloat(rental.damage_fee).toLocaleString('en-IN')}</span></div>}
              <div className="flex justify-between font-bold text-gray-800 pt-1.5 border-t border-gray-100"><span>Total</span><span>₹{parseFloat(rental.total_amount||0).toLocaleString('en-IN')}</span></div>
              <div className="flex justify-between text-green-600"><span>Collected</span><span>₹{totalPaid.toLocaleString('en-IN')}</span></div>
              {depositDeducted>0 && <div className="flex justify-between text-rose-600"><span>From Deposit</span><span>₹{depositDeducted.toLocaleString('en-IN')}</span></div>}
              <div className={`flex justify-between font-bold pt-1.5 border-t border-gray-100 ${balance>0?'text-red-600':balance<0?'text-orange-600':'text-green-600'}`}>
                <span>Balance</span>
                <span>{balance>0?`₹${balance.toLocaleString('en-IN')} due`:balance<0?`₹${Math.abs(balance).toLocaleString('en-IN')} excess`:'₹0 ✓'}</span>
              </div>
            </div>
            <div className="space-y-2 text-sm pt-3 border-t border-gray-100">
              <p className="text-xs font-semibold text-gray-400 uppercase">Deposit</p>
              <div className="flex justify-between text-gray-600"><span>Collected</span><span className="text-green-600">+₹{depositPaid.toLocaleString('en-IN')}</span></div>
              {depositRefunded>0 && <div className="flex justify-between text-gray-600"><span>Refunded</span><span className="text-red-500">−₹{depositRefunded.toLocaleString('en-IN')}</span></div>}
              {depositDeducted>0 && <div className="flex justify-between text-gray-600"><span>Deducted</span><span className="text-rose-600">−₹{depositDeducted.toLocaleString('en-IN')}</span></div>}
              <div className={`flex justify-between font-semibold pt-1.5 border-t border-gray-100 ${depositBalance>0?'text-amber-600':'text-green-600'}`}>
                <span>{depositBalance>0?'Held':'Settled'}</span><span>₹{depositBalance.toLocaleString('en-IN')}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Modal isOpen={returnModal} onClose={() => setReturnModal(false)} title="Process Return" size="lg">
        <ReturnModal rental={rental} onClose={() => setReturnModal(false)} onDone={() => { setReturnModal(false); fetch() }} />
      </Modal>
      <Modal isOpen={payModal} onClose={() => setPayModal(false)} title="Record Payment" size="sm">
        <PaymentModal rentalId={rental.id} depositHeld={depositBalance} onClose={() => setPayModal(false)} onDone={() => { setPayModal(false); fetch() }} />
      </Modal>
    </div>
  )
}
