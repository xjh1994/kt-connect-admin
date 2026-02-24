const express = require('express');
const router = express.Router();
const db = require('../db');

router.get('/', async (req, res) => {
  const { sessionId } = req.query;
  try {
    let tasks;
    if (sessionId) {
      tasks = await db.all('SELECT * FROM tasks WHERE sessionId = ? ORDER BY startTime DESC', [sessionId]);
    } else {
      tasks = await db.all('SELECT * FROM tasks ORDER BY startTime DESC');
    }
    const parsedTasks = tasks.map(t => ({
      ...t,
      params: JSON.parse(t.params || '{}'),
      logs: t.logs ? JSON.parse(t.logs) : [],
    }));
    res.json({ success: true, data: parsedTasks });
  } catch (error) {
    res.json({ success: false, error: error.message });
  }
});

router.post('/', async (req, res) => {
  const { id, type, status, params, logs, startTime, endTime, sessionId } = req.body;
  
  if (!id || !type || !status || !params) {
    return res.json({ success: false, error: 'Missing required fields' });
  }
  
  try {
    await db.run(
      `INSERT INTO tasks (id, type, status, params, logs, startTime, endTime, sessionId)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, type, status, JSON.stringify(params), JSON.stringify(logs || []), startTime, endTime || null, sessionId || '']
    );
    
    const task = await db.get('SELECT * FROM tasks WHERE id = ?', [id]);
    res.json({ success: true, data: task });
  } catch (error) {
    res.json({ success: false, error: error.message });
  }
});

router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { status, logs, endTime } = req.body;
  
  try {
    const existing = await db.get('SELECT * FROM tasks WHERE id = ?', [id]);
    if (!existing) {
      return res.json({ success: false, error: 'Task not found' });
    }
    
    await db.run(
      `UPDATE tasks SET status = ?, logs = ?, endTime = ? WHERE id = ?`,
      [
        status, 
        JSON.stringify(logs || JSON.parse(existing.logs || '[]')), 
        endTime || existing.endTime, 
        id
      ]
    );
    
    const task = await db.get('SELECT * FROM tasks WHERE id = ?', [id]);
    res.json({ success: true, data: task });
  } catch (error) {
    res.json({ success: false, error: error.message });
  }
});

router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  await db.run('DELETE FROM tasks WHERE id = ?', [id]);
  res.json({ success: true });
});

module.exports = router;
