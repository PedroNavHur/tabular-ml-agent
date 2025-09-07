import { action } from "./_generated/server";
import { api } from "./_generated/api";
import { v } from "convex/values";
import { profileSummaryPrompt } from "./prompts";

export const startPreprocess: unknown = action({
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
    const runId = await ctx.runMutation(api.datasets.createPreprocessRun, {
      datasetId,
      params,
    });

    const modalUrl = process.env.MODAL_PREPROCESS_URL;
    const webhookSecret = process.env.PREPROCESS_WEBHOOK_SECRET;
    // Prefer the Convex HTTP Actions base URL when constructing callback URLs
    const convexUrl =
      process.env.CONVEX_SITE_URL ||
      process.env.CONVEX_URL ||
      process.env.NEXT_PUBLIC_CONVEX_URL;

    if (!modalUrl)
      throw new Error("Missing MODAL_PREPROCESS_URL in Convex env");
    if (!webhookSecret)
      throw new Error("Missing PREPROCESS_WEBHOOK_SECRET in Convex env");
    if (!convexUrl)
      throw new Error(
        "Missing CONVEX_SITE_URL (preferred) or CONVEX_URL/NEXT_PUBLIC_CONVEX_URL in Convex env"
      );

    const endpoint = modalUrl.endsWith("/preprocess")
      ? modalUrl
      : `${modalUrl.replace(/\/$/, "")}/preprocess`;

    if (endpoint && webhookSecret && convexUrl) {
      await fetch(endpoint, {
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

export const summarizeProfile: unknown = action({
  args: { datasetId: v.id("datasets") },
  handler: async (ctx, { datasetId }) => {
    const latest = await ctx.runQuery(api.datasets.getLatestProfile, {
      datasetId,
    });
    if (!latest) throw new Error("No profile found for dataset");

    const prompt = profileSummaryPrompt(latest.report);
    const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
    if (!OPENAI_API_KEY)
      throw new Error("Missing OPENAI_API_KEY in Convex env");

    const resp = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-5-mini",
        messages: [
          {
            role: "system",
            content: "You are a helpful data science assistant.",
          },
          { role: "user", content: prompt },
        ],
      }),
    });
    if (!resp.ok) {
      const text = await resp.text();
      throw new Error(`OpenAI error: ${resp.status} ${text}`);
    }
    const data = await resp.json();
    const summary: string = data?.choices?.[0]?.message?.content ?? "";

    const summaryId = await ctx.runMutation(api.datasets.saveProfileSummary, {
      datasetId,
      profileId: latest._id,
      summary,
    });
    return { summaryId, summary };
  },
});
