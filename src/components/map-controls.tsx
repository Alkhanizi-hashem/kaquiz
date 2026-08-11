import { Pressable, Text, View } from "react-native";

import { colors } from "@/theme";

export function MapControls({ onZoomIn, onZoomOut }: { onZoomIn: () => void; onZoomOut: () => void }) {
  return (
    <View
      style={{
        position: "absolute",
        right: 16,
        bottom: 116,
        overflow: "hidden",
        borderRadius: 14,
        borderCurve: "continuous",
        borderWidth: 1,
        borderColor: colors.line,
        backgroundColor: colors.surface,
        boxShadow: "0 6px 20px rgba(16, 35, 30, 0.18)",
      }}
    >
      {[
        { label: "Zoom in", symbol: "+", onPress: onZoomIn },
        { label: "Zoom out", symbol: "−", onPress: onZoomOut },
      ].map((control, index) => (
        <Pressable
          key={control.label}
          accessibilityLabel={control.label}
          accessibilityRole="button"
          onPress={control.onPress}
          style={({ pressed }) => ({
            width: 48,
            height: 48,
            alignItems: "center",
            justifyContent: "center",
            borderTopWidth: index ? 1 : 0,
            borderTopColor: colors.line,
            backgroundColor: pressed ? colors.mint : colors.surface,
          })}
        >
          <Text style={{ color: colors.ink, fontSize: 28, fontWeight: "500", lineHeight: 30 }}>
            {control.symbol}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}
