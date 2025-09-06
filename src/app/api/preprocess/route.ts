import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const { datasetId, params } = (await req.json()) as {
    datasetId: string;
    params: {
      target: string | null;
      idColumn: string | null;
      taskType: "auto" | "classification" | "regression";
      missing: "auto" | "drop" | "mean" | "median" | "most_frequent";
      testSize: number;
    };
  };

  // TODO: Call Modal FastAPI endpoint to enqueue preprocessing
  // and pass Convex identifiers/secrets to write back results.
  // For now, return 202 to indicate accepted.
  return NextResponse.json(
    { ok: true, message: "Preprocess job accepted", datasetId, params },
    { status: 202 },
  );
}

