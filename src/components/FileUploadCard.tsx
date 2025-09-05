import * as React from "react";

type FileUploadCardProps = {
  className?: string;
  title?: string;
  subtitle?: string;
  accept?: string;
  onSelectFile?: (file: File | null) => void;
};

export default function FileUploadCard({
  className,
  title = "Upload CSV",
  subtitle = "Choose a tabular CSV to get started.",
  accept = ".csv,text/csv",
  onSelectFile,
}: FileUploadCardProps) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    onSelectFile?.(file);
  };

  return (
    <div className={["card bg-base-200 w-full max-w-xl", className].filter(Boolean).join(" ")}> 
      <div className="card-body items-stretch gap-4">
        <h2 className="card-title">{title}</h2>
        {subtitle ? <p className="text-sm opacity-70">{subtitle}</p> : null}
        <fieldset className="fieldset w-full">
          <legend className="fieldset-legend">Pick a file</legend>
          <input
            type="file"
            accept={accept}
            className="file-input file-input-primary w-full"
            onChange={handleChange}
          />
          <label className="label">Max size 10MB</label>
        </fieldset>
      </div>
    </div>
  );
}

