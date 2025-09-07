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


export function runCfgPrompt(report: unknown, summary: string): string {
  const header = `You are an ML engineer. Generate a JSON run configuration for training classical scikit-learn models on a tabular dataset.
- Use ONLY classical sklearn models (e.g., LogisticRegression, RandomForestClassifier, GradientBoostingClassifier, SVC, LinearRegression, RandomForestRegressor, GradientBoostingRegressor, SVR, etc.).
- Always set random_state=42 where applicable.
- Choose sensible preprocessing: scaling (StandardScaler / MinMaxScaler / RobustScaler / none), simple imputation strategies, and one-hot encoding for categoricals.
- Include: task_type, target, preprocessing, cv (cv_folds, shuffle=true, random_state=42), metric (classification=balanced_accuracy, regression=mae), and top 2–3 candidate models with concise hyperparams.
- Respond STRICTLY as JSON (no markdown, no extra commentary).`;

  return `${header}

LATEST PROFILE JSON:
${JSON.stringify(report)}

PROFILE SUMMARY (bulleted JSON or text):
${summary}`;
}
