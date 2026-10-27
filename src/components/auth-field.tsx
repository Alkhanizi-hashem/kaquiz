import { useState, type RefObject } from "react";
import { Text, TextInput, View, type TextInputProps } from "react-native";

import { colors } from "@/theme";

type Props = TextInputProps & {
  label: string;
  error?: string;
  inputRef?: RefObject<TextInput | null>;
};

export function AuthField({ label, error, inputRef, ...props }: Props) {
  const [focused, setFocused] = useState(false);
  const id = label.toLowerCase().replace(/[^a-z0-9]+/g, "-");
  const errorId = `${id}-error`;

  return (
    <View style={{ gap: 7 }}>
      <Text nativeID={`${id}-label`} style={{ color: colors.ink, fontSize: 15, fontWeight: "600" }}>
        {label}
      </Text>
      <TextInput
        ref={inputRef}
        accessibilityLabel={label}
        accessibilityLabelledBy={`${id}-label`}
        accessibilityHint={error}
        autoCorrect={false}
        placeholderTextColor={colors.muted}
        selectionColor={colors.greenDark}
        style={{
          minHeight: 52,
          borderWidth: 1.5,
          borderColor: error ? colors.coralDark : focused ? colors.greenDark : colors.line,
          borderRadius: 16,
          borderCurve: "continuous",
          paddingHorizontal: 16,
          paddingVertical: 14,
          backgroundColor: colors.surface,
          color: colors.ink,
          fontSize: 17,
        }}
        {...props}
        onFocus={(event) => { setFocused(true); props.onFocus?.(event); }}
        onBlur={(event) => { setFocused(false); props.onBlur?.(event); }}
      />
      {error ? (
        <Text nativeID={errorId} accessibilityRole="alert" selectable style={{ color: colors.coralDark, fontSize: 13, lineHeight: 18 }}>
          {error}
        </Text>
      ) : null}
    </View>
  );
}
