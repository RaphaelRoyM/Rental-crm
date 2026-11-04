import express from 'express'
import pool from '../config/db.js'
import { authenticate } from '../middleware/auth.js'

const router = express.Router()
router.use(authenticate)

// GET /api/damage
router.get('/', async (req, res) => {
  const { rental_id, asset_id } = req.query
  try {
    const conditions = []
    const params = []
    let i = 1
    if (rental_id) { conditions.push(`di.rental_id = $${i++}`); params.push(rental_id) }
    if (asset_id)  { conditions.push(`di.asset_id = $${i++}`);  params.push(asset_id) }
    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : ''

    const result = await pool.query(
      `SELECT di.*,
              a.asset_id AS asset_code, a.serial_number,
              tt.name AS tool_name,
              r.rental_number,
              u.name AS uploaded_by_name
       FROM damage_images di
       JOIN assets a ON a.id = di.asset_id
       JOIN tool_types tt ON tt.id = a.tool_type_id
       JOIN rentals r ON r.id = di.rental_id
       LEFT JOIN users u ON u.id = di.uploaded_by
       ${where}
       ORDER BY di.uploaded_at DESC`,
      params
    )
    res.json(result.rows)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// POST /api/damage
router.post('/', async (req, res) => {
  const { rental_id, asset_id, image_url, description } = req.body
  if (!rental_id || !asset_id || !image_url)
    return res.status(400).json({ message: 'rental_id, asset_id and image_url are required' })
  try {
    const result = await pool.query(
      `INSERT INTO damage_images (rental_id, asset_id, image_url, description, uploaded_by)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [rental_id, asset_id, image_url, description || null, req.user.id]
    )
    res.status(201).json(result.rows[0])
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// DELETE /api/damage/:id
router.delete('/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM damage_images WHERE id = $1', [req.params.id])
    res.json({ message: 'Image deleted' })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

export default router
