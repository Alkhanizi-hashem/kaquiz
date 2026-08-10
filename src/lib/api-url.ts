const DEVELOPMENT_API_URL = "http://localhost:3000/api";

export function resolveApiUrl(value: string | undefined, _isDevelopment?: boolean) {
  const configured = value?.trim();
  if (configured) return configured;
  return DEVELOPMENT_API_URL;
}
