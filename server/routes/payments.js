import express from 'express';
import pool from '../config/db.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticate);

// GET /api/payments
router.get('/', async (req, res) => {
  const { rental_id, search, page = 1, limit = 15 } = req.query
  const offset = (parseInt(page) - 1) * parseInt(limit)
  try {
    const conditions = []
    const params = []
    let i = 1
    if (rental_id) { conditions.push(`pay.rental_id = $${i++}`); params.push(rental_id) }
    if (search)    {
      conditions.push(`(r.rental_number ILIKE $${i} OR u.name ILIKE $${i})`)
      params.push(`%${search}%`); i++
    }
    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : ''

    const countResult = await pool.query(
      `SELECT COUNT(*) AS total FROM payments pay
       JOIN users u ON u.id = pay.received_by
       JOIN rentals r ON r.id = pay.rental_id ${where}`, params
    )
    const total = parseInt(countResult.rows[0].total)

    const result = await pool.query(
      `SELECT pay.*, u.name AS received_by_name, r.rental_number
       FROM payments pay
       JOIN users u ON u.id = pay.received_by
       JOIN rentals r ON r.id = pay.rental_id
       ${where}
       ORDER BY pay.paid_at DESC
       LIMIT $${i} OFFSET $${i + 1}`,
      [...params, parseInt(limit), offset]
    )
    res.json({ data: result.rows, total, page: parseInt(page), limit: parseInt(limit) })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// POST /api/payments
router.post('/', async (req, res) => {
  const { rental_id, amount, type, method, notes } = req.body;
  if (!rental_id || !amount || !type || !method)
    return res.status(400).json({ message: 'rental_id, amount, type and method are required' });
  try {
    const result = await pool.query(
      `INSERT INTO payments (rental_id, amount, type, method, received_by, notes)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [rental_id, amount, type, method, req.user.id, notes || null]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE /api/payments/:id
router.delete('/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM payments WHERE id = $1', [req.params.id]);
    res.json({ message: 'Payment deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
