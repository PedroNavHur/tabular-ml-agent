"use client";
import { useEffect, useMemo, useState } from "react";
import { useAction, useQuery } from "convex/react";
import Link from "next/link";
import { api } from "convex/_generated/api";
import type { Id, Doc } from "convex/_generated/dataModel";
import type { FunctionReference } from "convex/server";

export default function SuggestClient({ id }: { id: string }) {
  const datasetId = id as Id<"datasets">;
  const latestSummary = useQuery(api.datasets.getLatestProfileSummary, { datasetId }) as
    | Doc<"profile_summaries">
    | null
    | undefined;
  const latestRunCfg = useQuery(api.datasets.getLatestRunCfg, { datasetId }) as
    | Doc<"run_cfgs">
    | null
    | undefined;
  const trainedModels = useQuery(api.datasets.listTrainedModels, { datasetId }) as
    | Doc<"trained_models">[]
    | null
    | undefined;

  const generateRunCfgRef = (
    api as unknown as { flows: { generateRunCfg: FunctionReference<"action"> } }
  ).flows.generateRunCfg;
  const generateRunCfg = useAction(generateRunCfgRef);
  const startTrainingRef = (
    api as unknown as { flows: { startTraining: FunctionReference<"action"> } }
  ).flows.startTraining;
  const startTraining = useAction(startTrainingRef);

  const [status, setStatus] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setStatus("Generating training plan...");
        await generateRunCfg({ datasetId });
        if (!cancelled) setStatus("Training plan generated");
        setTimeout(() => !cancelled && setStatus(null), 2500);
      } catch (e) {
        if (!cancelled) setStatus("Failed to generate plan");
        setTimeout(() => !cancelled && setStatus(null), 3000);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [datasetId, generateRunCfg]);

  const plan = useMemo(() => latestRunCfg?.cfg, [latestRunCfg]);

  return (
    <div className="w-full max-w-6xl space-y-4">
      <h2 className="text-xl font-semibold">Suggested Training Plan</h2>
      <div className="card bg-base-200">
        <div className="card-body flex flex-col md:flex-row gap-2 md:items-center md:justify-between">
          <div className="flex gap-2">
            <Link className="btn btn-ghost" href={`/studio/preprocess/${id}`}>
              ← Prev: Preprocess
            </Link>
          </div>
          <div className="flex gap-2">
            {Array.isArray(trainedModels) && trainedModels.length > 0 ? (
              <Link className="btn" href={`/studio/results/${id}`}>
                View Results
              </Link>
            ) : (
              <button className="btn" disabled>
                View Results
              </button>
            )}
            <button
              className="btn btn-primary"
              disabled={!latestRunCfg}
              onClick={async () => {
                try {
                  setStatus("Starting training...");
                  await startTraining({ datasetId });
                  setStatus("Training started");
                } catch (e) {
                  setStatus("Failed to start training");
                } finally {
                  setTimeout(() => setStatus(null), 3000);
                }
              }}
            >
              Train Models
            </button>
          </div>
        </div>
      </div>

      {status ? (
        <div className="toast toast-end">
          <div className="alert alert-info">
            <span>{status}</span>
          </div>
        </div>
      ) : null}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="card bg-base-200">
          <div className="card-body">
            <h3 className="card-title">Latest Profile Summary</h3>
            {latestSummary === undefined ? (
              <div className="opacity-70">Loading...</div>
            ) : !latestSummary ? (
              <div className="opacity-70">No summary found.</div>
            ) : (() => {
              let items: Array<{ title: string; detail: string }> | null = null;
              try {
                const parsed = JSON.parse(latestSummary.summary);
                if (Array.isArray(parsed)) items = parsed;
              } catch {}
              return items ? (
                <ul className="list-disc pl-5 space-y-1">
                  {items.map((it, idx) => (
                    <li key={idx}>
                      <span className="font-semibold">{it.title}:</span> {it.detail}
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="prose prose-sm max-w-none whitespace-pre-wrap opacity-90">
                  {latestSummary.summary}
                </div>
              );
            })()}
          </div>
        </div>

        <div className="card bg-base-200 md:col-span-1">
          <div className="card-body">
            <h3 className="card-title">Plan JSON</h3>
            {latestRunCfg === undefined ? (
              <div className="opacity-70">Generating...</div>
            ) : !latestRunCfg ? (
              <div className="opacity-70">No plan yet.</div>
            ) : (
              <pre className="text-xs whitespace-pre-wrap opacity-90 max-h-80 overflow-auto">
                {typeof plan === "string" ? plan : JSON.stringify(plan as unknown, null, 2)}
              </pre>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
