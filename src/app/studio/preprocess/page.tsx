import Link from "next/link";

export default function PreprocessIndexPage() {
  return (
    <div className="w-full max-w-3xl space-y-4">
      <h2 className="text-xl font-semibold">Preprocess</h2>
      <div className="card bg-base-200">
        <div className="card-body">
          <p className="opacity-80">
            Select a dataset to start profiling and preprocessing.
          </p>
          <Link href="/studio/datasets" className="btn btn-primary w-fit">
            Browse Datasets
          </Link>
        </div>
      </div>
    </div>
  );
}
