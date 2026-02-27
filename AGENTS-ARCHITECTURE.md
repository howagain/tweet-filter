# Twitter Intelligence Multi-Agent System

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         ORCHESTRATOR (Main)                             │
│  Coordinates all agents, handles scheduling, monitors health            │
└─────────────────────────────────────────────────────────────────────────┘
         │              │              │              │              │
         ▼              ▼              ▼              ▼              ▼
┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐
│  X Browser  │ │  Knowledge  │ │   Project   │ │    Self     │ │    Repo     │
│    Agent    │ │   Graph     │ │   Manager   │ │  Debugger   │ │   Checker   │
│             │ │   Agent     │ │   Agent     │ │   Agent     │ │   Agent     │
└─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘
      │              │              │              │              │
      ▼              ▼              ▼              ▼              ▼
┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐
│   Kernel    │ │   Convex    │ │   Convex    │ │   Logs &    │ │   GitHub    │
│  Browser    │ │  Database   │ │  Database   │ │   Metrics   │ │     API     │
└─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘
```

---

## Agent Definitions

### 1. X Browser Agent (`agents/x-browser/`)

**Purpose:** Browse X/Twitter using Kernel, extract tweets, save to Convex

**Tools/Extensions:**
- `kernel-browser` - Kernel SDK for browser automation
- `convex-client` - Write tweets to database
- `tweet-parser` - Extract structured data from tweets

**AGENT.md:**
```markdown
# X Browser Agent

You browse X/Twitter to discover relevant content for the knowledge graph.

## Capabilities
- Create Kernel browser sessions with x-profile
- Navigate to feeds, search, bookmarks
- Extract tweet data (author, text, media, engagement)
- Save tweets to Convex database

## Workflow
1. Receive fetch request (feed/search/bookmarks)
2. Create Kernel browser with x-profile
3. Navigate to target URL
4. Wait for content to load
5. Extract tweets using DOM selectors
6. Parse and structure tweet data
7. Save to Convex via tweets:ingestTweets
8. Return summary of fetched tweets

## Tools
- kernel:createBrowser - Start browser session
- kernel:navigate - Go to URL
- kernel:extract - Run extraction script
- convex:ingestTweets - Save tweets to DB
```

**Key Files:**
```
agents/x-browser/
├── AGENT.md
├── tools/
│   ├── kernel-browser.ts    # Kernel SDK wrapper
│   ├── tweet-extractor.ts   # DOM extraction logic
│   └── convex-client.ts     # Convex mutations
└── prompts/
    └── extraction.md        # Tweet parsing instructions
```

---

### 2. Knowledge Graph Agent (`agents/knowledge-graph/`)

**Purpose:** Process tweets into topic clusters, calculate relevance scores

**Tools/Extensions:**
- `convex-client` - Read tweets, write topics/edges
- `embeddings` - Generate text embeddings for clustering
- `relevance-scorer` - Calculate project relevance

**AGENT.md:**
```markdown
# Knowledge Graph Agent

You process raw tweets into a structured knowledge graph.

## Capabilities
- Read tweets from Convex
- Cluster tweets by topic/event
- Identify source/original tweets
- Calculate topic importance (tweet count × engagement)
- Score relevance to user projects
- Create topic edges (relationships)

## Workflow
1. Fetch unprocessed tweets from Convex
2. Extract keywords and entities
3. Cluster by similarity (keyword overlap, semantic)
4. For each cluster:
   - Create/update topic
   - Find source tweet (earliest or most engaged)
   - Calculate importance score
   - Score relevance to each project
5. Identify cross-topic relationships
6. Save topics, edges, relevance scores to Convex

## Tools
- convex:listTweets - Get tweets
- convex:createTopic - Create topic cluster
- convex:updateTopicStats - Update importance
- convex:addRelevance - Save relevance scores
- nlp:extractKeywords - Keyword extraction
- nlp:cluster - Semantic clustering
```

---

### 3. Project Manager Agent (`agents/project-manager/`)

**Purpose:** CRUD operations for managing projects and their keywords

**AGENT.md:**
```markdown
# Project Manager Agent

You manage the projects that drive relevance scoring.

## Capabilities
- Create new projects with name, description, keywords
- Update project details
- Deactivate/archive projects
- List active projects
- Suggest keywords based on project description

