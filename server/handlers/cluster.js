const express = require('express');
const { writeFile, mkdir } = require('fs').promises;
const { existsSync } = require('fs');
const path = require('path');
const router = express.Router();
const db = require('../db');

const CONFIG_DIR = path.join(process.cwd(), 'kubeconfigs');

async function ensureConfigDir() {
  if (!existsSync(CONFIG_DIR)) {
    await mkdir(CONFIG_DIR, { recursive: true });
  }
}

router.get('/', async (req, res) => {
  try {
    const clusters = await db.all('SELECT * FROM clusters ORDER BY createdAt DESC');
    res.json({ success: true, data: clusters });
  } catch (error) {
    res.json({ success: false, error: error.message });
  }
});

router.post('/', async (req, res) => {
  const { name, kubeconfig, apiServer, apiServerHost, clusterIp, namespace, includeIps, autoHosts } = req.body;
  
  if (!name || !kubeconfig) {
    return res.json({ success: false, error: 'Name and kubeconfig are required' });
  }
  
  const id = Math.random().toString(36).substring(2, 15);
  const now = new Date().toISOString();
  
  try {
    await db.run(
      `INSERT INTO clusters (id, name, kubeconfig, apiServer, apiServerHost, clusterIp, namespace, includeIps, autoHosts, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, name, kubeconfig, apiServer || '', apiServerHost || '', clusterIp || '', namespace || 'default', includeIps || '', autoHosts ? 1 : 0, now, now]
    );
    
    const cluster = await db.get('SELECT * FROM clusters WHERE id = ?', [id]);
    res.json({ success: true, data: cluster });
  } catch (error) {
    res.json({ success: false, error: error.message });
  }
});

router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { name, kubeconfig, apiServer, apiServerHost, clusterIp, namespace, includeIps, autoHosts } = req.body;
  
  const existing = await db.get('SELECT * FROM clusters WHERE id = ?', [id]);
  if (!existing) {
    return res.json({ success: false, error: 'Cluster not found' });
  }
  
  const now = new Date().toISOString();
  
  if (kubeconfig && kubeconfig !== existing.kubeconfig) {
    try {
      await ensureConfigDir();
      await writeFile(path.join(CONFIG_DIR, `${id}.yaml`), kubeconfig, 'utf-8');
    } catch (error) {
      return res.json({ success: false, error: error.message });
    }
  }
  
  await db.run(
    `UPDATE clusters SET name = ?, kubeconfig = ?, apiServer = ?, apiServerHost = ?, clusterIp = ?, namespace = ?, includeIps = ?, autoHosts = ?, updatedAt = ?
     WHERE id = ?`,
    [name, kubeconfig || existing.kubeconfig, apiServer || '', apiServerHost || '', clusterIp || '', namespace || 'default', includeIps || '', autoHosts ? 1 : 0, now, id]
  );
  
  const cluster = await db.get('SELECT * FROM clusters WHERE id = ?', [id]);
  res.json({ success: true, data: cluster });
});

router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  await db.run('DELETE FROM clusters WHERE id = ?', [id]);
  res.json({ success: true });
});

router.post('/:id/test', async (req, res) => {
  const { id } = req.params;
  const cluster = await db.get('SELECT * FROM clusters WHERE id = ?', [id]);
  
  if (!cluster) {
    return res.json({ success: false, error: 'Cluster not found' });
  }
  
  res.json({ success: true, data: { valid: true, message: 'Connection test not implemented in demo mode' } });
});

module.exports = router;
