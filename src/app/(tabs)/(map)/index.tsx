import { useMemo } from "react";
import { Linking, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { AtlasButton } from "@/components/atlas-button";
import { FriendsMap } from "@/components/friends-map";
import { ScreenState } from "@/components/screen-state";
import { useFriends } from "@/hooks/use-api";
import { errorText, relativeTime } from "@/lib/format";
import { useLocationSharing } from "@/providers/location-provider";
import { colors } from "@/theme";
import { displayName } from "@/lib/user-display";

const statusCopy = {
  idle: ["OFF", "Location sharing is off"],
  requesting: ["CHECKING", "Checking location access"],
  live: ["LIVE", "Sharing while Kaquiz is open"],
  paused: ["PAUSED", "Sharing pauses in the background"],
  denied: ["BLOCKED", "Location permission is off"],
  error: ["RETRY", "Location update interrupted"],
} as const;

export default function MapScreen() {
  const friends = useFriends();
  const sharing = useLocationSharing();
  const insets = useSafeAreaInsets();
  const freshest = useMemo(
    () => [...(friends.data ?? [])]
      .filter((friend) => friend.location?.timestamp)
      .sort((a, b) => Date.parse(b.location!.timestamp) - Date.parse(a.location!.timestamp))[0],
    [friends.data],
  );
  const [statusLabel, statusDetail] = statusCopy[sharing.status];

  return (
    <View style={{ flex: 1, backgroundColor: colors.paper }}>
      {friends.isLoading ? (
        <ScreenState loading title="Drawing your atlas" detail="Loading accepted friends." />
      ) : friends.isError ? (
        <ScreenState
          title="The atlas could not load"
          detail={errorText(friends.error)}
          actionLabel="Try again"
          onAction={() => friends.refetch()}
        />
      ) : (
        <FriendsMap friends={friends.data ?? []} />
      )}
      <View
        accessibilityRole="summary"
        style={{
          position: "absolute",
          top: insets.top + 12,
          left: 16,
          right: 16,
          maxWidth: 680,
          alignSelf: "center",
          padding: 16,
          gap: 10,
          borderRadius: 18,
          borderCurve: "continuous",
          borderWidth: 1,
          borderColor: "rgba(255,255,255,0.72)",
          backgroundColor: "rgba(16,35,30,0.94)",
          boxShadow: "0 8px 24px rgba(16, 35, 30, 0.22)",
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
          <View
            style={{
              width: 9,
              height: 9,
              borderRadius: 5,
              backgroundColor: sharing.status === "live" ? colors.green : colors.coral,
            }}
          />
          <Text style={{ color: colors.green, fontSize: 12, fontWeight: "900", letterSpacing: 1.1 }}>
            {statusLabel}
          </Text>
          <Text numberOfLines={1} style={{ color: colors.white, flex: 1, fontSize: 14, fontWeight: "700" }}>
            {statusDetail}
          </Text>
        </View>
        <View style={{ height: 1, backgroundColor: "rgba(242,246,239,0.16)" }} />
        <Text style={{ color: "#BFD0C8", fontSize: 13 }}>
          Freshest friend
        </Text>
        <Text numberOfLines={1} style={{ color: colors.white, fontSize: 16, fontWeight: "800" }}>
          {freshest
            ? `${displayName(freshest)} · ${relativeTime(freshest.location?.timestamp)}`
            : "No friend updates yet"}
        </Text>
        {sharing.error ? (
          <Text accessibilityRole="alert" selectable style={{ color: "#FFC4B5", fontSize: 13 }}>
            {sharing.error}
          </Text>
        ) : null}
        {sharing.status === "denied" || sharing.status === "error" ? (
          <AtlasButton
            variant="secondary"
            onPress={sharing.canAskAgain ? sharing.retryPermission : () => Linking.openSettings()}
          >
            {sharing.canAskAgain ? "Allow location" : "Enable in system settings"}
          </AtlasButton>
        ) : sharing.lastSentAt ? (
          <Text style={{ color: "#BFD0C8", fontSize: 12, fontVariant: ["tabular-nums"] }}>
            Your last server update: {relativeTime(sharing.lastSentAt)}
          </Text>
        ) : null}
      </View>
    </View>
  );
}
