import express from 'express'
import pool from '../config/db.js'
import { authenticate, adminOnly } from '../middleware/auth.js'

const router = express.Router()
router.use(authenticate)

// GET /api/assets
router.get('/', async (req, res) => {
  const { status, tool_type_id, search } = req.query
  try {
    const conditions = []
    const params = []
    let i = 1

    if (status)       { conditions.push(`a.status = $${i++}`); params.push(status) }
    if (tool_type_id) { conditions.push(`a.tool_type_id = $${i++}`); params.push(tool_type_id) }
    if (search)       {
      conditions.push(`(a.asset_id ILIKE $${i} OR a.serial_number ILIKE $${i} OR tt.name ILIKE $${i})`)
      params.push(`%${search}%`); i++
    }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : ''

    const result = await pool.query(
      `SELECT a.*,
              tt.name AS tool_name, tt.brand, tt.category,
              tt.default_daily_rate, tt.image_url AS type_image_url,
              s.name AS supplier_name
       FROM assets a
       JOIN tool_types tt ON tt.id = a.tool_type_id
       LEFT JOIN suppliers s ON s.id = a.supplier_id
       ${where}
       ORDER BY a.asset_id ASC`,
      params
    )
    res.json(result.rows)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// GET /api/assets/available?start_date=&end_date=
router.get('/available', async (req, res) => {
  const { start_date, end_date } = req.query
  if (!start_date || !end_date)
    return res.status(400).json({ message: 'start_date and end_date are required' })
  try {
    const result = await pool.query(
      `SELECT a.*,
              tt.name AS tool_name, tt.brand, tt.category, tt.default_daily_rate,
              tt.image_url AS type_image_url, tt.security_deposit
       FROM assets a
       JOIN tool_types tt ON tt.id = a.tool_type_id
       WHERE a.status = 'available'
       AND tt.is_active = TRUE
       AND a.id NOT IN (
         SELECT ri.asset_id
         FROM rental_items ri
         JOIN rentals r ON r.id = ri.rental_id
         WHERE r.status IN ('reserved', 'active')
         AND r.start_date <= $2
         AND r.expected_end_date >= $1
       )
       ORDER BY tt.name ASC, a.asset_id ASC`,
      [start_date, end_date]
    )
    res.json(result.rows)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// GET /api/assets/:id/rental-history
router.get('/:id/rental-history', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT
          r.id,
          r.rental_number,
          r.start_date,
          r.expected_end_date,
          r.actual_end_date,
          r.status,
          r.total_amount,
          c.name AS customer_name,
          c.phone AS customer_phone,
          ri.daily_rate,
          ri.days_rented,
          ri.subtotal
       FROM rental_items ri
       JOIN rentals r ON r.id = ri.rental_id
       JOIN customers c ON c.id = r.customer_id
       WHERE ri.asset_id = $1
       ORDER BY r.start_date DESC`,
      [req.params.id]
    )
    res.json(result.rows)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// GET /api/assets/:id
router.get('/:id', async (req, res) => {
  try {
    const asset = await pool.query(
      `SELECT a.*,
              tt.name AS tool_name, tt.brand, tt.model_number, tt.category,
              tt.default_daily_rate, tt.security_deposit, tt.image_url AS type_image_url,
              s.name AS supplier_name
       FROM assets a
       JOIN tool_types tt ON tt.id = a.tool_type_id
       LEFT JOIN suppliers s ON s.id = a.supplier_id
       WHERE a.id = $1`,
      [req.params.id]
    )
    if (!asset.rows[0]) return res.status(404).json({ message: 'Asset not found' })

    const maintenance = await pool.query(
      `SELECT ml.*, s.name AS supplier_name
       FROM maintenance_logs ml
       LEFT JOIN suppliers s ON s.id = ml.supplier_id
       WHERE ml.asset_id = $1
       ORDER BY ml.start_date DESC`,
      [req.params.id]
    )

    const currentRental = await pool.query(
      `SELECT r.rental_number, r.start_date, r.expected_end_date,
              c.name AS customer_name, c.phone AS customer_phone
       FROM rental_items ri
       JOIN rentals r ON r.id = ri.rental_id
       JOIN customers c ON c.id = r.customer_id
       WHERE ri.asset_id = $1 AND r.status = 'active'
       LIMIT 1`,
      [req.params.id]
    )

    res.json({
      ...asset.rows[0],
      maintenance_logs: maintenance.rows,
      current_rental: currentRental.rows[0] || null,
    })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// POST /api/assets (admin only)
router.post('/', adminOnly, async (req, res) => {
  const {
    tool_type_id, serial_number, barcode, purchase_date, purchase_price,
    supplier_id, condition, storage_location, warranty_expiry,
    last_maintenance_date, next_maintenance_date, notes
  } = req.body

  if (!tool_type_id)
    return res.status(400).json({ message: 'tool_type_id is required' })

  try {
    const result = await pool.query(
      `INSERT INTO assets
         (asset_id, tool_type_id, serial_number, barcode, purchase_date, purchase_price,
          supplier_id, condition, storage_location, warranty_expiry,
          last_maintenance_date, next_maintenance_date, notes)
       VALUES ('', $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
       RETURNING *`,
      [tool_type_id, serial_number || null, barcode || null,
       purchase_date || null, purchase_price || null,
       supplier_id || null, condition || 'good',
       storage_location || null, warranty_expiry || null,
       last_maintenance_date || null, next_maintenance_date || null,
       notes || null]
    )
    res.status(201).json(result.rows[0])
  } catch (err) {
    if (err.code === '23505')
      return res.status(409).json({ message: 'Serial number already exists' })
    res.status(500).json({ message: err.message })
  }
})

// PUT /api/assets/:id (admin only)
router.put('/:id', adminOnly, async (req, res) => {
  const {
    serial_number, barcode, purchase_date, purchase_price, supplier_id,
    condition, status, storage_location, warranty_expiry,
    last_maintenance_date, next_maintenance_date, notes
  } = req.body
  try {
    const result = await pool.query(
      `UPDATE assets SET
         serial_number = COALESCE($1, serial_number),
         barcode = COALESCE($2, barcode),
         purchase_date = COALESCE($3, purchase_date),
         purchase_price = COALESCE($4, purchase_price),
         supplier_id = COALESCE($5, supplier_id),
         condition = COALESCE($6, condition),
         status = COALESCE($7, status),
         storage_location = COALESCE($8, storage_location),
         warranty_expiry = COALESCE($9, warranty_expiry),
         last_maintenance_date = COALESCE($10, last_maintenance_date),
         next_maintenance_date = COALESCE($11, next_maintenance_date),
         notes = COALESCE($12, notes)
       WHERE id = $13
       RETURNING *`,
      [serial_number, barcode, purchase_date, purchase_price, supplier_id,
       condition, status, storage_location, warranty_expiry,
       last_maintenance_date, next_maintenance_date, notes, req.params.id]
    )
    if (!result.rows[0]) return res.status(404).json({ message: 'Asset not found' })
    res.json(result.rows[0])
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// DELETE /api/assets/:id (admin only)
router.delete('/:id', adminOnly, async (req, res) => {
  try {
    await pool.query('DELETE FROM assets WHERE id = $1', [req.params.id])
    res.json({ message: 'Asset deleted' })
  } catch (err) {
    if (err.code === '23503')
      return res.status(409).json({ message: 'Cannot delete asset with existing rentals' })
    res.status(500).json({ message: err.message })
  }
})

export default router
