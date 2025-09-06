"use client";
import { useMemo, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import type { Id } from "../../../../../convex/_generated/dataModel";

type TaskType = "auto" | "classification" | "regression";

function parseCsvPreview(text: string, maxRows = 50): { headers: string[]; rows: string[][] } {
  const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length === 0) return { headers: [], rows: [] };
  const headers = splitCsvLine(lines[0]);
  const rows: string[][] = [];
  for (let i = 1; i < Math.min(lines.length, maxRows + 1); i++) {
    rows.push(splitCsvLine(lines[i]));
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

  const info = useMemo(() => dataset, [dataset]);
  const [loading, setLoading] = useState(false);
  const [headers, setHeaders] = useState<string[]>([]);
  const [rows, setRows] = useState<string[][]>([]);
  const [target, setTarget] = useState<string | null>(null);
  const [idColumn, setIdColumn] = useState<string | null>(null);
  const [taskType, setTaskType] = useState<TaskType>("auto");
  const [testSize, setTestSize] = useState<number>(0.2);
  const [missing, setMissing] = useState<"auto" | "drop" | "mean" | "median" | "most_frequent">("auto");

  const loadPreview = async () => {
    if (!info) return;
    setLoading(true);
    try {
      const url = await getDownloadUrl({ storageId: info.storageId });
      if (!url) throw new Error("No download URL");
      const res = await fetch(url);
      const text = await res.text();
      const { headers, rows } = parseCsvPreview(text);
      setHeaders(headers);
      setRows(rows);
      if (headers.length > 0 && !target) setTarget(headers[headers.length - 1] ?? null);
    } catch (e) {
      // noop: MVP scaffolding
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
                <div className="flex gap-2">
                  <button className="btn btn-sm" onClick={loadPreview} disabled={loading}>
                    {loading ? "Loading..." : "Load preview"}
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
                    onChange={(e) => setTarget(e.target.value || null)}
                  >
                    <option value="" disabled>
                      {headers.length ? "Select target" : "Load preview to choose"}
                    </option>
                    {headers.map((h) => (
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
                    onChange={(e) => setIdColumn(e.target.value || null)}
                  >
                    <option value="">None</option>
                    {headers.map((h) => (
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
                    onChange={(e) => setMissing(e.target.value as typeof missing)}
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
                    <span className="label-text">Test split: {(testSize * 100).toFixed(0)}%</span>
                  </div>
                  <input
                    type="range"
                    min={0.1}
                    max={0.5}
                    step={0.05}
                    value={testSize}
                    onChange={(e) => setTestSize(parseFloat(e.target.value))}
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
                    const body = {
                      datasetId: String(info._id),
                      params: {
                        target,
                        idColumn,
                        taskType,
                        missing,
                        testSize,
                      },
                    };
                    await fetch("/api/preprocess", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify(body),
                    });
                  }}
                >
                  Preprocess
                </button>
                <button className="btn btn-primary" disabled={!headers.length || !target}>
                  Run Profiling
                </button>
                <button className="btn btn-outline" disabled={!headers.length || !target}>
                  Next: Suggest Models
                </button>
              </div>
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
                        {headers.map((h) => (
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
