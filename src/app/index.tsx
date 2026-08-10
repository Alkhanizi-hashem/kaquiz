import { Redirect } from "expo-router";

import { ScreenState } from "@/components/screen-state";
import { AtlasButton } from "@/components/atlas-button";
import { useAuth } from "@/providers/auth-provider";
import { colors } from "@/theme";
import { View } from "react-native";

export default function IndexRoute() {
  const { status, startupError, retryRestore, logout } = useAuth();
  if (status === "loading") {
    return (
      <View style={{ flex: 1, justifyContent: "center", backgroundColor: colors.paper }}>
        <ScreenState loading title="Opening your atlas" detail="Restoring your secure session." />
      </View>
    );
  }
  if (status === "error") {
    return (
      <View style={{ flex: 1, justifyContent: "center", backgroundColor: colors.paper, padding: 24 }}>
        <ScreenState
          title="Kaquiz could not connect"
          detail={startupError ?? "Your session is still saved. Check your connection and try again."}
          actionLabel="Retry"
          onAction={retryRestore}
        />
        <View style={{ width: "100%", maxWidth: 360, alignSelf: "center" }}>
          <AtlasButton variant="danger" onPress={logout}>Sign out</AtlasButton>
        </View>
      </View>
    );
  }
  return <Redirect href={status === "authenticated" ? "/(tabs)/(map)" : "/auth/login"} />;
}
