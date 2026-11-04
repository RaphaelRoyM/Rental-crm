import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

const testConnection = async () => {
  try {
    const result = await pool.query('SELECT NOW()');
    console.log('✅  Connected to Supabase PostgreSQL:', result.rows[0].now);
  } catch (err) {
    console.error('❌  Database connection failed:', err.message);
  }
};

testConnection();

export default pool;
