"use client";
import { JsonEditor, type JsonData } from "json-edit-react";

type MetricProgressProps = {
  label: string;
  value: number;
};

function clamp01(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.min(1, Math.max(0, value));
}

function MetricProgress({ label, value }: MetricProgressProps) {
  const pct = clamp01(value) * 100;
  return (
    <div className="flex justify-items-start items-center gap-2">
      <span className="badge badge-soft badge-xs w-12 justify-center">
        {label}
      </span>
      <progress
        className="progress progress-secondary w-16"
        value={pct}
        max={100}
      />
      <span className="text-[0.6rem] font-mono opacity-80">
        {pct.toFixed(1)}%
      </span>
    </div>
  );
}

type BalancedAccuracySummaryProps = {
  value: number;
  std?: number | null;
  subMetrics?: Array<{ label: string; value: number }>;
};

function BalancedAccuracySummary({
  value,
  std,
  subMetrics = [],
}: BalancedAccuracySummaryProps) {
  const pct = clamp01(value) * 100;
  const stdPct = std == null ? undefined : Math.abs(std) * 100;
  return (
    <div className="flex flex-col gap-2">
      <div className="flex justify-items-start items-center gap-2">
        <span className="badge badge-soft badge-primary badge-xs w-12 justify-center">
          BA
        </span>
        <progress
          className="progress progress-primary w-16 md:w-66 xl:w-84"
          value={pct}
          max={100}
        />
        <div className="text-[0.6rem] md:text-[0.675rem] font-mono">
          {pct.toFixed(1)}%
          {stdPct !== undefined ? ` ±${stdPct.toFixed(1)}%` : ""}
        </div>
      </div>
      {subMetrics.length > 0 ? (
        <div className="grid grid-cols-1 gap-2 mr-5 md:[grid-template-columns:repeat(2,minmax(12rem,max-content))] md:justify-start md:justify-items-start">
          {subMetrics.map(metric => (
            <MetricProgress
              key={metric.label}
              label={metric.label}
              value={metric.value}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}

export type ModelMetricsProps = {
  metrics: unknown;
};

export function ModelMetrics({ metrics }: ModelMetricsProps) {
  if (!metrics || typeof metrics !== "object") {
    return (
      <span className="opacity-80 text-xs">
        {typeof metrics === "string" ? metrics : String(metrics)}
      </span>
    );
  }
  const m = metrics as Record<string, unknown>;
  const hasBA = typeof m["balanced_accuracy"] === "number";
  const hasBAStd = typeof m["balanced_accuracy_std"] === "number";
  const hasMAE = typeof m["mae"] === "number";
  const hasMAEStd = typeof m["mae_std"] === "number";

  const numeric = (key: string): number | null => {
    const value = m[key];
    return typeof value === "number" && Number.isFinite(value)
      ? (value as number)
      : null;
  };

  if (hasBA) {
    const acc = numeric("accuracy");
    const prec = numeric("precision");
    const rec = numeric("recall");
    const f1 = numeric("f1");
    const subMetrics = [
      acc != null ? { label: "Acc", value: acc } : null,
      prec != null ? { label: "Pre", value: prec } : null,
      rec != null ? { label: "Rec", value: rec } : null,
      f1 != null ? { label: "F1", value: f1 } : null,
    ].filter(Boolean) as Array<{ label: string; value: number }>;
    return (
      <BalancedAccuracySummary
        value={numeric("balanced_accuracy") ?? 0}
        std={hasBAStd ? numeric("balanced_accuracy_std") : undefined}
        subMetrics={subMetrics}
      />
    );
  }

  if (hasMAE) {
    const val = Math.abs(Number(m["mae"]));
    const std = hasMAEStd ? Math.abs(Number(m["mae_std"])) : undefined;
    return (
      <div className="flex items-center gap-2 text-xs">
        <span className="badge badge-outline">MAE</span>
        <span className="font-mono">
          {val.toFixed(4)}
          {std !== undefined ? ` ±${std.toFixed(4)}` : ""}
        </span>
        <span className="opacity-60">(lower is better)</span>
      </div>
    );
  }

  return (
    <div className="text-xs opacity-80 max-w-md overflow-auto">
      <JsonEditor
        data={metrics as JsonData}
        viewOnly
        indent={2}
        rootFontSize={"0.6rem"}
      />
    </div>
  );
}
