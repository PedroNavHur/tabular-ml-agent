import { action } from "./_generated/server";
import { api } from "./_generated/api";
import { v } from "convex/values";

export const startPreprocess: unknown = action({
  args: {
    datasetId: v.id("datasets"),
    params: v.object({
      target: v.union(v.string(), v.null()),
      idColumn: v.union(v.string(), v.null()),
      taskType: v.union(
        v.literal("auto"),
        v.literal("classification"),
        v.literal("regression"),
      ),
      missing: v.union(
        v.literal("auto"),
        v.literal("drop"),
        v.literal("mean"),
        v.literal("median"),
        v.literal("most_frequent"),
      ),
      testSize: v.number(),
    }),
  },
  handler: async (ctx, { datasetId, params }) => {
    const runId = await ctx.runMutation(api.datasets.createPreprocessRun, {
      datasetId,
      params,
    });

    const modalUrl = process.env.MODAL_PREPROCESS_URL;
    const webhookSecret = process.env.PREPROCESS_WEBHOOK_SECRET;
    const convexUrl = process.env.CONVEX_URL || process.env.NEXT_PUBLIC_CONVEX_URL;

    if (modalUrl && webhookSecret && convexUrl) {
      await fetch(modalUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          runId,
          datasetId,
          params,
          callbacks: {
            running: `${convexUrl}/preprocess/running`,
            complete: `${convexUrl}/preprocess/complete`,
            fail: `${convexUrl}/preprocess/fail`,
            saveProfile: `${convexUrl}/profile/save`,
            uploadUrl: `${convexUrl}/storage/upload-url`,
          },
          secret: webhookSecret,
        }),
      });
    }

    return { runId };
  },
});
