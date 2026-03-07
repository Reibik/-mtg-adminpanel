require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const db = require('./db');
const ssh = require('./ssh');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

// ─── Auth ─────────────────────────────────────────────────
const AUTH_TOKEN = process.env.AUTH_TOKEN || 'changeme';
app.use('/api', (req, res, next) => {
  const token = req.headers['x-auth-token'] || req.query.token;
  if (token !== AUTH_TOKEN) return res.status(401).json({ error: 'Unauthorized' });
  next();
});

// ══════════════════════════════════════════════════════════
// NODES
// ══════════════════════════════════════════════════════════

app.get('/api/nodes', (req, res) => {
  const nodes = db.prepare('SELECT id, name, host, ssh_user, ssh_port, base_dir, start_port, created_at FROM nodes').all();
  res.json(nodes);
});

app.post('/api/nodes', (req, res) => {
  const { name, host, ssh_user, ssh_port, ssh_key, ssh_password, base_dir, start_port } = req.body;
  if (!name || !host) return res.status(400).json({ error: 'name и host обязательны' });

  const result = db.prepare(`
    INSERT INTO nodes (name, host, ssh_user, ssh_port, ssh_key, ssh_password, base_dir, start_port)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(name, host, ssh_user || 'root', ssh_port || 22, ssh_key || null, ssh_password || null, base_dir || '/opt/mtg/users', start_port || 4433);

  res.json({ id: result.lastInsertRowid, name, host });
});

app.put('/api/nodes/:id', (req, res) => {
  const { name, host, ssh_user, ssh_port, ssh_key, ssh_password, base_dir, start_port } = req.body;
  const node = db.prepare('SELECT * FROM nodes WHERE id = ?').get(req.params.id);
  if (!node) return res.status(404).json({ error: 'Node not found' });

  db.prepare(`
    UPDATE nodes SET name=?, host=?, ssh_user=?, ssh_port=?, ssh_key=?, ssh_password=?, base_dir=?, start_port=?
    WHERE id=?
  `).run(
    name || node.name,
    host || node.host,
    ssh_user || node.ssh_user,
    ssh_port || node.ssh_port,
    ssh_key !== undefined ? ssh_key : node.ssh_key,
    ssh_password !== undefined ? ssh_password : node.ssh_password,
    base_dir || node.base_dir,
    start_port || node.start_port,
    req.params.id
  );

  res.json({ ok: true });
});

app.delete('/api/nodes/:id', (req, res) => {
  db.prepare('DELETE FROM nodes WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

app.get('/api/nodes/:id/check', async (req, res) => {
  const node = db.prepare('SELECT * FROM nodes WHERE id = ?').get(req.params.id);
  if (!node) return res.status(404).json({ error: 'Not found' });
  try {
    const online = await ssh.checkNode(node);
    res.json({ online });
  } catch (e) {
    res.json({ online: false, error: e.message });
  }
});

app.get('/api/nodes/:id/status', async (req, res) => {
  const node = db.prepare('SELECT * FROM nodes WHERE id = ?').get(req.params.id);
  if (!node) return res.status(404).json({ error: 'Not found' });
  try {
    const status = await ssh.getNodeStatus(node);
    res.json(status);
  } catch (e) {
    res.json({ online: false, containers: 0, error: e.message });
  }
});

app.get('/api/status', async (req, res) => {
  const nodes = db.prepare('SELECT * FROM nodes').all();
  const results = await Promise.allSettled(
    nodes.map(async node => {
      const status = await ssh.getNodeStatus(node);
      return { id: node.id, name: node.name, host: node.host, ...status };
    })
  );
  res.json(results.map((r, i) => r.status === 'fulfilled' ? r.value : { id: nodes[i].id, name: nodes[i].name, online: false }));
});

// ══════════════════════════════════════════════════════════
// USERS
// ══════════════════════════════════════════════════════════

app.get('/api/nodes/:id/users', async (req, res) => {
  const node = db.prepare('SELECT * FROM nodes WHERE id = ?').get(req.params.id);
  if (!node) return res.status(404).json({ error: 'Not found' });

  const dbUsers = db.prepare('SELECT * FROM users WHERE node_id = ?').all(req.params.id);

  try {
    const remoteUsers = await ssh.getRemoteUsers(node);
    const merged = dbUsers.map(u => {
      const remote = remoteUsers.find(r => r.name === u.name);
      return {
        ...u,
        connections: remote ? remote.connections : 0,
        running: remote ? !remote.status.includes('stopped') : false,
        link: `https://t.me/proxy?server=${node.host}&port=${u.port}&secret=${u.secret}`
      };
    });
    res.json(merged);
  } catch {
    res.json(dbUsers.map(u => ({
      ...u,
      connections: 0,
      running: false,
      link: `https://t.me/proxy?server=${node.host}&port=${u.port}&secret=${u.secret}`
    })));
  }
});

app.post('/api/nodes/:id/users', async (req, res) => {
  const node = db.prepare('SELECT * FROM nodes WHERE id = ?').get(req.params.id);
  if (!node) return res.status(404).json({ error: 'Node not found' });

  const { name } = req.body;
  if (!name) return res.status(400).json({ error: 'name required' });

  const exists = db.prepare('SELECT id FROM users WHERE node_id = ? AND name = ?').get(req.params.id, name);
  if (exists) return res.status(400).json({ error: 'User already exists' });

  try {
    const { port, secret } = await ssh.createRemoteUser(node, name);
    const result = db.prepare(
      'INSERT INTO users (node_id, name, port, secret) VALUES (?, ?, ?, ?)'
    ).run(req.params.id, name, port, secret);

    res.json({
      id: result.lastInsertRowid, name, port, secret,
      link: `https://t.me/proxy?server=${node.host}&port=${port}&secret=${secret}`
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.delete('/api/nodes/:id/users/:name', async (req, res) => {
  const node = db.prepare('SELECT * FROM nodes WHERE id = ?').get(req.params.id);
  if (!node) return res.status(404).json({ error: 'Node not found' });

  try {
    await ssh.removeRemoteUser(node, req.params.name);
    db.prepare('DELETE FROM users WHERE node_id = ? AND name = ?').run(req.params.id, req.params.name);
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/nodes/:id/users/:name/stop', async (req, res) => {
  const node = db.prepare('SELECT * FROM nodes WHERE id = ?').get(req.params.id);
  if (!node) return res.status(404).json({ error: 'Node not found' });
  try {
    await ssh.stopRemoteUser(node, req.params.name);
    db.prepare('UPDATE users SET status = ? WHERE node_id = ? AND name = ?').run('stopped', req.params.id, req.params.name);
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/nodes/:id/users/:name/start', async (req, res) => {
  const node = db.prepare('SELECT * FROM nodes WHERE id = ?').get(req.params.id);
  if (!node) return res.status(404).json({ error: 'Node not found' });
  try {
    await ssh.startRemoteUser(node, req.params.name);
    db.prepare('UPDATE users SET status = ? WHERE node_id = ? AND name = ?').run('active', req.params.id, req.params.name);
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

app.listen(PORT, () => {
  console.log(`🔒 MTG Panel running on http://0.0.0.0:${PORT}`);
  console.log(`🔑 Auth token: ${AUTH_TOKEN}`);
});
