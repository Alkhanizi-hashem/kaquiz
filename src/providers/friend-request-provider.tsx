import { useRouter } from "expo-router";
import { type PropsWithChildren, useEffect, useRef, useState } from "react";

import { FriendRequestToast } from "@/components/friend-request-toast";
import { useInvites } from "@/hooks/use-api";
import { newIncomingInvites } from "@/lib/live-updates";
import { displayName } from "@/lib/user-display";
import { useAuth } from "@/providers/auth-provider";
import type { IncomingInvite } from "@/types/api";

export function FriendRequestProvider({ children }: PropsWithChildren) {
  const { status, user } = useAuth();
  return (
    <>
      {children}
      {status === "authenticated" && user ? (
        <AuthenticatedNotifier key={user.id} userId={user.id} />
      ) : null}
    </>
  );
}

function AuthenticatedNotifier({ userId }: { userId: number }) {
  const invites = useInvites(userId);
  const router = useRouter();
  const previousInviteIds = useRef<Set<number> | null>(null);
  const [toastInvite, setToastInvite] = useState<IncomingInvite | null>(null);

  useEffect(() => {
    if (!invites.data) return;
    const additions = newIncomingInvites(previousInviteIds.current, invites.data.incoming);
    previousInviteIds.current = new Set(invites.data.incoming.map((invite) => invite.id));
    if (additions.length) setToastInvite(additions.at(-1)!);
  }, [invites.data]);

  if (!toastInvite) return null;
  return (
    <FriendRequestToast
      requestId={toastInvite.id}
      senderName={displayName(toastInvite.sender)}
      onDismiss={() => setToastInvite(null)}
      onPress={() => {
        setToastInvite(null);
        router.navigate("/(tabs)/(requests)");
      }}
    />
  );
}