## Workflow
1. Receive project command (create/update/delete/list)
2. Validate input
3. Execute Convex mutation/query
4. Return confirmation

## Tools
- convex:createProject
- convex:updateProject
- convex:listProjects
- convex:deleteProject
- nlp:suggestKeywords - Generate keyword suggestions
```

---

### 4. Self-Debugger Agent (`agents/debugger/`)

**Purpose:** Monitor system health, debug issues, self-heal

**AGENT.md:**
```markdown
# Self-Debugger Agent

You monitor system health and debug issues.

## Capabilities
- Check agent health status
- Analyze error logs
- Identify failing patterns
- Suggest fixes
- Apply safe auto-fixes
- Report issues to orchestrator

## Workflow
1. Periodically check each agent's status
2. Collect error logs and metrics
3. Analyze patterns:
   - Repeated failures
   - Performance degradation
   - API rate limits
   - Connection issues
4. Diagnose root cause
5. Apply fix if safe (restart, clear cache, retry)
6. Escalate if manual intervention needed

## Monitored Services
- Kernel browser sessions
- Convex connectivity
- GitHub API
- Agent response times

## Tools
- logs:tail - Get recent logs
- logs:search - Search for errors
- metrics:get - Get performance metrics
- agent:restart - Restart specific agent
- agent:healthcheck - Check agent status
```

---

### 5. Repo Checker Agent (`agents/repo-checker/`)

**Purpose:** Monitor GitHub repos for relevant updates

**AGENT.md:**
```markdown
# Repo Checker Agent

You monitor GitHub repositories for relevant updates.

## Capabilities
- List watched repositories
- Check for new commits/releases
- Analyze changelogs
- Score relevance to projects
- Create summaries of important updates

## Workflow
1. Get list of watched repos
2. For each repo:
   - Fetch recent commits/releases
   - Parse changelog/release notes
   - Score relevance to projects
3. Create update summary
4. Save to knowledge graph as topic if significant

## Watched Repos (configurable)
- anthropics/anthropic-sdk-*
- badlogicgames/pi
- kernel-ai/kernel
- Convex-dev/convex
- [user-defined repos]

