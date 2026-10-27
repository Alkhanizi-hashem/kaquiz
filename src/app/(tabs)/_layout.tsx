import { Redirect } from "expo-router";
import { NativeTabs } from "expo-router/unstable-native-tabs";

import { ScreenState } from "@/components/screen-state";
import { useInvites } from "@/hooks/use-api";
import { useAuth } from "@/providers/auth-provider";
import { colors } from "@/theme";

export default function TabsLayout() {
  const { status, user } = useAuth();
  if (status === "loading") return <ScreenState loading title="Loading Kaquiz" />;
  if (status !== "authenticated" || !user) return <Redirect href="/auth/login" />;

  return <AuthenticatedTabs key={user.id} userId={user.id} />;
}

function AuthenticatedTabs({ userId }: { userId: number }) {
  const invites = useInvites(userId);
  const incomingCount = invites.data?.incoming.length ?? 0;

  return (
    <NativeTabs tintColor={colors.greenDark} backgroundColor={colors.paper}>
      <NativeTabs.Trigger name="(map)">
        <NativeTabs.Trigger.Icon sf={{ default: "map", selected: "map.fill" }} md="map" />
        <NativeTabs.Trigger.Label>Map</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="(friends)">
        <NativeTabs.Trigger.Icon sf={{ default: "person.2", selected: "person.2.fill" }} md="group" />
        <NativeTabs.Trigger.Label>Friends</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="(requests)">
        <NativeTabs.Trigger.Icon sf={{ default: "bell", selected: "bell.fill" }} md="notifications" />
        <NativeTabs.Trigger.Label>Requests</NativeTabs.Trigger.Label>
        {incomingCount ? <NativeTabs.Trigger.Badge>{String(incomingCount)}</NativeTabs.Trigger.Badge> : null}
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="(profile)">
        <NativeTabs.Trigger.Icon sf={{ default: "person.crop.circle", selected: "person.crop.circle.fill" }} md="account_circle" />
        <NativeTabs.Trigger.Label>Profile</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
