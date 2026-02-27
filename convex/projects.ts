import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Create a project
export const createProject = mutation({
  args: {
    name: v.string(),
    description: v.string(),
    keywords: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("projects", {
      ...args,
      active: true,
    });
  },
});

// List projects
export const listProjects = query({
  handler: async (ctx) => {
    return await ctx.db
      .query("projects")
      .filter((q) => q.eq(q.field("active"), true))
      .collect();
  },
});

// Add relevance score
export const addRelevance = mutation({
  args: {
    topicId: v.id("topics"),
    projectId: v.id("projects"),
    score: v.number(),
    reasoning: v.string(),
    contentOpportunity: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("relevance", args);
  },
});

// Get relevance for a topic
export const getTopicRelevance = query({
  args: { topicId: v.id("topics") },
  handler: async (ctx, args) => {
    const relevances = await ctx.db
      .query("relevance")
      .withIndex("by_topic", (q) => q.eq("topicId", args.topicId))
      .collect();
    
    // Join with project names
    const results = [];
    for (const rel of relevances) {
      const project = await ctx.db.get(rel.projectId);
      results.push({ ...rel, projectName: project?.name });
    }
    return results;
  },
});
