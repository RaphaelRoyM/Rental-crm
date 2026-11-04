import express from 'express'
import pool from '../config/db.js'
import { authenticate, adminOnly } from '../middleware/auth.js'

const router = express.Router()
router.use(authenticate)

// GET /api/tool-types
router.get('/', async (req, res) => {
  const { category, search, active } = req.query
  try {
    const conditions = []
    const params = []
    let i = 1

    if (category) { conditions.push(`category ILIKE $${i++}`); params.push(`%${category}%`) }
    if (search)   { conditions.push(`(name ILIKE $${i} OR brand ILIKE $${i} OR model_number ILIKE $${i})`); params.push(`%${search}%`); i++ }
    if (active)   { conditions.push(`is_active = $${i++}`); params.push(active === 'true') }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : ''

    const result = await pool.query(
      `SELECT tt.*,
              COUNT(a.id) AS total_assets,
              COUNT(a.id) FILTER (WHERE a.status = 'available') AS available_count,
              COUNT(a.id) FILTER (WHERE a.status = 'rented')    AS rented_count
       FROM tool_types tt
       LEFT JOIN assets a ON a.tool_type_id = tt.id
       ${where}
       GROUP BY tt.id
       ORDER BY tt.created_at DESC`,
      params
    )

    // Fetch all assets grouped by tool_type_id and attach
    const allAssets = await pool.query(
      `SELECT a.*, s.name AS supplier_name
       FROM assets a
       LEFT JOIN suppliers s ON s.id = a.supplier_id
       ORDER BY a.asset_id ASC`
    )

    const assetsByType = {}
    for (const asset of allAssets.rows) {
      if (!assetsByType[asset.tool_type_id]) assetsByType[asset.tool_type_id] = []
      assetsByType[asset.tool_type_id].push(asset)
    }

    const rows = result.rows.map(tt => ({
      ...tt,
      assets: assetsByType[tt.id] || []
    }))

    res.json(rows)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// GET /api/tool-types/categories — distinct categories list
router.get('/categories', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT DISTINCT category FROM tool_types WHERE is_active = TRUE ORDER BY category ASC`
    )
    res.json(result.rows.map(r => r.category))
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// GET /api/tool-types/:id — with its assets
router.get('/:id', async (req, res) => {
  try {
    const tt = await pool.query('SELECT * FROM tool_types WHERE id = $1', [req.params.id])
    if (!tt.rows[0]) return res.status(404).json({ message: 'Tool type not found' })

    const assets = await pool.query(
      `SELECT a.*, s.name AS supplier_name
       FROM assets a
       LEFT JOIN suppliers s ON s.id = a.supplier_id
       WHERE a.tool_type_id = $1
       ORDER BY a.asset_id ASC`,
      [req.params.id]
    )

    res.json({ ...tt.rows[0], assets: assets.rows })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// POST /api/tool-types (admin only)
router.post('/', adminOnly, async (req, res) => {
  const {
    name, brand, model_number, category, description,
    power_type, specifications, default_daily_rate, default_weekly_rate,
    security_deposit, accessories, image_url, notes
  } = req.body

  if (!name || !category || !default_daily_rate)
    return res.status(400).json({ message: 'name, category and default_daily_rate are required' })

  try {
    const result = await pool.query(
      `INSERT INTO tool_types
         (tool_id, name, brand, model_number, category, description, power_type,
          specifications, default_daily_rate, default_weekly_rate, security_deposit,
          accessories, image_url, notes)
       VALUES ('', $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
       RETURNING *`,
      [name, brand || null, model_number || null, category,
       description || null, power_type || null, specifications || null,
       default_daily_rate, default_weekly_rate || null,
       security_deposit || 0, accessories || null,
       image_url || null, notes || null]
    )
    res.status(201).json(result.rows[0])
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// PUT /api/tool-types/:id (admin only)
router.put('/:id', adminOnly, async (req, res) => {
  const {
    name, brand, model_number, category, description, power_type,
    specifications, default_daily_rate, default_weekly_rate,
    security_deposit, accessories, image_url, notes, is_active
  } = req.body
  try {
    const result = await pool.query(
      `UPDATE tool_types SET
         name = COALESCE($1, name),
         brand = COALESCE($2, brand),
         model_number = COALESCE($3, model_number),
         category = COALESCE($4, category),
         description = COALESCE($5, description),
         power_type = COALESCE($6, power_type),
         specifications = COALESCE($7, specifications),
         default_daily_rate = COALESCE($8, default_daily_rate),
         default_weekly_rate = COALESCE($9, default_weekly_rate),
         security_deposit = COALESCE($10, security_deposit),
         accessories = COALESCE($11, accessories),
         image_url = COALESCE($12, image_url),
         notes = COALESCE($13, notes),
         is_active = COALESCE($14, is_active)
       WHERE id = $15
       RETURNING *`,
      [name, brand, model_number, category, description, power_type,
       specifications, default_daily_rate, default_weekly_rate,
       security_deposit, accessories, image_url, notes, is_active, req.params.id]
    )
    if (!result.rows[0]) return res.status(404).json({ message: 'Tool type not found' })
    res.json(result.rows[0])
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// DELETE /api/tool-types/:id (admin only)
router.delete('/:id', adminOnly, async (req, res) => {
  try {
    await pool.query('DELETE FROM tool_types WHERE id = $1', [req.params.id])
    res.json({ message: 'Tool type deleted' })
  } catch (err) {
    if (err.code === '23503')
      return res.status(409).json({ message: 'Cannot delete — assets exist for this tool type' })
    res.status(500).json({ message: err.message })
  }
})

export default router
