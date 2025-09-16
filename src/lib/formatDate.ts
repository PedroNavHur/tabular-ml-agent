const DATE_TIME_FORMATTER = new Intl.DateTimeFormat("en-US", {
  year: "numeric",
  month: "short",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hour12: false,
  timeZone: "UTC",
});

export function formatDateTimeUtc(value: number | string | Date): string {
  const date =
    typeof value === "number" || typeof value === "string"
      ? new Date(value)
      : value;
  if (Number.isNaN(date.getTime())) return "Invalid date";
  return `${DATE_TIME_FORMATTER.format(date)} UTC`;
}
