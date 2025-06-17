const { Pool } = require('pg');

let pool = null;

function setConfig(cfg) {
  pool = new Pool({
    host: cfg.server,
    port: cfg.port,
    user: cfg.user,
    password: cfg.password,
    database: cfg.database || 'inventory'
  });
  pool.on('error', err => {
    console.error('DB connection error', err);
  });
  console.log('Connected to DB');
  return pool;
}

if (process.env.DB_USER && process.env.DB_PASS) {
  setConfig({
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    server: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME,
    port: parseInt(process.env.DB_PORT || '5432', 10)
  });
}

async function getPool() {
  if (!pool) throw new Error('Database not configured');
  return pool;
}

async function init() {
  const client = await getPool().connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS inventory_types (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) UNIQUE NOT NULL
      );
      CREATE TABLE IF NOT EXISTS inventory_items (
        id SERIAL PRIMARY KEY,
        type_id INTEGER NOT NULL REFERENCES inventory_types(id) ON DELETE CASCADE,
        barcode VARCHAR(100) UNIQUE NOT NULL,
        name VARCHAR(100),
        amount INTEGER,
        material VARCHAR(100),
        color VARCHAR(100),
        store_url VARCHAR(200),
        price REAL,
        notes TEXT
      );
    `);
  } finally {
    client.release();
  }
}

function isConfigured() {
  return !!pool;
}

module.exports = { setConfig, getPool, init, isConfigured };
