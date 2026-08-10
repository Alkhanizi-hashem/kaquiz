export function relativeTime(value?: string | number | null) {
  if (!value) return "No location yet";
  const time = typeof value === "number" ? value : Date.parse(value);
  if (!Number.isFinite(time)) return "Update time unavailable";
  const seconds = Math.max(0, Math.floor((Date.now() - time) / 1_000));
  if (seconds < 10) return "Just now";
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export function errorText(error: unknown) {
  return error instanceof Error ? error.message : "Something went wrong. Please try again.";
}
