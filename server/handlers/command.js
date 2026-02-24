const express = require('express');
const { spawn } = require('child_process');
const { writeFile, readFile, unlink } = require('fs').promises;
const db = require('../db');
const router = express.Router();

const runningProcesses = new Map();
const taskLogs = new Map();
const tempFiles = new Map();

const HOSTS_PATH = process.platform === 'win32' 
  ? 'C:\\Windows\\System32\\drivers\\etc\\hosts' 
  : '/etc/hosts';

const HOSTS_MARKER_START = '# kt-connect-admin-start';
const HOSTS_MARKER_END = '# kt-connect-admin-end';

async function addHostsEntry(ip, hostname) {
  try {
    const content = await readFile(HOSTS_PATH, 'utf-8');
    
    let newContent;
    if (content.includes(hostname)) {
      const lines = content.split('\n');
      const filteredLines = lines.filter(line => !line.includes(hostname));
      newContent = filteredLines.join('\n');
    } else {
      newContent = content.trim();
    }
    
    newContent = newContent + '\n' + HOSTS_MARKER_START + '\n' + 
                 `${ip}\t${hostname}\n` + 
                 HOSTS_MARKER_END + '\n';
    
    await writeFile(HOSTS_PATH, newContent, 'utf-8');
    console.log(`Added hosts entry: ${ip} ${hostname}`);
  } catch (error) {
    console.error(`Failed to add hosts entry:`, error.message);
    throw error;
  }
}

async function removeHostsEntry(hostname) {
  try {
    const content = await readFile(HOSTS_PATH, 'utf-8');
    const lines = content.split('\n');
    
    let inBlock = false;
    let hasHostname = false;
    const filteredLines = lines.filter(line => {
      if (line.includes(HOSTS_MARKER_START)) {
        inBlock = true;
        return true;
      }
      if (line.includes(HOSTS_MARKER_END)) {
        const shouldKeep = hasHostname;
        inBlock = false;
        hasHostname = false;
        return shouldKeep;
      }
      if (inBlock) {
        if (line.includes(hostname)) {
          hasHostname = true;
          return false;
        }
      }
      return true;
    });
    
    await writeFile(HOSTS_PATH, filteredLines.join('\n'), 'utf-8');
    console.log(`Removed hosts entry for ${hostname}`);
  } catch (error) {
    console.error(`Failed to remove hosts entry:`, error.message);
  }
}

router.get('/logs/:taskId', (req, res) => {
  const { taskId } = req.params;
  
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  
  const sendLog = (log) => {
    const data = `data: ${JSON.stringify({ log })}\n\n`;
    res.write(data);
  };
  
  if (!taskLogs.has(taskId)) {
    taskLogs.set(taskId, []);
  }
  
  const logs = taskLogs.get(taskId);
  let sentCount = 0;
  logs.forEach(sendLog);
  
  const interval = setInterval(() => {
    if (logs.length > sentCount) {
      const newLogs = logs.slice(sentCount);
      newLogs.forEach(sendLog);
      sentCount = logs.length;
    }
  }, 500);
  
  req.on('close', () => {
    clearInterval(interval);
  });
});

