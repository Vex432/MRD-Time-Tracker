"use client";

import type { ThemeName } from "../types/tracker";
import { themes, themeOrder } from "../lib/themes";

type ThemePickerProps = {
  selectedTheme: ThemeName;
  onThemeChange: (theme: ThemeName) => void;
};

export default function ThemePicker({
  selectedTheme,
  onThemeChange,
}: ThemePickerProps) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(125px, 1fr))",
        gap: 10,
      }}
    >
      {themeOrder.map((themeName) => {
        const theme = themes[themeName];
        const selected = selectedTheme === themeName;

        return (
          <button
            key={themeName}
            type="button"
            onClick={() => onThemeChange(themeName)}
            title={`Use ${theme.name} theme`}
            style={{
              position: "relative",
              padding: 12,
              borderRadius: 12,
              border: selected
                ? `3px solid ${theme.accent}`
                : `1px solid ${theme.border}`,
              background: theme.card,
              color: theme.text,
              cursor: "pointer",
              textAlign: "left",
              boxShadow: selected
                ? `0 0 18px ${theme.glow}`
                : "none",
              transition: "all 160ms ease",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                marginBottom: 10,
              }}
            >
              <span style={{ fontSize: 20 }}>{theme.emoji}</span>

              <strong
                style={{
                  fontSize: 14,
                }}
              >
                {theme.name}
              </strong>
            </div>

            <div
              style={{
                display: "flex",
                gap: 5,
              }}
            >
              <span
                style={{
                  width: 20,
                  height: 20,
                  borderRadius: 6,
                  background: theme.primary,
                }}
              />

              <span
                style={{
                  width: 20,
                  height: 20,
                  borderRadius: 6,
                  background: theme.secondary,
                }}
              />

              <span
                style={{
                  width: 20,
                  height: 20,
                  borderRadius: 6,
                  background: theme.accent,
                }}
              />

              <span
                style={{
                  width: 20,
                  height: 20,
                  borderRadius: 6,
                  background: theme.success,
                }}
              />
            </div>

            {selected && (
              <div
                style={{
                  position: "absolute",
                  top: 8,
                  right: 8,
                  fontSize: 12,
                  fontWeight: 800,
                  color: theme.accent,
                }}
              >
                ✓
              </div>
            )}
          </button>
        );
      })}
    </div>
  );
}