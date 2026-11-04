import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Phone, Mail, MapPin, FileText } from 'lucide-react'
import api from '../../../lib/api'
import Badge   from '../../../components/common/Badge'
import Spinner from '../../../components/common/Spinner'
import Button  from '../../../components/common/Button'

export default function CustomerDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [customer, setCustomer] = useState(null)
  const [loading, setLoading]   = useState(true)

  useEffect(() => {
    api.get(`/customers/${id}`)
      .then(r => setCustomer(r.data))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [id])

  if (loading) return <div className="flex items-center justify-center h-64"><Spinner size="lg" /></div>
  if (!customer) return <div className="p-6 text-gray-400">Customer not found</div>

  const totalSpent = customer.rentals?.reduce((s, r) => s + parseFloat(r.total_amount || 0), 0) || 0
  const totalDues  = customer.outstanding_dues?.reduce((s, d) => s + parseFloat(d.outstanding || 0), 0) || 0

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-100 rounded-lg text-gray-500 transition">
          <ArrowLeft size={18} />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-800">{customer.name}</h1>
          <p className="text-sm text-gray-400">Customer Profile</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Profile card */}
        <div className="md:col-span-2 bg-white rounded-xl border border-gray-100 p-5 shadow-sm space-y-4">
          <h3 className="font-semibold text-gray-700">Contact Information</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
            <div className="flex items-center gap-2 text-gray-600"><Phone size={15} className="text-gray-400" />{customer.phone}</div>
            {customer.email && <div className="flex items-center gap-2 text-gray-600"><Mail size={15} className="text-gray-400" />{customer.email}</div>}
            {customer.address && <div className="flex items-start gap-2 text-gray-600 col-span-2"><MapPin size={15} className="text-gray-400 mt-0.5 shrink-0" />{customer.address}</div>}
            {customer.id_proof_type && (
              <div className="flex items-center gap-2 text-gray-600 col-span-2">
                <FileText size={15} className="text-gray-400" />
                {customer.id_proof_type}: {customer.id_proof_number || '—'}
              </div>
            )}
          </div>
          {customer.notes && (
            <div className="pt-3 border-t border-gray-100">
              <p className="text-xs text-gray-400 mb-1">Notes</p>
              <p className="text-sm text-gray-600">{customer.notes}</p>
            </div>
          )}
        </div>

        {/* Stats */}
        <div className="space-y-3">
          <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm text-center">
            <p className="text-2xl font-bold text-gray-800">{customer.rentals?.length || 0}</p>
            <p className="text-sm text-gray-500">Total Rentals</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm text-center">
            <p className="text-2xl font-bold text-green-600">₹{totalSpent.toLocaleString()}</p>
            <p className="text-sm text-gray-500">Total Spent</p>
          </div>
          {totalDues > 0 && (
            <div className="bg-red-50 rounded-xl border border-red-100 p-4 text-center">
              <p className="text-2xl font-bold text-red-600">₹{totalDues.toLocaleString()}</p>
              <p className="text-sm text-red-500">Outstanding Dues</p>
            </div>
          )}
        </div>
      </div>

      {/* Rental history */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <h3 className="font-semibold text-gray-700">Rental History</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                {['Rental #', 'Start', 'End', 'Status', 'Amount', ''].map(h => (
                  <th key={h} className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {!customer.rentals?.length ? (
                <tr><td colSpan={6} className="px-5 py-8 text-center text-gray-400">No rentals yet</td></tr>
              ) : customer.rentals.map(r => (
                <tr key={r.id} className="hover:bg-gray-50 transition">
                  <td className="px-5 py-3 font-medium text-indigo-600">{r.rental_number}</td>
                  <td className="px-5 py-3 text-gray-500">{new Date(r.start_date).toLocaleDateString()}</td>
                  <td className="px-5 py-3 text-gray-500">{r.actual_end_date ? new Date(r.actual_end_date).toLocaleDateString() : new Date(r.expected_end_date).toLocaleDateString()}</td>
                  <td className="px-5 py-3"><Badge label={r.status} /></td>
                  <td className="px-5 py-3 text-gray-700">₹{parseFloat(r.total_amount || 0).toLocaleString()}</td>
                  <td className="px-5 py-3">
                    <Button size="sm" variant="ghost" onClick={() => navigate(`/admin/rentals/${r.id}`)}>View</Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Outstanding dues */}
      {customer.outstanding_dues?.length > 0 && (
        <div className="bg-white rounded-xl border border-red-100 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-red-100 bg-red-50">
            <h3 className="font-semibold text-red-700">Outstanding Dues</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  {['Rental #', 'Total Amount', 'Paid', 'Outstanding'].map(h => (
                    <th key={h} className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {customer.outstanding_dues.map((d, i) => (
                  <tr key={i} className="hover:bg-gray-50">
                    <td className="px-5 py-3 font-medium text-indigo-600">{d.rental_number}</td>
                    <td className="px-5 py-3">₹{parseFloat(d.total_amount).toLocaleString()}</td>
                    <td className="px-5 py-3 text-green-600">₹{parseFloat(d.paid).toLocaleString()}</td>
                    <td className="px-5 py-3 font-semibold text-red-600">₹{parseFloat(d.outstanding).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
