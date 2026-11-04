const escapeHtml = (value) => String(value ?? '')
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&#039;')

const formatDate = (value) => value
  ? new Date(value).toLocaleDateString('en-IN')
  : '—'

const formatAmount = (value) => `₹${Number(value || 0).toLocaleString('en-IN', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})}`

export function downloadRentalBill(rental) {
  const payments = rental.payments || []
  const totalPaid = payments
    .filter(payment => !['deposit', 'deposit_refund', 'deposit_deduction'].includes(payment.type))
    .reduce((sum, payment) => sum + Number(payment.amount || 0), 0)
  const depositPaid = payments
    .filter(payment => payment.type === 'deposit')
    .reduce((sum, payment) => sum + Number(payment.amount || 0), 0)
  const depositRefunded = payments
    .filter(payment => payment.type === 'deposit_refund')
    .reduce((sum, payment) => sum + Number(payment.amount || 0), 0)
  const depositDeducted = payments
    .filter(payment => payment.type === 'deposit_deduction')
    .reduce((sum, payment) => sum + Number(payment.amount || 0), 0)
  const total = Number(rental.total_amount || 0)
  const balance = total - totalPaid - depositDeducted
  const depositBalance = depositPaid - depositRefunded - depositDeducted
  const itemRows = (rental.items || []).map(item => `
    <tr>
      <td>${escapeHtml(item.asset_code)}</td>
      <td>${escapeHtml(item.tool_name)}${item.serial_number ? `<small>Serial: ${escapeHtml(item.serial_number)}</small>` : ''}</td>
      <td>${formatAmount(item.daily_rate)}</td>
      <td>${escapeHtml(item.days_rented ?? '—')}</td>
      <td>${formatAmount(item.subtotal)}</td>
    </tr>
  `).join('')
  const paymentRows = payments.map(payment => `
    <tr>
      <td>${formatDate(payment.paid_at)}</td>
      <td>${escapeHtml(payment.type.replace(/_/g, ' '))}</td>
      <td>${escapeHtml(payment.method.replace(/_/g, ' '))}</td>
      <td class="${payment.type === 'deposit_refund' ? 'negative' : ''}">
        ${payment.type === 'deposit_refund' ? '−' : '+'} ${formatAmount(payment.amount)}
      </td>
    </tr>
  `).join('')
  const generatedAt = new Date().toLocaleString('en-IN')
  const fileName = `Bill-${String(rental.rental_number || 'rental').replace(/[^a-z0-9-_]/gi, '-')}.html`

  const document = `<!doctype html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Bill ${escapeHtml(rental.rental_number)}</title>
  <style>
    * { box-sizing: border-box; }
    body { margin: 0; padding: 32px; color: #1f2937; font: 14px Arial, sans-serif; background: #f3f4f6; }
    .page { max-width: 820px; margin: auto; padding: 36px; background: white; }
    header { display: flex; justify-content: space-between; gap: 24px; padding-bottom: 24px; border-bottom: 2px solid #4f46e5; }
    h1 { margin: 0 0 6px; color: #4338ca; font-size: 26px; }
    h2 { margin: 26px 0 10px; font-size: 16px; }
    p { margin: 4px 0; }
    .muted { color: #6b7280; }
    .right { text-align: right; }
    .details { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-top: 24px; }
    .box { padding: 14px; border: 1px solid #e5e7eb; border-radius: 6px; }
    table { width: 100%; border-collapse: collapse; }
    th, td { padding: 10px 8px; text-align: left; border-bottom: 1px solid #e5e7eb; }
    th { color: #6b7280; background: #f9fafb; font-size: 12px; text-transform: uppercase; }
    td:last-child, th:last-child { text-align: right; }
    small { display: block; margin-top: 4px; color: #6b7280; }
    .summary { width: 320px; margin: 18px 0 0 auto; }
    .summary div { display: flex; justify-content: space-between; padding: 6px 0; }
    .total { margin-top: 4px; padding-top: 10px !important; border-top: 2px solid #d1d5db; font-size: 16px; font-weight: bold; }
    .negative { color: #dc2626; }
    .balance { color: ${balance > 0 ? '#dc2626' : '#15803d'}; font-weight: bold; }
    footer { margin-top: 30px; padding-top: 14px; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 12px; }
    @media print { body { padding: 0; background: white; } .page { max-width: none; padding: 0; } }
  </style>
</head>
<body>
  <main class="page">
    <header>
      <div>
        <h1>Rental Bill</h1>
        <p class="muted">Equipment &amp; Tool Rental CRM</p>
      </div>
      <div class="right">
        <strong>${escapeHtml(rental.rental_number)}</strong>
        <p class="muted">Status: ${escapeHtml(rental.status)}</p>
        <p class="muted">Generated: ${escapeHtml(generatedAt)}</p>
      </div>
    </header>
    <section class="details">
      <div class="box">
        <strong>Customer</strong>
        <p>${escapeHtml(rental.customer_name)}</p>
        <p class="muted">${escapeHtml(rental.customer_phone)}</p>
        ${rental.customer_email ? `<p class="muted">${escapeHtml(rental.customer_email)}</p>` : ''}
        ${rental.customer_address ? `<p class="muted">${escapeHtml(rental.customer_address)}</p>` : ''}
      </div>
      <div class="box">
        <strong>Rental Period</strong>
        <p>Start: ${formatDate(rental.start_date)}</p>
        <p>Expected return: ${formatDate(rental.expected_end_date)}</p>
        <p>Actual return: ${formatDate(rental.actual_end_date)}</p>
      </div>
    </section>
    <h2>Rented Items</h2>
    <table>
      <thead><tr><th>Asset</th><th>Item</th><th>Daily rate</th><th>Days</th><th>Amount</th></tr></thead>
      <tbody>${itemRows || '<tr><td colspan="5">No items recorded</td></tr>'}</tbody>
    </table>
    <div class="summary">
      <div><span>Subtotal</span><span>${formatAmount(rental.subtotal)}</span></div>
      <div><span>Late fee</span><span>${formatAmount(rental.late_fee)}</span></div>
      <div><span>Damage fee</span><span>${formatAmount(rental.damage_fee)}</span></div>
      <div class="total"><span>Total bill</span><span>${formatAmount(total)}</span></div>
      <div><span>Paid toward bill</span><span>${formatAmount(totalPaid)}</span></div>
      ${depositDeducted ? `<div><span>Deposit deduction</span><span>${formatAmount(depositDeducted)}</span></div>` : ''}
      <div class="balance"><span>${balance > 0 ? 'Balance due' : 'Balance'}</span><span>${formatAmount(Math.max(balance, 0))}</span></div>
    </div>
    <h2>Payments</h2>
    <table>
      <thead><tr><th>Date</th><th>Type</th><th>Method</th><th>Amount</th></tr></thead>
      <tbody>${paymentRows || '<tr><td colspan="4">No payments recorded</td></tr>'}</tbody>
    </table>
    <h2>Security Deposit</h2>
    <p>Collected: ${formatAmount(depositPaid)} &nbsp; Refunded: ${formatAmount(depositRefunded)} &nbsp; Held: ${formatAmount(depositBalance)}</p>
    ${rental.notes ? `<p class="muted"><strong>Notes:</strong> ${escapeHtml(rental.notes)}</p>` : ''}
    <footer>Thank you for choosing Equipment &amp; Tool Rental CRM.</footer>
  </main>
</body>
</html>`

  const blob = new Blob([document], { type: 'text/html;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = window.document.createElement('a')
  link.href = url
  link.download = fileName
  link.click()
  URL.revokeObjectURL(url)
}
