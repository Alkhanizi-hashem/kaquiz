export const LOCATION_INTERVAL_MS = 5_000;

export function shouldSendLocation(now: number, lastSentAt: number | null) {
  return lastSentAt === null || now - lastSentAt >= LOCATION_INTERVAL_MS;
}