## Tools
- github:listRepos - Get watched repos
- github:getCommits - Recent commits
- github:getReleases - Recent releases
- github:getChangelog - Parse changelog
- convex:createTopic - Save as topic
```

---

## Shared Infrastructure

### Convex Schema (already deployed)
```typescript
// tweets, topics, projects, feedback, topicEdges, relevance
// See convex/schema.ts
```

### Environment Variables
```bash
KERNEL_API_KEY=sk_...
CONVEX_URL=https://adorable-boar-892.convex.cloud
GITHUB_TOKEN=ghp_...
```

### Inter-Agent Communication

Agents communicate via:
1. **Convex** - Shared database for persistent state
2. **Message Queue** - For real-time coordination (could use Convex subscriptions)
3. **Orchestrator** - Central coordinator for complex workflows

---

## Orchestrator Workflows

### Daily Fetch Workflow
```
1. Orchestrator triggers X Browser Agent
2. X Browser fetches feed + bookmarks → Convex
3. Orchestrator triggers Knowledge Graph Agent
4. Knowledge Graph processes → topics, relevance
5. Orchestrator triggers Repo Checker
6. Repo Checker scans repos → updates
7. Self-Debugger checks all health
8. Generate daily summary
```

### On-Demand Deep Dive
```
1. User requests deep dive on topic
2. Orchestrator triggers X Browser with search query
3. X Browser fetches related tweets
4. Knowledge Graph expands topic cluster
5. Return expanded analysis
```

---

## Pi Agent Implementation Details

### Extension System (from research)

Pi extensions are TypeScript modules loaded via `jiti` without pre-compilation:
- `~/.pi/agent/extensions/*.ts` (global)
- `.pi/extensions/*.ts` (project-local)

**Core Extension Pattern:**
```typescript
import type { ExtensionAPI } from "@mariozechner/pi-coding-agent";
import { Type } from "@sinclair/typebox";

export default function (pi: ExtensionAPI) {
  // Register custom tools
  pi.registerTool({
    name: "kernel_browse",
    description: "Browse URL with Kernel browser",
    parameters: Type.Object({
      url: Type.String(),
      profile: Type.Optional(Type.String({ default: "x-profile" }))
    }),
    async execute(toolCallId, params, signal, onUpdate, ctx) {
      // Kernel SDK implementation
      return { content: [{ type: "text", text: result }], details: {} };
    },
  });
  
  // Lifecycle hooks
  pi.on("tool_call", async (event, ctx) => {
    // Can block/modify tool calls
  });
}
```

### Multi-Agent Patterns

**Subagent Spawning (Pi SDK):**
```typescript
import { createAgentSession, SessionManager } from "@mariozechner/pi-coding-agent";

const { session } = await createAgentSession({
  sessionManager: SessionManager.inMemory(),
  model: getModel("anthropic", "claude-sonnet-4-20250514"),
});

// Subscribe to events
session.subscribe((event) => {
  if (event.type === "message_update") {
    // Handle streaming output
  }
});

await session.prompt("Fetch tweets from bookmarks");
```

**Chained Workflows:**
```typescript
// Chain tasks with {previous} placeholder
{ 
  chain: [
    { agent: "x-browser", task: "Fetch bookmarks" },
    { agent: "knowledge-graph", task: "Process these tweets: {previous}" }
  ]
}
```

### OpenClaw Integration Options

If running within OpenClaw environment, can use:
- `sessions_spawn` for isolated sub-agents
- `cron` for scheduled daily fetches  
- `browser` tool for CDP-based automation
- Cross-session messaging for orchestration

**OpenClaw Cron Schedule:**
```json
{
  "schedule": { "kind": "cron", "expr": "0 8 * * *", "tz": "America/Denver" },
  "payload": { "kind": "agentTurn", "message": "Run daily tweet fetch workflow" },
  "sessionTarget": "isolated"
}
```

---

## Implementation Plan

### Phase 1: Core Extensions (Days 1-2)
1. [ ] Create `extensions/kernel-browser.ts` - Kernel SDK wrapper
2. [ ] Create `extensions/convex-client.ts` - Convex mutations/queries
3. [ ] Create `extensions/tweet-extractor.ts` - DOM extraction logic
4. [ ] Test with single browser session

### Phase 2: Agent Scaffolding (Days 3-4)
1. [ ] Set up `.pi/agents/` directory structure
2. [ ] Write AGENT.md for each agent type
3. [ ] Configure agent-specific tool access
4. [ ] Test individual agent prompts

### Phase 3: Orchestration (Days 5-6)
1. [ ] Implement orchestrator with subagent spawning
2. [ ] Set up workflow chains (fetch → process → score)
3. [ ] Add error handling and retry logic
4. [ ] Integrate with Convex subscriptions for real-time updates

### Phase 4: Automation (Day 7)
1. [ ] Add cron triggers for daily workflow
2. [ ] Set up self-debugger monitoring
3. [ ] Build notification system for new high-relevance content
4. [ ] Deploy and test full pipeline

---

## Quick Start Commands

```bash
# Install Pi globally
npm install -g @mariozechner/pi-coding-agent

# Create project structure
cd ~/projects/tweet-filter
mkdir -p .pi/agents .pi/extensions

# Copy extension templates
cp templates/kernel-browser.ts .pi/extensions/
cp templates/convex-client.ts .pi/extensions/

# Run specific agent
pi --agent x-browser -p "Fetch my bookmarks"

# Run orchestrator workflow  
pi --agent orchestrator -p "Run daily fetch workflow"
```

---

## File Structure

```
tweet-filter/
├── agents/
│   ├── x-browser/
│   │   ├── AGENT.md
│   │   └── tools/
│   ├── knowledge-graph/
│   │   ├── AGENT.md
│   │   └── tools/
│   ├── project-manager/
│   │   ├── AGENT.md
│   │   └── tools/
│   ├── debugger/
│   │   ├── AGENT.md
│   │   └── tools/
│   └── repo-checker/
│       ├── AGENT.md
│       └── tools/
├── orchestrator/
│   ├── index.ts
│   ├── workflows/
│   └── scheduler.ts
├── shared/
│   ├── convex-client.ts
│   ├── kernel-client.ts
│   └── types.ts
├── convex/
│   └── [existing schema & functions]
└── package.json
```
