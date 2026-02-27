const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static('.'));

const DATA_FILE = './data/db.json';

// Initialize DB
function getDB() {
  if (!fs.existsSync(DATA_FILE)) {
    const initial = {
      tweets: [],
      topics: [],
      projects: [],
      feedback: [],
      edges: []
    };
    fs.writeFileSync(DATA_FILE, JSON.stringify(initial, null, 2));
  }
  return JSON.parse(fs.readFileSync(DATA_FILE));
}

function saveDB(db) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(db, null, 2));
}

// TWEETS
app.post('/api/tweets/ingest', (req, res) => {
  const db = getDB();
  const { tweets } = req.body;
  let added = 0;
  
  for (const tweet of tweets) {
    const exists = db.tweets.find(t => t.url === tweet.url);
    if (!exists) {
      db.tweets.push({
        ...tweet,
        id: Date.now().toString() + Math.random().toString(36).slice(2),
        fetchedAt: Date.now()
      });
      added++;
    }
  }
  
  saveDB(db);
  res.json({ added, total: db.tweets.length });
});

app.get('/api/tweets', (req, res) => {
  const db = getDB();
  res.json(db.tweets);
});

// TOPICS
app.post('/api/topics', (req, res) => {
  const db = getDB();
  const topic = {
    ...req.body,
    id: Date.now().toString(),
    tweetCount: 0,
    importance: 0,
    createdAt: Date.now()
  };
  db.topics.push(topic);
  saveDB(db);
  res.json(topic);
});

app.get('/api/topics', (req, res) => {
  const db = getDB();
  // Sort by importance
  const sorted = db.topics.sort((a, b) => b.importance - a.importance);
  res.json(sorted);
});

app.patch('/api/topics/:id', (req, res) => {
  const db = getDB();
  const idx = db.topics.findIndex(t => t.id === req.params.id);
  if (idx >= 0) {
    db.topics[idx] = { ...db.topics[idx], ...req.body };
    saveDB(db);
    res.json(db.topics[idx]);
  } else {
    res.status(404).json({ error: 'Not found' });
  }
});

// PROJECTS
app.post('/api/projects', (req, res) => {
  const db = getDB();
  const project = {
    ...req.body,
    id: Date.now().toString(),
    active: true
  };
  db.projects.push(project);
  saveDB(db);
  res.json(project);
});

app.get('/api/projects', (req, res) => {
  const db = getDB();
  res.json(db.projects.filter(p => p.active));
});

// FEEDBACK
app.post('/api/feedback', (req, res) => {
  const db = getDB();
  const feedback = {
    ...req.body,
    id: Date.now().toString(),
    createdAt: Date.now()
  };
  db.feedback.push(feedback);
  saveDB(db);
  res.json(feedback);
});

app.get('/api/feedback', (req, res) => {
  const db = getDB();
  res.json(db.feedback);
});

// FULL DB (for Leo to read)
app.get('/api/db', (req, res) => {
  res.json(getDB());
});

const PORT = process.env.PORT || 3456;
app.listen(PORT, () => {
  console.log(`Tweet Filter API running on port ${PORT}`);
  console.log(`DB file: ${DATA_FILE}`);
});
