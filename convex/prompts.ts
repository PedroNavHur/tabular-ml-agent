export function profileSummaryPrompt(report: unknown): string {
  const header = `You are a senior data scientist. Summarize the following tabular dataset profile for a product engineer.
- Focus on: target distribution, class/imbalance (if categorical), range/outliers (if numeric), missingness hotspots, cardinality, potential leakage signals, and high‑level next steps (encoding, scaling, feature handling).
- Keep it concise (8–14 bullets), actionable, and avoid repeating raw numbers unless meaningful.
- If the target is present, point out its dtype and any issues (e.g., skew, imbalance).
- Respond STRICTLY as JSON: an array of objects with fields {"title": string, "detail": string}. No markdown, no extra text.`;

  return `${header}

JSON profile:
${JSON.stringify(report)}`;
}
