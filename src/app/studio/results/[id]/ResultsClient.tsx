"use client";
import Link from "next/link";
import { useMemo } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "convex/_generated/api";
import type { Id, Doc } from "convex/_generated/dataModel";

export default function ResultsClient({ id }: { id: string }) {
  const datasetId = id as Id<"datasets">;
  const models = useQuery(api.datasets.listTrainedModels, { datasetId }) as
    | Doc<"trained_models">[]
    | undefined;
  const getDownloadUrl = useMutation(api.datasets.getDownloadUrl);

  const rows = useMemo(() => models ?? [], [models]);

  return (
    <div className="w-full max-w-6xl space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Training Results</h2>
        <div className="flex gap-2">
          <Link className="btn btn-ghost" href={`/studio/preprocess/${id}`}>
            ← Prev: Preprocess
          </Link>
          <Link className="btn btn-outline" href={`/studio/suggest/${id}`}>
            Suggest Models
          </Link>
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
                  rows.map((m) => (
                    <tr key={String(m._id)}>
                      <td className="font-medium">{m.modelName}</td>
                      <td className="text-xs opacity-90">
                        {typeof m.metrics === "string"
                          ? m.metrics
                          : JSON.stringify(m.metrics as unknown, null, 2)}
                      </td>
                      <td className="text-right">
                        <button
                          className="btn btn-sm btn-outline"
                          onClick={async () => {
                            const url = await getDownloadUrl({ storageId: m.storageId });
                            if (url) window.open(url, "_blank");
                          }}
                        >
                          Download
                        </button>
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
