const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3000;
const DB_FILE = path.join(__dirname, 'backend_db.json');

app.use(cors());
app.use(express.json());

// Helper to read database
function readDB() {
  if (!fs.existsSync(DB_FILE)) {
    return { users: [], logs: [] };
  }
  try {
    const data = fs.readFileSync(DB_FILE, 'utf8');
    return JSON.parse(data);
  } catch (err) {
    console.error('Failed to read database file, resetting...', err);
    return { users: [], logs: [] };
  }
}

// Helper to write database
function writeDB(data) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf8');
  } catch (err) {
    console.error('Failed to write database file', err);
  }
}

// Ensure database file exists
readDB();

// 1. Get all logs saved on backend
app.get('/api/logs', (req, res) => {
  const db = readDB();
  res.json(db.logs);
});

// 2. Sync endpoint: receives logs from client
app.post('/api/sync', (req, res) => {
  const { logs } = req.body;
  if (!logs || !Array.isArray(logs)) {
    return res.status(400).json({ error: 'Invalid logs format. Expected array.' });
  }

  const db = readDB();
  
  // Append new sync records to backend list
  logs.forEach(log => {
    // Check if log already exists
    const exists = db.logs.some(existingLog => existingLog.id === log.id && existingLog.timestamp === log.timestamp);
    if (!exists) {
      db.logs.push({
        ...log,
        synced_at: new Date().toISOString()
      });
    }
  });

  writeDB(db);
  console.log(`Backend Database: Synced ${logs.length} logs from client.`);

  res.status(200).json({
    success: true,
    message: `Successfully synchronized ${logs.length} records on the backend.`,
    count: logs.length
  });
});

// 3. User Backup endpoint: saves enrolled embeddings to server
app.post('/api/enroll', (req, res) => {
  const { user_id, name, embedding } = req.body;
  if (!user_id || !name || !embedding) {
    return res.status(400).json({ error: 'Missing user_id, name, or embedding vector.' });
  }

  const db = readDB();
  
  // Upsert user
  db.users = db.users.filter(u => u.user_id !== user_id);
  db.users.push({
    user_id,
    name,
    embedding,
    synced_at: new Date().toISOString()
  });

  writeDB(db);
  console.log(`Backend Database: Registered/Backed up user: ${name} (${user_id})`);

  res.status(200).json({
    success: true,
    message: `User ${name} enrolled/backed up successfully.`
  });
});

// 4. Retrieve users backed up on cloud
app.get('/api/users', (req, res) => {
  const db = readDB();
  res.json(db.users);
});

app.listen(PORT, () => {
  console.log(`================================================`);
  console.log(`🚀 FaceGate Mock Backend running on port ${PORT}`);
  console.log(`🔗 API Sync endpoint: http://localhost:${PORT}/api/sync`);
  console.log(`💾 JSON Database: ${DB_FILE}`);
  console.log(`================================================`);
});
