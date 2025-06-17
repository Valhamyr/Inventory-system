const sql = require('mssql');

const config = {
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  server: process.env.DB_HOST,
  database: process.env.DB_NAME || 'inventory',
  options: {
    encrypt: true,
    trustServerCertificate: true
  }
};

const poolPromise = new sql.ConnectionPool(config)
  .connect()
  .then(pool => {
    console.log('Connected to DB');
    return pool;
  })
  .catch(err => {
    console.error('DB Connection Failed', err);
    throw err;
  });

async function init() {
  const pool = await poolPromise;
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

module.exports = { sql, poolPromise, init };
