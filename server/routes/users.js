import express from 'express';
import bcrypt from 'bcryptjs';
import pool from '../config/db.js';
import { authenticate, adminOnly } from '../middleware/auth.js';

const router = express.Router();

// All user routes are admin only
router.use(authenticate, adminOnly);

// GET /api/users
router.get('/', async (req, res) => {
  const { page = 1, limit = 15 } = req.query
  const offset = (parseInt(page) - 1) * parseInt(limit)
  try {
    const countResult = await pool.query('SELECT COUNT(*) AS total FROM users')
    const total = parseInt(countResult.rows[0].total)
    const result = await pool.query(
      'SELECT id, name, email, role, phone, is_active, created_at FROM users ORDER BY created_at DESC LIMIT $1 OFFSET $2',
      [parseInt(limit), offset]
    )
    res.json({ data: result.rows, total, page: parseInt(page), limit: parseInt(limit) })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// GET /api/users/:id
router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, name, email, role, phone, is_active, created_at FROM users WHERE id = $1',
      [req.params.id]
    );
    if (!result.rows[0]) return res.status(404).json({ message: 'User not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/users
router.post('/', async (req, res) => {
  const { name, email, password, role, phone } = req.body;
  if (!name || !email || !password || !role)
    return res.status(400).json({ message: 'name, email, password and role are required' });

  try {
    const hash = await bcrypt.hash(password, 10);
    const result = await pool.query(
      `INSERT INTO users (name, email, password_hash, role, phone)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, name, email, role, phone, is_active, created_at`,
      [name, email, hash, role, phone || null]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    if (err.code === '23505')
      return res.status(409).json({ message: 'Email already exists' });
    res.status(500).json({ message: err.message });
  }
});

// PUT /api/users/:id
router.put('/:id', async (req, res) => {
  const { name, email, role, phone, is_active } = req.body;
  try {
    const result = await pool.query(
      `UPDATE users
       SET name = COALESCE($1, name),
           email = COALESCE($2, email),
           role = COALESCE($3, role),
           phone = COALESCE($4, phone),
           is_active = COALESCE($5, is_active)
       WHERE id = $6
       RETURNING id, name, email, role, phone, is_active, created_at`,
      [name, email, role, phone, is_active, req.params.id]
    );
    if (!result.rows[0]) return res.status(404).json({ message: 'User not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT /api/users/:id/password
router.put('/:id/password', async (req, res) => {
  const { password } = req.body;
  if (!password) return res.status(400).json({ message: 'Password is required' });
  try {
    const hash = await bcrypt.hash(password, 10);
    await pool.query('UPDATE users SET password_hash = $1 WHERE id = $2', [hash, req.params.id]);
    res.json({ message: 'Password updated' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE /api/users/:id (soft delete)
router.delete('/:id', async (req, res) => {
  try {
    await pool.query('UPDATE users SET is_active = FALSE WHERE id = $1', [req.params.id]);
    res.json({ message: 'User deactivated' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
