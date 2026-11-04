// Ops New Rental — reuses the same wizard, just different back navigation
import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Search, Plus, X, ArrowLeft, ArrowRight, Check, User, Calendar, Package, ClipboardList } from 'lucide-react'
import api    from '../../../lib/api'
import Badge  from '../../../components/common/Badge'
import Button from '../../../components/common/Button'
import Spinner from '../../../components/common/Spinner'

function Steps({ current }) {
  const steps = [
    { id: 1, label: 'Customer', icon: User },
    { id: 2, label: 'Dates',    icon: Calendar },
    { id: 3, label: 'Tools',    icon: Package },
    { id: 4, label: 'Confirm',  icon: ClipboardList },
  ]
  return (
    <div className="flex items-center justify-center gap-0 mb-8">
      {steps.map((s, i) => (
        <div key={s.id} className="flex items-center">
          <div className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition
            ${current === s.id ? 'bg-teal-600 text-white' : current > s.id ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-400'}`}>
            {current > s.id ? <Check size={14} /> : <s.icon size={14} />}
            <span className="hidden sm:inline">{s.label}</span>
          </div>
          {i < steps.length - 1 && (
            <div className={`w-8 h-0.5 mx-1 ${current > s.id ? 'bg-green-300' : 'bg-gray-200'}`} />
          )}
        </div>
      ))}
    </div>
  )
}

function StepCustomer({ selected, onSelect, preselected }) {
  const [search, setSearch]       = useState('')
  const [customers, setCustomers] = useState([])
  const [loading, setLoading]     = useState(true)
  const [showForm, setShowForm]   = useState(false)
  const [newCust, setNewCust]     = useState({ name: '', phone: '', email: '', id_proof_type: '', id_proof_number: '' })
  const [saving, setSaving]       = useState(false)

  useEffect(() => {
    const t = setTimeout(async () => {
      setLoading(true)
      try {
        const r = await api.get(`/customers${search ? `?search=${search}` : ''}`)
        setCustomers(r.data.data || r.data)
      } catch (e) { console.error(e) }
      finally { setLoading(false) }
    }, search ? 300 : 0)
    return () => clearTimeout(t)
  }, [search])

  const createAndSelect = async (e) => {
    e.preventDefault(); setSaving(true)
    try { const r = await api.post('/customers', newCust); onSelect(r.data) }
    catch (err) { alert(err.response?.data?.message || 'Failed') }
    finally { setSaving(false) }
  }

  if (selected) return (
    <div className="bg-green-50 border border-green-200 rounded-xl p-5 flex items-center justify-between">
      <div>
        <p className="font-semibold text-green-800">{selected.name}</p>
        <p className="text-sm text-green-600">{selected.phone}{selected.email ? ` · ${selected.email}` : ''}</p>
      </div>
      <button onClick={() => onSelect(null)} className="text-green-400 hover:text-green-600 p-1"><X size={18} /></button>
    </div>
  )

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search customer by name or phone…"
          className="w-full pl-9 pr-3 py-2.5 border border-gray-300 rounded-lg text-sm outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100" />
      </div>
      {loading ? <div className="flex justify-center py-4"><Spinner /></div> : (
        <div className="border border-gray-200 rounded-xl overflow-hidden">
          {customers.length === 0 ? (
            <p className="px-4 py-6 text-center text-sm text-gray-400">{search ? 'No customers found' : 'No customers yet'}</p>
          ) : (
            <div className="divide-y divide-gray-100 max-h-64 overflow-y-auto">
              {customers.map(c => (
                <button key={c.id} onClick={() => onSelect(c)}
                  className="w-full text-left px-4 py-3 hover:bg-teal-50 transition flex items-center justify-between group">
                  <div>
                    <p className="font-medium text-gray-800">{c.name}</p>
                    <p className="text-sm text-gray-500">{c.phone}{c.email ? ` · ${c.email}` : ''}</p>
                  </div>
                  <span className="text-xs text-teal-600 font-medium opacity-0 group-hover:opacity-100 transition">Select →</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
      <div className="border-t border-gray-100 pt-4">
        <button onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 text-sm text-teal-600 hover:underline font-medium">
          <Plus size={15} /> Register new customer
        </button>
        {showForm && (
          <form onSubmit={createAndSelect} className="mt-4 space-y-3 bg-gray-50 p-4 rounded-xl border border-gray-200">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Name <span className="text-red-500">*</span></label>
                <input required value={newCust.name} onChange={e => setNewCust(p => ({ ...p, name: e.target.value }))} placeholder="Full name"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-teal-500" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Phone <span className="text-red-500">*</span></label>
                <input required value={newCust.phone} onChange={e => setNewCust(p => ({ ...p, phone: e.target.value }))} placeholder="Phone"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-teal-500" />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-gray-600 mb-1">Email</label>
                <input type="email" value={newCust.email} onChange={e => setNewCust(p => ({ ...p, email: e.target.value }))} placeholder="Optional"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-teal-500" />
              </div>
            </div>
            <div className="flex gap-2 justify-end">
              <Button size="sm" variant="secondary" type="button" onClick={() => setShowForm(false)}>Cancel</Button>
              <Button size="sm" type="submit" disabled={saving}>{saving ? 'Saving…' : 'Register & Select'}</Button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}

function StepDates({ dates, onChange }) {
  const today = new Date().toISOString().split('T')[0]
  const days = dates.start && dates.end
    ? Math.max(1, Math.ceil((new Date(dates.end) - new Date(dates.start)) / 86400000)) : 0
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Start Date <span className="text-red-500">*</span></label>
          <input type="date" required min={today} value={dates.start}
            onChange={e => onChange({ ...dates, start: e.target.value })}
            className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Expected Return <span className="text-red-500">*</span></label>
          <input type="date" required min={dates.start || today} value={dates.end}
            onChange={e => onChange({ ...dates, end: e.target.value })}
            className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100" />
        </div>
      </div>
      {days > 0 && (
        <div className="bg-teal-50 rounded-xl p-4 text-sm text-teal-700">
          📅 Duration: <strong>{days} day{days > 1 ? 's' : ''}</strong>
        </div>
      )}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Security Deposit (₹)</label>
        <input type="number" min="0" step="0.01" value={dates.deposit}
          onChange={e => onChange({ ...dates, deposit: e.target.value })} placeholder="0.00"
          className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100" />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
        <textarea rows={2} value={dates.notes} onChange={e => onChange({ ...dates, notes: e.target.value })}
          placeholder="Special instructions"
          className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100 resize-none" />
      </div>
    </div>
  )
}

function StepTools({ dates, selectedItems, onToggle }) {
  const [available, setAvailable] = useState([])
  const [loading, setLoading]     = useState(true)
  const [search, setSearch]       = useState('')
  const [catFilter, setCatFilter] = useState('')

  useEffect(() => {
    ;(async () => {
      setLoading(true)
      try {
        const r = await api.get(`/assets/available?start_date=${dates.start}&end_date=${dates.end}`)
        setAvailable(r.data)
      } catch (e) { console.error(e) }
      finally { setLoading(false) }
    })()
  }, [dates.start, dates.end])

  const categories = [...new Set(available.map(a => a.category))].sort()
  const filtered = available.filter(a => {
    const ms = !search || a.tool_name?.toLowerCase().includes(search.toLowerCase()) || a.asset_id?.toLowerCase().includes(search.toLowerCase())
    const mc = !catFilter || a.category === catFilter
    return ms && mc
  })
  const isSelected = (id) => selectedItems.some(i => i.asset_id === id)
  const days = Math.max(1, Math.ceil((new Date(dates.end) - new Date(dates.start)) / 86400000))

  if (loading) return <div className="flex justify-center py-10"><Spinner size="lg" /></div>

  return (
    <div className="space-y-4">
      {selectedItems.length > 0 && (
        <div className="bg-teal-50 border border-teal-100 rounded-xl p-4">
          <p className="text-sm font-semibold text-teal-700 mb-2">Selected ({selectedItems.length})</p>
          <div className="space-y-1.5">
            {selectedItems.map(item => (
              <div key={item.asset_id} className="flex items-center justify-between text-sm">
                <span className="text-teal-700">
                  <span className="font-mono text-xs bg-teal-100 px-1.5 py-0.5 rounded mr-2">{item.asset_code}</span>
                  {item.tool_name}
                </span>
                <div className="flex items-center gap-3">
                  <span className="text-teal-600 font-medium">₹{(item.daily_rate * days).toLocaleString('en-IN')}</span>
                  <button onClick={() => onToggle(item)} className="text-teal-300 hover:text-red-500"><X size={14} /></button>
                </div>
              </div>
            ))}
            <div className="border-t border-teal-200 pt-2 flex justify-between font-semibold text-teal-800 text-sm">
              <span>Est. Total ({days} days)</span>
              <span>₹{selectedItems.reduce((s, i) => s + i.daily_rate * days, 0).toLocaleString('en-IN')}</span>
            </div>
          </div>
        </div>
      )}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search tools…"
            className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:border-teal-500" />
        </div>
        <select value={catFilter} onChange={e => setCatFilter(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white outline-none min-w-36">
          <option value="">All Categories</option>
          {categories.map(c => <option key={c}>{c}</option>)}
        </select>
      </div>
      {filtered.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <Package size={32} className="mx-auto mb-2 text-gray-300" />
          <p>No available tools for selected dates</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-96 overflow-y-auto pr-1">
          {filtered.map(a => {
            const sel = isSelected(a.id)
            return (
              <button key={a.id}
                onClick={() => onToggle({ asset_id: a.id, asset_code: a.asset_id, tool_name: a.tool_name, serial_number: a.serial_number, daily_rate: parseFloat(a.default_daily_rate), category: a.category })}
                className={`text-left p-4 rounded-xl border-2 transition ${sel ? 'border-teal-500 bg-teal-50' : 'border-gray-200 hover:border-teal-300 bg-white hover:bg-gray-50'}`}>
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2"><span className="font-mono text-xs text-gray-400">{a.asset_id}</span><Badge label={a.condition} /></div>
                    <p className="font-semibold text-gray-800 mt-1 truncate">{a.tool_name}</p>
                    {a.brand && <p className="text-xs text-gray-400">{a.brand}</p>}
                    <p className="text-sm font-semibold text-teal-600 mt-1">₹{a.default_daily_rate}/day</p>
                  </div>
                  <div className={`shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition ${sel ? 'bg-teal-600 border-teal-600' : 'border-gray-300'}`}>
                    {sel && <Check size={12} className="text-white" />}
                  </div>
                </div>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

function StepConfirm({ customer, dates, items }) {
  const days = Math.max(1, Math.ceil((new Date(dates.end) - new Date(dates.start)) / 86400000))
  const subtotal = items.reduce((s, i) => s + i.daily_rate * days, 0)
  return (
    <div className="space-y-4">
      <div className="bg-white border border-gray-200 rounded-xl p-4">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Customer</p>
        <p className="font-semibold text-gray-800">{customer.name}</p>
        <p className="text-sm text-gray-500">{customer.phone}</p>
      </div>
      <div className="bg-white border border-gray-200 rounded-xl p-4">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Period</p>
        <div className="flex gap-6 text-sm">
          <div><p className="text-gray-400">Start</p><p className="font-medium">{new Date(dates.start).toLocaleDateString('en-IN')}</p></div>
          <div><p className="text-gray-400">Return</p><p className="font-medium">{new Date(dates.end).toLocaleDateString('en-IN')}</p></div>
          <div><p className="text-gray-400">Duration</p><p className="font-medium">{days} day{days > 1 ? 's' : ''}</p></div>
        </div>
      </div>
      <div className="bg-white border border-gray-200 rounded-xl p-4">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Tools ({items.length})</p>
        <div className="space-y-2">
          {items.map(item => (
            <div key={item.asset_id} className="flex justify-between items-center text-sm py-1.5 border-b border-gray-50 last:border-0">
              <div>
                <span className="font-mono text-xs bg-gray-100 px-1.5 py-0.5 rounded mr-2 text-gray-500">{item.asset_code}</span>
                <span className="font-medium text-gray-800">{item.tool_name}</span>
              </div>
              <div className="text-right">
                <p className="text-gray-500 text-xs">₹{item.daily_rate}/day × {days}d</p>
                <p className="font-semibold text-gray-700">₹{(item.daily_rate * days).toLocaleString('en-IN')}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="bg-teal-50 border border-teal-100 rounded-xl p-4 space-y-2 text-sm">
        <div className="flex justify-between text-gray-600"><span>Est. Subtotal</span><span>₹{subtotal.toLocaleString('en-IN')}</span></div>
        {dates.deposit > 0 && <div className="flex justify-between text-gray-600"><span>Deposit</span><span>₹{parseFloat(dates.deposit).toLocaleString('en-IN')}</span></div>}
        <div className="flex justify-between font-bold text-teal-800 text-base pt-1 border-t border-teal-200">
          <span>Total Est.</span><span>₹{(subtotal + parseFloat(dates.deposit || 0)).toLocaleString('en-IN')}</span>
        </div>
      </div>
    </div>
  )
}

export default function OpsNewRental() {
  const navigate       = useNavigate()
  const [searchParams] = useSearchParams()
  const [step, setStep]         = useState(1)
  const [customer, setCustomer] = useState(null)
  const [dates, setDates]       = useState({ start: '', end: '', deposit: '', notes: '' })
  const [items, setItems]       = useState([])
  const [saving, setSaving]     = useState(false)
  const [error, setError]       = useState('')

  // Pre-select customer if coming from customer page
  useEffect(() => {
    const cid  = searchParams.get('customer_id')
    const name = searchParams.get('customer_name')
    const phone = searchParams.get('customer_phone') || ''
    if (cid && name) setCustomer({ id: cid, name: decodeURIComponent(name), phone })
  }, [])

  const toggleItem = (item) => setItems(prev =>
    prev.some(i => i.asset_id === item.asset_id)
      ? prev.filter(i => i.asset_id !== item.asset_id)
      : [...prev, item]
  )

  const canNext = () => {
    if (step === 1) return !!customer
    if (step === 2) return !!dates.start && !!dates.end && dates.end >= dates.start
    if (step === 3) return items.length > 0
    return true
  }

  const submit = async () => {
    setSaving(true); setError('')
    try {
      const r = await api.post('/rentals', {
        customer_id: customer.id,
        start_date: dates.start,
        expected_end_date: dates.end,
        deposit_amount: parseFloat(dates.deposit) || 0,
        notes: dates.notes || null,
        items: items.map(i => ({ asset_id: i.asset_id, daily_rate: i.daily_rate })),
      })
      navigate(`/ops/rentals/${r.data.id}`)
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to create rental')
      setSaving(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate('/ops/rentals')}
          className="p-2 hover:bg-gray-100 rounded-lg text-gray-500 transition">
          <ArrowLeft size={18} />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-800">New Rental</h1>
          <p className="text-sm text-gray-400">Create a rental agreement</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <Steps current={step} />

        {step === 1 && <div><h2 className="text-lg font-semibold text-gray-700 mb-4">Select Customer</h2><StepCustomer selected={customer} onSelect={setCustomer} /></div>}
        {step === 2 && <div><h2 className="text-lg font-semibold text-gray-700 mb-4">Set Dates</h2><StepDates dates={dates} onChange={setDates} /></div>}
        {step === 3 && <div><h2 className="text-lg font-semibold text-gray-700 mb-4">Select Tools</h2><StepTools dates={dates} selectedItems={items} onToggle={toggleItem} /></div>}
        {step === 4 && <div><h2 className="text-lg font-semibold text-gray-700 mb-4">Confirm</h2><StepConfirm customer={customer} dates={dates} items={items} /></div>}

        {error && <div className="mt-4 bg-red-50 text-red-600 text-sm px-4 py-3 rounded-lg border border-red-100">{error}</div>}

        <div className="flex justify-between mt-6 pt-4 border-t border-gray-100">
          <Button variant="secondary" onClick={() => step > 1 ? setStep(s => s - 1) : navigate('/ops/rentals')}>
            <ArrowLeft size={15} /> {step === 1 ? 'Cancel' : 'Back'}
          </Button>
          {step < 4
            ? <Button onClick={() => setStep(s => s + 1)} disabled={!canNext()}>Next <ArrowRight size={15} /></Button>
            : <Button onClick={submit} disabled={saving} variant="success">{saving ? 'Creating…' : <><Check size={15} /> Create Rental</>}</Button>
          }
        </div>
      </div>
    </div>
  )
}
