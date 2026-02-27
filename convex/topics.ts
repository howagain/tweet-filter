import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Create a topic cluster
export const createTopic = mutation({
  args: {
    name: v.string(),
    summary: v.string(),
    keywords: v.array(v.string()),
    sourceTweetId: v.optional(v.string()),
    sourceUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("topics", {
      ...args,
      tweetCount: 0,
      importance: 0,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
  },
});

// Update topic stats
export const updateTopicStats = mutation({
  args: {
    topicId: v.id("topics"),
    tweetCount: v.number(),
    importance: v.number(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.topicId, {
      tweetCount: args.tweetCount,
      importance: args.importance,
      updatedAt: Date.now(),
    });
  },
});

// Assign tweet to topic
export const assignTweetToTopic = mutation({
  args: {
    tweetId: v.id("tweets"),
    topicId: v.id("topics"),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.tweetId, { topicId: args.topicId });
    
    // Update topic tweet count
    const tweets = await ctx.db
      .query("tweets")
      .withIndex("by_topic", (q) => q.eq("topicId", args.topicId))
      .collect();
    
    await ctx.db.patch(args.topicId, {
      tweetCount: tweets.length,
      updatedAt: Date.now(),
    });
  },
});

// Get top topics by importance
export const getTopTopics = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("topics")
      .withIndex("by_importance")
      .order("desc")
      .take(args.limit || 10);
  },
});

// Get all topics
export const listTopics = query({
  handler: async (ctx) => {
    return await ctx.db.query("topics").collect();
  },
});
