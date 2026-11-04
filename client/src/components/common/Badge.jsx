const variants = {
  available:   'bg-green-100 text-green-700',
  reserved:    'bg-purple-100 text-purple-700',
  rented:      'bg-blue-100 text-blue-700',
  maintenance: 'bg-yellow-100 text-yellow-700',
  retired:     'bg-gray-100 text-gray-500',
  active:      'bg-blue-100 text-blue-700',
  returned:    'bg-green-100 text-green-700',
  cancelled:   'bg-red-100 text-red-600',
  ongoing:     'bg-yellow-100 text-yellow-700',
  completed:   'bg-green-100 text-green-700',
  admin:       'bg-indigo-100 text-indigo-700',
  staff:       'bg-slate-100 text-slate-700',
  vendor:      'bg-cyan-100 text-cyan-700',
  service:     'bg-orange-100 text-orange-700',
  both:        'bg-purple-100 text-purple-700',
  excellent:   'bg-green-100 text-green-700',
  good:        'bg-blue-100 text-blue-700',
  fair:        'bg-yellow-100 text-yellow-700',
  poor:        'bg-red-100 text-red-600',
  // Tally status
  balanced:   'bg-green-100 text-green-700',
  underpaid:  'bg-red-100 text-red-700',
  overpaid:   'bg-amber-100 text-amber-700',
  rent:               'bg-green-100 text-green-700',
  late_fee:           'bg-orange-100 text-orange-700',
  damage_fee:         'bg-red-100 text-red-700',
  deposit_refund:     'bg-gray-100 text-gray-600',
  deposit_deduction:  'bg-rose-100 text-rose-700',
}

export default function Badge({ label }) {
  const key = label?.toLowerCase()
  const cls = variants[key] || 'bg-gray-100 text-gray-600'
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${cls}`}>
      {label}
    </span>
  )
}
