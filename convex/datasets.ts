import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const generateUploadUrl = mutation({
  args: {},
  handler: async ctx => {
    const url = await ctx.storage.generateUploadUrl();
    return url;
  },
});

export const saveDataset = mutation({
  args: {
    storageId: v.id("_storage"),
    filename: v.string(),
    contentType: v.string(),
    size: v.number(),
  },
  handler: async (ctx, args) => {
    const id = await ctx.db.insert("datasets", {
      storageId: args.storageId,
      filename: args.filename,
      contentType: args.contentType,
      size: args.size,
      uploadedAt: Date.now(),
    });
    return id;
  },
});

export const listDatasets = query({
  args: {},
  handler: async ctx => {
    const items = await ctx.db
      .query("datasets")
      .withIndex("by_uploadedAt")
      .order("desc")
      .collect();
    return items;
  },
});

export const getDownloadUrl = mutation({
  args: { storageId: v.id("_storage") },
  handler: async (ctx, { storageId }) => {
    const url = await ctx.storage.getUrl(storageId);
    return url;
  },
});

export const getDataset = query({
  args: { id: v.id("datasets") },
  handler: async (ctx, { id }) => {
    const doc = await ctx.db.get(id);
    return doc;
  },
});
