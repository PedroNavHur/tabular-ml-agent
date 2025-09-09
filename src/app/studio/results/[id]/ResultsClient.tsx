"use client";
import { api } from "convex/_generated/api";
import type { Doc, Id } from "convex/_generated/dataModel";
import { useMutation, useQuery } from "convex/react";
import { JsonEditor, type JsonData } from "json-edit-react";
import { ArrowBigLeft, Download, FlaskConical } from "lucide-react";
import Link from "next/link";
import { useMemo } from "react";

export default function ResultsClient({ id }: { id: string }) {
  const datasetId = id as Id<"datasets">;
  const models = useQuery(api.datasets.listTrainedModels, { datasetId }) as
    | Doc<"trained_models">[]
    | undefined;
  const getDownloadUrl = useMutation(api.datasets.getDownloadUrl);

  function metricKindAndValue(metrics: unknown): {
    kind: "ba" | "mae" | null;
    value: number | null;
  } {
    if (!metrics || typeof metrics !== "object")
      return { kind: null, value: null };
    const m = metrics as Record<string, unknown>;
    if (typeof m["balanced_accuracy"] === "number")
      return { kind: "ba", value: Number(m["balanced_accuracy"]) };
    if (typeof m["mae"] === "number")
      return { kind: "mae", value: Number(m["mae"]) };
    return { kind: null, value: null };
  }

  const rows = useMemo(() => {
    const arr = models ? [...models] : ([] as Doc<"trained_models">[]);
    // Sort by best score: balanced_accuracy (higher is better) or mae (lower is better)
    arr.sort((a, b) => {
      const A = metricKindAndValue(a.metrics);
      const B = metricKindAndValue(b.metrics);
      const scoreA =
        A.value == null
          ? Number.NEGATIVE_INFINITY
          : A.kind === "mae"
            ? -A.value
            : A.value;
      const scoreB =
        B.value == null
          ? Number.NEGATIVE_INFINITY
          : B.kind === "mae"
            ? -B.value
            : B.value;
      return scoreB - scoreA; // descending
    });
    return arr;
  }, [models]);

  // Render metrics nicely (balanced_accuracy or mae)
  function MetricsCell({ metrics }: { metrics: unknown }) {
    if (!metrics || typeof metrics !== "object") {
      return (
        <span className="opacity-80 text-xs">
          {typeof metrics === "string" ? metrics : String(metrics)}
        </span>
      );
    }
    const m = metrics as Record<string, unknown>;
    const hasBA = typeof m["balanced_accuracy"] === "number";
    const hasBAStd = typeof m["balanced_accuracy_std"] === "number";
    const hasMAE = typeof m["mae"] === "number";
    const hasMAEStd = typeof m["mae_std"] === "number";
    const n = (k: string): number | null =>
      typeof m[k] === "number" && Number.isFinite(m[k] as number)
        ? (m[k] as number)
        : null;
    if (hasBA) {
      const val =
        Math.max(0, Math.min(1, Number(m["balanced_accuracy"]))) * 100;
      const std = hasBAStd
        ? Math.abs(Number(m["balanced_accuracy_std"])) * 100
        : undefined;
      const acc = n("accuracy");
      const prec = n("precision");
      const rec = n("recall");
      const f1 = n("f1");
      return (
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-3">
            <progress
              className="progress progress-primary w-56"
              value={val}
              max={100}
            />
            <div className="text-xs font-mono">
              {val.toFixed(1)}%{std !== undefined ? ` ±${std.toFixed(1)}%` : ""}
              <span className="opacity-60 ml-1">BA</span>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {acc != null ? (
              <div className="flex items-center gap-2">
                <span className="badge badge-soft badge-xs w-12 justify-center">Acc</span>
                <progress
                  className="progress progress-secondary w-40"
                  value={Math.max(0, Math.min(1, acc)) * 100}
                  max={100}
                />
                <span className="text-[10px] font-mono opacity-80">
                  {(Math.max(0, Math.min(1, acc)) * 100).toFixed(1)}%
                </span>
              </div>
            ) : null}
            {prec != null ? (
              <div className="flex items-center gap-2">
                <span className="badge badge-soft badge-xs w-12 justify-center">Pre</span>
                <progress
                  className="progress progress-secondary w-40"
                  value={Math.max(0, Math.min(1, prec)) * 100}
                  max={100}
                />
                <span className="text-[10px] font-mono opacity-80">
                  {(Math.max(0, Math.min(1, prec)) * 100).toFixed(1)}%
                </span>
              </div>
            ) : null}
            {rec != null ? (
              <div className="flex items-center gap-2">
                <span className="badge badge-soft badge-xs w-12 justify-center">Rec</span>
                <progress
                  className="progress progress-secondary w-40"
                  value={Math.max(0, Math.min(1, rec)) * 100}
                  max={100}
                />
                <span className="text-[10px] font-mono opacity-80">
                  {(Math.max(0, Math.min(1, rec)) * 100).toFixed(1)}%
                </span>
              </div>
            ) : null}
            {f1 != null ? (
              <div className="flex items-center gap-2">
                <span className="badge badge-soft badge-xs w-12 justify-center">F1</span>
                <progress
                  className="progress progress-secondary w-40"
                  value={Math.max(0, Math.min(1, f1)) * 100}
                  max={100}
                />
                <span className="text-[10px] font-mono opacity-80">
                  {(Math.max(0, Math.min(1, f1)) * 100).toFixed(1)}%
                </span>
              </div>
            ) : null}
          </div>
        </div>
      );
    }
    if (hasMAE) {
      const val = Math.abs(Number(m["mae"]));
      const std = hasMAEStd ? Math.abs(Number(m["mae_std"])) : undefined;
      return (
        <div className="flex items-center gap-2 text-xs">
          <span className="badge badge-outline">MAE</span>
          <span className="font-mono">
            {val.toFixed(4)}
            {std !== undefined ? ` ±${std.toFixed(4)}` : ""}
          </span>
          <span className="opacity-60">(lower is better)</span>
        </div>
      );
    }
    return (
      <div className="text-xs opacity-80 max-w-md overflow-auto">
        <JsonEditor data={metrics as JsonData} viewOnly indent={2} />
      </div>
    );
  }

  return (
    <div className="w-full max-w-6xl space-y-4">
      <h2 className="text-xl font-semibold">Training Results</h2>
      <div className="card bg-base-200">
        <div className="card-body flex flex-col md:flex-row gap-2 md:items-center md:justify-between">
          <div className="flex gap-2">
            <Link className="btn btn-outline" href={`/studio/train/${id}`}>
              <ArrowBigLeft className="h-4 w-4" />
              <span>Train</span>
            </Link>
          </div>
        </div>
      </div>

      <div className="card bg-base-200">
        <div className="card-body">
          <h3 className="card-title">Models</h3>
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th>Model</th>
                  <th>Metrics</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {models === undefined ? (
                  <tr>
                    <td colSpan={3} className="opacity-70 text-center">
                      Loading...
                    </td>
                  </tr>
                ) : rows.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="opacity-70 text-center">
                      No trained models yet.
                    </td>
                  </tr>
                ) : (
                  rows.map(m => (
                    <tr key={String(m._id)}>
                      <td className="font-medium flex items-center gap-2">
                        {m.modelName}
                        {rows[0] && rows[0]._id === m._id ? (
                          <span className="badge badge-accent badge-sm">
                            Best
                          </span>
                        ) : null}
                      </td>
                      <td className="text-xs opacity-90">
                        <MetricsCell metrics={m.metrics} />
                      </td>
                      <td className="text-right flex items-center justify-end gap-2">
                        <div className="tooltip" data-tip="Test Model">
                          <Link
                            className="btn btn-sm btn-soft btn-accent"
                            href={`/studio/test/${id}?model=${String(m._id)}`}
                            aria-label="Test Model"
                          >
                            <FlaskConical className="h-4 w-4" />
                          </Link>
                        </div>
                        <div className="tooltip" data-tip="Download">
                          <button
                            className="btn btn-sm btn-soft btn-outline"
                            onClick={async () => {
                              const url = await getDownloadUrl({
                                storageId: m.storageId,
                              });
                              if (url) window.open(url, "_blank");
                            }}
                            aria-label="Download"
                          >
                            <Download className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
