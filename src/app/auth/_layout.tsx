import { Redirect } from "expo-router";
import { Stack } from "expo-router/stack";

import { useAuth } from "@/providers/auth-provider";
import { colors } from "@/theme";

export default function AuthLayout() {
  const { status } = useAuth();
  if (status === "authenticated") return <Redirect href="/(tabs)/(map)" />;
  return (
    <Stack
      screenOptions={{
        contentStyle: { backgroundColor: colors.paper },
        headerStyle: { backgroundColor: colors.paper },
        headerShadowVisible: false,
        headerTintColor: colors.ink,
        headerBackButtonDisplayMode: "minimal",
      }}
    >
      <Stack.Screen name="login" options={{ headerShown: false }} />
      <Stack.Screen name="create-account" options={{ title: "Create account" }} />
    </Stack>
  );
}
