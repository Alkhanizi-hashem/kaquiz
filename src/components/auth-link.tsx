import type { Href } from "expo-router";
import { Link } from "expo-router";
import { Pressable, Text } from "react-native";

import { colors } from "@/theme";

export function AuthLink({ href, children }: { href: Href; children: string }) {
  return (
    <Link href={href} asChild>
      <Pressable
        accessibilityRole="link"
        style={({ pressed }) => ({ minHeight: 44, justifyContent: "center", opacity: pressed ? 0.6 : 1 })}
      >
        <Text style={{ color: colors.greenDark, fontSize: 15, fontWeight: "800", textAlign: "center" }}>{children}</Text>
      </Pressable>
    </Link>
  );
}
