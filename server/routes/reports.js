import express from 'express'
import pool from '../config/db.js'
import { authenticate, adminOnly } from '../middleware/auth.js'

const router = express.Router()
router.use(authenticate, adminOnly)

// GET /api/reports/dashboard
router.get('/dashboard', async (req, res) => {
  try {
    const [revenue, activeRentals, overdueRentals, totalAssets, availableAssets, totalCustomers] =
      await Promise.all([
        pool.query(`SELECT COALESCE(SUM(amount), 0) AS total FROM payments WHERE type != 'deposit_refund'`),
        pool.query(`SELECT COUNT(*) AS count FROM rentals WHERE status = 'active'`),
        pool.query(`SELECT COUNT(*) AS count FROM rentals WHERE status = 'active' AND expected_end_date < CURRENT_DATE`),
        pool.query(`SELECT COUNT(*) AS count FROM assets WHERE status != 'retired'`),
        pool.query(`SELECT COUNT(*) AS count FROM assets WHERE status = 'available'`),
        pool.query(`SELECT COUNT(*) AS count FROM customers`),
      ])

    res.json({
      total_revenue:      parseFloat(revenue.rows[0].total),
      active_rentals:     parseInt(activeRentals.rows[0].count),
      overdue_rentals:    parseInt(overdueRentals.rows[0].count),
      total_assets:       parseInt(totalAssets.rows[0].count),
      available_assets:   parseInt(availableAssets.rows[0].count),
      total_customers:    parseInt(totalCustomers.rows[0].count),
    })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// GET /api/reports/revenue?from=&to=
router.get('/revenue', async (req, res) => {
  const { from, to } = req.query
  try {
    const result = await pool.query(
      `SELECT
         DATE_TRUNC('month', paid_at)                                    AS month,
         SUM(amount) FILTER (WHERE type = 'rent')                        AS rent_revenue,
         SUM(amount) FILTER (WHERE type = 'late_fee')                    AS late_fee_revenue,
         SUM(amount) FILTER (WHERE type = 'damage_fee')                  AS damage_fee_revenue,
         SUM(amount) FILTER (WHERE type != 'deposit_refund')             AS total_revenue
       FROM payments
       WHERE ($1::date IS NULL OR paid_at >= $1)
         AND ($2::date IS NULL OR paid_at <= $2)
       GROUP BY month ORDER BY month ASC`,
      [from || null, to || null]
    )
    res.json(result.rows)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// GET /api/reports/utilization
router.get('/utilization', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT
         tt.id, tt.name AS tool_name, tt.brand, tt.category,
         a.asset_id, a.serial_number, a.status,
         COUNT(ri.id)                     AS total_rentals,
         COALESCE(SUM(ri.days_rented), 0) AS total_days_rented,
         COALESCE(SUM(ri.subtotal), 0)    AS total_revenue
       FROM tool_types tt
       JOIN assets a ON a.tool_type_id = tt.id
       LEFT JOIN rental_items ri ON ri.asset_id = a.id
       GROUP BY tt.id, a.id
       ORDER BY total_rentals DESC`
    )
    res.json(result.rows)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// GET /api/reports/overdue
router.get('/overdue', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT
         r.id, r.rental_number, r.start_date, r.expected_end_date,
         CURRENT_DATE - r.expected_end_date                                                     AS days_overdue,
         c.name AS customer_name, c.phone AS customer_phone,
         r.total_amount,
         COALESCE(SUM(p.amount) FILTER (WHERE p.type != 'deposit_refund'), 0)                  AS amount_paid,
         r.total_amount - COALESCE(SUM(p.amount) FILTER (WHERE p.type != 'deposit_refund'), 0) AS amount_due
       FROM rentals r
       JOIN customers c ON c.id = r.customer_id
       LEFT JOIN payments p ON p.rental_id = r.id
       WHERE r.status = 'active' AND r.expected_end_date < CURRENT_DATE
       GROUP BY r.id, c.id
       ORDER BY days_overdue DESC`
    )
    res.json(result.rows)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// GET /api/reports/top-customers
router.get('/top-customers', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT
         c.id, c.name, c.phone, c.email,
         COUNT(DISTINCT r.id)                                                              AS total_rentals,
         COALESCE(SUM(p.amount) FILTER (WHERE p.type != 'deposit_refund'), 0)             AS total_spent
       FROM customers c
       LEFT JOIN rentals r ON r.customer_id = c.id
       LEFT JOIN payments p ON p.rental_id = r.id
       GROUP BY c.id
       ORDER BY total_spent DESC
       LIMIT 10`
    )
    res.json(result.rows)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

export default router
