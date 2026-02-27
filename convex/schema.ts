import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // Raw tweets
  tweets: defineTable({
    tweetId: v.string(),
    author: v.string(),
    authorHandle: v.string(),
    followers: v.optional(v.number()),
    text: v.string(),
    url: v.string(),
    time: v.string(),
    hasMedia: v.optional(v.boolean()),
    topicId: v.optional(v.id("topics")),
    isBookmark: v.optional(v.boolean()),
    fetchedAt: v.number(),
  })
    .index("by_topic", ["topicId"])
    .index("by_author", ["authorHandle"])
    .index("by_time", ["time"]),

  // Clustered topics/events
  topics: defineTable({
    name: v.string(),
    summary: v.string(),
    tweetCount: v.number(),
    sourceTweetId: v.optional(v.string()),
    sourceUrl: v.optional(v.string()),
    importance: v.number(), // Global importance score
    keywords: v.array(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_importance", ["importance"])
    .searchIndex("search_topics", { searchField: "name" }),

  // Edges between topics
  topicEdges: defineTable({
    fromTopic: v.id("topics"),
    toTopic: v.id("topics"),
    relationship: v.string(), // "references", "related", "contradicts", etc.
    strength: v.number(),
  })
    .index("by_from", ["fromTopic"])
    .index("by_to", ["toTopic"]),

  // Your projects
  projects: defineTable({
    name: v.string(),
    description: v.string(),
    keywords: v.array(v.string()),
    active: v.boolean(),
  }),

  // Relevance scores (topic → project)
  relevance: defineTable({
    topicId: v.id("topics"),
    projectId: v.id("projects"),
    score: v.number(),
    reasoning: v.string(),
    contentOpportunity: v.optional(v.string()),
  })
    .index("by_topic", ["topicId"])
    .index("by_project", ["projectId"]),

  // Feedback for learning
  feedback: defineTable({
    tweetId: v.optional(v.string()),
    topicId: v.optional(v.id("topics")),
    rating: v.string(), // "good" | "bad"
    comment: v.optional(v.string()),
    createdAt: v.number(),
  }),
});
