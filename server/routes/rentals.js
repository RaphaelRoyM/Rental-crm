import express from 'express'
import pool from '../config/db.js'
import { authenticate } from '../middleware/auth.js'

const router = express.Router()
router.use(authenticate)

// GET /api/rentals
router.get('/', async (req, res) => {
  const { status, customer_id, search, page = 1, limit = 15 } = req.query
  const offset = (parseInt(page) - 1) * parseInt(limit)
  try {
    const conditions = []
    const params = []
    let i = 1

    if (status)      { conditions.push(`r.status = $${i++}`); params.push(status) }
    if (customer_id) { conditions.push(`r.customer_id = $${i++}`); params.push(customer_id) }
    if (search)      {
      conditions.push(`(r.rental_number ILIKE $${i} OR c.name ILIKE $${i} OR c.phone ILIKE $${i})`)
      params.push(`%${search}%`); i++
    }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : ''

    // Total count
    const countResult = await pool.query(
      `SELECT COUNT(DISTINCT r.id) AS total
       FROM rentals r
       JOIN customers c ON c.id = r.customer_id
       ${where}`,
      params
    )
    const total = parseInt(countResult.rows[0].total)

    const result = await pool.query(
      `SELECT r.*,
              c.name AS customer_name, c.phone AS customer_phone,
              u.name AS created_by_name,
              COALESCE(SUM(p.amount) FILTER (WHERE p.type NOT IN ('deposit','deposit_refund','deposit_deduction')), 0) AS rent_paid,
              COALESCE(SUM(p.amount) FILTER (WHERE p.type = 'deposit'), 0)             AS deposit_paid,
              COALESCE(SUM(p.amount) FILTER (WHERE p.type = 'deposit_refund'), 0)      AS deposit_refunded,
              COALESCE(SUM(p.amount) FILTER (WHERE p.type = 'deposit_deduction'), 0)   AS deposit_deducted
       FROM rentals r
       JOIN customers c ON c.id = r.customer_id
       JOIN users u ON u.id = r.created_by
       LEFT JOIN payments p ON p.rental_id = r.id
       ${where}
       GROUP BY r.id, c.id, u.id
       ORDER BY r.created_at DESC
       LIMIT $${i} OFFSET $${i + 1}`,
      [...params, parseInt(limit), offset]
    )

    const rows = result.rows.map(r => {
      const effectivePaid  = parseFloat(r.rent_paid) + parseFloat(r.deposit_deducted)
      const balance        = parseFloat(r.total_amount) - effectivePaid
      const depositBalance = parseFloat(r.deposit_paid) - parseFloat(r.deposit_refunded) - parseFloat(r.deposit_deducted)
      let tally_status = null
      if (r.status === 'returned') {
        if (balance > 0)                            tally_status = 'underpaid'
        else if (balance < 0 || depositBalance > 0) tally_status = 'overpaid'
        else                                        tally_status = 'balanced'
      }
      return { ...r, tally_status }
    })

    res.json({ data: rows, total, page: parseInt(page), limit: parseInt(limit) })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// GET /api/rentals/export — returns ALL rentals for Excel export (no pagination)
router.get('/export', async (req, res) => {
  const { status, search } = req.query
  try {
    const conditions = []
    const params = []
    let i = 1

    if (status) { conditions.push(`r.status = $${i++}`); params.push(status) }
    if (search) {
      conditions.push(`(r.rental_number ILIKE $${i} OR c.name ILIKE $${i} OR c.phone ILIKE $${i})`)
      params.push(`%${search}%`); i++
    }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : ''

    const result = await pool.query(
      `SELECT
          r.rental_number,
          c.name      AS customer_name,
          c.phone     AS customer_phone,
          c.email     AS customer_email,
          r.start_date,
          r.expected_end_date,
          r.actual_end_date,
          r.status,
          r.subtotal,
          r.late_fee,
          r.damage_fee,
          r.total_amount,
          r.deposit_amount,
          r.notes,
          u.name      AS created_by,
          r.created_at,
          COALESCE(SUM(p.amount) FILTER (WHERE p.type NOT IN ('deposit','deposit_refund','deposit_deduction')), 0) AS rent_paid,
          COALESCE(SUM(p.amount) FILTER (WHERE p.type = 'deposit'), 0)           AS deposit_paid,
          COALESCE(SUM(p.amount) FILTER (WHERE p.type = 'deposit_refund'), 0)    AS deposit_refunded,
          COALESCE(SUM(p.amount) FILTER (WHERE p.type = 'deposit_deduction'), 0) AS deposit_deducted
       FROM rentals r
       JOIN customers c ON c.id = r.customer_id
       JOIN users u ON u.id = r.created_by
       LEFT JOIN payments p ON p.rental_id = r.id
       ${where}
       GROUP BY r.id, c.id, u.id
       ORDER BY r.created_at DESC`,
      params
    )

    const rows = result.rows.map(r => {
      const effectivePaid  = parseFloat(r.rent_paid) + parseFloat(r.deposit_deducted)
      const balance        = parseFloat(r.total_amount) - effectivePaid
      const depositBalance = parseFloat(r.deposit_paid) - parseFloat(r.deposit_refunded) - parseFloat(r.deposit_deducted)
      let tally = ''
      if (r.status === 'returned') {
        if (balance > 0)                            tally = 'Underpaid'
        else if (balance < 0 || depositBalance > 0) tally = 'Overpaid'
        else                                        tally = 'Balanced'
      }
      return { ...r, tally_status: tally, balance, deposit_balance: depositBalance }
    })

    res.json(rows)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// GET /api/rentals/overdue
router.get('/overdue', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT r.*,
              c.name AS customer_name, c.phone AS customer_phone,
              CURRENT_DATE - r.expected_end_date AS days_overdue
       FROM rentals r
       JOIN customers c ON c.id = r.customer_id
       WHERE r.status = 'active'
       AND r.expected_end_date < CURRENT_DATE
       ORDER BY days_overdue DESC`
    )
    res.json(result.rows)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// GET /api/rentals/:id
router.get('/:id', async (req, res) => {
  try {
    const rental = await pool.query(
      `SELECT r.*,
              c.name AS customer_name, c.phone AS customer_phone,
              c.email AS customer_email, c.address AS customer_address,
              c.id_proof_type, c.id_proof_number,
              u.name AS created_by_name
       FROM rentals r
       JOIN customers c ON c.id = r.customer_id
       JOIN users u ON u.id = r.created_by
       WHERE r.id = $1`,
      [req.params.id]
    )
    if (!rental.rows[0]) return res.status(404).json({ message: 'Rental not found' })

    const items = await pool.query(
      `SELECT ri.*,
              ri.asset_id  AS asset_uuid,
              a.asset_id   AS asset_code,
              a.serial_number, a.condition,
              tt.name AS tool_name, tt.brand, tt.category
       FROM rental_items ri
       JOIN assets a ON a.id = ri.asset_id
       JOIN tool_types tt ON tt.id = a.tool_type_id
       WHERE ri.rental_id = $1`,
      [req.params.id]
    )

    const payments = await pool.query(
      `SELECT pay.*, u.name AS received_by_name
       FROM payments pay
       JOIN users u ON u.id = pay.received_by
       WHERE pay.rental_id = $1
       ORDER BY pay.paid_at DESC`,
      [req.params.id]
    )

    const damageImages = await pool.query(
      `SELECT di.*,
              a.asset_id, a.serial_number,
              tt.name AS tool_name
       FROM damage_images di
       JOIN assets a ON a.id = di.asset_id
       JOIN tool_types tt ON tt.id = a.tool_type_id
       WHERE di.rental_id = $1`,
      [req.params.id]
    )

    res.json({
      ...rental.rows[0],
      items: items.rows,
      payments: payments.rows,
      damage_images: damageImages.rows,
    })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// POST /api/rentals
// items: [{ asset_id, daily_rate }]
router.post('/', async (req, res) => {
  const { customer_id, start_date, expected_end_date, items, deposit_amount, notes } = req.body
  if (!customer_id || !start_date || !expected_end_date || !items?.length)
    return res.status(400).json({ message: 'customer_id, start_date, expected_end_date and items are required' })

  const client = await pool.connect()
  try {
    await client.query('BEGIN')

    const rentalResult = await client.query(
      `INSERT INTO rentals
         (rental_number, customer_id, created_by, start_date, expected_end_date, deposit_amount, notes, status)
       VALUES ('', $1, $2, $3, $4, $5, $6, 'reserved')
       RETURNING *`,
      [customer_id, req.user.id, start_date, expected_end_date, deposit_amount || 0, notes || null]
    )
    const rental = rentalResult.rows[0]

    for (const item of items) {
      await client.query(
        `INSERT INTO rental_items (rental_id, asset_id, daily_rate) VALUES ($1, $2, $3)`,
        [rental.id, item.asset_id, item.daily_rate]
      )
      // Mark as reserved — tool is booked but not yet dispatched
      await client.query(
        `UPDATE assets SET status = 'reserved' WHERE id = $1`,
        [item.asset_id]
      )
    }

    await client.query('COMMIT')

    const full = await pool.query(
      `SELECT r.*, c.name AS customer_name FROM rentals r
       JOIN customers c ON c.id = r.customer_id WHERE r.id = $1`,
      [rental.id]
    )
    res.status(201).json(full.rows[0])
  } catch (err) {
    await client.query('ROLLBACK')
    res.status(500).json({ message: err.message })
  } finally {
    client.release()
  }
})

// PUT /api/rentals/:id/dispatch
router.put('/:id/dispatch', async (req, res) => {
  const client = await pool.connect()
  try {
    await client.query('BEGIN')

    const result = await client.query(
      `UPDATE rentals SET status = 'active' WHERE id = $1 AND status = 'reserved' RETURNING *`,
      [req.params.id]
    )
    if (!result.rows[0]) {
      await client.query('ROLLBACK')
      return res.status(400).json({ message: 'Rental not found or already active' })
    }

    // Mark all assets in this rental as rented
    const items = await client.query(
      'SELECT asset_id FROM rental_items WHERE rental_id = $1',
      [req.params.id]
    )
    for (const item of items.rows) {
      await client.query(
        `UPDATE assets SET status = 'rented' WHERE id = $1`,
        [item.asset_id]
      )
    }

    await client.query('COMMIT')
    res.json(result.rows[0])
  } catch (err) {
    await client.query('ROLLBACK')
    res.status(500).json({ message: err.message })
  } finally {
    client.release()
  }
})

// PUT /api/rentals/:id/return
router.put('/:id/return', async (req, res) => {
  const { actual_end_date, damage_fee, notes } = req.body
  if (!actual_end_date)
    return res.status(400).json({ message: 'actual_end_date is required' })

  const client = await pool.connect()
  try {
    await client.query('BEGIN')

    const rentalResult = await client.query(
      'SELECT * FROM rentals WHERE id = $1 AND status = $2',
      [req.params.id, 'active']
    )
    const rental = rentalResult.rows[0]
    if (!rental) {
      await client.query('ROLLBACK')
      return res.status(400).json({ message: 'Rental not found or not active' })
    }

    const returnDate = new Date(actual_end_date)
    const dueDate    = new Date(rental.expected_end_date)
    const startDate  = new Date(rental.start_date)
    const daysLate   = Math.max(0, Math.ceil((returnDate - dueDate) / 86400000))

    const items = await client.query(
      'SELECT * FROM rental_items WHERE rental_id = $1',
      [rental.id]
    )

    let subtotal = 0
    let lateFee  = 0

    for (const item of items.rows) {
      const totalDays    = Math.max(1, Math.ceil((returnDate - startDate) / 86400000))
      const itemSubtotal = item.daily_rate * totalDays
      const itemLateFee  = item.daily_rate * 1.5 * daysLate

      subtotal += itemSubtotal
      lateFee  += itemLateFee

      await client.query(
        `UPDATE rental_items SET days_rented = $1, subtotal = $2 WHERE id = $3`,
        [totalDays, itemSubtotal, item.id]
      )
      await client.query(
        `UPDATE assets SET status = 'available' WHERE id = $1`,
        [item.asset_id]
      )
    }

    const damageFee   = parseFloat(damage_fee) || 0
    const totalAmount = subtotal + lateFee + damageFee

    const updated = await client.query(
      `UPDATE rentals
       SET status = 'returned', actual_end_date = $1,
           subtotal = $2, late_fee = $3, damage_fee = $4,
           total_amount = $5, notes = COALESCE($6, notes)
       WHERE id = $7 RETURNING *`,
      [actual_end_date, subtotal, lateFee, damageFee, totalAmount, notes || null, rental.id]
    )

    await client.query('COMMIT')
    res.json(updated.rows[0])
  } catch (err) {
    await client.query('ROLLBACK')
    res.status(500).json({ message: err.message })
  } finally {
    client.release()
  }
})

// PUT /api/rentals/:id/cancel
router.put('/:id/cancel', async (req, res) => {
  const client = await pool.connect()
  try {
    await client.query('BEGIN')

    const rentalResult = await client.query(
      `UPDATE rentals SET status = 'cancelled' WHERE id = $1 AND status IN ('reserved','active') RETURNING *`,
      [req.params.id]
    )
    if (!rentalResult.rows[0]) {
      await client.query('ROLLBACK')
      return res.status(400).json({ message: 'Rental not found or cannot be cancelled' })
    }

    // Free assets back to available (works whether reserved or rented)
    const items = await client.query(
      'SELECT asset_id FROM rental_items WHERE rental_id = $1',
      [req.params.id]
    )
    for (const item of items.rows) {
      await client.query(
        `UPDATE assets SET status = 'available' WHERE id = $1 AND status IN ('reserved', 'rented')`,
        [item.asset_id]
      )
    }

    await client.query('COMMIT')
    res.json(rentalResult.rows[0])
  } catch (err) {
    await client.query('ROLLBACK')
    res.status(500).json({ message: err.message })
  } finally {
    client.release()
  }
})

export default router
