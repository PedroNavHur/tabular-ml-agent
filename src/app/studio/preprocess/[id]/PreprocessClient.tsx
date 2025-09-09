"use client";
import { api } from "convex/_generated/api";
import type { Id, Doc } from "convex/_generated/dataModel";
import { useAction, useMutation, useQuery } from "convex/react";
import type { FunctionReference } from "convex/server";
import Link from "next/link";
import { toast } from "sonner";
import { useMemo, useState } from "react";

type TaskType = "auto" | "classification" | "regression";

function firstNLines(text: string, n: number): string[] {
  const out: string[] = [];
  let start = 0;
  while (out.length < n && start <= text.length) {
    const idx = text.indexOf("\n", start);
    if (idx === -1) {
      const line = text.slice(start).replace(/\r$/, "");
      if (line.length > 0) out.push(line);
      break;
    }
    const line = text.slice(start, idx).replace(/\r$/, "");
    if (line.length > 0) out.push(line);
    start = idx + 1;
  }
  return out;
}

function parseCsvPreview(
  text: string,
  maxRows = 20
): { headers: string[]; rows: string[][] } {
  // Only read the header + up to maxRows lines to keep fast
  const lines = firstNLines(text, maxRows + 1);
  if (lines.length === 0) return { headers: [], rows: [] };
  const headers = splitCsvLine(lines[0]);
  const rows: string[][] = [];
  const limit = Math.min(lines.length - 1, maxRows);
  for (let i = 0; i < limit; i++) {
    rows.push(splitCsvLine(lines[i + 1]));
  }
  return { headers, rows };
}

function splitCsvLine(line: string): string[] {
  // Minimal CSV splitter: handles simple quoted fields and commas.
  const result: string[] = [];
  let cur = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        cur += '"';
        i++; // skip escaped quote
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === "," && !inQuotes) {
      result.push(cur);
      cur = "";
    } else {
      cur += ch;
    }
  }
  result.push(cur);
  return result;
}

