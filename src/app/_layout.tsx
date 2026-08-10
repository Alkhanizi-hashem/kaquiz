import { QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router/stack";
import { ThemeProvider } from "expo-router/react-navigation";
import { StatusBar } from "expo-status-bar";
import { GestureHandlerRootView } from "react-native-gesture-handler";

import { queryClient } from "@/lib/query-client";
import { AuthProvider } from "@/providers/auth-provider";
import { LocationProvider } from "@/providers/location-provider";
import { colors } from "@/theme";

const atlasTheme = {
  dark: false,
  colors: {
    primary: colors.greenDark,
    background: colors.paper,
    card: colors.paper,
    text: colors.ink,
    border: colors.line,
    notification: colors.coral,
  },
  fonts: {
    regular: { fontFamily: "System", fontWeight: "400" as const },
    medium: { fontFamily: "System", fontWeight: "600" as const },
    bold: { fontFamily: "System", fontWeight: "700" as const },
    heavy: { fontFamily: "System", fontWeight: "800" as const },
  },
};

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <LocationProvider>
            <ThemeProvider value={atlasTheme}>
              <StatusBar style="dark" />
              <Stack
                screenOptions={{
                  contentStyle: { backgroundColor: colors.paper },
                  headerStyle: { backgroundColor: colors.paper },
                  headerShadowVisible: false,
                  headerTintColor: colors.ink,
                  headerBackButtonDisplayMode: "minimal",
                }}
              >
                <Stack.Screen name="index" options={{ headerShown: false }} />
                <Stack.Screen name="auth" options={{ headerShown: false }} />
                <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                <Stack.Screen
                  name="search"
                  options={{ title: "Find a friend", presentation: "modal", headerLargeTitle: false }}
                />
              </Stack>
            </ThemeProvider>
          </LocationProvider>
        </AuthProvider>
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}
