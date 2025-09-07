import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  datasets: defineTable({
    storageId: v.id("_storage"),
    filename: v.string(),
    contentType: v.string(),
    size: v.number(),
    uploadedAt: v.number(),
  }).index("by_uploadedAt", ["uploadedAt"]),
  preprocess_runs: defineTable({
    datasetId: v.id("datasets"),
    status: v.union(
      v.literal("pending"),
      v.literal("running"),
      v.literal("failed"),
      v.literal("completed")
    ),
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
    processedStorageId: v.optional(v.id("_storage")),
    processedFilename: v.optional(v.string()),
    summary: v.optional(v.any()),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_dataset_createdAt", ["datasetId", "createdAt"]),
  profiles: defineTable({
    datasetId: v.id("datasets"),
    report: v.any(),
    runId: v.optional(v.id("preprocess_runs")),
    createdAt: v.number(),
  }).index("by_dataset_createdAt", ["datasetId", "createdAt"]),
  profile_summaries: defineTable({
    datasetId: v.id("datasets"),
    profileId: v.id("profiles"),
    summary: v.string(),
    createdAt: v.number(),
  }).index("by_dataset_createdAt", ["datasetId", "createdAt"]),
  run_cfgs: defineTable({
    datasetId: v.id("datasets"),
    profileId: v.id("profiles"),
    summaryId: v.optional(v.id("profile_summaries")),
    cfg: v.any(),
    createdAt: v.number(),
  }).index("by_dataset_createdAt", ["datasetId", "createdAt"]),
});
