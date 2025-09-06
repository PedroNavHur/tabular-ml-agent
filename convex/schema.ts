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
});

