System Brief for Codex

Project: tabular-ml-agent
Goal: MVP AutoML-for-tabular app where users upload a CSV, pick a target, we profile → shortlist top 3 model families → run small parallel random search → show a leaderboard → export a reusable pipeline artifact.

Architecture (final):
• Frontend (Vercel): Next.js (TS), Tailwind, DaisyUI
• Middleware/Realtime/Storage: Convex (TypeScript)
• Backend Compute: Modal-hosted FastAPI (@modal.asgi_app()), with parallel workers via .map() and a Modal Volume at /runs for artifacts

Key Non-negotiables:
• Python 3.11; scikit-learn pipelines with ColumnTransformer (no leakage)
• Reproducibility: random_state=42 everywhere; persist versions in artifact manifest
• Classification default metric = balanced_accuracy; regression default = MAE
• Safe serialization: prefer skops (fallback joblib OK for MVP)
• Hard timeouts: per-trial (60–90s) and global (e.g., 10–15 min)
• Clean API contracts: /profile, /train, /health
• CORS allowlist for Vercel + Convex origins
• Strict TypeScript types don't use "any"
