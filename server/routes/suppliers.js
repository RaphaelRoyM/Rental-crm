import express from 'express';
import pool from '../config/db.js';
import { authenticate, adminOnly } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticate);

// GET /api/suppliers
router.get('/', async (req, res) => {
  const { search, page = 1, limit = 15 } = req.query
  const offset = (parseInt(page) - 1) * parseInt(limit)
  try {
    const where = search ? `WHERE name ILIKE $1 OR contact_person ILIKE $1` : ''
    const params = search ? [`%${search}%`] : []
    const countResult = await pool.query(`SELECT COUNT(*) AS total FROM suppliers ${where}`, params)
    const total = parseInt(countResult.rows[0].total)
    const result = await pool.query(
      `SELECT * FROM suppliers ${where} ORDER BY name ASC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
      [...params, parseInt(limit), offset]
    )
    res.json({ data: result.rows, total, page: parseInt(page), limit: parseInt(limit) })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// GET /api/suppliers/:id
router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM suppliers WHERE id = $1', [req.params.id]);
    if (!result.rows[0]) return res.status(404).json({ message: 'Supplier not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/suppliers (admin only)
router.post('/', adminOnly, async (req, res) => {
  const { name, contact_person, phone, email, address, type, notes } = req.body;
  if (!name || !type)
    return res.status(400).json({ message: 'Name and type are required' });
  try {
    const result = await pool.query(
      `INSERT INTO suppliers (name, contact_person, phone, email, address, type, notes)
       VALUES ($1,$2,$3,$4,$5,$6,$7)
       RETURNING *`,
      [name, contact_person || null, phone || null, email || null, address || null, type, notes || null]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT /api/suppliers/:id (admin only)
router.put('/:id', adminOnly, async (req, res) => {
  const { name, contact_person, phone, email, address, type, notes } = req.body;
  try {
    const result = await pool.query(
      `UPDATE suppliers
       SET name = COALESCE($1, name),
           contact_person = COALESCE($2, contact_person),
           phone = COALESCE($3, phone),
           email = COALESCE($4, email),
           address = COALESCE($5, address),
           type = COALESCE($6, type),
           notes = COALESCE($7, notes)
       WHERE id = $8
       RETURNING *`,
      [name, contact_person, phone, email, address, type, notes, req.params.id]
    );
    if (!result.rows[0]) return res.status(404).json({ message: 'Supplier not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE /api/suppliers/:id (admin only)
router.delete('/:id', adminOnly, async (req, res) => {
  try {
    await pool.query('DELETE FROM suppliers WHERE id = $1', [req.params.id]);
    res.json({ message: 'Supplier deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
