const sql = require('mssql');

let poolPromise = null;
let currentConfig = null;

function setConfig(cfg) {
  currentConfig = {
    user: cfg.user,
    password: cfg.password,
    server: cfg.server,
    port: cfg.port,
    database: cfg.database || 'inventory',
    options: {
      encrypt: true,
      trustServerCertificate: true
    }
  };
  poolPromise = new sql.ConnectionPool(currentConfig)
    .connect()
    .then(pool => {
      console.log('Connected to DB');
      return pool;
    })
    .catch(err => {
      console.error('DB Connection Failed', err);
      throw err;
    });
  return poolPromise;
}

if (process.env.DB_USER && process.env.DB_PASS && process.env.DB_HOST) {
  setConfig({
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    server: process.env.DB_HOST,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT ? parseInt(process.env.DB_PORT, 10) : undefined
  });
}

async function getPool() {
  if (!poolPromise) throw new Error('Database not configured');
  return poolPromise;
}

async function init() {
  const pool = await getPool();
  await pool.request().query(`
    IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='inventory_types' AND xtype='U')
    CREATE TABLE inventory_types (
      id INT IDENTITY PRIMARY KEY,
      name NVARCHAR(100) UNIQUE NOT NULL
    );
    IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='inventory_items' AND xtype='U')
    CREATE TABLE inventory_items (
      id INT IDENTITY PRIMARY KEY,
      type_id INT NOT NULL REFERENCES inventory_types(id) ON DELETE CASCADE,
      barcode NVARCHAR(100) UNIQUE NOT NULL,
      name NVARCHAR(100),
      amount INT,
      material NVARCHAR(100),
      color NVARCHAR(100),
      store_url NVARCHAR(200),
      price FLOAT,
      notes NVARCHAR(MAX)
    );
  `);
}

function isConfigured() {
  return !!poolPromise;
}

module.exports = { sql, setConfig, getPool, init, isConfigured };
