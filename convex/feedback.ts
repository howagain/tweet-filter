import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Save feedback
export const saveFeedback = mutation({
  args: {
    tweetId: v.optional(v.string()),
    topicId: v.optional(v.id("topics")),
    rating: v.string(),
    comment: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("feedback", {
      ...args,
      createdAt: Date.now(),
    });
  },
});

// Get all feedback
export const listFeedback = query({
  handler: async (ctx) => {
    return await ctx.db.query("feedback").order("desc").collect();
  },
});
