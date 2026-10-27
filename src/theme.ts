/** Shared native and web visual foundations. */
export const colors = {
  ink: "#183B32",
  inkSoft: "#405C52",
  paper: "#F7F8F2",
  surface: "#FFFFFF",
  mint: "#E8F2E8",
  green: "#40B880",
  greenDark: "#21734F",
  coral: "#D98B66",
  coralDark: "#A23E2E",
  line: "#DEE5DC",
  muted: "#65756C",
  white: "#FFFFFF",
} as const;

export const layout = { maxWidth: 680, gutter: 20, tabletGutter: 32 } as const;
export const spacing = { xs: 4, sm: 8, md: 12, lg: 20, xl: 28, xxl: 40 } as const;
export const radii = { input: 16, card: 24, pill: 999 } as const;
