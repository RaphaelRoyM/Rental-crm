import { useEffect, useState } from 'react'
import { Plus, Pencil, Trash2, ChevronDown, ChevronUp, Search, Package } from 'lucide-react'
import api from '../../../lib/api'
import PageHeader     from '../../../components/common/PageHeader'
import Button         from '../../../components/common/Button'
import Badge          from '../../../components/common/Badge'
import Modal          from '../../../components/common/Modal'
import ConfirmDialog  from '../../../components/common/ConfirmDialog'
import Spinner        from '../../../components/common/Spinner'
import ToolTypeForm   from './ToolTypeForm'
import AssetForm      from './AssetForm'
import AssetTable     from './AssetTable'

export default function AdminProducts() {
  const [toolTypes, setToolTypes]   = useState([])
  const [suppliers, setSuppliers]   = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading]       = useState(true)
  const [search, setSearch]         = useState('')
  const [catFilter, setCatFilter]   = useState('')
  const [expanded, setExpanded]     = useState({})        // which tool types are expanded

  // Modals
  const [ttModal, setTtModal]         = useState(false)   // tool type form
  const [editTt, setEditTt]           = useState(null)    // tool type being edited
  const [assetModal, setAssetModal]   = useState(false)   // asset form
  const [editAsset, setEditAsset]     = useState(null)    // asset being edited
  const [activeTt, setActiveTt]       = useState(null)    // which tool type we're adding asset to
  const [confirmTt, setConfirmTt]     = useState(null)    // tool type to delete
  const [confirmAsset, setConfirmAsset] = useState(null)  // asset to delete
  const [saving, setSaving]           = useState(false)
  const [error, setError]             = useState('')

  const fetchAll = async () => {
    try {
      const [tt, sup, cats] = await Promise.all([
        api.get('/tool-types'),
        api.get('/suppliers'),
        api.get('/categories'),
      ])
      setToolTypes(tt.data)
      setSuppliers(sup.data)
      setCategories(cats.data.map(c => c.name))
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchAll() }, [])

  const toggle = (id) => setExpanded(prev => ({ ...prev, [id]: !prev[id] }))

  const filtered = toolTypes.filter(tt => {
    const matchSearch = !search ||
      tt.name.toLowerCase().includes(search.toLowerCase()) ||
      tt.brand?.toLowerCase().includes(search.toLowerCase()) ||
      tt.tool_id?.toLowerCase().includes(search.toLowerCase())
    const matchCat = !catFilter || tt.category === catFilter
    return matchSearch && matchCat
  })

  // ── Tool Type CRUD ───────────────────────────────────────
  const openAddTt = () => { setEditTt(null); setTtModal(true); setError('') }
  const openEditTt = (tt) => { setEditTt(tt); setTtModal(true); setError('') }

  const saveTt = async (form) => {
    setSaving(true); setError('')
    try {
      if (editTt) {
        await api.put(`/tool-types/${editTt.id}`, form)
      } else {
        await api.post('/tool-types', form)
      }
      setTtModal(false)
      await fetchAll()
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  const deleteTt = async () => {
    try {
      await api.delete(`/tool-types/${confirmTt.id}`)
      await fetchAll()
    } catch (e) {
      alert(e.response?.data?.message || 'Delete failed')
    }
  }

  // ── Asset CRUD ───────────────────────────────────────────
  const openAddAsset = (tt) => {
    setActiveTt(tt); setEditAsset(null); setAssetModal(true); setError('')
    setExpanded(prev => ({ ...prev, [tt.id]: true }))
  }
  const openEditAsset = (tt, asset) => {
    setActiveTt(tt); setEditAsset(asset); setAssetModal(true); setError('')
  }

  const saveAsset = async (form) => {
    setSaving(true); setError('')
    try {
      if (editAsset) {
        await api.put(`/assets/${editAsset.id}`, form)
      } else {
        await api.post('/assets', form)
      }
      setAssetModal(false)
      await fetchAll()
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  const deleteAsset = async () => {
    try {
      await api.delete(`/assets/${confirmAsset.id}`)
      await fetchAll()
    } catch (e) {
      alert(e.response?.data?.message || 'Delete failed')
    }
  }

  if (loading) return <div className="flex items-center justify-center h-64"><Spinner size="lg" /></div>

  return (
    <div className="space-y-6">
      <PageHeader
        title="Products & Assets"
        subtitle="Manage tool catalogue and individual units"
        actions={
          <Button onClick={openAddTt}>
            <Plus size={16} /> Add Tool Type
          </Button>
        }
      />

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by name, brand or tool ID…"
            className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
          />
        </div>
        <select
          value={catFilter}
          onChange={e => setCatFilter(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-indigo-500 bg-white min-w-40"
        >
          <option value="">All Categories</option>
          {categories.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      {/* Summary badges */}
      <div className="flex flex-wrap gap-2 text-sm">
        <span className="px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full font-medium">{toolTypes.length} Tool Types</span>
        <span className="px-3 py-1 bg-green-50 text-green-700 rounded-full font-medium">
          {toolTypes.reduce((s, t) => s + parseInt(t.available_count || 0), 0)} Available
        </span>
        <span className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full font-medium">
          {toolTypes.reduce((s, t) => s + parseInt(t.rented_count || 0), 0)} Rented
        </span>
        <span className="px-3 py-1 bg-gray-50 text-gray-600 rounded-full font-medium">
          {toolTypes.reduce((s, t) => s + parseInt(t.total_assets || 0), 0)} Total Units
        </span>
      </div>

      {/* Tool Type cards */}
      {filtered.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-xl border border-dashed border-gray-200">
          <Package size={40} className="mx-auto text-gray-300 mb-3" />
          <p className="text-gray-500 font-medium">No tool types found</p>
          <p className="text-gray-400 text-sm mt-1">Add your first tool type to get started</p>
          <Button className="mt-4" onClick={openAddTt}><Plus size={16} /> Add Tool Type</Button>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(tt => (
            <div key={tt.id} className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
              {/* Tool type header */}
              <div className="flex items-center gap-4 px-5 py-4">
                {/* Image placeholder */}
                <div className="w-12 h-12 rounded-lg bg-indigo-50 flex items-center justify-center shrink-0">
                  {tt.image_url
                    ? <img src={tt.image_url} alt={tt.name} className="w-12 h-12 rounded-lg object-cover" />
                    : <Package size={22} className="text-indigo-400" />
                  }
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono text-xs text-gray-400">{tt.tool_id}</span>
                    <h3 className="font-semibold text-gray-800">{tt.name}</h3>
                    {tt.brand && <span className="text-sm text-gray-500">· {tt.brand}</span>}
                    {tt.model_number && <span className="text-sm text-gray-400">{tt.model_number}</span>}
                    <Badge label={tt.category} />
                    {!tt.is_active && <Badge label="inactive" />}
                  </div>
                  <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
                    <span>₹{tt.default_daily_rate}/day</span>
                    {tt.security_deposit > 0 && <span>Deposit: ₹{tt.security_deposit}</span>}
                    {tt.power_type && <span className="capitalize">{tt.power_type}</span>}
                  </div>
                </div>

                {/* Unit counts */}
                <div className="hidden sm:flex items-center gap-3 text-sm shrink-0">
                  <div className="text-center">
                    <p className="font-bold text-gray-800">{tt.total_assets}</p>
                    <p className="text-xs text-gray-400">Total</p>
                  </div>
                  <div className="text-center">
                    <p className="font-bold text-green-600">{tt.available_count}</p>
                    <p className="text-xs text-gray-400">Available</p>
                  </div>
                  <div className="text-center">
                    <p className="font-bold text-blue-600">{tt.rented_count}</p>
                    <p className="text-xs text-gray-400">Rented</p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 shrink-0">
                  <button onClick={() => openEditTt(tt)}
                    className="p-2 hover:bg-indigo-50 rounded-lg text-gray-400 hover:text-indigo-600 transition" title="Edit">
                    <Pencil size={16} />
                  </button>
                  <button onClick={() => setConfirmTt(tt)}
                    className="p-2 hover:bg-red-50 rounded-lg text-gray-400 hover:text-red-500 transition" title="Delete">
                    <Trash2 size={16} />
                  </button>
                  <button onClick={() => toggle(tt.id)}
                    className="p-2 hover:bg-gray-100 rounded-lg text-gray-400 transition ml-1">
                    {expanded[tt.id] ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </button>
                </div>
              </div>

              {/* Expanded: Asset table */}
              {expanded[tt.id] && (
                <div className="px-5 pb-5 border-t border-gray-100 pt-4">
                  {tt.description && (
                    <p className="text-sm text-gray-500 mb-3">{tt.description}</p>
                  )}
                  <AssetTable
                    assets={tt.assets || []}
                    onAdd={() => openAddAsset(tt)}
                    onEdit={(asset) => openEditAsset(tt, asset)}
                    onDelete={(asset) => setConfirmAsset(asset)}
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Tool Type Form Modal */}
      <Modal
        isOpen={ttModal}
        onClose={() => setTtModal(false)}
        title={editTt ? 'Edit Tool Type' : 'Add New Tool Type'}
        size="lg"
      >
        {error && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg mb-4">{error}</p>}
        <ToolTypeForm
          initial={editTt}
          onSubmit={saveTt}
          onCancel={() => setTtModal(false)}
          loading={saving}
        />
      </Modal>

      {/* Asset Form Modal */}
      <Modal
        isOpen={assetModal}
        onClose={() => setAssetModal(false)}
        title={editAsset ? `Edit Unit — ${editAsset.asset_id}` : `Add Unit — ${activeTt?.name}`}
        size="lg"
      >
        {error && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg mb-4">{error}</p>}
        {activeTt && (
          <AssetForm
            initial={editAsset}
            toolType={activeTt}
            suppliers={suppliers}
            onSubmit={saveAsset}
            onCancel={() => setAssetModal(false)}
            loading={saving}
          />
        )}
      </Modal>

      {/* Delete Tool Type confirm */}
      <ConfirmDialog
        isOpen={!!confirmTt}
        onClose={() => setConfirmTt(null)}
        onConfirm={deleteTt}
        title="Delete Tool Type"
        message={`Delete "${confirmTt?.name}"? All assets under this type will also be deleted. This cannot be undone.`}
        confirmLabel="Delete"
        variant="danger"
      />

      {/* Delete Asset confirm */}
      <ConfirmDialog
        isOpen={!!confirmAsset}
        onClose={() => setConfirmAsset(null)}
        onConfirm={deleteAsset}
        title="Delete Asset Unit"
        message={`Delete unit ${confirmAsset?.asset_id}${confirmAsset?.serial_number ? ` (${confirmAsset.serial_number})` : ''}? This cannot be undone.`}
        confirmLabel="Delete"
        variant="danger"
      />
    </div>
  )
}
