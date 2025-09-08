export default function Home() {
  return (
    <div className="min-h-screen">
      {/* Navbar */}
      <div className="navbar bg-base-100 shadow-sm">
        <div className="flex-1">
          <a className="btn btn-ghost text-xl">TabularML</a>
        </div>
        <div className="flex-none gap-2">
          <a className="btn btn-ghost" href="/studio">Studio</a>
          <a className="btn btn-primary" href="/studio">Get Started</a>
        </div>
      </div>

      {/* Hero */}
      <section className="hero bg-base-200">
        <div className="hero-content text-center py-16">
          <div className="max-w-3xl">
            <div className="badge badge-outline mb-4">AutoML for tabular data</div>
            <h1 className="text-4xl md:text-6xl font-bold">
              One tool to manage your datasets and models
            </h1>
            <p className="py-6 opacity-80">
              Upload a CSV, profile your data, let the assistant suggest
              classical scikit‑learn models, train them in the cloud, and test
              predictions — all in minutes, fully reproducible.
            </p>
            <div className="flex items-center justify-center gap-3 flex-wrap">
              <a className="btn btn-primary" href="/studio">Start in Studio</a>
              <a className="btn btn-outline" href="#features">Explore features</a>
            </div>
          </div>
        </div>
      </section>

      {/* Logos strip (placeholder) */}
      <section className="py-6">
        <div className="container mx-auto max-w-5xl opacity-70 text-sm flex flex-wrap items-center justify-center gap-6">
          <span>scikit‑learn</span>
          <span>Convex</span>
          <span>Modal</span>
          <span>pandas</span>
          <span>NumPy</span>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="container mx-auto max-w-6xl px-4 md:px-6 py-10">
        <div className="text-center mb-6">
          <div className="badge badge-outline mb-3">Features</div>
          <h2 className="text-3xl md:text-4xl font-bold">Latest advanced tooling</h2>
          <p className="opacity-70">Everything you need for tabular ML workflows</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="card bg-base-200">
            <div className="card-body">
              <h3 className="card-title">Upload & Profile</h3>
              <p className="opacity-80">
                Upload CSVs securely to Convex. Automatic profiling spots missing
                values, imbalance, and types. Summaries are generated with LLM
                assistance.
              </p>
              <div className="card-actions justify-end">
                <a className="btn btn-sm" href="/studio">Open Studio</a>
              </div>
            </div>
          </div>
          <div className="card bg-base-200">
            <div className="card-body">
              <h3 className="card-title">Suggest & Train</h3>
              <p className="opacity-80">
                The assistant proposes a run config of classical sklearn models.
                We train in Modal, serialize with skops, and store artifacts in
                Convex.
              </p>
              <div className="card-actions justify-end">
                <a className="btn btn-sm" href="/studio">Generate Plan</a>
              </div>
            </div>
          </div>
          <div className="card bg-base-200">
            <div className="card-body">
              <h3 className="card-title">Evaluate & Predict</h3>
              <p className="opacity-80">
                View a leaderboard with metrics, download models, and test
                predictions with an interactive form using your trained pipeline.
              </p>
              <div className="card-actions justify-end">
                <a className="btn btn-sm" href="/studio">See Results</a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA banner */}
      <section className="container mx-auto max-w-6xl px-4 md:px-6 py-10">
        <div className="hero rounded-box bg-base-300">
          <div className="hero-content text-center py-12">
            <div className="max-w-2xl">
              <h3 className="text-2xl md:text-3xl font-bold">Don’t replace. Integrate.</h3>
              <p className="opacity-80 mt-2">
                Keep your pandas workflows and sklearn pipelines. TabularML sits
                on top, making the boring parts delightful and reproducible.
              </p>
              <div className="mt-4 flex items-center justify-center gap-3">
                <a className="btn btn-primary" href="/studio">Start for free</a>
                <a className="btn btn-outline" href="#features">Learn more</a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="container mx-auto max-w-6xl px-4 md:px-6 py-8">
        <div className="stats stats-vertical md:stats-horizontal shadow w-full">
          <div className="stat">
            <div className="stat-title">Models Trained</div>
            <div className="stat-value">50+</div>
            <div className="stat-desc">Across classification & regression</div>
          </div>
          <div className="stat">
            <div className="stat-title">Avg. Setup Time</div>
            <div className="stat-value">&lt; 5m</div>
            <div className="stat-desc">From upload to first results</div>
          </div>
          <div className="stat">
            <div className="stat-title">Reproducible</div>
            <div className="stat-value">100%</div>
            <div className="stat-desc">Skops artifacts + manifests</div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer bg-base-200 p-10">
        <aside>
          <a className="btn btn-ghost text-xl">TabularML</a>
          <p className="opacity-70 max-w-sm">
            AutoML for tabular data. Built on Next.js, Convex, Modal and
            scikit‑learn.
          </p>
        </aside>
        <nav>
          <h6 className="footer-title">Product</h6>
          <a className="link link-hover" href="/studio">Studio</a>
          <a className="link link-hover" href="#features">Features</a>
        </nav>
        <nav>
          <h6 className="footer-title">Resources</h6>
          <a className="link link-hover" href="https://scikit-learn.org/">scikit‑learn</a>
          <a className="link link-hover" href="https://www.convex.dev/">Convex</a>
          <a className="link link-hover" href="https://modal.com/">Modal</a>
        </nav>
      </footer>
    </div>
  );
}
