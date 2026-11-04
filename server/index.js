import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import pool from './config/db.js'

import authRouter        from './routes/auth.js'
import usersRouter       from './routes/users.js'
import customersRouter   from './routes/customers.js'
import suppliersRouter   from './routes/suppliers.js'
import categoriesRouter  from './routes/categories.js'
import toolTypesRouter   from './routes/toolTypes.js'
import assetsRouter      from './routes/assets.js'
import rentalsRouter     from './routes/rentals.js'
import paymentsRouter    from './routes/payments.js'
import maintenanceRouter from './routes/maintenance.js'
import damageRouter      from './routes/damage.js'
import reportsRouter     from './routes/reports.js'

const app = express()

// ── Middleware ───────────────────────────────────────────────
app.use(cors())
app.use(express.json())

// ── Health check ─────────────────────────────────────────────
app.get('/api/health', async (req, res) => {
  try {
    const result = await pool.query('SELECT NOW() AS time')
    res.json({ status: 'ok', db: 'connected', serverTime: result.rows[0].time })
  } catch (err) {
    res.status(500).json({ status: 'error', db: 'disconnected', message: err.message })
  }
})

// ── Routes ───────────────────────────────────────────────────
app.use('/api/auth',        authRouter)
app.use('/api/users',       usersRouter)
app.use('/api/customers',   customersRouter)
app.use('/api/suppliers',   suppliersRouter)
app.use('/api/categories',  categoriesRouter)
app.use('/api/tool-types',  toolTypesRouter)
app.use('/api/assets',      assetsRouter)
app.use('/api/rentals',     rentalsRouter)
app.use('/api/payments',    paymentsRouter)
app.use('/api/maintenance', maintenanceRouter)
app.use('/api/damage',      damageRouter)
app.use('/api/reports',     reportsRouter)

// ── 404 ──────────────────────────────────────────────────────
app.use((req, res) => res.status(404).json({ message: 'Route not found' }))

// ── Error handler ────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error(err.stack)
  res.status(500).json({ message: 'Internal server error' })
})

// ── Start ────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000
app.listen(PORT, () => console.log(`🚀  Server running on http://localhost:${PORT}`))
