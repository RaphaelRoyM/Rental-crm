import { Pencil, Trash2, Plus, History } from 'lucide-react'
import Badge from '../../../components/common/Badge'
import Button from '../../../components/common/Button'

export default function AssetTable({ assets, onAdd, onEdit, onDelete, onViewHistory }) {
  return (
    <div className="mt-3">
      <div className="flex items-center justify-between mb-2">
        <p className="text-sm font-medium text-gray-600">Individual Units ({assets.length})</p>
        <Button size="sm" onClick={onAdd}>
          <Plus size={14} /> Add Unit
        </Button>
      </div>

      {assets.length === 0 ? (
        <div className="text-center py-6 bg-gray-50 rounded-lg border border-dashed border-gray-200">
          <p className="text-sm text-gray-400">No units added yet.</p>
          <button onClick={onAdd} className="text-sm text-indigo-600 hover:underline mt-1">Add the first unit</button>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-gray-100">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                {['Asset ID', 'Serial No.', 'Condition', 'Status', 'Location', 'Next Maintenance', ''].map(h => (
                  <th key={h} className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
              {assets.map(a => (
                <tr key={a.id} className="hover:bg-gray-50 transition">
                  <td className="px-4 py-2.5 font-mono text-xs font-medium text-indigo-600">{a.asset_id}</td>
                  <td className="px-4 py-2.5 text-gray-600">{a.serial_number || <span className="text-gray-300">—</span>}</td>
                  <td className="px-4 py-2.5"><Badge label={a.condition} /></td>
                  <td className="px-4 py-2.5"><Badge label={a.status} /></td>
                  <td className="px-4 py-2.5 text-gray-500 max-w-32 truncate">{a.storage_location || <span className="text-gray-300">—</span>}</td>
                  <td className="px-4 py-2.5 text-gray-500">
                    {a.next_maintenance_date
                      ? new Date(a.next_maintenance_date).toLocaleDateString()
                      : <span className="text-gray-300">—</span>}
                  </td>
                  <td className="px-4 py-2.5">
                    <div className="flex items-center gap-1">
                      <button onClick={() => onViewHistory(a)} className="p-1.5 hover:bg-blue-50 rounded text-gray-400 hover:text-blue-600 transition" title="Rental History">
                        <History size={14} />
                      </button>
                      <button onClick={() => onEdit(a)} className="p-1.5 hover:bg-indigo-50 rounded text-gray-400 hover:text-indigo-600 transition" title="Edit">
                        <Pencil size={14} />
                      </button>
                      <button onClick={() => onDelete(a)} className="p-1.5 hover:bg-red-50 rounded text-gray-400 hover:text-red-500 transition" title="Delete">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
