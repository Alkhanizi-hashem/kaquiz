import { ActivityIndicator, Text, View } from "react-native";

import { AtlasButton } from "@/components/atlas-button";
import { colors } from "@/theme";

export function ScreenState({
  title,
  detail,
  loading,
  actionLabel,
  onAction,
}: {
  title: string;
  detail?: string;
  loading?: boolean;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <View
      accessibilityRole={loading ? "progressbar" : undefined}
      style={{ padding: 24, gap: 12, alignItems: "center", justifyContent: "center", minHeight: 180 }}
    >
      {loading ? <ActivityIndicator size="large" color={colors.greenDark} /> : null}
      <Text selectable style={{ color: colors.ink, fontSize: 20, fontWeight: "800", textAlign: "center" }}>
        {title}
      </Text>
      {detail ? (
        <Text selectable style={{ color: colors.muted, fontSize: 15, lineHeight: 22, textAlign: "center" }}>
          {detail}
        </Text>
      ) : null}
      {actionLabel && onAction ? <AtlasButton onPress={onAction}>{actionLabel}</AtlasButton> : null}
    </View>
  );
}
