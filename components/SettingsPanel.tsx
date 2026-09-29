"use client";

import type { TrackerSettings } from "../types/tracker";
import type { ThemeColors } from "../lib/themes";
import ThemePicker from "./ThemePicker";

type SettingsPanelProps = {
  settings: TrackerSettings;
  colors: ThemeColors;
  onSettingsChange: (settings: TrackerSettings) => void;
  onBackup: () => void;
  onRestore: () => void;
  onResetSettings: () => void;
};

export default function SettingsPanel({
  settings,
  colors,
  onSettingsChange,
  onBackup,
  onRestore,
  onResetSettings,
}: SettingsPanelProps) {
  function updateSetting<K extends keyof TrackerSettings>(
    key: K,
    value: TrackerSettings[K]
  ) {
    onSettingsChange({
      ...settings,
      [key]: value,
    });
  }

  const sectionStyle: React.CSSProperties = {
    padding: 16,
    borderRadius: 12,
    border: `1px solid ${colors.border}`,
    background: colors.cardAlt,
  };

  const selectStyle: React.CSSProperties = {
    width: "100%",
    padding: "10px 12px",
    borderRadius: 9,
    border: `1px solid ${colors.inputBorder}`,
    background: colors.inputBackground,
    color: colors.text,
    fontSize: 14,
  };

  const buttonStyle: React.CSSProperties = {
    border: "none",
    borderRadius: 9,
    padding: "10px 14px",
    cursor: "pointer",
    fontWeight: 700,
  };

  const checkboxRow: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    gap: 9,
    marginBottom: 10,
    cursor: "pointer",
    color: colors.text,
  };

  return (
    <div style={{ display: "grid", gap: 16 }}>
      <div>
        <div
          style={{
            fontWeight: 800,
            fontSize: 15,
            marginBottom: 10,
            color: colors.text,
          }}
        >
          Theme
        </div>

        <ThemePicker
          selectedTheme={settings.theme}
          onThemeChange={(theme) =>
            updateSetting("theme", theme)
          }
        />
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            "repeat(auto-fit, minmax(220px, 1fr))",
          gap: 14,
        }}
      >
        <div style={sectionStyle}>
          <div
            style={{
              fontWeight: 800,
              marginBottom: 10,
              color: colors.text,
            }}
          >
            Layout
          </div>

          <select
            value={settings.density}
            onChange={(e) =>
              updateSetting(
                "density",
                e.target.value as TrackerSettings["density"]
              )
            }
            style={selectStyle}
          >
            <option value="comfortable">
              Comfortable
            </option>
            <option value="compact">
              Compact
            </option>
          </select>
        </div>

        <div style={sectionStyle}>
          <div
            style={{
              fontWeight: 800,
              marginBottom: 10,
              color: colors.text,
            }}
          >
            Timer Display
          </div>

          <select
            value={settings.timerDisplay}
            onChange={(e) =>
              updateSetting(
                "timerDisplay",
                e.target.value as TrackerSettings["timerDisplay"]
              )
            }
            style={selectStyle}
          >
            <option value="clock">
              Clock — 01:23:45
            </option>

            <option value="hours-minutes">
              Words — 1h 23m
            </option>
          </select>
        </div>
      </div>

      <div style={sectionStyle}>
        <div
          style={{
            fontWeight: 800,
            marginBottom: 12,
            color: colors.text,
          }}
        >
          Display Options
        </div>

        <label style={checkboxRow}>
          <input
            type="checkbox"
            checked={settings.showSeconds}
            onChange={(e) =>
              updateSetting(
                "showSeconds",
                e.target.checked
              )
            }
          />
          Show seconds
        </label>

        <label style={checkboxRow}>
          <input
            type="checkbox"
            checked={settings.animations}
            onChange={(e) =>
              updateSetting(
                "animations",
                e.target.checked
              )
            }
          />
          Enable animations
        </label>

        <label style={checkboxRow}>
          <input
            type="checkbox"
            checked={settings.stickyTimer}
            onChange={(e) =>
              updateSetting(
                "stickyTimer",
                e.target.checked
              )
            }
          />
          Keep active timer visible while scrolling
        </label>

        <label
          style={{
            ...checkboxRow,
            marginBottom: 0,
          }}
        >
          <input
            type="checkbox"
            checked={settings.collapseHistory}
            onChange={(e) =>
              updateSetting(
                "collapseHistory",
                e.target.checked
              )
            }
          />
          Collapse history by default
        </label>
      </div>

      <div style={sectionStyle}>
        <div
          style={{
            fontWeight: 800,
            marginBottom: 6,
            color: colors.text,
          }}
        >
          Backup & Preferences
        </div>

        <div
          style={{
            color: colors.textMuted,
            fontSize: 13,
            lineHeight: 1.5,
            marginBottom: 12,
          }}
        >
          Create a backup before clearing browser
          data or moving to another computer.
        </div>

        <div
          style={{
            display: "flex",
            gap: 10,
            flexWrap: "wrap",
          }}
        >
          <button
            type="button"
            onClick={onBackup}
            style={{
              ...buttonStyle,
              background: colors.success,
              color: "#ffffff",
            }}
          >
            💾 Backup Data
          </button>

          <button
            type="button"
            onClick={onRestore}
            style={{
              ...buttonStyle,
              background: colors.secondary,
              color: colors.secondaryText,
            }}
          >
            📂 Restore Backup
          </button>

          <button
            type="button"
            onClick={onResetSettings}
            style={{
              ...buttonStyle,
              background: colors.danger,
              color: "#ffffff",
            }}
          >
            Reset Preferences
          </button>
        </div>
      </div>
    </div>
  );
}