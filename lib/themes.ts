import type { ThemeName } from "../types/tracker";

export type ThemeColors = {
  name: string;
  emoji: string;

  background: string;
  backgroundAlt: string;
  card: string;
  cardAlt: string;

  text: string;
  textMuted: string;

  border: string;
  inputBorder: string;

  primary: string;
  primaryHover: string;
  primaryText: string;

  secondary: string;
  secondaryText: string;

  success: string;
  danger: string;
  warning: string;

  accent: string;
  glow: string;

  inputBackground: string;
};

export const themes: Record<ThemeName, ThemeColors> = {
  light: {
    name: "Light",
    emoji: "☀️",
    background: "#f3f4f6",
    backgroundAlt: "#e5e7eb",
    card: "#ffffff",
    cardAlt: "#f9fafb",
    text: "#111827",
    textMuted: "#6b7280",
    border: "#d1d5db",
    inputBorder: "#cbd5e1",
    primary: "#2563eb",
    primaryHover: "#1d4ed8",
    primaryText: "#ffffff",
    secondary: "#64748b",
    secondaryText: "#ffffff",
    success: "#059669",
    danger: "#dc2626",
    warning: "#d97706",
    accent: "#2563eb",
    glow: "rgba(37, 99, 235, 0.20)",
    inputBackground: "#ffffff",
  },

  dark: {
    name: "Dark",
    emoji: "🌙",
    background: "#111827",
    backgroundAlt: "#0f172a",
    card: "#1f2937",
    cardAlt: "#273449",
    text: "#f9fafb",
    textMuted: "#9ca3af",
    border: "#374151",
    inputBorder: "#475569",
    primary: "#3b82f6",
    primaryHover: "#2563eb",
    primaryText: "#ffffff",
    secondary: "#64748b",
    secondaryText: "#ffffff",
    success: "#10b981",
    danger: "#ef4444",
    warning: "#f59e0b",
    accent: "#60a5fa",
    glow: "rgba(96, 165, 250, 0.20)",
    inputBackground: "#111827",
  },

  ocean: {
    name: "Ocean",
    emoji: "🌊",
    background: "#061826",
    backgroundAlt: "#082f49",
    card: "#0c2538",
    cardAlt: "#10344a",
    text: "#ecfeff",
    textMuted: "#a5f3fc",
    border: "#155e75",
    inputBorder: "#0e7490",
    primary: "#06b6d4",
    primaryHover: "#0891b2",
    primaryText: "#042f2e",
    secondary: "#0284c7",
    secondaryText: "#ffffff",
    success: "#2dd4bf",
    danger: "#fb7185",
    warning: "#fbbf24",
    accent: "#22d3ee",
    glow: "rgba(34, 211, 238, 0.28)",
    inputBackground: "#071f2e",
  },

  sunset: {
    name: "Sunset",
    emoji: "🌅",
    background: "#24112b",
    backgroundAlt: "#3b163d",
    card: "#35183e",
    cardAlt: "#48204c",
    text: "#fff7ed",
    textMuted: "#fdbaaa",
    border: "#7c2d5e",
    inputBorder: "#9d416f",
    primary: "#f97316",
    primaryHover: "#ea580c",
    primaryText: "#ffffff",
    secondary: "#db2777",
    secondaryText: "#ffffff",
    success: "#84cc16",
    danger: "#ef4444",
    warning: "#fbbf24",
    accent: "#fb7185",
    glow: "rgba(251, 113, 133, 0.30)",
    inputBackground: "#2b1433",
  },

  cyberpunk: {
    name: "Cyberpunk",
    emoji: "🌃",
    background: "#070711",
    backgroundAlt: "#0d0b1d",
    card: "#111122",
    cardAlt: "#18152d",
    text: "#f5f3ff",
    textMuted: "#a5b4fc",
    border: "#3b2f66",
    inputBorder: "#5b45a0",
    primary: "#22d3ee",
    primaryHover: "#06b6d4",
    primaryText: "#06131a",
    secondary: "#a855f7",
    secondaryText: "#ffffff",
    success: "#39ff88",
    danger: "#ff3366",
    warning: "#facc15",
    accent: "#e879f9",
    glow: "rgba(232, 121, 249, 0.35)",
    inputBackground: "#0b0b18",
  },

  forest: {
    name: "Forest",
    emoji: "🌲",
    background: "#0c1a13",
    backgroundAlt: "#12251a",
    card: "#16271d",
    cardAlt: "#1d3326",
    text: "#f0fdf4",
    textMuted: "#bbf7d0",
    border: "#2f5d42",
    inputBorder: "#3f7655",
    primary: "#22c55e",
    primaryHover: "#16a34a",
    primaryText: "#052e16",
    secondary: "#65a30d",
    secondaryText: "#ffffff",
    success: "#4ade80",
    danger: "#f87171",
    warning: "#eab308",
    accent: "#86efac",
    glow: "rgba(134, 239, 172, 0.24)",
    inputBackground: "#102017",
  },

  midnight: {
    name: "Midnight",
    emoji: "🌌",
    background: "#090d1a",
    backgroundAlt: "#11172a",
    card: "#151c31",
    cardAlt: "#1c2540",
    text: "#eef2ff",
    textMuted: "#a5b4fc",
    border: "#303b68",
    inputBorder: "#43528c",
    primary: "#6366f1",
    primaryHover: "#4f46e5",
    primaryText: "#ffffff",
    secondary: "#8b5cf6",
    secondaryText: "#ffffff",
    success: "#34d399",
    danger: "#fb7185",
    warning: "#fbbf24",
    accent: "#818cf8",
    glow: "rgba(129, 140, 248, 0.30)",
    inputBackground: "#0f1527",
  },

  candy: {
    name: "Candy",
    emoji: "🍬",
    background: "#fff1f7",
    backgroundAlt: "#f5e8ff",
    card: "#ffffff",
    cardAlt: "#fff7fc",
    text: "#4a244f",
    textMuted: "#8b5b8f",
    border: "#e9c5e9",
    inputBorder: "#d8b4e2",
    primary: "#ec4899",
    primaryHover: "#db2777",
    primaryText: "#ffffff",
    secondary: "#8b5cf6",
    secondaryText: "#ffffff",
    success: "#14b8a6",
    danger: "#f43f5e",
    warning: "#f59e0b",
    accent: "#c084fc",
    glow: "rgba(236, 72, 153, 0.22)",
    inputBackground: "#ffffff",
  },

  ember: {
    name: "Ember",
    emoji: "🔥",
    background: "#15100e",
    backgroundAlt: "#211612",
    card: "#261a15",
    cardAlt: "#332019",
    text: "#fff7ed",
    textMuted: "#fdba74",
    border: "#63351f",
    inputBorder: "#854d2a",
    primary: "#f97316",
    primaryHover: "#ea580c",
    primaryText: "#ffffff",
    secondary: "#b91c1c",
    secondaryText: "#ffffff",
    success: "#65a30d",
    danger: "#ef4444",
    warning: "#fbbf24",
    accent: "#fb923c",
    glow: "rgba(249, 115, 22, 0.30)",
    inputBackground: "#1b120f",
  },

  terminal: {
    name: "Terminal",
    emoji: "💻",
    background: "#050805",
    backgroundAlt: "#080d08",
    card: "#0b110b",
    cardAlt: "#101810",
    text: "#b7ffb7",
    textMuted: "#65a765",
    border: "#1f4d27",
    inputBorder: "#2e6b38",
    primary: "#39ff6a",
    primaryHover: "#22c55e",
    primaryText: "#031006",
    secondary: "#15803d",
    secondaryText: "#ffffff",
    success: "#39ff6a",
    danger: "#ff5252",
    warning: "#e5ff52",
    accent: "#00ff88",
    glow: "rgba(57, 255, 106, 0.25)",
    inputBackground: "#060b06",
  },
};

export const themeOrder: ThemeName[] = [
  "light",
  "dark",
  "ocean",
  "sunset",
  "cyberpunk",
  "forest",
  "midnight",
  "candy",
  "ember",
  "terminal",
];