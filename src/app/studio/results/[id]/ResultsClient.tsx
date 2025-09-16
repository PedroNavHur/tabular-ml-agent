"use client";
import { api } from "convex/_generated/api";
import type { Doc, Id } from "convex/_generated/dataModel";
import { useMutation, useQuery } from "convex/react";
import { ArrowBigLeft, Download, FlaskConical } from "lucide-react";
import Link from "next/link";
import { useMemo } from "react";
import { ModelMetrics } from "@/components/ModelMetrics";

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
                            <ModelMetrics metrics={m.metrics} />
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
                        <ModelMetrics metrics={m.metrics} />
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
