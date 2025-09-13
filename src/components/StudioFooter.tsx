export default function StudioFooter() {
  return (
    <footer className="bg-base-300 w-full mt-8">
      <div className="container mx-auto max-w-6xl p-6 md:p-8 footer grid grid-cols-1 md:grid-cols-3 gap-8">
        <aside>
          <a className="btn btn-ghost text-xl">FirstModel</a>
          <p className="opacity-70 max-w-sm">
            AutoML for tabular data. Built on Next.js, Convex, Modal and
            scikit‑learn.
          </p>
        </aside>
        <nav>
          <h6 className="footer-title">Product</h6>
          <a className="link link-hover" href="/studio">
            Studio
          </a>
          <a className="link link-hover" href="/studio/datasets">
            Datasets
          </a>
        </nav>
        <nav>
          <h6 className="footer-title">Resources</h6>
          <a className="link link-hover" href="https://scikit-learn.org/">
            scikit‑learn
          </a>
          <a className="link link-hover" href="https://www.convex.dev/">
            Convex
          </a>
          <a className="link link-hover" href="https://modal.com/">
            Modal
          </a>
        </nav>
      </div>
    </footer>
  );
}

