import express from 'express'
import pool from '../config/db.js'
import { authenticate, adminOnly } from '../middleware/auth.js'

const router = express.Router()
router.use(authenticate)

// GET /api/maintenance
router.get('/', async (req, res) => {
  const { asset_id, status, search, page = 1, limit = 15 } = req.query
  const offset = (parseInt(page) - 1) * parseInt(limit)
  try {
    const conditions = []
    const params = []
    let i = 1
    if (asset_id) { conditions.push(`ml.asset_id = $${i++}`); params.push(asset_id) }
    if (status)   { conditions.push(`ml.status = $${i++}`);   params.push(status) }
    if (search)   {
      conditions.push(`(tt.name ILIKE $${i} OR a.asset_id ILIKE $${i} OR a.serial_number ILIKE $${i})`)
      params.push(`%${search}%`); i++
    }
    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : ''

    const countResult = await pool.query(
      `SELECT COUNT(*) AS total FROM maintenance_logs ml
       JOIN assets a ON a.id = ml.asset_id
       JOIN tool_types tt ON tt.id = a.tool_type_id ${where}`, params
    )
    const total = parseInt(countResult.rows[0].total)

    const result = await pool.query(
      `SELECT ml.*,
              a.asset_id AS asset_code, a.serial_number,
              tt.name AS tool_name, tt.brand,
              s.name AS supplier_name,
              u.name AS created_by_name
       FROM maintenance_logs ml
       JOIN assets a ON a.id = ml.asset_id
       JOIN tool_types tt ON tt.id = a.tool_type_id
       LEFT JOIN suppliers s ON s.id = ml.supplier_id
       LEFT JOIN users u ON u.id = ml.created_by
       ${where}
       ORDER BY ml.created_at DESC
       LIMIT $${i} OFFSET $${i + 1}`,
      [...params, parseInt(limit), offset]
    )
    res.json({ data: result.rows, total, page: parseInt(page), limit: parseInt(limit) })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// GET /api/maintenance/:id
router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT ml.*,
              a.asset_id AS asset_code, a.serial_number,
              tt.name AS tool_name,
              s.name AS supplier_name
       FROM maintenance_logs ml
       JOIN assets a ON a.id = ml.asset_id
       JOIN tool_types tt ON tt.id = a.tool_type_id
       LEFT JOIN suppliers s ON s.id = ml.supplier_id
       WHERE ml.id = $1`,
      [req.params.id]
    )
    if (!result.rows[0]) return res.status(404).json({ message: 'Log not found' })
    res.json(result.rows[0])
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// POST /api/maintenance (admin only)
router.post('/', adminOnly, async (req, res) => {
  const { asset_id, supplier_id, type, description, cost, start_date, end_date } = req.body
  if (!asset_id || !type || !start_date)
    return res.status(400).json({ message: 'asset_id, type and start_date are required' })

  const client = await pool.connect()
  try {
    await client.query('BEGIN')

    const result = await client.query(
      `INSERT INTO maintenance_logs
         (asset_id, supplier_id, type, description, cost, start_date, end_date, created_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
      [asset_id, supplier_id || null, type, description || null,
       cost || 0, start_date, end_date || null, req.user.id]
    )

    await client.query(
      `UPDATE assets SET status = 'maintenance', last_maintenance_date = $1 WHERE id = $2`,
      [start_date, asset_id]
    )

    await client.query('COMMIT')
    res.status(201).json(result.rows[0])
  } catch (err) {
    await client.query('ROLLBACK')
    res.status(500).json({ message: err.message })
  } finally {
    client.release()
  }
})

// PUT /api/maintenance/:id (admin only)
router.put('/:id', adminOnly, async (req, res) => {
  const { supplier_id, type, description, cost, start_date, end_date, status } = req.body
  const client = await pool.connect()
  try {
    await client.query('BEGIN')

    const result = await client.query(
      `UPDATE maintenance_logs SET
         supplier_id = COALESCE($1, supplier_id),
         type = COALESCE($2, type),
         description = COALESCE($3, description),
         cost = COALESCE($4, cost),
         start_date = COALESCE($5, start_date),
         end_date = COALESCE($6, end_date),
         status = COALESCE($7, status)
       WHERE id = $8 RETURNING *`,
      [supplier_id, type, description, cost, start_date, end_date, status, req.params.id]
    )
    if (!result.rows[0]) {
      await client.query('ROLLBACK')
      return res.status(404).json({ message: 'Log not found' })
    }

    // Mark asset available when maintenance completes
    if (status === 'completed') {
      await client.query(
        `UPDATE assets
         SET status = 'available', last_maintenance_date = CURRENT_DATE
         WHERE id = $1`,
        [result.rows[0].asset_id]
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

// DELETE /api/maintenance/:id (admin only)
router.delete('/:id', adminOnly, async (req, res) => {
  try {
    await pool.query('DELETE FROM maintenance_logs WHERE id = $1', [req.params.id])
    res.json({ message: 'Log deleted' })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

export default router
