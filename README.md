FirstModel — From dataset to first model in minutes.

This is a [Next.js](https://nextjs.org) app (App Router) using [Convex](https://www.convex.dev/) for realtime/storage and a Modal‑hosted FastAPI backend for preprocessing, profiling and training. It turns a CSV into a reproducible baseline model and pipeline artifact quickly.

## Environment Setup (Convex + Modal)

Set these in the correct places to enable preprocessing:

- Convex (deployment env variables)
  - `MODAL_PREPROCESS_URL`: The public URL of your Modal FastAPI app endpoint. You can set the base (e.g. `https://<app>.modal.run`) and the system will append `/preprocess` automatically.
  - `PREPROCESS_WEBHOOK_SECRET`: A random secret (e.g., from `openssl rand -hex 32`) used to authenticate callbacks into Convex.
  - `CONVEX_SITE_URL` (preferred): Your Convex HTTP Actions base URL (shown in the Convex panel as “HTTP Actions URL”). This is what our callbacks hit.
    - If you prefer, `CONVEX_URL` or `NEXT_PUBLIC_CONVEX_URL` can be used as fallback, but `CONVEX_SITE_URL` is recommended.
  - CLI examples:
    - `npx convex env set MODAL_PREPROCESS_URL https://<app>.modal.run`
    - `npx convex env set PREPROCESS_WEBHOOK_SECRET <your-secret>`
    - `npx convex env set CONVEX_URL https://<project>.convex.cloud`

- Modal (secrets)
  - Create a secret named `tabular-ml-agent-backend` with key `NEXT_PUBLIC_CONVEX_URL` (or `CONVEX_URL`) set to your Convex HTTP Actions URL — the same as `CONVEX_SITE_URL` above.
  - The backend reads `CONVEX_URL` and falls back to `NEXT_PUBLIC_CONVEX_URL`.

- Local (optional, for `modal serve`)
  - You can export `CONVEX_URL` in your shell so the backend picks it up when serving locally:
    - `export CONVEX_URL="$(grep NEXT_PUBLIC_CONVEX_URL .env.local | cut -d= -f2)"`

Health check: Once served/deployed, the Modal app exposes `GET /health` returning `{ "ok": true }`.

Notes

- Uploads are limited to 1MB in the demo UI (see `src/app/studio/UploadClient.tsx`).
- Preview defaults to 5 rows and can be adjusted via the row selector.
- “Next” actions are primary; disabled buttons surface tooltips explaining why.
- Results show balanced accuracy plus accuracy/precision/recall/f1 for classification and MAE for regression.

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the landing page by modifying `src/app/page.tsx`. The page auto‑updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Modal backend changes (important)

- Predict endpoint: skops allow‑list expanded to load common sklearn internals. You can opt‑in to a permissive load for testing via `ALLOW_UNTRUSTED_MODELS=1` in the container env.
- Training endpoint: returns additional classification metrics: `accuracy`, `precision` (macro), `recall` (macro), and `f1` (macro), each with `*_std`, in addition to `balanced_accuracy`. Regression still returns `mae` and `mae_std`.

## Brand & Metadata

- Brand: FirstModel
- Tagline: “From dataset to first model in minutes.”
- Metadata updated in `src/app/layout.tsx` (OpenGraph/Twitter, authors, creator/publisher).
