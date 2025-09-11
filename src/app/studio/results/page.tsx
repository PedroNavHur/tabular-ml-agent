import Link from "next/link";

export default function ResultsIndexPage() {
  return (
    <div className="w-full max-w-3xl space-y-4">
      <h2 className="text-xl font-semibold">Results</h2>
      <div className="card bg-base-200">
        <div className="card-body">
          <p className="opacity-80">
            View experiment results for a specific dataset.
          </p>
          <Link href="/studio/datasets" className="btn btn-primary w-fit">
            Browse Datasets
          </Link>
        </div>
      </div>
    </div>
  );
}
