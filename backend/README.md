# Modal FastAPI Backend

This backend runs on Modal and performs dataset preprocessing and basic profiling for the Tabular ML Agent. It communicates with Convex via authenticated HTTP callbacks.

## What it does
- Receives a preprocess request with `datasetId` and parameters.
- Marks the preprocess run as `running` in Convex.
- Fetches the original CSV download URL from Convex.
- Preprocesses the CSV (drop ID, handle missing, etc.) and records a detailed summary of the steps taken.
- Uploads the processed CSV back to Convex storage.
- Marks the run `completed` with the processed file info + summary.
- Generates a lightweight profile and stores it in Convex.

## Project layout
- `modal_app.py`: Modal app definition and FastAPI endpoint `/preprocess`.
- `requirements.txt`: Python dependencies for the Modal image.

## Prerequisites
- Modal account and CLI installed.
- Convex deployment set up (already used by the Next.js app).

## Environment variables
Set these in the environments where they are used:

- Convex (used by the Convex action in `convex/flows.ts`):
  - `MODAL_PREPROCESS_URL`: Public URL to this Modal FastAPI `/preprocess` endpoint.
  - `PREPROCESS_WEBHOOK_SECRET`: Shared secret used to authenticate Convex HTTP routes. Passed to Modal in the request body and in `x-webhook-secret` headers.
  - `CONVEX_URL` or `NEXT_PUBLIC_CONVEX_URL`: Convex deployment URL (used for building callback URLs in the action).

- Modal container (used by `backend/modal_app.py` to call back into Convex):
  - `CONVEX_URL` or `NEXT_PUBLIC_CONVEX_URL`: Convex deployment URL for calling Convex HTTP helpers (e.g., `/dataset/download-url`).

Note: The secret used for Convex HTTP routes is sent by Convex in the request payload and used by the Modal service; it doesn’t need to be stored as an env var in the Modal container.

## Running locally
You can serve the Modal app locally for testing:

```
modal serve backend/modal_app.py
```

This prints a temporary URL. Use that as `MODAL_PREPROCESS_URL` (in Convex env) to test end‑to‑end.

## Endpoint
- `POST /preprocess`
  - Body JSON:
    ```json
    {
      "runId": "<preprocess_runs id>",
      "datasetId": "<datasets id>",
      "params": {
        "target": "<col>|null",
        "idColumn": "<col>|null",
        "taskType": "auto|classification|regression",
        "missing": "auto|drop|mean|median|most_frequent",
        "testSize": 0.2
      },
      "callbacks": {
        "running": "<convex url>/preprocess/running",
        "complete": "<convex url>/preprocess/complete",
        "fail": "<convex url>/preprocess/fail",
        "saveProfile": "<convex url>/profile/save",
        "uploadUrl": "<convex url>/storage/upload-url"
      },
      "secret": "<shared secret>"
    }
    ```
  - Returns: `{ "ok": true }` on success.

## Data recorded in Convex
- `preprocess_runs.summary` includes:
  - `shape_before`, `shape_after`, `columns`, `target`
  - `applied`: dropped columns, imputations (strategy + value)
  - `missing_counts`, `dtypes`
- `profiles.report` includes:
  - `n_rows`, `n_cols`, `columns`, `target`, `na_by_col`, and `describe()` output

## Notes
- For large files, consider streaming or chunking in the future. The MVP reads CSV into memory.
- Keep the original CSV immutable, and store the latest processed CSV for the active workflow (older processed files may be pruned while retaining run metadata).

