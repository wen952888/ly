import express from 'express';
import { createServer as createViteServer } from 'vite';
import Database from 'better-sqlite3';

const db = new Database('local-mock.db');

async function startServer() {
  const app = express();
  app.use(express.json());

  // Mock /api/init
  app.get('/api/init', (req, res) => {
    try {
      db.exec(`
        CREATE TABLE IF NOT EXISTS draws (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          draw_date TEXT NOT NULL,
          numbers TEXT NOT NULL,
          special INTEGER NOT NULL,
          created_at INTEGER NOT NULL
        );
      `);
      res.json({ success: true, message: "Table created or exists" });
    } catch (e: any) {
      res.status(500).json({ success: false, error: e.message });
    }
  });

  // Mock /api/latest
  app.get('/api/latest', (req, res) => {
    try {
      const stmt = db.prepare("SELECT * FROM draws ORDER BY created_at DESC LIMIT 1");
      const draw = stmt.get() as any;
      if (draw) {
        draw.numbers = JSON.parse(draw.numbers);
        res.json({ success: true, draw });
      } else {
        res.json({ success: true, draw: null });
      }
    } catch (e: any) {
      res.status(500).json({ success: false, error: e.message });
    }
  });

  // Mock /api/history
  app.get('/api/history', (req, res) => {
    try {
      const stmt = db.prepare("SELECT * FROM draws ORDER BY created_at DESC LIMIT 20");
      const results = stmt.all() as any[];
      const history = results.map(draw => ({
        ...draw,
        numbers: JSON.parse(draw.numbers)
      }));
      res.json({ success: true, history });
    } catch (e: any) {
      res.status(500).json({ success: false, error: e.message });
    }
  });

  // Mock /api/draw
  app.post('/api/draw', (req, res) => {
    const nums: number[] = [];
    while (nums.length < 7) {
      const r = Math.floor(Math.random() * 49) + 1;
      if (!nums.includes(r)) nums.push(r);
    }
    const special = nums.pop()!;
    const numbers = nums.sort((a, b) => a - b);
    
    const hkTime = new Date(new Date().getTime() + 8 * 3600 * 1000);
    const draw_date = hkTime.toISOString().split('T')[0];
    const created_at = Date.now();

    try {
      const checkStmt = db.prepare("SELECT id FROM draws WHERE draw_date = ?");
      const existing = checkStmt.all(draw_date);
      if (existing && existing.length > 0) {
        return res.json({ success: false, message: "Already drawn today" });
      }

      const stmt = db.prepare("INSERT INTO draws (draw_date, numbers, special, created_at) VALUES (?, ?, ?, ?)");
      stmt.run(draw_date, JSON.stringify(numbers), special, created_at);

      res.json({ success: true, draw: { draw_date, numbers, special, created_at } });
    } catch (e: any) {
      res.status(500).json({ success: false, error: e.message });
    }
  });

  // Vite middleware
  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: 'spa',
  });
  app.use(vite.middlewares);

  app.listen(3000, '0.0.0.0', () => {
    console.log('Server running on port 3000');
  });
}

startServer();
