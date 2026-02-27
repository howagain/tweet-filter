const { ConvexHttpClient } = require("convex/browser");
const fs = require("fs");

const client = new ConvexHttpClient(process.env.CONVEX_URL);

async function seed() {
  // Load our data
  const bookmarks = JSON.parse(fs.readFileSync("/home/claude/artifacts/bookmarks.json"));
  const freshTweets = JSON.parse(fs.readFileSync("/home/claude/artifacts/fresh-tweets.json"));
  
  // Format tweets for Convex
  const allTweets = [
    ...bookmarks.map(t => ({
      tweetId: t.url.split("/status/")[1] || t.url,
      author: t.author || "unknown",
      authorHandle: t.author || "unknown",
      text: t.text,
      url: t.url,
      time: t.time || new Date().toISOString(),
      isBookmark: true
    })),
    ...freshTweets.map(t => ({
      tweetId: t.url.split("/status/")[1] || t.url,
      author: t.author || "unknown", 
      authorHandle: t.author || "unknown",
      text: t.text,
      url: t.url,
      time: t.time || new Date().toISOString(),
      isBookmark: false
    }))
  ];
  
  console.log(`Ingesting ${allTweets.length} tweets...`);
  
  // Ingest tweets
  const result = await client.mutation("tweets:ingestTweets", { tweets: allTweets });
  console.log("Tweets result:", result);
  
  // Add projects
  const projects = [
    { name: "Tool Discovery", description: "Find new tools & frameworks to test", keywords: ["tool", "framework", "library", "sdk", "cli", "open source", "release"] },
    { name: "Cutting Edge Intel", description: "Track paradigm shifts in AI/software", keywords: ["changing", "new reality", "first principles", "revolution", "paradigm", "future"] },
    { name: "Competitive Awareness", description: "Know what others are building", keywords: ["building", "shipped", "launched", "startup", "company", "hiring"] }
  ];
  
  for (const proj of projects) {
    const id = await client.mutation("projects:createProject", proj);
    console.log(`Created project: ${proj.name} (${id})`);
  }
  
  // Add topics
  const topics = [
    { name: "Agent Infrastructure", summary: "Tools and frameworks for running AI agents", keywords: ["agent", "sandbox", "isolation", "runtime", "infrastructure", "openclaw", "zeroclaw"] },
    { name: "AI Memory/Context", summary: "AI systems that remember across sessions", keywords: ["memory", "remember", "context", "sessions", "auto-memory"] },
    { name: "Block AI Layoffs", summary: "Block added $8B in market cap after announcing AI-driven layoffs", keywords: ["block", "layoff", "fired", "$8b", "market cap", "employees"] },
    { name: "Local AI Models", summary: "Running powerful AI models locally", keywords: ["local", "macbook", "24gb", "open source", "open weight", "free"] },
    { name: "Coding Tools Race", summary: "Competition in AI-assisted coding tools", keywords: ["cursor", "opencode", "claude code", "coding", "vibe coding"] }
  ];
  
  for (const topic of topics) {
    const id = await client.mutation("topics:createTopic", topic);
    console.log(`Created topic: ${topic.name} (${id})`);
  }
  
  console.log("\n✓ Seeding complete!");
}

seed().catch(console.error);
