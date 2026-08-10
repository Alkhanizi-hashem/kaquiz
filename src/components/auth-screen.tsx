import type { PropsWithChildren, ReactNode } from "react";
import { ScrollView, Text, View } from "react-native";

import { colors } from "@/theme";

export function AuthScreen({
  eyebrow,
  title,
  detail,
  children,
  footer,
}: PropsWithChildren<{
  eyebrow?: string;
  title: string;
  detail: string;
  footer?: ReactNode;
}>) {
  return (
    <ScrollView
      automaticallyAdjustKeyboardInsets
      contentInsetAdjustmentBehavior="automatic"
      contentContainerStyle={{ flexGrow: 1, justifyContent: "center", padding: 24, paddingVertical: 32 }}
      keyboardDismissMode="on-drag"
      keyboardShouldPersistTaps="handled"
      style={{ backgroundColor: colors.paper }}
    >
      <View style={{ width: "100%", maxWidth: 520, alignSelf: "center", gap: 24 }}>
        <View style={{ gap: 8 }}>
          {eyebrow ? (
            <Text style={{ color: colors.greenDark, fontSize: 13, fontWeight: "800", letterSpacing: 1.2 }}>
              {eyebrow}
            </Text>
          ) : null}
          <Text accessibilityRole="header" style={{ color: colors.ink, fontSize: 36, lineHeight: 41, fontWeight: "900" }}>
            {title}
          </Text>
          <Text style={{ color: colors.inkSoft, fontSize: 16, lineHeight: 24 }}>{detail}</Text>
        </View>
        <View style={{ gap: 16 }}>{children}</View>
        {footer}
      </View>
    </ScrollView>
  );
}
