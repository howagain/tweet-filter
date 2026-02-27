/**
 * Convex Client Extension for Pi Coding Agent
 * Provides mutations and queries for Twitter Intelligence system
 */
import type { ExtensionAPI } from "@mariozechner/pi-coding-agent";
import { Type } from "@sinclair/typebox";

const CONVEX_URL = process.env.CONVEX_URL || "https://adorable-boar-892.convex.cloud";

interface Tweet {
  tweetId: string;
  author: string;
  handle: string;
  text: string;
  postedAt: string;
  url: string;
  images?: string[];
  likes?: number;
  retweets?: number;
  replies?: number;
  source?: string;
}

interface Topic {
  name: string;
  keywords: string[];
  importance: number;
  sourceTweetId?: string;
}

async function convexQuery(fnPath: string, args: Record<string, unknown> = {}) {
  const response = await fetch(`${CONVEX_URL}/api/query`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ path: fnPath, args })
  });
  
  if (!response.ok) {
    throw new Error(`Convex query error: ${response.status}`);
  }
  
  const data = await response.json();
  return data.value;
}

async function convexMutation(fnPath: string, args: Record<string, unknown> = {}) {
  const response = await fetch(`${CONVEX_URL}/api/mutation`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ path: fnPath, args })
  });
  
  if (!response.ok) {
    throw new Error(`Convex mutation error: ${response.status}`);
  }
  
  const data = await response.json();
  return data.value;
}

