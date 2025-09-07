This is a [Next.js](https://nextjs.org) project with Convex (DB/realtime) and a Modal FastAPI backend for tabular AutoML preprocessing and profiling.

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

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
