const http = require('http');

// Fetch all tweets
async function fetchJSON(path) {
  return new Promise((resolve, reject) => {
    http.get(`http://localhost:3456${path}`, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(JSON.parse(data)));
    }).on('error', reject);
  });
}

async function postJSON(path, body) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(body);
    const req = http.request({
      hostname: 'localhost',
      port: 3456,
      path,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length
      }
    }, (res) => {
      let result = '';
      res.on('data', chunk => result += chunk);
      res.on('end', () => resolve(JSON.parse(result)));
    });
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

// Simple keyword-based clustering
const TOPIC_PATTERNS = [
  {
    name: "Block AI Layoffs",
    keywords: ["block", "layoff", "fired", "$8b", "market cap", "employees"],
    summary: "Block added $8B in market cap after announcing AI-driven layoffs"
  },
  {
    name: "Agent Infrastructure",
    keywords: ["agent", "sandbox", "isolation", "runtime", "infrastructure", "openclaw", "zeroclaw"],
    summary: "Tools and frameworks for running AI agents"
  },
  {
    name: "Coding Tools Race",
    keywords: ["cursor", "opencode", "claude code", "coding", "vibe coding"],
    summary: "Competition in AI-assisted coding tools"
  },
  {
    name: "Local AI Models",
    keywords: ["local", "macbook", "24gb", "open source", "open weight", "free"],
    summary: "Running powerful AI models locally"
  },
  {
    name: "AI Memory/Context",
    keywords: ["memory", "remember", "context", "sessions", "auto-memory"],
    summary: "AI systems that remember across sessions"
  },
  {
    name: "Visual Agent Builders",
    keywords: ["drag", "drop", "canvas", "visual", "no code", "sim"],
    summary: "No-code tools for building AI agents"
  },
  {
    name: "Industry Shifts",
    keywords: ["changing", "changed", "students", "hiring", "interview", "future"],
    summary: "How AI is changing the software industry"
  }
];

async function cluster() {
  const tweets = await fetchJSON('/api/tweets');
  console.log(`Analyzing ${tweets.length} tweets...\n`);

  const topicMatches = {};

  for (const pattern of TOPIC_PATTERNS) {
    topicMatches[pattern.name] = {
      ...pattern,
      tweets: [],
      importance: 0
    };
  }

  // Match tweets to topics
  for (const tweet of tweets) {
    const text = tweet.text.toLowerCase();
    
    for (const pattern of TOPIC_PATTERNS) {
      const matchCount = pattern.keywords.filter(kw => text.includes(kw.toLowerCase())).length;
      if (matchCount >= 1) {
        topicMatches[pattern.name].tweets.push({
          author: tweet.author,
          text: tweet.text.slice(0, 100),
          url: tweet.url,
          matchScore: matchCount
        });
      }
    }
  }

  // Calculate importance (# of tweets × avg match score)
  for (const [name, topic] of Object.entries(topicMatches)) {
    if (topic.tweets.length > 0) {
      const avgScore = topic.tweets.reduce((sum, t) => sum + t.matchScore, 0) / topic.tweets.length;
      topic.importance = Math.round(topic.tweets.length * avgScore * 10);
    }
  }

  // Sort by importance
  const ranked = Object.values(topicMatches)
    .filter(t => t.tweets.length > 0)
    .sort((a, b) => b.importance - a.importance);

  console.log("=== TOPIC CLUSTERS (by importance) ===\n");
  
  for (const topic of ranked) {
    console.log(`📊 ${topic.name} (importance: ${topic.importance})`);
    console.log(`   ${topic.summary}`);
    console.log(`   ${topic.tweets.length} tweets:`);
    topic.tweets.slice(0, 3).forEach(t => {
      console.log(`   • @${t.author}: ${t.text.slice(0, 60)}...`);
    });
    console.log();
    
    // Save topic to DB
    await postJSON('/api/topics', {
      name: topic.name,
      summary: topic.summary,
      keywords: topic.keywords,
      tweetCount: topic.tweets.length,
      importance: topic.importance
    });
  }

  console.log("Topics saved to database!");
}

cluster().catch(console.error);
