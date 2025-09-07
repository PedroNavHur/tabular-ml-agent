"use client";
import { useMemo } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "convex/_generated/api";
import type { Id } from "convex/_generated/dataModel";

export default function RunsClient({ id }: { id: string }) {
  const datasetId = id as Id<"datasets">;
  const runs = useQuery(api.datasets.listPreprocessRuns, { datasetId });
  const getDownloadUrl = useMutation(api.datasets.getDownloadUrl);
  const items = useMemo(() => runs ?? [], [runs]);

  return (
    <div className="w-full max-w-5xl">
      <h2 className="text-xl font-semibold mb-3">Preprocess Runs</h2>
      <div className="overflow-x-auto">
        <table className="table">
          <thead>
            <tr>
              <th>Run ID</th>
              <th>Status</th>
              <th>Updated</th>
              <th>Processed File</th>
              <th className="text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {runs === undefined ? (
              <tr>
                <td colSpan={4} className="text-center opacity-70">
                  Loading...
                </td>
              </tr>
            ) : items.length === 0 ? (
              <tr>
                <td colSpan={4} className="text-center opacity-70">
                  No runs yet.
                </td>
              </tr>
            ) : (
              items.map(r => (
                <tr key={String(r._id)}>
                  <td className="font-mono text-xs">{String(r._id)}</td>
                  <td>
                    <span className="badge badge-outline">{r.status}</span>
                  </td>
                  <td className="opacity-80">
                    {new Date(r.updatedAt).toLocaleString()}
                  </td>
                  <td>
                    {r.processedFilename ? (
                      <span className="badge badge-ghost">
                        {r.processedFilename}
                      </span>
                    ) : (
                      <span className="opacity-60">—</span>
                    )}
                  </td>
                  <td className="text-right">
                    {r.processedStorageId ? (
                      <button
                        className="btn btn-sm btn-outline"
                        onClick={async () => {
                          const url = await getDownloadUrl({
                            storageId: r.processedStorageId!,
                          });
                          if (url) window.open(url, "_blank");
                        }}
                      >
                        Download
                      </button>
                    ) : (
                      <span className="opacity-60">—</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
