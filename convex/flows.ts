import { action } from "./_generated/server";
import { api } from "./_generated/api";
import { v } from "convex/values";
import { profileSummaryPrompt, runCfgPrompt } from "./prompts";

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


export const generateRunCfg: unknown = action({
  args: { datasetId: v.id("datasets") },
  handler: async (ctx, { datasetId }) => {
    const existing = await ctx.runQuery(api.datasets.getLatestRunCfg, { datasetId });
    if (existing) return { runCfgId: existing._id, cfg: existing.cfg };

    const [profile, summary] = await Promise.all([
      ctx.runQuery(api.datasets.getLatestProfile, { datasetId }),
      ctx.runQuery(api.datasets.getLatestProfileSummary, { datasetId }),
    ]);
    if (!profile) throw new Error("No profile found for dataset");

    const prompt = runCfgPrompt(profile.report, summary?.summary ?? "");
    const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
    if (!OPENAI_API_KEY) throw new Error("Missing OPENAI_API_KEY in Convex env");

    const resp = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-5",
        messages: [
          { role: "system", content: "You are a helpful ML engineer." },
          { role: "user", content: prompt },
        ],
      }),
    });
    if (!resp.ok) {
      const text = await resp.text();
      throw new Error(`OpenAI error: ${resp.status} ${text}`);
    }
    const data = await resp.json();
    const content: string = data?.choices?.[0]?.message?.content ?? "";
    let cfg: unknown;
    try {
      cfg = JSON.parse(content);
    } catch {
      cfg = content;
    }

    const runCfgId = await ctx.runMutation(api.datasets.saveRunCfg, {
      datasetId,
      profileId: profile._id,
      summaryId: summary?._id,
      cfg,
    });
    return { runCfgId, cfg };
  },
});


export const startTraining: unknown = action({
  args: { datasetId: v.id("datasets") },
  handler: async (ctx, { datasetId }) => {
    const plan = await ctx.runQuery(api.datasets.getLatestRunCfg, { datasetId });
    if (!plan) throw new Error("No run config found. Generate one first.");

    const modalUrl = process.env.MODAL_TRAIN_URL;
    const webhookSecret = process.env.PREPROCESS_WEBHOOK_SECRET;
    const convexUrl = process.env.CONVEX_SITE_URL || process.env.CONVEX_URL || process.env.NEXT_PUBLIC_CONVEX_URL;
    if (!modalUrl) throw new Error("Missing MODAL_TRAIN_URL in Convex env");
    if (!webhookSecret) throw new Error("Missing PREPROCESS_WEBHOOK_SECRET in Convex env");
    if (!convexUrl) throw new Error("Missing CONVEX_SITE_URL (preferred) or CONVEX_URL/NEXT_PUBLIC_CONVEX_URL in Convex env");

    const processedResp = await fetch(`${convexUrl}/dataset/processed-download-url`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-webhook-secret": webhookSecret },
      body: JSON.stringify({ datasetId }),
    });
    if (!processedResp.ok) {
      const t = await processedResp.text();
      throw new Error(`Failed to get processed CSV URL: ${processedResp.status} ${t}`);
    }
    const processed = await processedResp.json();

    const endpoint = modalUrl.endsWith("/train") ? modalUrl : `${modalUrl.replace(/\/$/, "")}/train`;
    const body = {
      datasetId,
      runCfgId: plan._id,
      csvUrl: processed.url,
      cfg: plan.cfg,
      secret: webhookSecret,
      callbacks: {
        uploadUrl: `${convexUrl}/storage/upload-url`,
        saveModel: `${convexUrl}/models/save`,
      },
    };
    const resp = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!resp.ok) {
      const t = await resp.text();
      throw new Error(`Training error: ${resp.status} ${t}`);
    }
    const data = await resp.json();
    return data;
  },
});


export const predictModel: unknown = action({
  args: { modelId: v.id("trained_models"), input: v.any() },
  handler: async (ctx, { modelId, input }) => {
    const modalUrl = process.env.MODAL_PREDICT_URL;
    const webhookSecret = process.env.PREPROCESS_WEBHOOK_SECRET;
    const convexUrl = process.env.CONVEX_SITE_URL || process.env.CONVEX_URL || process.env.NEXT_PUBLIC_CONVEX_URL;
    if (!modalUrl) throw new Error("Missing MODAL_PREDICT_URL in Convex env");
    if (!webhookSecret) throw new Error("Missing PREPROCESS_WEBHOOK_SECRET in Convex env");
    if (!convexUrl) throw new Error("Missing CONVEX_SITE_URL (preferred) or CONVEX_URL/NEXT_PUBLIC_CONVEX_URL in Convex env");

    const urlResp = await fetch(`${convexUrl}/models/download-url`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-webhook-secret": webhookSecret },
      body: JSON.stringify({ modelId }),
    });
    if (!urlResp.ok) {
      const t = await urlResp.text();
      throw new Error(`Failed to get model URL: ${urlResp.status} ${t}`);
    }
    const data = await urlResp.json();
    const url = data.url;

    const endpoint = modalUrl.endsWith("/predict") ? modalUrl : `${modalUrl.replace(/\/$/, "")}/predict`;
    const body = { modelUrl: url, X: Array.isArray(input) ? input : [input] };
    const resp = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!resp.ok) {
      const t = await resp.text();
      throw new Error(`Predict error: ${resp.status} ${t}`);
    }
    return await resp.json();
  },
});
