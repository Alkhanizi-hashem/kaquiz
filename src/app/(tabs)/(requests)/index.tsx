import { Stack } from "expo-router/stack";
import { ScrollView, Text, View } from "react-native";

import { AtlasButton } from "@/components/atlas-button";
import { AtlasCard } from "@/components/atlas-card";
import { Avatar } from "@/components/avatar";
import { ScreenState } from "@/components/screen-state";
import { useContentStyle } from "@/hooks/use-content-style";
import { useInviteActions, useInvites } from "@/hooks/use-api";
import { errorText, relativeTime } from "@/lib/format";
import { useAuth } from "@/providers/auth-provider";
import { colors } from "@/theme";
import { displayName } from "@/lib/user-display";

export default function RequestsScreen() {
  const { user } = useAuth();
  const invites = useInvites(user?.id);
  const { accept, decline } = useInviteActions(user?.id);
  const contentStyle = useContentStyle();
  const actionError = accept.error ?? decline.error;

  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      contentContainerStyle={{ ...contentStyle, paddingVertical: 16, gap: 20 }}
      style={{ backgroundColor: colors.paper }}
    >
      <Stack.Screen options={{ title: "Requests" }} />
      {invites.isLoading ? <ScreenState loading title="Loading requests" /> : null}
      {invites.isError ? (
        <ScreenState
          title="Requests could not load"
          detail={errorText(invites.error)}
          actionLabel="Try again"
          onAction={() => invites.refetch()}
        />
      ) : null}
      {actionError ? (
        <Text accessibilityRole="alert" selectable style={{ color: colors.coralDark }}>
          {errorText(actionError)}
        </Text>
      ) : null}
      {invites.data ? (
        <>
          <View style={{ gap: 10 }}>
            <Text style={{ color: colors.ink, fontSize: 14, fontWeight: "900", letterSpacing: 1 }}>
              INCOMING · {invites.data.incoming.length}
            </Text>
            {!invites.data.incoming.length ? (
              <Text style={{ color: colors.muted, lineHeight: 22 }}>No one is waiting for your response.</Text>
            ) : null}
            {invites.data.incoming.map((invite) => {
              const name = displayName(invite.sender);
              return (
                <AtlasCard key={invite.id}>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
                    <Avatar name={invite.sender.name} email={invite.sender.email} uri={invite.sender.avatar} />
                    <View style={{ flex: 1, gap: 3 }}>
                      <Text style={{ color: colors.ink, fontSize: 17, fontWeight: "800" }}>{name}</Text>
                      <Text style={{ color: colors.muted }}>Sent {relativeTime(invite.created_at)}</Text>
                    </View>
                  </View>
                  <View style={{ flexDirection: "row", gap: 8 }}>
                    <AtlasButton
                      style={{ flex: 1 }}
                      loading={accept.isPending && accept.variables === invite.sender.id}
                      onPress={() => accept.mutate(invite.sender.id)}
                    >
                      Accept
                    </AtlasButton>
                    <AtlasButton
                      style={{ flex: 1 }}
                      variant="danger"
                      loading={decline.isPending && decline.variables === invite.sender.id}
                      onPress={() => decline.mutate(invite.sender.id)}
                    >
                      Decline
                    </AtlasButton>
                  </View>
                </AtlasCard>
              );
            })}
          </View>
          <View style={{ gap: 10 }}>
            <Text style={{ color: colors.ink, fontSize: 14, fontWeight: "900", letterSpacing: 1 }}>
              SENT · {invites.data.outgoing.length}
            </Text>
            {!invites.data.outgoing.length ? (
              <Text style={{ color: colors.muted, lineHeight: 22 }}>No pending invitations.</Text>
            ) : null}
            {invites.data.outgoing.map((invite) => {
              const name = displayName(invite.recipient);
              return (
                <AtlasCard key={invite.id} style={{ flexDirection: "row", alignItems: "center" }}>
                  <Avatar name={invite.recipient.name} email={invite.recipient.email} uri={invite.recipient.avatar} />
                  <View style={{ flex: 1, gap: 3 }}>
                    <Text style={{ color: colors.ink, fontSize: 17, fontWeight: "800" }}>{name}</Text>
                    <Text style={{ color: colors.muted }}>Awaiting reply · {relativeTime(invite.created_at)}</Text>
                  </View>
                </AtlasCard>
              );
            })}
          </View>
        </>
      ) : null}
    </ScrollView>
  );
}
