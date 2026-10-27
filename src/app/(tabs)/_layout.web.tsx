import { Redirect } from "expo-router";
import { Tabs } from "expo-router/js-tabs";
import { Text, View } from "react-native";

import { ScreenState } from "@/components/screen-state";
import { useInvites } from "@/hooks/use-api";
import { useAuth } from "@/providers/auth-provider";
import { colors } from "@/theme";

// NativeTabs uses a floating, top-positioned web menu. Use a layout-aware
// bottom bar on web; iOS and Android retain their platform-native tab bars.
export default function WebTabsLayout() {
  const { status, user } = useAuth();
  if (status === "loading") return <ScreenState loading title="Loading Kaquiz" />;
  if (status !== "authenticated" || !user) return <Redirect href="/auth/login" />;
  return <AuthenticatedWebTabs key={user.id} userId={user.id} />;
}

function AuthenticatedWebTabs({ userId }: { userId: number }) {
  const invites = useInvites(userId);
  const incoming = invites.data?.incoming.length ?? 0;
  return (
    <Tabs screenOptions={{
      headerShown: false,
      tabBarActiveTintColor: colors.greenDark,
      tabBarInactiveTintColor: colors.muted,
      tabBarActiveBackgroundColor: colors.mint,
      tabBarIcon: () => null,
      tabBarIconStyle: { display: "none" },
      tabBarLabelPosition: "beside-icon",
      tabBarLabelStyle: { fontSize: 13, fontWeight: "700" },
      tabBarItemStyle: { minHeight: 48, borderRadius: 16, marginHorizontal: 3 },
      tabBarStyle: { height: 68, paddingTop: 10, paddingBottom: 10, paddingHorizontal: 12, backgroundColor: colors.surface, borderTopColor: colors.line },
    }}>
      <Tabs.Screen name="(map)" options={{ title: "Map" }} />
      <Tabs.Screen name="(friends)" options={{ title: "Friends" }} />
      <Tabs.Screen name="(requests)" options={{
        title: "Requests",
        tabBarAccessibilityLabel: incoming ? `Requests, ${incoming} incoming` : "Requests",
        tabBarLabel: ({ color }) => (
          <View style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
            <Text style={{ color, fontSize: 13, fontWeight: "700" }}>Requests</Text>
            {incoming ? <Text style={{ color: colors.white, backgroundColor: colors.greenDark, borderRadius: 10, minWidth: 20, paddingHorizontal: 5, paddingVertical: 2, textAlign: "center", fontSize: 11, fontWeight: "700" }}>{incoming}</Text> : null}
          </View>
        ),
      }} />
      <Tabs.Screen name="(profile)" options={{ title: "Profile" }} />
    </Tabs>
  );
}