export default function (pi: ExtensionAPI) {
  // ============ TWEET TOOLS ============
  
  pi.registerTool({
    name: "convex_ingest_tweets",
    description: "Save tweets to Convex database",
    parameters: Type.Object({
      tweets: Type.Array(Type.Object({
        tweetId: Type.String(),
        author: Type.String(),
        handle: Type.String(),
        text: Type.String(),
        postedAt: Type.String(),
        url: Type.String(),
        images: Type.Optional(Type.Array(Type.String())),
        likes: Type.Optional(Type.Number()),
        retweets: Type.Optional(Type.Number()),
        replies: Type.Optional(Type.Number()),
        source: Type.Optional(Type.String())
      }))
    }),
    async execute(_toolCallId, params, _signal, _onUpdate, _ctx) {
      try {
        const result = await convexMutation("tweets:ingestTweets", { tweets: params.tweets });
        return {
          content: [{ type: "text", text: `Ingested ${params.tweets.length} tweets` }],
          details: { type: "json", data: result }
        };
      } catch (err) {
        return { content: [{ type: "text", text: `Error: ${err}` }], details: {} };
      }
    }
  });

  pi.registerTool({
    name: "convex_list_tweets",
    description: "List tweets from Convex, optionally filtered by source or topic",
    parameters: Type.Object({
      source: Type.Optional(Type.String({ description: "Filter by source (feed, bookmarks, search)" })),
      topicId: Type.Optional(Type.String({ description: "Filter by topic ID" })),
      limit: Type.Optional(Type.Number({ description: "Max tweets to return (default 50)" }))
    }),
    async execute(_toolCallId, params, _signal, _onUpdate, _ctx) {
      try {
        const result = await convexQuery("tweets:listTweets", params);
        return {
          content: [{ type: "text", text: `Found ${result.length} tweets` }],
          details: { type: "json", data: result }
        };
      } catch (err) {
        return { content: [{ type: "text", text: `Error: ${err}` }], details: {} };
      }
    }
  });

  // ============ TOPIC TOOLS ============

  pi.registerTool({
    name: "convex_list_topics",
    description: "List all topics in the knowledge graph",
    parameters: Type.Object({}),
    async execute(_toolCallId, _params, _signal, _onUpdate, _ctx) {
      try {
        const result = await convexQuery("topics:listTopics", {});
        return {
          content: [{ type: "text", text: `Found ${result.length} topics` }],
          details: { type: "json", data: result }
        };
      } catch (err) {
        return { content: [{ type: "text", text: `Error: ${err}` }], details: {} };
      }
    }
  });

  pi.registerTool({
    name: "convex_create_topic",
    description: "Create a new topic in the knowledge graph",
    parameters: Type.Object({
      name: Type.String({ description: "Topic name" }),
      keywords: Type.Array(Type.String(), { description: "Keywords for matching" }),
      importance: Type.Optional(Type.Number({ description: "Importance score 0-1" })),
      sourceTweetId: Type.Optional(Type.String({ description: "ID of the source/origin tweet" }))
    }),
    async execute(_toolCallId, params, _signal, _onUpdate, _ctx) {
      try {
        const result = await convexMutation("topics:createTopic", params);
        return {
          content: [{ type: "text", text: `Created topic: ${params.name}` }],
          details: { type: "json", data: result }
        };
      } catch (err) {
        return { content: [{ type: "text", text: `Error: ${err}` }], details: {} };
      }
    }
  });

  pi.registerTool({
    name: "convex_assign_tweet_to_topic",
    description: "Assign a tweet to a topic",
    parameters: Type.Object({
      tweetId: Type.String(),
      topicId: Type.String()
    }),
    async execute(_toolCallId, params, _signal, _onUpdate, _ctx) {
      try {
        const result = await convexMutation("tweets:assignToTopic", params);
        return {
          content: [{ type: "text", text: `Assigned tweet to topic` }],
          details: { type: "json", data: result }
        };
      } catch (err) {
        return { content: [{ type: "text", text: `Error: ${err}` }], details: {} };
      }
    }
  });

  // ============ PROJECT TOOLS ============

  pi.registerTool({
    name: "convex_list_projects",
    description: "List all projects",
    parameters: Type.Object({}),
    async execute(_toolCallId, _params, _signal, _onUpdate, _ctx) {
      try {
        const result = await convexQuery("projects:listProjects", {});
        return {
          content: [{ type: "text", text: `Found ${result.length} projects` }],
          details: { type: "json", data: result }
        };
      } catch (err) {
        return { content: [{ type: "text", text: `Error: ${err}` }], details: {} };
      }
    }
  });

  pi.registerTool({
    name: "convex_create_project",
    description: "Create a new project for relevance scoring",
    parameters: Type.Object({
      name: Type.String(),
      description: Type.String(),
      keywords: Type.Array(Type.String()),
      active: Type.Optional(Type.Boolean({ default: true }))
    }),
    async execute(_toolCallId, params, _signal, _onUpdate, _ctx) {
      try {
        const result = await convexMutation("projects:createProject", params);
        return {
          content: [{ type: "text", text: `Created project: ${params.name}` }],
          details: { type: "json", data: result }
        };
      } catch (err) {
        return { content: [{ type: "text", text: `Error: ${err}` }], details: {} };
      }
    }
  });

  // ============ RELEVANCE TOOLS ============

  pi.registerTool({
    name: "convex_score_relevance",
    description: "Calculate and save relevance score between a topic and project",
    parameters: Type.Object({
      topicId: Type.String(),
      projectId: Type.String(),
      score: Type.Number({ minimum: 0, maximum: 1, description: "Relevance score 0-1" }),
      reason: Type.Optional(Type.String({ description: "Explanation for the score" }))
    }),
    async execute(_toolCallId, params, _signal, _onUpdate, _ctx) {
      try {
        const result = await convexMutation("relevance:scoreRelevance", params);
        return {
          content: [{ type: "text", text: `Saved relevance score: ${params.score}` }],
          details: { type: "json", data: result }
        };
      } catch (err) {
        return { content: [{ type: "text", text: `Error: ${err}` }], details: {} };
      }
    }
  });

  pi.registerTool({
    name: "convex_get_high_relevance",
    description: "Get topics with high relevance to any project",
    parameters: Type.Object({
      minScore: Type.Optional(Type.Number({ default: 0.7, description: "Minimum relevance score" })),
      projectId: Type.Optional(Type.String({ description: "Filter by specific project" }))
    }),
    async execute(_toolCallId, params, _signal, _onUpdate, _ctx) {
      try {
        const result = await convexQuery("relevance:getHighRelevance", params);
        return {
          content: [{ type: "text", text: `Found ${result.length} high-relevance topics` }],
          details: { type: "json", data: result }
        };
      } catch (err) {
        return { content: [{ type: "text", text: `Error: ${err}` }], details: {} };
      }
    }
  });

  // ============ FEEDBACK TOOLS ============

  pi.registerTool({
    name: "convex_record_feedback",
    description: "Record user feedback on a tweet (like, save, dismiss)",
    parameters: Type.Object({
      tweetId: Type.String(),
      action: Type.Union([
        Type.Literal("like"),
        Type.Literal("save"),
        Type.Literal("dismiss"),
        Type.Literal("expand")
      ])
    }),
    async execute(_toolCallId, params, _signal, _onUpdate, _ctx) {
      try {
        const result = await convexMutation("feedback:recordFeedback", params);
        return {
          content: [{ type: "text", text: `Recorded feedback: ${params.action}` }],
          details: { type: "json", data: result }
        };
      } catch (err) {
        return { content: [{ type: "text", text: `Error: ${err}` }], details: {} };
      }
    }
  });
}
