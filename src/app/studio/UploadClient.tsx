"use client";
import { useState } from "react";
import FileUploadCard from "@/components/FileUploadCard";
import { useMutation } from "convex/react";
import { api } from "convex/_generated/api";
import type { Id } from "convex/_generated/dataModel";

export default function UploadClient() {
  const [status, setStatus] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);

  const generateUploadUrl = useMutation(api.datasets.generateUploadUrl);
  const saveDataset = useMutation(api.datasets.saveDataset);

  return (
    <div className="w-full flex flex-col items-center">
      <FileUploadCard
        onSelectFileAction={async file => {
          if (!file) return;
          // Enforce 1MB max for demo
          const maxBytes = 1 * 1024 * 1024;
          if (file.size > maxBytes) {
            setStatus("File too large. Max 1MB for demo.");
            return;
          }
          setFileName(file.name);
          setStatus("Uploading...");
          try {
            const url: string = await generateUploadUrl({});
            const res = await fetch(url, {
              method: "POST",
              headers: { "Content-Type": file.type || "text/csv" },
              body: file,
            });
            if (!res.ok) throw new Error(`Upload failed: ${res.status}`);
            const { storageId } = (await res.json()) as {
              storageId: Id<"_storage">;
            };

            await saveDataset({
              storageId,
              filename: file.name,
              contentType: file.type || "text/csv",
              size: file.size,
            });
            setStatus("Uploaded ✔");
          } catch (err: unknown) {
            const message =
              err instanceof Error ? err.message : "Upload failed";
            setStatus(message);
          }
        }}
      />
      {fileName || status ? (
        <div className="mt-3 text-sm opacity-80">
          {fileName ? <div>File: {fileName}</div> : null}
          {status ? <div>Status: {status}</div> : null}
        </div>
      ) : null}
    </div>
  );
}
