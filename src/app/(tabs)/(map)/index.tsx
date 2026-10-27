import { useLocalSearchParams, useRouter } from "expo-router";
import { useMemo } from "react";
import { Linking, Pressable, ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { AtlasButton } from "@/components/atlas-button";
import { Avatar } from "@/components/avatar";
import { FriendsMap } from "@/components/friends-map";
import { ScreenState } from "@/components/screen-state";
import { useFriends } from "@/hooks/use-api";
import { errorText, relativeTime } from "@/lib/format";
import { useLocationSharing } from "@/providers/location-provider";
import { colors } from "@/theme";
import { displayName } from "@/lib/user-display";

const statusCopy = {
  idle: ["Sharing off", "Your location is not being shared."],
  requesting: ["Checking access", "Checking your location permission."],
  live: ["Sharing is on", "Only while Kaquiz is open."],
  paused: ["Updates paused", "Friends may still see your last shared location."],
  denied: ["Location is off", "Location permission is not enabled."],
  error: ["Update interrupted", "Your location could not be updated."],
} as const;

export default function MapScreen() {
  const { friendId } = useLocalSearchParams<{ friendId?: string }>();
  const router = useRouter();
  const friends = useFriends();
  const sharing = useLocationSharing();
  const insets = useSafeAreaInsets();
  const recent = useMemo(() => {
    const located = (friends.data ?? []).filter((friend) => friend.location?.timestamp);
    return located.find((friend) => String(friend.id) === friendId)
      ?? [...located].sort((a, b) => Date.parse(b.location!.timestamp) - Date.parse(a.location!.timestamp))[0];
  }, [friends.data, friendId]);
  const [statusLabel, statusDetail] = statusCopy[sharing.status];
  const statusColor = sharing.status === "live" ? colors.greenDark : sharing.status === "error" || sharing.status === "denied" ? colors.coralDark : colors.muted;

  return (
    <ScrollView style={{ backgroundColor: colors.paper }} contentContainerStyle={{ flexGrow: 1 }}>
      <View style={{ paddingTop: insets.top + 12, paddingHorizontal: 20, paddingBottom: 16, gap: 14, width: "100%", maxWidth: 760, alignSelf: "center" }}>
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 16 }}>
          <View style={{ flex: 1, gap: 3 }}>
            <Text style={{ color: colors.greenDark, fontWeight: "700", fontSize: 11, letterSpacing: 1.6 }}>YOUR SHARED WORLD</Text>
            <Text accessibilityRole="header" style={{ color: colors.ink, fontSize: 30, lineHeight: 36, letterSpacing: -1, fontWeight: "700" }}>On the map.</Text>
          </View>
          <Pressable accessibilityRole="button" accessibilityLabel="Find a friend by email" onPress={() => router.push("/search")} style={({ pressed }) => ({ minHeight: 48, minWidth: 48, paddingHorizontal: 16, borderRadius: 24, justifyContent: "center", backgroundColor: pressed ? colors.line : colors.mint })}>
            <Text style={{ color: colors.greenDark, fontWeight: "700", fontSize: 14 }}>+ Add friend</Text>
          </Pressable>
        </View>
        <View style={{ flexDirection: "row", gap: 9, alignItems: "flex-start" }}>
          <View style={{ width: 7, height: 7, marginTop: 6, borderRadius: 4, backgroundColor: statusColor }} />
          <Text accessibilityLiveRegion="polite" style={{ flex: 1, color: colors.muted, fontSize: 13, lineHeight: 20 }}><Text style={{ color: statusColor, fontWeight: "700" }}>{statusLabel}</Text> · {statusDetail}</Text>
        </View>
      </View>
      <View style={{ flex: 1, minHeight: 280, backgroundColor: colors.mint, overflow: "hidden" }}>
        {friends.isLoading ? <ScreenState loading title="Finding your people" detail="Loading your friends’ shared locations." /> : friends.isError ? (
          <ScreenState title="The map couldn’t load" detail={errorText(friends.error)} actionLabel="Try again" onAction={() => friends.refetch()} />
        ) : <FriendsMap friends={friends.data ?? []} selectedFriendId={friendId} />}
      </View>
      <View style={{ width: "100%", maxWidth: 760, alignSelf: "center", padding: 20, gap: 14 }}>
        {sharing.error ? <Text accessibilityRole="alert" selectable style={{ color: colors.coralDark, fontSize: 13, lineHeight: 20 }}>{sharing.error}</Text> : null}
        {sharing.status === "denied" || sharing.status === "error" ? (
          <AtlasButton variant="secondary" onPress={sharing.canAskAgain ? sharing.retryPermission : () => Linking.openSettings()}>
            {sharing.canAskAgain ? sharing.status === "error" ? "Retry location" : "Allow location" : "Open location settings"}
          </AtlasButton>
        ) : null}
        {!friends.isLoading && !friends.isError ? recent ? (
          <Pressable accessibilityRole="button" accessibilityLabel={`View ${displayName(recent)} on map, updated ${relativeTime(recent.location?.timestamp)}`} onPress={() => router.setParams({ friendId: String(recent.id) })} style={({ pressed }) => ({ flexDirection: "row", alignItems: "center", gap: 12, opacity: pressed ? 0.7 : 1, minHeight: 60 })}>
            <Avatar name={recent.name} email={recent.email} uri={recent.avatar} size={52} />
            <View style={{ flex: 1, gap: 4 }}>
              <Text style={{ color: colors.muted, fontSize: 10, fontWeight: "700", letterSpacing: 1.3 }}>{String(recent.id) === friendId ? "SELECTED FRIEND" : "LATEST SHARED LOCATION"}</Text>
              <Text style={{ color: colors.ink, fontSize: 18, fontWeight: "700" }}>{displayName(recent)}</Text>
              <Text style={{ color: colors.muted, fontSize: 13 }}>Updated {relativeTime(recent.location?.timestamp)}</Text>
            </View>
            <Text style={{ color: colors.greenDark, fontSize: 25 }}>›</Text>
          </Pressable>
        ) : (
          <View style={{ gap: 6 }}>
            <Text style={{ color: colors.ink, fontSize: 19, fontWeight: "700" }}>{friends.data?.length ? "Waiting for a shared location" : "Good company starts here."}</Text>
            <Text style={{ color: colors.muted, fontSize: 14, lineHeight: 21 }}>{friends.data?.length ? "Your friends will appear here when they share a location." : "Invite someone you know. Their location appears after they accept and share it."}</Text>
          </View>
        ) : null}
        {sharing.lastSentAt ? <Text style={{ color: colors.muted, fontSize: 11, lineHeight: 16 }}>Your last update · {relativeTime(sharing.lastSentAt)}</Text> : null}
      </View>
    </ScrollView>
  );
}
