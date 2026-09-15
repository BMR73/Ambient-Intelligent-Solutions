/**
 * KDS (Kitchen Display System) - Server
 * Express + SQLite backend with Ready/Complete order lifecycle
 */

const express = require('express');
const Database = require('better-sqlite3');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;
const DB_PATH = process.env.DB_PATH || path.join(__dirname, 'kds.db');

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// ─── Database Setup ───────────────────────────────────────────────────────────
const db = new Database(DB_PATH);

db.exec(`
  CREATE TABLE IF NOT EXISTS orders (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    table_number TEXT    NOT NULL,
    items        TEXT    NOT NULL,
    notes        TEXT    DEFAULT '',
    status       TEXT    NOT NULL DEFAULT 'pending',
    ready        INTEGER NOT NULL DEFAULT 0,
    ready_at     TEXT    DEFAULT NULL,
    completed_at TEXT    DEFAULT NULL,
    created_at   TEXT    NOT NULL DEFAULT (datetime('now'))
  );
`);

// Idempotent migrations for existing databases
try { db.exec(`ALTER TABLE orders ADD COLUMN ready     INTEGER NOT NULL DEFAULT 0`); } catch (_) {}
try { db.exec(`ALTER TABLE orders ADD COLUMN ready_at  TEXT    DEFAULT NULL`);       } catch (_) {}
try { db.exec(`ALTER TABLE orders ADD COLUMN status    TEXT    NOT NULL DEFAULT 'pending'`); } catch (_) {}
try { db.exec(`ALTER TABLE orders ADD COLUMN completed_at TEXT DEFAULT NULL`);       } catch (_) {}

// ─── Prepared Statements ──────────────────────────────────────────────────────
const stmts = {
  getAllActive: db.prepare(`SELECT * FROM orders WHERE status != 'complete' ORDER BY created_at ASC`),
  getAll:       db.prepare(`SELECT * FROM orders ORDER BY created_at DESC`),
  getById:      db.prepare(`SELECT * FROM orders WHERE id = ?`),
  insert:       db.prepare(`INSERT INTO orders (table_number, items, notes) VALUES (@table_number, @items, @notes)`),
  setReady:     db.prepare(`UPDATE orders SET ready = @ready, ready_at = @ready_at, status = @status WHERE id = @id`),
  setComplete:  db.prepare(`UPDATE orders SET status = 'complete', completed_at = datetime('now') WHERE id = ?`),
  deleteOrder:  db.prepare(`DELETE FROM orders WHERE id = ?`),
};

function parseOrder(row) {
  if (!row) return null;
  return { ...row, items: JSON.parse(row.items), ready: row.ready === 1 };
}

function nowISO() { return new Date().toISOString(); }

// ─── Routes ───────────────────────────────────────────────────────────────────

// GET /api/orders  — active orders; ?all=true for all including completed
app.get('/api/orders', (req, res) => {
  try {
    const rows = req.query.all === 'true' ? stmts.getAll.all() : stmts.getAllActive.all();
    res.json(rows.map(parseOrder));
  } catch (err) { res.status(500).json({ error: 'Failed to fetch orders.' }); }
});

// GET /api/orders/:id
app.get('/api/orders/:id', (req, res) => {
  try {
    const row = stmts.getById.get(req.params.id);
    if (!row) return res.status(404).json({ error: 'Order not found.' });
    res.json(parseOrder(row));
  } catch (err) { res.status(500).json({ error: 'Failed to fetch order.' }); }
});

// POST /api/orders  — create order
// Body: { table_number, items: string[], notes? }
app.post('/api/orders', (req, res) => {
  try {
    const { table_number, items, notes = '' } = req.body;
    if (!table_number || !Array.isArray(items) || items.length === 0)
      return res.status(400).json({ error: 'table_number and a non-empty items array are required.' });

    const info = stmts.insert.run({
      table_number: String(table_number).trim(),
      items: JSON.stringify(items.map(String)),
      notes: String(notes).trim(),
    });
    res.status(201).json(parseOrder(stmts.getById.get(info.lastInsertRowid)));
  } catch (err) { res.status(500).json({ error: 'Failed to create order.' }); }
});

// POST /api/order/ready  — toggle ready state
// Body: { id: number, ready: boolean }
// ready=true  → status='ready',   sets ready_at timestamp
// ready=false → status='pending', clears ready_at
app.post('/api/order/ready', (req, res) => {
  try {
    const { id, ready } = req.body;
    if (id === undefined || ready === undefined)
      return res.status(400).json({ error: 'id and ready fields are required.' });

    const existing = stmts.getById.get(Number(id));
    if (!existing)              return res.status(404).json({ error: 'Order not found.' });
    if (existing.status === 'complete') return res.status(409).json({ error: 'Cannot modify a completed order.' });

    const isReady = Boolean(ready);
    stmts.setReady.run({
      id:       Number(id),
      ready:    isReady ? 1 : 0,
      ready_at: isReady ? nowISO() : null,
      status:   isReady ? 'ready' : 'pending',
    });

    res.json(parseOrder(stmts.getById.get(Number(id))));
  } catch