export default function PreprocessClient({ id }: { id: string }) {
  const datasetId = id as Id<"datasets">;
  const dataset = useQuery(api.datasets.getDataset, { id: datasetId });
  const getDownloadUrl = useMutation(api.datasets.getDownloadUrl);
  const startPreprocessRef = (
    api as unknown as {
      flows: { startPreprocess: FunctionReference<"action"> };
    }
  ).flows.startPreprocess;
  const startPreprocess = useAction(startPreprocessRef);
  const summarizeProfileRef = (
    api as unknown as {
      flows: { summarizeProfile: FunctionReference<"action"> };
    }
  ).flows.summarizeProfile;
  const summarizeProfile = useAction(summarizeProfileRef);

  const info = useMemo(() => dataset, [dataset]);
  const [loading, setLoading] = useState(false);
  const [previewRows, setPreviewRows] = useState<number>(20);
  const [headers, setHeaders] = useState<string[]>([]);
  const [rows, setRows] = useState<string[][]>([]);
  const [target, setTarget] = useState<string | null>(null);
  const [idColumn, setIdColumn] = useState<string | null>(null);
  const [taskType, setTaskType] = useState<TaskType>("auto");
  const [testSize, setTestSize] = useState<number>(0.2);
  const [missing, setMissing] = useState<
    "auto" | "drop" | "mean" | "median" | "most_frequent"
  >("auto");

  // Status panels
  const runs = useQuery(
    api.datasets.listPreprocessRuns,
    info ? { datasetId: info._id as Id<"datasets"> } : "skip"
  );
  const latestProfile = useQuery(
    api.datasets.getLatestProfile,
    info ? { datasetId: info._id as Id<"datasets"> } : "skip"
  );
  const latestProfileSummary = useQuery(
    api.datasets.getLatestProfileSummary,
    info ? { datasetId: info._id as Id<"datasets"> } : "skip"
  ) as Doc<"profile_summaries"> | null | undefined;
  const hasCompleted =
    Array.isArray(runs) && runs.some(r => r.status === "completed");

  const loadPreview = async (n?: number) => {
    if (!info) return;
    setLoading(true);
    try {
      await toast.promise(
        (async () => {
          const url = await getDownloadUrl({ storageId: info.storageId });
          if (!url) throw new Error("No download URL");
          const res = await fetch(url);
          const text = await res.text();
          const { headers, rows } = parseCsvPreview(text, n ?? previewRows);
          setHeaders(headers);
          setRows(rows);
          if (headers.length > 0 && !target)
            setTarget(headers[headers.length - 1] ?? null);
        })(),
        {
          loading: "Loading preview...",
          success: "Preview loaded",
          error: "Failed to load preview",
        }
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-6xl space-y-4">
      <h2 className="text-xl font-semibold">Preprocess Dataset</h2>
      {info === undefined ? (
        <div className="opacity-70">Loading dataset...</div>
      ) : info === null ? (
        <div className="opacity-70">Dataset not found.</div>
      ) : (
        <>
          <div className="card bg-base-200">
            <div className="card-body gap-3">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">{info.filename}</div>
                  <div className="text-xs opacity-70">{info.contentType}</div>
                </div>
                <div className="flex gap-2 items-center">
                  <span className="text-xs opacity-70">Rows</span>
                  <div className="join">
                    {[10, 20, 50, 100].map((n) => (
                      <button
                        key={n}
                        type="button"
                        className={`btn btn-sm join-item ${previewRows === n ? "btn-active" : ""}`}
                        onClick={() => {
                          setPreviewRows(n);
                          if (headers.length && !loading) void loadPreview(n);
                        }}
                        disabled={loading}
                      >
                        {n}
                      </button>
                    ))}
                  </div>
                  <button
                    className="btn btn-sm"
                    onClick={() => loadPreview()}
                    disabled={loading}
                  >
                    Load preview
                  </button>
                  <button
                    className="btn btn-sm btn-ghost"
                    onClick={() => {
                      setHeaders([]);
                      setRows([]);
                    }}
                    disabled={loading}
                  >
                    Clear
                  </button>
                </div>
              </div>

              {/* Controls */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <label className="form-control w-full">
                  <div className="label">
                    <span className="label-text">Target column</span>
                  </div>
                  <select
                    className="select select-bordered"
                    value={target ?? ""}
                    onChange={e => setTarget(e.target.value || null)}
                  >
                    <option value="" disabled>
                      {headers.length
                        ? "Select target"
                        : "Load preview to choose"}
                    </option>
                    {headers.map(h => (
                      <option key={h} value={h}>
                        {h}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="form-control w-full">
                  <div className="label">
                    <span className="label-text">ID column (optional)</span>
                  </div>
                  <select
                    className="select select-bordered"
                    value={idColumn ?? ""}
                    onChange={e => setIdColumn(e.target.value || null)}
                  >
                    <option value="">None</option>
                    {headers.map(h => (
                      <option key={h} value={h}>
                        {h}
                      </option>
                    ))}
                  </select>
                </label>

                <div className="form-control">
                  <div className="label">
                    <span className="label-text">Task type</span>
                  </div>
                  <div className="join">
                    <input
                      type="radio"
                      name="task"
                      className="btn join-item"
                      aria-label="Auto"
                      checked={taskType === "auto"}
                      onChange={() => setTaskType("auto")}
                    />
                    <input
                      type="radio"
                      name="task"
                      className="btn join-item"
                      aria-label="Classification"
                      checked={taskType === "classification"}
                      onChange={() => setTaskType("classification")}
                    />
                    <input
                      type="radio"
                      name="task"
                      className="btn join-item"
                      aria-label="Regression"
                      checked={taskType === "regression"}
                      onChange={() => setTaskType("regression")}
                    />
                  </div>
                </div>

                <label className="form-control">
                  <div className="label">
                    <span className="label-text">Missing values</span>
                  </div>
                  <select
                    className="select select-bordered"
                    value={missing}
                    onChange={e => setMissing(e.target.value as typeof missing)}
                  >
                    <option value="auto">Auto</option>
                    <option value="drop">Drop rows</option>
                    <option value="mean">Impute mean</option>
                    <option value="median">Impute median</option>
                    <option value="most_frequent">Impute most frequent</option>
                  </select>
                </label>

                <label className="form-control">
                  <div className="label">
                    <span className="label-text">
                      Test split: {(testSize * 100).toFixed(0)}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min={0.1}
                    max={0.5}
                    step={0.05}
                    value={testSize}
                    onChange={e => setTestSize(parseFloat(e.target.value))}
                    className="range"
                  />
                </label>
              </div>

              <div className="card-actions justify-end pt-2">
                <button
                  className="btn btn-secondary"
                  disabled={!headers.length || !target}
                  onClick={async () => {
                    if (!info) return;
                    try {
                      await startPreprocess({
                        datasetId: info._id as Id<"datasets">,
                        params: {
                          target,
                          idColumn,
                          taskType,
                          missing,
                          testSize,
                        },
                      });
                      toast.success("Preprocess started");
                    } catch (e: unknown) {
                      const msg =
                        e instanceof Error
                          ? e.message
                          : "Failed to start preprocess";
                      toast.error(msg);
                    } finally {
                      // no-op
                    }
                  }}
                >
                  Preprocess
                </button>
                <button
                  className="btn btn-primary"
                  disabled={!headers.length || !target || !hasCompleted}
                  title={!hasCompleted ? "Run preprocessing first" : undefined}
                  onClick={async () => {
                    if (!info) return;
                    try {
                      await summarizeProfile({
                        datasetId: info._id as Id<"datasets">,
                      });
                      toast.success("Profile summarized");
                    } catch (e: unknown) {
                      const msg =
                        e instanceof Error
                          ? e.message
                          : "Failed to summarize profile";
                      toast.error(msg);
                    } finally {
                      // no-op
                    }
                  }}
                >
                  Run Profiling
                </button>
                {(!headers.length || !target) ? (
                  <button className="btn btn-outline" disabled>
                    Next: Train
                  </button>
                ) : (
                  <a className="btn btn-outline" href={`/studio/train/${String(datasetId)}`}>
                    Next: Train
                  </a>
                )}
              </div>
            </div>
          </div>

          {/* Sonner handles toasts globally */}

          {/* Status Panels */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="card bg-base-200">
              <div className="card-body">
                <h3 className="card-title">Latest Preprocess Run</h3>
                {runs === undefined ? (
                  <div className="opacity-70">Loading...</div>
                ) : !runs || runs.length === 0 ? (
                  <div className="opacity-70">No runs yet.</div>
                ) : (
                  <>
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">
                          Status: {runs[0].status}
                        </div>
                        <div className="text-xs opacity-70">
                          Updated:{" "}
                          {new Date(runs[0].updatedAt).toLocaleString()}
                        </div>
                      </div>
                      {/* processed filename omitted to avoid long names cluttering the UI */}
                    </div>
                    {runs[0].summary ? (
                      <pre className="text-xs whitespace-pre-wrap opacity-80 max-h-40 overflow-auto">
                        {JSON.stringify(runs[0].summary, null, 2)}
                      </pre>
                    ) : null}
                    <div className="card-actions justify-end">
                      {info ? (
                        <Link
                          href={`/studio/preprocess/${String(info._id)}/runs`}
                          className="btn btn-sm btn-outline"
                        >
                          View all runs
                        </Link>
                      ) : null}
                    </div>
                  </>
                )}
              </div>
            </div>
            <div className="card bg-base-200">
              <div className="card-body">
                <h3 className="card-title">Latest Profile</h3>
                {latestProfile === undefined ? (
                  <div className="opacity-70">Loading...</div>
                ) : !latestProfile ? (
                  <div className="opacity-70">No profile saved yet.</div>
                ) : (
                  <pre className="text-xs whitespace-pre-wrap opacity-80 max-h-40 overflow-auto">
                    {JSON.stringify(latestProfile.report, null, 2)}
                  </pre>
                )}
              </div>
            </div>
          </div>

          {/* Summary */}
          <div className="card bg-base-200">
            <div className="card-body">
              <h3 className="card-title">Profile Summary</h3>
              {latestProfileSummary === undefined ? (
                <div className="opacity-70">Loading...</div>
              ) : !latestProfileSummary ? (
                <div className="opacity-70">
                  No summary yet. Use &quot;Run Profiling&quot; to generate.
                </div>
              ) : (
                (() => {
                  let items: Array<{ title: string; detail: string }> | null =
                    null;
                  try {
                    const parsed = JSON.parse(latestProfileSummary.summary);
                    if (Array.isArray(parsed))
                      items = parsed as Array<{
                        title: string;
                        detail: string;
                      }>;
                  } catch {}
                  return items ? (
                    <ul className="list-disc pl-5 space-y-1">
                      {items.map((it, idx) => (
                        <li key={idx}>
                          <span className="font-semibold">{it.title}:</span>{" "}
                          {it.detail}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <div className="prose prose-sm max-w-none whitespace-pre-wrap opacity-90">
                      {latestProfileSummary.summary}
                    </div>
                  );
                })()
              )}
            </div>
          </div>
          {/* Preview Table */}
          <div className="card bg-base-200">
            <div className="card-body">
              <h3 className="card-title">Preview</h3>
              {!headers.length ? (
                <div className="opacity-70 text-sm">No preview loaded.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="table table-zebra">
                    <thead>
                      <tr>
                        {headers.map(h => (
                          <th key={h}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {rows.map((r, i) => (
                        <tr key={i}>
                          {headers.map((_, j) => (
                            <td key={j}>{r[j] ?? ""}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
