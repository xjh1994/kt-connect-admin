require('dotenv').config();
const express = require('express');
const cors = require('cors');
const clusterHandler = require('./handlers/cluster');
const commandHandler = require('./handlers/command');
const hostsHandler = require('./handlers/hosts');
const taskHandler = require('./handlers/task');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json({ limit: '10mb' }));

app.use('/api/clusters', clusterHandler);
app.use('/api/command', commandHandler);
app.use('/api/hosts', hostsHandler);
app.use('/api/tasks', taskHandler);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`KT Connect Admin API running on port ${PORT}`);
});
