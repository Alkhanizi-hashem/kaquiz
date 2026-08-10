import { ScrollView, Text, View } from "react-native";

import { AtlasCard } from "@/components/atlas-card";
import { Avatar } from "@/components/avatar";
import { relativeTime } from "@/lib/format";
import { colors } from "@/theme";
import type { Friend } from "@/types/api";
import { displayName } from "@/lib/user-display";

export function FriendsMap({ friends }: { friends: Friend[] }) {
  const located = friends.filter((friend) => friend.location);
  return (
    <ScrollView
      accessibilityLabel="Web location overview"
      contentInsetAdjustmentBehavior="automatic"
      contentContainerStyle={{ padding: 16, paddingTop: 120, gap: 12 }}
      style={{ flex: 1, backgroundColor: colors.paper }}
    >
      <View style={{ gap: 4 }}>
        <Text style={{ color: colors.ink, fontSize: 24, fontWeight: "800" }}>Coordinate atlas</Text>
        <Text style={{ color: colors.muted, fontSize: 15, lineHeight: 22 }}>
          The interactive map is available in the iOS and Android app. Latest coordinates remain useful here.
        </Text>
      </View>
      {located.map((friend) => {
        const name = displayName(friend);
        return (
          <AtlasCard key={friend.id} style={{ flexDirection: "row", alignItems: "center" }}>
            <Avatar name={friend.name} email={friend.email} uri={friend.avatar} />
            <View style={{ flex: 1, gap: 3 }}>
              <Text style={{ color: colors.ink, fontSize: 17, fontWeight: "700" }}>{name}</Text>
              <Text selectable style={{ color: colors.muted, fontVariant: ["tabular-nums"] }}>
                {Number(friend.location?.latitude).toFixed(4)}, {Number(friend.location?.longitude).toFixed(4)}
              </Text>
              <Text style={{ color: colors.greenDark }}>{relativeTime(friend.location?.timestamp)}</Text>
            </View>
          </AtlasCard>
        );
      })}
      {!located.length ? (
        <Text style={{ color: colors.muted, textAlign: "center", padding: 24 }}>
          No friend has shared a location yet.
        </Text>
      ) : null}
    </ScrollView>
  );
}
