import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Ingest tweets from a fetch
export const ingestTweets = mutation({
  args: {
    tweets: v.array(v.object({
      tweetId: v.string(),
      author: v.string(),
      authorHandle: v.string(),
      followers: v.optional(v.number()),
      text: v.string(),
      url: v.string(),
      time: v.string(),
      hasMedia: v.optional(v.boolean()),
      isBookmark: v.optional(v.boolean()),
    })),
  },
  handler: async (ctx, args) => {
    const results = [];
    for (const tweet of args.tweets) {
      // Check if already exists
      const existing = await ctx.db
        .query("tweets")
        .filter((q) => q.eq(q.field("tweetId"), tweet.tweetId))
        .first();
      
      if (!existing) {
        const id = await ctx.db.insert("tweets", {
          ...tweet,
          fetchedAt: Date.now(),
        });
        results.push({ id, status: "inserted" });
      } else {
        results.push({ id: existing._id, status: "exists" });
      }
    }
    return results;
  },
});

// Get all tweets
export const listTweets = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("tweets")
      .order("desc")
      .take(args.limit || 50);
  },
});

// Get tweets by topic
export const getTweetsByTopic = query({
  args: { topicId: v.id("topics") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("tweets")
      .withIndex("by_topic", (q) => q.eq("topicId", args.topicId))
      .collect();
  },
});

// Get bookmarks
export const getBookmarks = query({
  handler: async (ctx) => {
    return await ctx.db
      .query("tweets")
      .filter((q) => q.eq(q.field("isBookmark"), true))
      .collect();
  },
});
