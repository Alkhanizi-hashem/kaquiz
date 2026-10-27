import type { PropsWithChildren, ReactNode } from "react";
import { ScrollView, Text, View, useWindowDimensions } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { colors } from "@/theme";

/** Decorative atlas lines are not locations or a preview of real users. */
function AtlasIllustration() {
  return (
    <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={{ height: 116, borderRadius: 24, overflow: "hidden", backgroundColor: colors.mint }}>
      {[18, 58, 98].map((top) => <View key={top} style={{ position: "absolute", top, left: -20, right: -20, height: 12, backgroundColor: "#F8FBF5", transform: [{ rotate: "-12deg" }] }} />)}
      {[70, 190, 300].map((left) => <View key={left} style={{ position: "absolute", top: -50, bottom: -50, left, width: 10, backgroundColor: "#F8FBF5", transform: [{ rotate: "24deg" }] }} />)}
      <View style={{ position: "absolute", top: 25, left: "43%", width: 64, height: 64, borderRadius: 32, backgroundColor: "rgba(33,115,79,0.10)", alignItems: "center", justifyContent: "center" }}>
        <View style={{ width: 34, height: 34, borderRadius: 17, backgroundColor: colors.greenDark, borderWidth: 5, borderColor: colors.white }} />
      </View>
      <View style={{ position: "absolute", top: 26, left: "19%", width: 13, height: 13, borderRadius: 7, backgroundColor: colors.coral, borderWidth: 3, borderColor: colors.white }} />
      <View style={{ position: "absolute", bottom: 23, right: "16%", width: 13, height: 13, borderRadius: 7, backgroundColor: colors.greenDark, borderWidth: 3, borderColor: colors.white }} />
    </View>
  );
}

export function AuthScreen({ eyebrow, title, detail, children, footer, headerVisible = false }: PropsWithChildren<{
  eyebrow?: string; title: string; detail: string; footer?: ReactNode; headerVisible?: boolean;
}>) {
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  return (
    <ScrollView
      automaticallyAdjustKeyboardInsets
      contentInsetAdjustmentBehavior="never"
      contentContainerStyle={{ flexGrow: 1, justifyContent: "center", paddingHorizontal: 24, paddingTop: headerVisible ? 24 : Math.max(24, insets.top + 12), paddingBottom: Math.max(24, insets.bottom + 16) }}
      keyboardDismissMode="on-drag" keyboardShouldPersistTaps="handled"
      style={{ backgroundColor: colors.paper }}
    >
      <View style={{ width: "100%", maxWidth: 420, alignSelf: "center", gap: 24 }}>
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
          <Text style={{ color: colors.ink, fontSize: 24, fontWeight: "800", letterSpacing: -1 }}>kaquiz<Text style={{ color: colors.greenDark }}>.</Text></Text>
          <Text style={{ color: colors.muted, fontSize: 11, letterSpacing: 1.5, fontWeight: "600" }}>YOUR PEOPLE, CLOSER</Text>
        </View>
        {height >= 740 ? <AtlasIllustration /> : null}
        <View style={{ gap: 8 }}>
          {eyebrow ? <Text style={{ color: colors.greenDark, fontSize: 11, fontWeight: "700", letterSpacing: 1.8 }}>{eyebrow}</Text> : null}
          <Text accessibilityRole="header" style={{ color: colors.ink, fontSize: 34, lineHeight: 39, letterSpacing: -1.2, fontWeight: "700" }}>{title}</Text>
          <Text style={{ color: colors.muted, fontSize: 15, lineHeight: 23 }}>{detail}</Text>
        </View>
        <View style={{ gap: 16 }}>{children}</View>
        {footer}
      </View>
    </ScrollView>
  );
}
