require('dotenv').config();
const express = require('express');
const fetch = require('node-fetch');
const db = require('./db');

const app = express();
app.use(express.json({limit: '2mb'}));

// Initialize database tables
db.init().catch(err => {
  console.error('DB init failed', err);
  process.exit(1);
});

app.post('/api/parse-invoice', async (req, res) => {
  const text = req.body && req.body.text;
  if (!text) return res.status(400).json({ error: 'No text provided' });

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'Missing OPENAI_API_KEY' });

  try {
    const openaiRes = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: 'Extract invoice line items from the given text. Respond with a JSON array of objects {"name": string, "amount": number, "price": number}.'
          },
          { role: 'user', content: text }
        ],
        temperature: 0.2
      })
    });

    if (!openaiRes.ok) {
      const errText = await openaiRes.text();
      console.error('OpenAI error', openaiRes.status, errText);
      return res.status(500).json({ error: 'OpenAI request failed' });
    }

    const data = await openaiRes.json();
    const content = data.choices && data.choices[0].message.content.trim();
    let items;
    try {
      items = JSON.parse(content);
    } catch (err) {
      console.error('Parse error', err);
      return res.status(500).json({ error: 'Failed to parse OpenAI response' });
    }
    res.json(items);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Inventory Types
app.get('/api/types', async (req, res) => {
  try {
    const pool = await db.poolPromise;
    const result = await pool.request().query('SELECT name FROM inventory_types ORDER BY name');
    res.json(result.recordset.map(r => r.name));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'DB error' });
  }
});

app.post('/api/types', async (req, res) => {
  const name = req.body && req.body.name;
  if (!name) return res.status(400).json({ error: 'Missing name' });
  try {
    const pool = await db.poolPromise;
    await pool.request().input('name', db.sql.NVarChar, name).query('INSERT INTO inventory_types(name) VALUES (@name)');
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'DB error' });
  }
});

app.delete('/api/types/:name', async (req, res) => {
  const name = req.params.name;
  try {
    const pool = await db.poolPromise;
    await pool.request().input('name', db.sql.NVarChar, name).query('DELETE FROM inventory_types WHERE name=@name');
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'DB error' });
  }
});

// Inventory Items
app.get('/api/items/:type', async (req, res) => {
  const type = req.params.type;
  try {
    const pool = await db.poolPromise;
    const result = await pool.request()
      .input('name', db.sql.NVarChar, type)
      .query(`SELECT it.* FROM inventory_items it JOIN inventory_types t ON it.type_id=t.id WHERE t.name=@name`);
    res.json(result.recordset);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'DB error' });
  }
});

app.post('/api/items/:type', async (req, res) => {
  const type = req.params.type;
  const item = req.body;
  if (!item || !item.barcode) return res.status(400).json({ error: 'Missing item data' });
  try {
    const pool = await db.poolPromise;
    const result = await pool.request()
      .input('name', db.sql.NVarChar, type)
      .query('SELECT id FROM inventory_types WHERE name=@name');
    if (!result.recordset.length) return res.status(400).json({ error: 'Invalid type' });
    const typeId = result.recordset[0].id;
    const request = pool.request()
      .input('type_id', db.sql.Int, typeId)
      .input('barcode', db.sql.NVarChar, item.barcode)
      .input('name', db.sql.NVarChar, item.name || '')
      .input('amount', db.sql.Int, item.amount || 0)
      .input('material', db.sql.NVarChar, item.material || '')
      .input('color', db.sql.NVarChar, item.color || '')
      .input('store_url', db.sql.NVarChar, item.store_url || '')
      .input('price', db.sql.Float, item.price || 0)
      .input('notes', db.sql.NVarChar, item.notes || '');
    await request.query(`INSERT INTO inventory_items(type_id, barcode, name, amount, material, color, store_url, price, notes)
                         VALUES (@type_id, @barcode, @name, @amount, @material, @color, @store_url, @price, @notes)`);
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'DB error' });
  }
});

app.put('/api/items/:type/:barcode', async (req, res) => {
  const type = req.params.type;
  const barcode = req.params.barcode;
  const item = req.body || {};
  try {
    const pool = await db.poolPromise;
    const result = await pool.request()
      .input('name', db.sql.NVarChar, type)
      .query('SELECT id FROM inventory_types WHERE name=@name');
    if (!result.recordset.length) return res.status(400).json({ error: 'Invalid type' });
    const typeId = result.recordset[0].id;
    const request = pool.request()
      .input('type_id', db.sql.Int, typeId)
      .input('barcode', db.sql.NVarChar, barcode)
      .input('name', db.sql.NVarChar, item.name || '')
      .input('amount', db.sql.Int, item.amount || 0)
      .input('material', db.sql.NVarChar, item.material || '')
      .input('color', db.sql.NVarChar, item.color || '')
      .input('store_url', db.sql.NVarChar, item.store_url || '')
      .input('price', db.sql.Float, item.price || 0)
      .input('notes', db.sql.NVarChar, item.notes || '');
    await request.query(`UPDATE inventory_items
      SET name=@name, amount=@amount, material=@material, color=@color, store_url=@store_url, price=@price, notes=@notes
      WHERE barcode=@barcode AND type_id=@type_id`);
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'DB error' });
  }
});

app.delete('/api/items/:type/:barcode', async (req, res) => {
  const type = req.params.type;
  const barcode = req.params.barcode;
  try {
    const pool = await db.poolPromise;
    const result = await pool.request()
      .input('name', db.sql.NVarChar, type)
      .query('SELECT id FROM inventory_types WHERE name=@name');
    if (!result.recordset.length) return res.status(400).json({ error: 'Invalid type' });
    const typeId = result.recordset[0].id;
    await pool.request()
      .input('barcode', db.sql.NVarChar, barcode)
      .input('type_id', db.sql.Int, typeId)
      .query('DELETE FROM inventory_items WHERE barcode=@barcode AND type_id=@type_id');
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'DB error' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
