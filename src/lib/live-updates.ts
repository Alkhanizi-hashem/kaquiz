import type { IncomingInvite } from "@/types/api";

export const INVITES_REFRESH_INTERVAL_MS = 3_000;
export const FRIENDS_REFRESH_INTERVAL_MS = 5_000;

export function newIncomingInvites(
  previousIds: ReadonlySet<number> | null,
  incoming: IncomingInvite[],
) {
  if (previousIds === null) return [];
  return incoming.filter((invite) => !previousIds.has(invite.id));
}
