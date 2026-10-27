import * as Haptics from "expo-haptics";
import type { PropsWithChildren } from "react";
import { ActivityIndicator, Pressable, Text, type ViewStyle } from "react-native";

import { colors } from "@/theme";

type Props = PropsWithChildren<{
  onPress?: () => void | Promise<void>;
  variant?: "primary" | "secondary" | "danger" | "ghost";
  disabled?: boolean;
  loading?: boolean;
  accessibilityLabel?: string;
  style?: ViewStyle;
}>;

export function AtlasButton({
  children,
  onPress,
  variant = "primary",
  disabled,
  loading,
  accessibilityLabel,
  style,
}: Props) {
  const palette = {
    primary: { background: colors.ink, foreground: colors.white, border: colors.ink },
    secondary: { background: colors.mint, foreground: colors.ink, border: colors.line },
    danger: { background: "#FFE7E1", foreground: colors.coralDark, border: "#FFB7A6" },
    ghost: { background: "transparent", foreground: colors.ink, border: "transparent" },
  }[variant];

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? (typeof children === "string" ? children : undefined)}
      accessibilityState={{ disabled: Boolean(disabled || loading), busy: loading }}
      disabled={disabled || loading}
      onPress={async () => {
        if (process.env.EXPO_OS === "ios") {
          await Haptics.selectionAsync();
        }
        await onPress?.();
      }}
      style={({ pressed }) => ({
        minHeight: 52,
        paddingVertical: 13,
        flexDirection: "row",
        gap: 10,
        paddingHorizontal: 20,
        alignItems: "center",
        justifyContent: "center",
        borderRadius: 16,
        borderCurve: "continuous",
        borderWidth: 1,
        borderColor: palette.border,
        backgroundColor: palette.background,
        opacity: disabled && !loading ? 0.5 : pressed ? 0.82 : 1,
        ...style,
      })}
    >
      {loading ? <ActivityIndicator color={palette.foreground} /> : null}
      <Text style={{ color: palette.foreground, fontSize: 16, lineHeight: 22, fontWeight: "700", textAlign: "center", flexShrink: 1 }}>
        {children}
      </Text>
    </Pressable>
  );
}
