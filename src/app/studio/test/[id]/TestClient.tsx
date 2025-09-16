"use client";
import { useAction, useMutation, useQuery } from "convex/react";
import { JsonEditor, type JsonData } from "json-edit-react";
import { ArrowBigLeft } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
// toast handled via useToastOp
import { useToastOp } from "@/hooks/useToastOp";
import { api } from "convex/_generated/api";
import type { Doc, Id } from "convex/_generated/dataModel";
import type { FunctionReference } from "convex/server";

export default function TestClient({ id }: { id: string }) {
  const datasetId = id as Id<"datasets">;
  const search = useSearchParams();
  const modelParam = search.get("model");
  const profile = useQuery(api.datasets.getLatestProfile, { datasetId });
  const models = useQuery(api.datasets.listTrainedModels, { datasetId }) as
    | Doc<"trained_models">[]
    | undefined;
  const runs = useQuery(api.datasets.listPreprocessRuns, { datasetId }) as
    | Doc<"preprocess_runs">[]
    | undefined;
  const getDownloadUrl = useMutation(api.datasets.getDownloadUrl);
  const predictRef = (
    api as unknown as { flows: { predictModel: FunctionReference<"action"> } }
  ).flows.predictModel;
  const predict = useAction(predictRef);

  const cols = useMemo(() => profile?.report?.columns ?? [], [profile]);
  const describe = useMemo(
    () =>
      (profile?.report?.describe ?? {}) as Record<
        string,
        Record<string, unknown>
      >,
    [profile]
  );
  const [selectedModel, setSelectedModel] = useState<string | null>(null);
  const [form, setForm] = useState<Record<string, string>>({});
  const [result, setResult] = useState<unknown>(null);
  const [samples, setSamples] = useState<Record<string, string>[]>([]);
  const samplesOp = useToastOp();
  const predictOp = useToastOp();
  const [sampleIndex, setSampleIndex] = useState<number | "">("");

  async function loadSamples() {
    if (samplesOp.inFlight) return;
    await samplesOp.run(
      async () => {
        const latestCompleted = Array.isArray(runs)
          ? runs.find(r => r.status === "completed" && r.processedStorageId)
          : undefined;
        if (!latestCompleted?.processedStorageId) {
          throw new Error("No processed data found");
        }
        const url = await getDownloadUrl({
          storageId: latestCompleted.processedStorageId,
        });
        if (!url) throw new Error("No URL");
        const res = await fetch(url);
        const text = await res.text();
        const parsed = parseCsv(text, 50);
        setSamples(parsed.rows);
      },
      {
        loading: "Loading samples...",
        success: "Samples loaded",
        error: e => (e instanceof Error ? e.message : "Failed to load samples"),
      }
    );
  }

  function parseCsv(
    text: string,
    maxRows = 50
  ): { headers: string[]; rows: Record<string, string>[] } {
    const lines = text.split(/\r?\n/).filter(l => l.trim().length > 0);
    if (lines.length === 0) return { headers: [], rows: [] };
    const headers = splitCsvLine(lines[0]);
    const rows: Record<string, string>[] = [];
    for (let i = 1; i < Math.min(lines.length, maxRows + 1); i++) {
      const vals = splitCsvLine(lines[i]);
      const rec: Record<string, string> = {};
      headers.forEach((h, idx) => {
        rec[h] = vals[idx] ?? "";
      });
      rows.push(rec);
    }
    return { headers, rows };
  }

  function splitCsvLine(line: string): string[] {
    const result: string[] = [];
    let cur = "";
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') {
        if (inQuotes && line[i + 1] === '"') {
          cur += '"';
          i++;
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

  const featureCols = useMemo(
    () =>
      Array.isArray(cols)
        ? cols.filter((c: string) => c !== profile?.report?.target)
        : [],
    [cols, profile]
  );

  const latestCompletedRun = useMemo(() => {
    if (!Array.isArray(runs)) return null;
    return runs.find(r => r.status === "completed" && r.summary);
  }, [runs]);

  function asRecord(u: unknown): Record<string, unknown> {
    return u && typeof u === "object" ? (u as Record<string, unknown>) : {};
  }

  function asString(u: unknown): string | undefined {
    return typeof u === "string" ? u : undefined;
  }

  function asNumber(u: unknown): number | undefined {
    return typeof u === "number" && Number.isFinite(u) ? u : undefined;
  }

  function renderResult(res: unknown) {
    const rec = asRecord(res);
    const preds = rec["predictions"] as unknown;
    const prob = rec["probabilities"] as unknown;
    if (Array.isArray(preds)) {
      // Single prediction
      if (preds.length === 1) {
        const val = preds[0];
        const isClassification =
          Array.isArray(prob) &&
          Array.isArray((prob as unknown[])[0] as unknown[]);
        const prows = isClassification
          ? ((prob as unknown[])[0] as unknown[])
          : null;
        return (
          <div className="space-y-4">
            <div className="stats shadow w-full">
              <div className="stat">
                <div className="stat-title">Prediction</div>
                <div className="stat-value text-primary">
                  {typeof val === "number"
                    ? isClassification
                      ? String(val)
                      : val.toFixed(4)
                    : String(val)}
                </div>
              </div>
            </div>
            {Array.isArray(prows) && prows.length > 0 ? (
              <div>
                <div className="mb-2 text-sm opacity-80">
                  Class probabilities
                </div>
                <div className="flex flex-col gap-2">
                  {(prows as number[]).map((p, i) => {
                    const pct = Math.max(0, Math.min(1, Number(p))) * 100;
                    return (
                      <div key={i} className="flex items-center gap-3">
                        <span className="badge w-14 justify-center">#{i}</span>
                        <progress
                          className="progress progress-accent w-64"
                          value={pct}
                          max={100}
                        />
                        <span className="text-xs font-mono">
                          {pct.toFixed(1)}%
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : null}
          </div>
        );
      }
      // Multiple predictions -> simple table
      return (
        <div className="overflow-x-auto">
          <table className="table table-zebra">
            <thead>
              <tr>
                <th>#</th>
                <th>Prediction</th>
              </tr>
            </thead>
            <tbody>
              {preds.map((v, i) => (
                <tr key={i}>
                  <td className="w-10">{i + 1}</td>
                  <td className="font-mono">
                    {typeof v === "number"
                      ? (v.toFixed?.(4) ?? String(v))
                      : String(v)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    }
    // Fallback: render JSON
    return (
      <div className="text-xs opacity-90">
        <JsonEditor
          data={res as JsonData}
          viewOnly
          indent={2}
          rootFontSize={"0.6rem"}
        />
      </div>
    );
  }

  const dtypeByCol = useMemo(() => {
    const summaryRec = asRecord(latestCompletedRun?.summary as unknown);
    const dtypesRec = asRecord(summaryRec["dtypes"]);
    const out: Record<string, string> = {};
    for (const [k, v] of Object.entries(dtypesRec)) {
      const sv = asString(v);
      if (sv !== undefined) out[k] = sv;
    }
    return out;
  }, [latestCompletedRun]);

  function isNumericColumn(c: string): boolean {
    const dtype = dtypeByCol[c]?.toLowerCase?.() ?? "";
    if (
      dtype.includes("int") ||
      dtype.includes("float") ||
      dtype.includes("double")
    )
      return true;
    if (
      dtype &&
      (dtype.includes("object") ||
        dtype.includes("string") ||
        dtype.includes("category") ||
        dtype.includes("bool"))
    )
      return false;
    const stats = asRecord(describe?.[c]);
    const top = stats["top"];
    const topIsString = typeof top === "string" && top.length > 0;
    const numericKeys = [
      "mean",
      "std",
      "25%",
      "50%",
      "75%",
      "min",
      "max",
    ] as const;
    const hasNumericStat = numericKeys.some(k => typeof stats[k] === "number");
    // Treat as numeric only if we see numeric stats and it's not clearly categorical (top as string)
    return hasNumericStat && !topIsString;
  }

  useEffect(() => {
    if (modelParam) setSelectedModel(modelParam);
  }, [modelParam]);

  return (
    <div className="w-full max-w-5xl space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Test Trained Model</h2>
        <div className="flex gap-2">
          <Link className="btn btn-ghost" href={`/studio/results/${id}`}>
            <ArrowBigLeft className="h-4 w-4" />
            <span>Results</span>
          </Link>
        </div>
      </div>

      <div className="card bg-base-200">
        <div className="card-body gap-3">
          <div className="flex items-center justify-between">
            <h3 className="card-title m-0">Model & Samples</h3>
            <button
              className="btn btn-outline rounded-2xl"
              onClick={loadSamples}
              type="button"
              disabled={samplesOp.inFlight}
            >
              Load samples
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:items-end">
            <div className="form-control w-full flex flex-col gap-2">
              <label className="label p-0">
                <span className="label-text">Choose model</span>
              </label>
              <select
                className="select select-bordered h-12"
                value={selectedModel ?? ""}
                onChange={e => setSelectedModel(e.target.value || null)}
              >
                <option value="" disabled>
                  {Array.isArray(models) && models.length
                    ? "Select"
                    : "No models trained yet"}
                </option>
                {Array.isArray(models)
                  ? models.map(m => (
                      <option key={String(m._id)} value={String(m._id)}>
                        {m.modelName}
                      </option>
                    ))
                  : null}
              </select>
            </div>

            <div className="form-control w-full flex flex-col gap-2">
              <label className="label p-0">
                <span className="label-text">Prefill from sample</span>
              </label>
              <select
                className="select select-bordered h-12"
                value={sampleIndex === "" ? "" : String(sampleIndex)}
                onChange={e => {
                  const v = e.target.value;
                  setSampleIndex(v === "" ? "" : Number(v));
                  if (v !== "") {
                    const idx = Number(v);
                    const rec = samples[idx];
                    if (rec) {
                      const next: Record<string, string> = { ...form };
                      featureCols.forEach((c: string) => {
                        if (rec[c] !== undefined) next[c] = String(rec[c]);
                      });
                      setForm(next);
                    }
                  }
                }}
              >
                <option value="">Select row</option>
                {samples.map((_, i) => (
                  <option key={i} value={String(i)}>
                    Row {i + 1}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      <div className="card bg-base-200">
        <div className="card-body gap-3">
          <h3 className="card-title">Feature Inputs</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {featureCols.map((c: string) => {
              const stats = asRecord(describe?.[c]);
              const isNumeric = isNumericColumn(c);
              const min = isNumeric ? asNumber(stats["min"]) : undefined;
              const max = isNumeric ? asNumber(stats["max"]) : undefined;
              return (
                <div key={c} className="form-control flex flex-col gap-2">
                  <label className="label p-0">
                    <span className="label-text">{c}</span>
                    {isNumeric ? (
                      <span className="label-text-alt opacity-70">{`Min: ${min ?? "?"}  Max: ${max ?? "?"}`}</span>
                    ) : null}
                  </label>
                  <input
                    type={isNumeric ? "number" : "text"}
                    className="input input-bordered"
                    value={form[c] ?? ""}
                    {...(isNumeric && min !== undefined ? { min } : {})}
                    {...(isNumeric && max !== undefined ? { max } : {})}
                    onChange={e =>
                      setForm(f => ({ ...f, [c]: e.target.value }))
                    }
                  />
                </div>
              );
            })}
          </div>

          <div className="card-actions justify-end">
            <button
              className="btn btn-primary rounded-2xl"
              disabled={
                !selectedModel ||
                !Array.isArray(models) ||
                models.length === 0 ||
                predictOp.inFlight
              }
              onClick={async () => {
                if (!selectedModel) return;
                await predictOp.run(
                  async () => {
                    const modelId =
                      selectedModel as unknown as Id<"trained_models">;
                    const res = await predict({ modelId, input: form });
                    setResult(res);
                  },
                  {
                    loading: "Predicting...",
                    success: "Done",
                    error: "Failed to predict",
                  }
                );
              }}
            >
              Predict
            </button>
          </div>
        </div>
      </div>

      <div className="card bg-base-200">
        <div className="card-body">
          <h3 className="card-title">Result</h3>
          {result ? (
            renderResult(result)
          ) : (
            <div className="opacity-70">No prediction yet.</div>
          )}
        </div>
      </div>
    </div>
  );
}
