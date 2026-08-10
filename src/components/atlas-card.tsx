import type { PropsWithChildren } from "react";
import { View, type ViewStyle } from "react-native";

import { colors } from "@/theme";

export function AtlasCard({ children, style }: PropsWithChildren<{ style?: ViewStyle }>) {
  return (
    <View
      style={{
        padding: 16,
        gap: 12,
        borderRadius: 18,
        borderCurve: "continuous",
        borderWidth: 1,
        borderColor: colors.line,
        backgroundColor: colors.surface,
        boxShadow: "0 4px 18px rgba(16, 35, 30, 0.06)",
        ...style,
      }}
    >
      {children}
    </View>
  );
}
