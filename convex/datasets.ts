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

// Preprocess runs
export const createPreprocessRun = mutation({
  args: {
    datasetId: v.id("datasets"),
    params: v.object({
      target: v.union(v.string(), v.null()),
      idColumn: v.union(v.string(), v.null()),
      taskType: v.union(
        v.literal("auto"),
        v.literal("classification"),
        v.literal("regression")
      ),
      missing: v.union(
        v.literal("auto"),
        v.literal("drop"),
        v.literal("mean"),
        v.literal("median"),
        v.literal("most_frequent")
      ),
      testSize: v.number(),
    }),
  },
  handler: async (ctx, { datasetId, params }) => {
    const now = Date.now();
    const id = await ctx.db.insert("preprocess_runs", {
      datasetId,
      status: "pending",
      params,
      createdAt: now,
      updatedAt: now,
    });
    return id;
  },
});

export const markPreprocessRunning = mutation({
  args: { runId: v.id("preprocess_runs") },
  handler: async (ctx, { runId }) => {
    await ctx.db.patch(runId, { status: "running", updatedAt: Date.now() });
  },
});

export const completePreprocessRun = mutation({
  args: {
    runId: v.id("preprocess_runs"),
    processedStorageId: v.id("_storage"),
    processedFilename: v.string(),
    summary: v.any(),
  },
  handler: async (
    ctx,
    { runId, processedStorageId, processedFilename, summary }
  ) => {
    await ctx.db.patch(runId, {
      status: "completed",
      processedStorageId,
      processedFilename,
      summary,
      updatedAt: Date.now(),
    });
  },
});

export const failPreprocessRun = mutation({
  args: { runId: v.id("preprocess_runs"), error: v.string() },
  handler: async (ctx, { runId, error }) => {
    await ctx.db.patch(runId, {
      status: "failed",
      summary: { error },
      updatedAt: Date.now(),
    });
  },
});

export const listPreprocessRuns = query({
  args: { datasetId: v.id("datasets") },
  handler: async (ctx, { datasetId }) => {
    const items = await ctx.db
      .query("preprocess_runs")
      .withIndex("by_dataset_createdAt", q => q.eq("datasetId", datasetId))
      .order("desc")
      .collect();
    return items;
  },
});

// Profiles
export const saveProfile = mutation({
  args: {
    datasetId: v.id("datasets"),
    report: v.any(),
    runId: v.optional(v.id("preprocess_runs")),
  },
  handler: async (ctx, { datasetId, report, runId }) => {
    const id = await ctx.db.insert("profiles", {
      datasetId,
      report,
      runId,
      createdAt: Date.now(),
    });
    return id;
  },
});

export const getLatestProfile = query({
  args: { datasetId: v.id("datasets") },
  handler: async (ctx, { datasetId }) => {
    const [latest] = await ctx.db
      .query("profiles")
      .withIndex("by_dataset_createdAt", q => q.eq("datasetId", datasetId))
      .order("desc")
      .take(1);
    return latest ?? null;
  },
});

// (Actions & HTTP callbacks are implemented in convex/flows.ts and convex/webhooks.ts)

export const saveProfileSummary = mutation({
  args: {
    datasetId: v.id("datasets"),
    profileId: v.id("profiles"),
    summary: v.string(),
  },
  handler: async (ctx, { datasetId, profileId, summary }) => {
    const id = await ctx.db.insert("profile_summaries", {
      datasetId,
      profileId,
      summary,
      createdAt: Date.now(),
    });
    return id;
  },
});

export const getLatestProfileSummary = query({
  args: { datasetId: v.id("datasets") },
  handler: async (ctx, { datasetId }) => {
    const [latest] = await ctx.db
      .query("profile_summaries")
      .withIndex("by_dataset_createdAt", q => q.eq("datasetId", datasetId))
      .order("desc")
      .take(1);
    return latest ?? null;
  },
});


export const saveRunCfg = mutation({
  args: {
    datasetId: v.id("datasets"),
    profileId: v.id("profiles"),
    summaryId: v.optional(v.id("profile_summaries")),
    cfg: v.any(),
  },
  handler: async (ctx, { datasetId, profileId, summaryId, cfg }) => {
    const id = await ctx.db.insert("run_cfgs", {
      datasetId,
      profileId,
      summaryId,
      cfg,
      createdAt: Date.now(),
    });
    return id;
  },
});

export const getLatestRunCfg = query({
  args: { datasetId: v.id("datasets") },
  handler: async (ctx, { datasetId }) => {
    const [latest] = await ctx.db
      .query("run_cfgs")
      .withIndex("by_dataset_createdAt", (q) => q.eq("datasetId", datasetId))
      .order("desc")
      .take(1);
    return latest ?? null;
  },
});


export const saveTrainedModel = mutation({
  args: {
    datasetId: v.id("datasets"),
    runCfgId: v.optional(v.id("run_cfgs")),
    modelName: v.string(),
    storageId: v.id("_storage"),
    metrics: v.any(),
  },
  handler: async (ctx, { datasetId, runCfgId, modelName, storageId, metrics }) => {
    const id = await ctx.db.insert("trained_models", {
      datasetId,
      runCfgId,
      modelName,
      storageId,
      metrics,
      createdAt: Date.now(),
    });
    return id;
  },
});


export const listTrainedModels = query({
  args: { datasetId: v.id("datasets") },
  handler: async (ctx, { datasetId }) => {
    const items = await ctx.db
      .query("trained_models")
      .withIndex("by_dataset_createdAt", (q) => q.eq("datasetId", datasetId))
      .order("desc")
      .collect();
    return items;
  },
});
