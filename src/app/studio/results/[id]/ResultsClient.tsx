"use client";
import { api } from "convex/_generated/api";
import type { Doc, Id } from "convex/_generated/dataModel";
import { useMutation, useQuery } from "convex/react";
import { JsonEditor, type JsonData } from "json-edit-react";
import { ArrowBigLeft, Download, FlaskConical } from "lucide-react";
import Link from "next/link";
import { useMemo } from "react";

type MetricProgressProps = {
  label: string;
  value: number;
};

function MetricProgress({ label, value }: MetricProgressProps) {
  const pct = Math.max(0, Math.min(1, value)) * 100;
  return (
    <div className="flex justify-items-start items-center gap-2">
      <span className="badge badge-soft badge-xs w-12 justify-center">
        {label}
      </span>
      <progress
        className="progress progress-secondary w-16"
        value={pct}
        max={100}
      />
      <span className="text-[0.6rem] font-mono opacity-80">
        {pct.toFixed(1)}%
      </span>
    </div>
  );
}

type BalancedAccuracySummaryProps = {
  value: number;
  std?: number | null;
  subMetrics?: Array<{ label: string; value: number }>;
};

function clamp01(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.min(1, Math.max(0, value));
}

function BalancedAccuracySummary({
  value,
  std,
  subMetrics = [],
}: BalancedAccuracySummaryProps) {
  const pct = clamp01(value) * 100;
  const stdPct = std == null ? undefined : Math.abs(std) * 100;
  return (
    <div className="flex flex-col gap-2">
      <div className="flex justify-items-start items-center gap-2">
        <span className="badge badge-soft badge-primary badge-xs w-12 justify-center">
          BA
        </span>
        <progress
          className="progress progress-primary w-16 md:w-66 xl:w-84"
          value={pct}
          max={100}
        />
        <div className="text-[0.6rem] md:text-[0.675rem] font-mono">
          {pct.toFixed(1)}%
          {stdPct !== undefined ? ` ±${stdPct.toFixed(1)}%` : ""}
        </div>
      </div>
      {subMetrics.length > 0 ? (
        <div className="grid grid-cols-1 gap-2 mr-5 md:[grid-template-columns:repeat(2,minmax(12rem,max-content))] md:justify-start md:justify-items-start">
          {subMetrics.map(metric => (
            <MetricProgress
              key={metric.label}
              label={metric.label}
              value={metric.value}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}

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
      const val = Number(m["balanced_accuracy"]);
      const std = hasBAStd ? Number(m["balanced_accuracy_std"]) : undefined;
      const acc = n("accuracy");
      const prec = n("precision");
      const rec = n("recall");
      const f1 = n("f1");
      const subMetrics = [
        acc != null ? { label: "Acc", value: acc } : null,
        prec != null ? { label: "Pre", value: prec } : null,
        rec != null ? { label: "Rec", value: rec } : null,
        f1 != null ? { label: "F1", value: f1 } : null,
      ].filter(Boolean) as Array<{ label: string; value: number }>;
      return (
        <BalancedAccuracySummary
          value={val}
          std={std}
          subMetrics={subMetrics}
        />
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
        <JsonEditor
          data={metrics as JsonData}
          viewOnly
          indent={2}
          rootFontSize={"0.6rem"}
        />
      </div>
    );
  }

  return (
    <div className="w-full max-w-6xl space-y-4">
      <h2 className="text-xl font-semibold">Training Results</h2>
      <div>
        <div className="flex flex-col md:flex-row gap-2 md:items-center md:justify-between">
          <div className="flex gap-2">
            <Link
              className="btn btn-outline rounded-2xl"
              href={`/studio/train/${id}`}
            >
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
                  <th className="hidden md:table-cell">Metrics</th>
                  <th className="hidden md:table-cell text-right">Actions</th>
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
                      <td className="font-medium align-top">
                        <div className="flex flex-col gap-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span>{m.modelName}</span>
                            {rows[0] && rows[0]._id === m._id ? (
                              <span className="badge badge-accent badge-sm">
                                Recommended
                              </span>
                            ) : null}
                          </div>
                          <div className="md:hidden text-xs opacity-90 pt-2">
                            <MetricsCell metrics={m.metrics} />
                          </div>
                          <div className="md:hidden flex gap-2 pt-2">
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
                          </div>
                        </div>
                      </td>
                      <td className="hidden md:table-cell text-xs opacity-90 align-top">
                        <MetricsCell metrics={m.metrics} />
                      </td>
                      <td className="hidden md:table-cell text-right">
                        <div className="flex items-center justify-end gap-2">
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