router.post('/execute', async (req, res) => {
  const { type, command, taskId, autoHosts, apiServerHost, clusterIp, cleanupOld, kubeconfig } = req.body;
  
  if (!command) {
    return res.json({ success: false, error: 'Command is required' });
  }
  
  if (!taskId) {
    return res.json({ success: false, error: 'TaskId is required' });
  }

  if (cleanupOld) {
    const oldEntries = Array.from(runningProcesses.values())
      .filter(p => p.apiServerHost)
      .map(p => p.apiServerHost);
    for (const host of oldEntries) {
      await removeHostsEntry(host);
    }
  }

  if (autoHosts && apiServerHost && clusterIp) {
    try {
      await addHostsEntry(clusterIp, apiServerHost);
    } catch (e) {
      console.error(`Failed to add hosts:`, e.message);
    }
  }

  let tempKubeconfigPath = null;
  
  if (kubeconfig) {
    try {
      const tempDir = '/tmp/kt-connect';
      tempKubeconfigPath = `${tempDir}/kubeconfig-${taskId}.yaml`;
      await writeFile(tempKubeconfigPath, kubeconfig, 'utf-8');
      tempFiles.set(taskId, tempKubeconfigPath);
    } catch (error) {
      console.error(`Failed to write kubeconfig:`, error.message);
    }
  }

  taskLogs.set(taskId, []);
  const addLog = (log) => {
    const logs = taskLogs.get(taskId) || [];
    logs.push(log);
    taskLogs.set(taskId, logs);
  };

  const isWindows = process.platform === 'win32';
  
  let finalCommand = command;
  if (tempKubeconfigPath) {
    finalCommand = command.replace(/--kubeconfig\s+\S+/, `--kubeconfig ${tempKubeconfigPath}`);
  }
  
  const shell = isWindows ? 'cmd.exe' : '/bin/bash';
  const shellArgs = isWindows ? ['/c', finalCommand] : ['-c', finalCommand];
  
  const proc = spawn(shell, shellArgs, {
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  
  const pid = proc.pid;
  runningProcesses.set(taskId, { proc, apiServerHost, autoHosts });
  addLog(`[${new Date().toISOString()}] Starting: ${finalCommand}`);
  
  proc.stdout.on('data', (data) => {
    const log = data.toString().trim();
    log.split('\n').forEach(line => addLog(line));
    console.log(`[${taskId}] ${log}`);
  });
  
  proc.stderr.on('data', (data) => {
    const log = data.toString().trim();
    log.split('\n').forEach(line => addLog(line));
    console.error(`[${taskId}] ${log}`);
  });
  
  proc.on('close', async (code) => {
    addLog(`[${new Date().toISOString()}] Process exited with code ${code}`);
    console.log(`[${taskId}] Process exited with code ${code}`);
    
    if (tempKubeconfigPath) {
      try {
        await unlink(tempKubeconfigPath);
        tempFiles.delete(taskId);
      } catch (e) {}
    }
    
    const status = code === 0 ? 'success' : 'error';
    try {
      await db.run('UPDATE tasks SET status = ?, endTime = ? WHERE id = ?', [status, new Date().toISOString(), taskId]);
    } catch (e) {
      console.error('Failed to update task status:', e);
    }
    
    runningProcesses.delete(taskId);
  });
  
  proc.on('error', async (err) => {
    addLog(`[${new Date().toISOString()}] Process error: ${err.message}`);
    console.error(`[${taskId}] Process error: ${err}`);
    
    if (tempKubeconfigPath) {
      try {
        await unlink(tempKubeconfigPath);
        tempFiles.delete(taskId);
      } catch (e) {}
    }
    
    try {
      await db.run('UPDATE tasks SET status = ?, endTime = ? WHERE id = ?', ['error', new Date().toISOString(), taskId]);
    } catch (e) {
      console.error('Failed to update task status:', e);
    }
    
    runningProcesses.delete(taskId);
  });
  
  res.json({ success: true, data: { taskId, pid, hostsEntry: { ip: clusterIp, hostname: apiServerHost } } });
});

router.post('/stop', async (req, res) => {
  const { taskId, removeHosts } = req.body;
  
  const taskInfo = runningProcesses.get(taskId);
  if (!taskInfo) {
    return res.json({ success: false, error: 'Process not found' });
  }
  
  const { proc, apiServerHost, autoHosts } = taskInfo;
  
  if (process.platform === 'win32') {
    spawn('taskkill', ['/pid', proc.pid.toString(), '/f', '/t']);
  } else {
    proc.kill('SIGTERM');
  }
  
  if (removeHosts && apiServerHost) {
    await removeHostsEntry(apiServerHost);
  }
  
  if (tempFiles.has(taskId)) {
    try {
      await unlink(tempFiles.get(taskId));
      tempFiles.delete(taskId);
    } catch (e) {}
  }

  try {
    await db.run('UPDATE tasks SET status = ?, endTime = ? WHERE id = ?', ['stopped', new Date().toISOString(), taskId]);
  } catch (e) {
    console.error('Failed to update task status:', e);
  }
  
  runningProcesses.delete(taskId);
  res.json({ success: true });
});

module.exports = router;
