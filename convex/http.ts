import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { api } from "./_generated/api";
import type { Id } from "./_generated/dataModel";

const httpPreprocessRunning = httpAction(async (ctx, request) => {
  const secret = request.headers.get("x-webhook-secret");
  if (secret !== process.env.PREPROCESS_WEBHOOK_SECRET) {
    return new Response("unauthorized", { status: 401 });
  }
  const { runId } = (await request.json()) as { runId: string };
  await ctx.runMutation(api.datasets.markPreprocessRunning, {
    runId: runId as Id<"preprocess_runs">,
  });
  return new Response(JSON.stringify({ ok: true }), { status: 200 });
});

const httpPreprocessComplete = httpAction(async (ctx, request) => {
  const secret = request.headers.get("x-webhook-secret");
  if (secret !== process.env.PREPROCESS_WEBHOOK_SECRET) {
    return new Response("unauthorized", { status: 401 });
  }
  const { runId, processedStorageId, processedFilename, summary } =
    (await request.json()) as {
      runId: string;
      processedStorageId: string;
      processedFilename: string;
      summary: unknown;
    };
  await ctx.runMutation(api.datasets.completePreprocessRun, {
    runId: runId as Id<"preprocess_runs">,
    processedStorageId: processedStorageId as Id<"_storage">,
    processedFilename,
    summary,
  });
  return new Response(JSON.stringify({ ok: true }), { status: 200 });
});

const httpPreprocessFail = httpAction(async (ctx, request) => {
  const secret = request.headers.get("x-webhook-secret");
  if (secret !== process.env.PREPROCESS_WEBHOOK_SECRET) {
    return new Response("unauthorized", { status: 401 });
  }
  const { runId, error } = (await request.json()) as {
    runId: string;
    error: string;
  };
  await ctx.runMutation(api.datasets.failPreprocessRun, {
    runId: runId as Id<"preprocess_runs">,
    error,
  });
  return new Response(JSON.stringify({ ok: true }), { status: 200 });
});

const httpSaveProfile = httpAction(async (ctx, request) => {
  const secret = request.headers.get("x-webhook-secret");
  if (secret !== process.env.PREPROCESS_WEBHOOK_SECRET) {
    return new Response("unauthorized", { status: 401 });
  }
  const { datasetId, report, runId } = (await request.json()) as {
    datasetId: string;
    report: unknown;
    runId?: string;
  };
  await ctx.runMutation(api.datasets.saveProfile, {
    datasetId: datasetId as Id<"datasets">,
    report,
    runId: (runId as Id<"preprocess_runs">) ?? undefined,
  });
  return new Response(JSON.stringify({ ok: true }), { status: 200 });
});

const httpGenerateUploadUrl = httpAction(async (ctx, request) => {
  const secret = request.headers.get("x-webhook-secret");
  if (secret !== process.env.PREPROCESS_WEBHOOK_SECRET) {
    return new Response("unauthorized", { status: 401 });
  }
  const url = await ctx.storage.generateUploadUrl();
  return new Response(JSON.stringify({ url }), { status: 200 });
});

const http = httpRouter();

http.route({
  path: "/preprocess/running",
  method: "POST",
  handler: httpPreprocessRunning,
});
http.route({
  path: "/preprocess/complete",
  method: "POST",
  handler: httpPreprocessComplete,
});
http.route({
  path: "/preprocess/fail",
  method: "POST",
  handler: httpPreprocessFail,
});
http.route({ path: "/profile/save", method: "POST", handler: httpSaveProfile });
http.route({
  path: "/storage/upload-url",
  method: "POST",
  handler: httpGenerateUploadUrl,
});
// Helper to fetch original dataset download URL
http.route({
  path: "/dataset/download-url",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const secret = request.headers.get("x-webhook-secret");
    if (secret !== process.env.PREPROCESS_WEBHOOK_SECRET) {
      return new Response("unauthorized", { status: 401 });
    }
    const { datasetId } = (await request.json()) as { datasetId: string };
    const doc = await ctx.runQuery(api.datasets.getDataset, {
      id: datasetId as Id<"datasets">,
    });
    if (!doc) return new Response("not found", { status: 404 });
    const url = await ctx.storage.getUrl(doc.storageId);
    return new Response(JSON.stringify({ url }), { status: 200 });
  }),
});

// Helper to fetch latest processed CSV URL
http.route({
  path: "/dataset/processed-download-url",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const secret = request.headers.get("x-webhook-secret");
    if (secret !== process.env.PREPROCESS_WEBHOOK_SECRET) {
      return new Response("unauthorized", { status: 401 });
    }
    const { datasetId } = (await request.json()) as { datasetId: string };
    const runs = await ctx.runQuery(api.datasets.listPreprocessRuns, {
      datasetId: datasetId as Id<"datasets">,
    });
    const completed = Array.isArray(runs)
      ? runs.find((r: any) => r.status === "completed" && r.processedStorageId)
      : undefined;
    if (!completed?.processedStorageId) return new Response("not found", { status: 404 });
    const url = await ctx.storage.getUrl(completed.processedStorageId);
    return new Response(JSON.stringify({ url }), { status: 200 });
  }),
});

// Latest run cfg for dataset
http.route({
  path: "/run_cfg/latest",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const secret = request.headers.get("x-webhook-secret");
    if (secret !== process.env.PREPROCESS_WEBHOOK_SECRET) {
      return new Response("unauthorized", { status: 401 });
    }
    const { datasetId } = (await request.json()) as { datasetId: string };
    const cfg = await ctx.runQuery(api.datasets.getLatestRunCfg, {
      datasetId: datasetId as Id<"datasets">,
    });
    return new Response(JSON.stringify({ cfg }), { status: 200 });
  }),
});

// Save trained model metadata
http.route({
  path: "/models/save",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const secret = request.headers.get("x-webhook-secret");
    if (secret !== process.env.PREPROCESS_WEBHOOK_SECRET) {
      return new Response("unauthorized", { status: 401 });
    }
    const body = (await request.json()) as {
      datasetId: string;
      runCfgId?: string;
      modelName: string;
      storageId: string;
      metrics: unknown;
    };
    const id = await ctx.runMutation(api.datasets.saveTrainedModel, {
      datasetId: body.datasetId as Id<"datasets">,
      runCfgId: (body.runCfgId as Id<"run_cfgs">) ?? undefined,
      modelName: body.modelName,
      storageId: body.storageId as Id<"_storage">,
      metrics: body.metrics,
    });
    return new Response(JSON.stringify({ id }), { status: 200 });
  }),
});



// Download URL for a trained model by id
http.route({
  path: "/models/download-url",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const secret = request.headers.get("x-webhook-secret");
    if (secret !== process.env.PREPROCESS_WEBHOOK_SECRET) {
      return new Response("unauthorized", { status: 401 });
    }
    const { modelId } = (await request.json()) as { modelId: string };
    const doc = await ctx.runQuery(api.datasets.getTrainedModel, {
      id: modelId as Id<"trained_models">,
    });
    if (!doc) return new Response("not found", { status: 404 });
    const url = await ctx.storage.getUrl(doc.storageId);
    return new Response(JSON.stringify({ url }), { status: 200 });
  }),
});

export default http;
