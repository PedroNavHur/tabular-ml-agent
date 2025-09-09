"use client";
import { useToastOp } from "@/hooks/useToastOp";
import { api } from "convex/_generated/api";
import type { Doc, Id } from "convex/_generated/dataModel";
import { useAction, useQuery } from "convex/react";
import type { FunctionReference } from "convex/server";
import Link from "next/link";
import { ArrowBigLeft } from "lucide-react";
import { useMemo } from "react";
import { ArrowBigRight } from "lucide-react";
import { JsonEditor, type JsonData } from "json-edit-react";

export default function TrainClient({ id }: { id: string }) {
  const datasetId = id as Id<"datasets">;
  const latestSummary = useQuery(api.datasets.getLatestProfileSummary, {
    datasetId,
  }) as Doc<"profile_summaries"> | null | undefined;
  const latestProfile = useQuery(api.datasets.getLatestProfile, { datasetId });
  const latestRunCfg = useQuery(api.datasets.getLatestRunCfg, { datasetId }) as
    | Doc<"run_cfgs">
    | null
    | undefined;
  const trainedModels = useQuery(api.datasets.listTrainedModels, {
    datasetId,
  }) as Doc<"trained_models">[] | null | undefined;

  const generateRunCfgRef = (
    api as unknown as { flows: { generateRunCfg: FunctionReference<"action"> } }
  ).flows.generateRunCfg;
  const generateRunCfg = useAction(generateRunCfgRef);
  const startTrainingRef = (
    api as unknown as { flows: { startTraining: FunctionReference<"action"> } }
  ).flows.startTraining;
  const startTraining = useAction(startTrainingRef);

  // Plan generation is now manual via the button below.

  const plan = useMemo(() => latestRunCfg?.cfg, [latestRunCfg]);
  const genOp = useToastOp();
  const startOp = useToastOp();

  return (
    <div className="w-full max-w-6xl space-y-4">
      <h2 className="text-xl font-semibold">Training Plan</h2>
      <div className="card bg-base-200">
        <div className="card-body flex flex-col md:flex-row gap-2 md:items-center md:justify-between">
          <div className="flex gap-2">
            <Link className="btn btn-outline" href={`/studio/preprocess/${id}`}>
              <ArrowBigLeft className="h-4 w-4" />
              <span>Preprocess</span>
            </Link>
          </div>
          <div className="flex gap-2">
            <button
              className="btn"
              disabled={!latestSummary || !!latestRunCfg || genOp.inFlight}
              onClick={async () => {
                if (!latestSummary) return;
                if (latestRunCfg) return;
                if (genOp.inFlight) return;
                await genOp.run(() => generateRunCfg({ datasetId }), {
                  loading: "Generating training plan...",
                  success: "Training plan generated",
                  error: "Failed to generate plan",
                });
              }}
            >
              Generate Run Config
            </button>
            <button
              className="btn btn-primary"
              disabled={!latestRunCfg || !latestSummary || startOp.inFlight}
              onClick={async () => {
                if (startOp.inFlight) return;
                await startOp.run(() => startTraining({ datasetId }), {
                  loading: "Starting training...",
                  success: "Training started",
                  error: "Failed to start training",
                });
              }}
            >
              Train Models
            </button>
            {Array.isArray(trainedModels) && trainedModels.length > 0 ? (
              <Link className="btn btn-outline" href={`/studio/results/${id}`}>
                <span>Results</span>
                <ArrowBigRight className="h-4 w-4" />
              </Link>
            ) : (
              <button className="btn btn-outline" disabled>
                <span>Results</span>
                <ArrowBigRight className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="card bg-base-200">
          <div className="card-body">
            <h3 className="card-title">Latest Training</h3>
            {trainedModels === undefined ? (
              <div className="opacity-70">Loading...</div>
            ) : !trainedModels || trainedModels.length === 0 ? (
              <div className="opacity-70">
                {startOp.inFlight ? "Training in progress..." : "No trained models yet."}
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">Status: completed</div>
                    <div className="text-xs opacity-70">
                      Updated: {new Date(trainedModels[0].createdAt).toLocaleString()}
                    </div>
                  </div>
                  <div className="text-xs opacity-70">Models: {trainedModels.length}</div>
                </div>
              </>
            )}
          </div>
        </div>
        <div className="card bg-base-200">
          <div className="card-body">
            <h3 className="card-title">Plan JSON</h3>
            {latestRunCfg === undefined ? (
              <div className="opacity-70">Generating...</div>
            ) : !latestRunCfg ? (
              <div className="opacity-70">No plan yet.</div>
            ) : (
              <div className="text-xs opacity-90 max-h-80 overflow-auto">
                <JsonEditor
                  data={
                    (typeof plan === "string"
                      ? (() => {
                          try {
                            return JSON.parse(plan as string);
                          } catch {
                            return { value: plan };
                          }
                        })()
                      : (plan as unknown)) as JsonData
                  }
                  viewOnly
                  indent={2}
                />
              </div>
            )}
          </div>
        </div>

        <div className="card bg-base-200 md:col-span-2">
          <div className="card-body">
            <h3 className="card-title">Latest Profile Summary</h3>
            {latestSummary === undefined ? (
              <div className="opacity-70">Loading...</div>
            ) : !latestSummary ? (
              <div className="opacity-70">
                {latestProfile ? "Profiling in progress..." : "No summary found."}
              </div>
            ) : (
              (() => {
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
              })()
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
