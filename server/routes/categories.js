import express from 'express'
import pool from '../config/db.js'
import { authenticate, adminOnly } from '../middleware/auth.js'

const router = express.Router()
router.use(authenticate)

// GET /api/categories — list all
router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM categories ORDER BY name ASC')
    res.json(result.rows)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// POST /api/categories — add new (admin only)
router.post('/', adminOnly, async (req, res) => {
  const { name } = req.body
  if (!name?.trim()) return res.status(400).json({ message: 'Category name is required' })
  try {
    const result = await pool.query(
      `INSERT INTO categories (name) VALUES ($1) RETURNING *`,
      [name.trim()]
    )
    res.status(201).json(result.rows[0])
  } catch (err) {
    if (err.code === '23505') return res.status(409).json({ message: 'Category already exists' })
    res.status(500).json({ message: err.message })
  }
})

// PUT /api/categories/:id — rename (admin only)
router.put('/:id', adminOnly, async (req, res) => {
  const { name } = req.body
  if (!name?.trim()) return res.status(400).json({ message: 'Category name is required' })
  try {
    const result = await pool.query(
      `UPDATE categories SET name = $1 WHERE id = $2 RETURNING *`,
      [name.trim(), req.params.id]
    )
    if (!result.rows[0]) return res.status(404).json({ message: 'Category not found' })
    res.json(result.rows[0])
  } catch (err) {
    if (err.code === '23505') return res.status(409).json({ message: 'Category already exists' })
    res.status(500).json({ message: err.message })
  }
})

// DELETE /api/categories/:id (admin only)
router.delete('/:id', adminOnly, async (req, res) => {
  try {
    await pool.query('DELETE FROM categories WHERE id = $1', [req.params.id])
    res.json({ message: 'Category deleted' })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

export default router
