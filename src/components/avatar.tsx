import { Image } from "expo-image";
import { Text, View } from "react-native";

import { colors } from "@/theme";
import { displayName } from "@/lib/user-display";

export function Avatar({
  name,
  email,
  uri,
  size = 48,
}: {
  name: string | null;
  email?: string | null;
  uri?: string | null;
  size?: number;
}) {
  const label = displayName({ name, email });
  if (uri) {
    return (
      <Image
        source={{ uri }}
        accessibilityLabel={`${label}'s profile photo`}
        contentFit="cover"
        transition={150}
        style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: colors.mint }}
      />
    );
  }

  return (
    <View
      accessible
      accessibilityLabel={`${label}'s initials`}
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: colors.ink,
      }}
    >
      <Text style={{ color: colors.white, fontSize: size * 0.38, fontWeight: "800" }}>
        {label[0].toUpperCase()}
      </Text>
    </View>
  );
}
