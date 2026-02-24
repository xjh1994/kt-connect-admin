const express = require('express');
const { readFile, writeFile } = require('fs').promises;
const { existsSync } = require('fs');
const router = express.Router();

const HOSTS_PATH = process.platform === 'win32' 
  ? 'C:\\Windows\\System32\\drivers\\etc\\hosts' 
  : '/etc/hosts';

const MARKER_START = '# kt-connect-admin-start';
const MARKER_END = '# kt-connect-admin-end';

async function readHosts() {
  try {
    if (!existsSync(HOSTS_PATH)) {
      return '';
    }
    return await readFile(HOSTS_PATH, 'utf-8');
  } catch (error) {
    console.error('Error reading hosts file:', error);
    return '';
  }
}

async function writeHosts(content) {
  await writeFile(HOSTS_PATH, content, 'utf-8');
}

router.get('/read', async (req, res) => {
  try {
    const content = await readHosts();
    res.json({ success: true, data: content });
  } catch (error) {
    res.json({ success: false, error: error.message });
  }
});

router.post('/write', async (req, res) => {
  try {
    const { entries } = req.body;
    
    if (!entries || !Array.isArray(entries)) {
      return res.json({ success: false, error: 'Entries array is required' });
    }
    
    let content = await readHosts();
    
    const existingWithoutMarker = content.split(MARKER_START)[0] + 
      (content.includes(MARKER_END) ? content.split(MARKER_END)[1] : '');
    
    const newEntries = entries
      .map(e => `${e.ip}\t${e.hostname}`)
      .join('\n');
    
    const newContent = existingWithoutMarker.trim() + '\n\n' +
      MARKER_START + '\n' +
      newEntries + '\n' +
      MARKER_END + '\n';
    
    await writeHosts(newContent);
    res.json({ success: true });
  } catch (error) {
    res.json({ success: false, error: error.message });
  }
});

router.post('/add', async (req, res) => {
  try {
    const { ip, hostname } = req.body;
    
    if (!ip || !hostname) {
      return res.json({ success: false, error: 'IP and hostname are required' });
    }
    
    let content = await readHosts();
    
    if (content.includes(hostname)) {
      return res.json({ success: true, message: 'Entry already exists' });
    }
    
    const newEntry = `\n${MARKER_START}\n${ip}\t${hostname}\n${MARKER_END}\n`;
    content = content.trim() + newEntry;
    
    await writeHosts(content);
    res.json({ success: true });
  } catch (error) {
    res.json({ success: false, error: error.message });
  }
});

router.post('/remove', async (req, res) => {
  try {
    const { hostname } = req.body;
    
    if (!hostname) {
      return res.json({ success: false, error: 'Hostname is required' });
    }
    
    let content = await readHosts();
    
    const lines = content.split('\n');
    const filteredLines = lines.filter(line => !line.includes(hostname));
    
    await writeHosts(filteredLines.join('\n'));
    res.json({ success: true });
  } catch (error) {
    res.json({ success: false, error: error.message });
  }
});

module.exports = router;
