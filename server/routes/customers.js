import express from 'express';
import pool from '../config/db.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticate);

// GET /api/customers
router.get('/', async (req, res) => {
  const { search, page = 1, limit = 15 } = req.query
  const offset = (parseInt(page) - 1) * parseInt(limit)
  try {
    const where = search ? `WHERE name ILIKE $1 OR phone ILIKE $1 OR email ILIKE $1` : ''
    const params = search ? [`%${search}%`] : []

    const countResult = await pool.query(`SELECT COUNT(*) AS total FROM customers ${where}`, params)
    const total = parseInt(countResult.rows[0].total)

    const result = await pool.query(
      `SELECT * FROM customers ${where} ORDER BY created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
      [...params, parseInt(limit), offset]
    )
    res.json({ data: result.rows, total, page: parseInt(page), limit: parseInt(limit) })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// GET /api/customers/:id
router.get('/:id', async (req, res) => {
  try {
    const customer = await pool.query('SELECT * FROM customers WHERE id = $1', [req.params.id]);
    if (!customer.rows[0]) return res.status(404).json({ message: 'Customer not found' });

    const rentals = await pool.query(
      `SELECT r.id, r.rental_number, r.start_date, r.expected_end_date,
              r.actual_end_date, r.status, r.total_amount, r.deposit_amount
       FROM rentals r
       WHERE r.customer_id = $1
       ORDER BY r.created_at DESC`,
      [req.params.id]
    );

    const dues = await pool.query(
      `SELECT r.rental_number, r.total_amount,
              COALESCE(SUM(p.amount), 0) AS paid,
              r.total_amount - COALESCE(SUM(p.amount), 0) AS outstanding
       FROM rentals r
       LEFT JOIN payments p ON p.rental_id = r.id AND p.type != 'deposit_refund'
       WHERE r.customer_id = $1 AND r.status IN ('active', 'returned')
       GROUP BY r.id
       HAVING r.total_amount - COALESCE(SUM(p.amount), 0) > 0`,
      [req.params.id]
    );

    res.json({
      ...customer.rows[0],
      rentals: rentals.rows,
      outstanding_dues: dues.rows,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/customers
router.post('/', async (req, res) => {
  const { name, email, phone, address, id_proof_type, id_proof_number, notes } = req.body;
  if (!name || !phone)
    return res.status(400).json({ message: 'Name and phone are required' });
  try {
    const result = await pool.query(
      `INSERT INTO customers (name, email, phone, address, id_proof_type, id_proof_number, notes)
       VALUES ($1,$2,$3,$4,$5,$6,$7)
       RETURNING *`,
      [name, email || null, phone, address || null, id_proof_type || null, id_proof_number || null, notes || null]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT /api/customers/:id
router.put('/:id', async (req, res) => {
  const { name, email, phone, address, id_proof_type, id_proof_number, notes } = req.body;
  try {
    const result = await pool.query(
      `UPDATE customers
       SET name = COALESCE($1, name),
           email = COALESCE($2, email),
           phone = COALESCE($3, phone),
           address = COALESCE($4, address),
           id_proof_type = COALESCE($5, id_proof_type),
           id_proof_number = COALESCE($6, id_proof_number),
           notes = COALESCE($7, notes)
       WHERE id = $8
       RETURNING *`,
      [name, email, phone, address, id_proof_type, id_proof_number, notes, req.params.id]
    );
    if (!result.rows[0]) return res.status(404).json({ message: 'Customer not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE /api/customers/:id
router.delete('/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM customers WHERE id = $1', [req.params.id]);
    res.json({ message: 'Customer deleted' });
  } catch (err) {
    if (err.code === '23503')
      return res.status(409).json({ message: 'Cannot delete customer with existing rentals' });
    res.status(500).json({ message: err.message });
  }
});

export default router;
