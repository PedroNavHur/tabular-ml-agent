"use client";
import { useMemo } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Doc } from "../../convex/_generated/dataModel";

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"] as const;
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
}

function formatDate(ms: number): string {
  try {
    return new Date(ms).toLocaleString();
  } catch {
    return String(ms);
  }
}

export default function DatasetsTable() {
  const datasets = useQuery(api.datasets.listDatasets, {});
  const getDownloadUrl = useMutation(api.datasets.getDownloadUrl);

  const rows = useMemo(() => datasets ?? [], [datasets]);

  return (
    <div className="w-full max-w-5xl">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-lg font-semibold">Uploaded Datasets</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="table">
          <thead>
            <tr>
              <th>Filename</th>
              <th>Size</th>
              <th>Type</th>
              <th>Uploaded</th>
              <th className="text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows === undefined ? (
              <tr>
                <td colSpan={5} className="text-center opacity-70">
                  Loading...
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-center opacity-70">
                  No datasets uploaded yet.
                </td>
              </tr>
            ) : (
              rows.map((d: Doc<"datasets">) => (
                <tr key={d._id as unknown as string}>
                  <td className="font-medium">{d.filename}</td>
                  <td>{formatBytes(d.size)}</td>
                  <td className="opacity-80">{d.contentType}</td>
                  <td className="opacity-80">{formatDate(d.uploadedAt)}</td>
                  <td className="text-right">
                    <button
                      className="btn btn-sm btn-outline"
                      onClick={async () => {
                        const url = await getDownloadUrl({ storageId: d.storageId });
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
  );
}

