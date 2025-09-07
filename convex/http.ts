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

export default http;
