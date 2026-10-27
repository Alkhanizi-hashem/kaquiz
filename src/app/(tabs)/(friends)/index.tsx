import { useRouter } from "expo-router";
import { Stack } from "expo-router/stack";
import { Alert, Pressable, ScrollView, Text, View } from "react-native";

import { AtlasButton } from "@/components/atlas-button";
import { AtlasCard } from "@/components/atlas-card";
import { Avatar } from "@/components/avatar";
import { ScreenState } from "@/components/screen-state";
import { useFriends, useInviteActions } from "@/hooks/use-api";
import { errorText, relativeTime } from "@/lib/format";
import { isFriendOnline } from "@/lib/friend-map";
import { colors } from "@/theme";
import { useContentStyle } from "@/hooks/use-content-style";
import { displayName } from "@/lib/user-display";

export default function FriendsScreen() {
  const friends = useFriends();
  const { remove } = useInviteActions();
  const contentStyle = useContentStyle();
  const router = useRouter();

  const confirmRemove = (id: number, name: string) => {
    if (remove.isPending) return;
    Alert.alert(
      `Remove ${name}?`,
      "You will stop seeing each other's shared location. A new invite is required to reconnect.",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Remove friend", style: "destructive", onPress: () => remove.mutate(id) },
      ],
    );
  };

  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      contentContainerStyle={{ ...contentStyle, paddingTop: 12, paddingBottom: 32, gap: 18 }}
      style={{ backgroundColor: colors.paper }}
    >
      <Stack.Screen options={{ title: "Friends" }} />
      <View style={{ gap: 8, paddingBottom: 2 }}>
        <Text style={{ color: colors.greenDark, fontSize: 12, fontWeight: "800", letterSpacing: 1.8 }}>YOUR CIRCLE</Text>
        <Text style={{ color: colors.inkSoft, fontSize: 16, lineHeight: 24 }}>A little closer, wherever you are.</Text>
        <Text style={{ color: colors.muted, fontSize: 13, lineHeight: 20 }}>Only accepted friends can see each other’s shared location.</Text>
      </View>
      <AtlasButton
        accessibilityLabel="Find a friend by email"
        onPress={() => router.push("/search")}
      >
        Find a friend
      </AtlasButton>
      {friends.isLoading ? <ScreenState loading title="Loading friends" /> : null}
      {friends.isError ? (
        <ScreenState
          title="Friends could not load"
          detail={errorText(friends.error)}
          actionLabel="Try again"
          onAction={() => friends.refetch()}
        />
      ) : null}
      {!friends.isLoading && !friends.isError && !friends.data?.length ? (
        <ScreenState
          title="Your circle starts here"
          detail="Search by email to invite someone you trust. Their location appears only after they accept."
        />
      ) : null}
      {friends.data?.map((friend) => {
        const name = displayName(friend);
        const recent = friend.location ? isFriendOnline(friend.location.timestamp) : false;
        const viewOnMap = () => router.navigate({
          pathname: "/(tabs)/(map)",
          params: { friendId: String(friend.id) },
        });
        return (
          <AtlasCard key={friend.id}>
            <Pressable
              accessibilityLabel={friend.location ? `View ${name} on map` : undefined}
              accessibilityRole={friend.location ? "button" : undefined}
              disabled={!friend.location}
              onPress={viewOnMap}
              style={({ pressed }) => ({
                flexDirection: "row",
                alignItems: "center",
                gap: 12,
                opacity: pressed ? 0.7 : 1,
              })}
            >
              <Avatar name={friend.name} email={friend.email} uri={friend.avatar} />
              <View style={{ flex: 1, gap: 3 }}>
                <Text style={{ color: colors.ink, fontSize: 18, fontWeight: "800" }}>{name}</Text>
                {friend.email ? <Text selectable style={{ color: colors.muted }}>{friend.email}</Text> : null}
                <Text style={{ color: recent ? colors.greenDark : colors.muted, fontWeight: "700" }}>
                  {recent
                    ? "Location updated just now"
                    : friend.location
                      ? `Location updated ${relativeTime(friend.location.timestamp)}`
                      : "No location shared yet"}
                </Text>
              </View>
            </Pressable>
            {friend.location ? (
              <AtlasButton
                variant="secondary"
                onPress={viewOnMap}
                accessibilityLabel={`View ${name} on map`}
              >
                {recent ? "View location" : "View last location"}
              </AtlasButton>
            ) : null}
            <AtlasButton
              variant="ghost"
              style={{ alignSelf: "flex-start", paddingHorizontal: 0 }}
              disabled={remove.isPending}
              loading={remove.isPending && remove.variables === friend.id}
              onPress={() => confirmRemove(friend.id, name)}
              accessibilityLabel={`Remove ${name} from friends`}
            >
              Remove friend
            </AtlasButton>
          </AtlasCard>
        );
      })}
      {remove.isError ? (
        <Text accessibilityRole="alert" selectable style={{ color: colors.coralDark }}>
          {errorText(remove.error)}
        </Text>
      ) : null}
    </ScrollView>
  );
}
