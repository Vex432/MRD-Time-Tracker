"use client";

import { useEffect, useMemo, useState } from "react";

import SettingsPanel from "../components/SettingsPanel";
import { themes } from "../lib/themes";
import {
  DEFAULT_SETTINGS,
  loadSettings,
  saveSettings,
} from "../lib/storage";

import type { TrackerSettings } from "../types/tracker";

type ActiveTask = {
  projectNumber: string;
  item: string;
  description: string;
  start: number;
};

export default function Home() {
  const [settings, setSettings] =
    useState<TrackerSettings>(DEFAULT_SETTINGS);

  const [settingsOpen, setSettingsOpen] = useState(false);
  const [loaded, setLoaded] = useState(false);

  const [projectNumber, setProjectNumber] = useState("");
  const [item, setItem] = useState("");
  const [description, setDescription] = useState("");

  const [activeTask, setActiveTask] =
    useState<ActiveTask | null>(null);

  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  const colors = useMemo(
    () => themes[settings.theme],
    [settings.theme]
  );

  // -----------------------------
  // SETTINGS
  // -----------------------------

  useEffect(() => {
    setSettings(loadSettings());
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (!loaded) return;
    saveSettings(settings);
  }, [settings, loaded]);

  // -----------------------------
  // LIVE TIMER
  // -----------------------------

  useEffect(() => {
    if (!activeTask) {
      setElapsedSeconds(0);
      return;
    }

    const updateTimer = () => {
      setElapsedSeconds(
        Math.floor((Date.now() - activeTask.start) / 1000)
      );
    };

    updateTimer();

    const interval = window.setInterval(updateTimer, 1000);

    return () => window.clearInterval(interval);
  }, [activeTask]);

  // -----------------------------
  // TIMER FUNCTIONS
  // -----------------------------

  function startTask() {
    const project = projectNumber.trim();
    const taskItem = item.trim();
    const taskDescription = description.trim();

    if (!project) {
      alert("Enter an MRD Project Number.");
      return;
    }

    if (!taskItem) {
      alert("Enter an Item.");
      return;
    }

    if (!taskDescription) {
      alert("Enter a Description.");
      return;
    }

    setActiveTask({
      projectNumber: project,
      item: taskItem,
      description: taskDescription,
      start: Date.now(),
    });
  }

  function stopTask() {
    if (!activeTask) return;

    setActiveTask(null);
  }

  function formatTimer(totalSeconds: number) {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    if (
      settings.timerDisplay === "hours-minutes" &&
      !settings.showSeconds
    ) {
      return `${hours}h ${minutes}m`;
    }

    if (settings.timerDisplay === "hours-minutes") {
      return `${hours}h ${minutes}m ${seconds}s`;
    }

    const parts = [hours, minutes];

    if (settings.showSeconds) {
      parts.push(seconds);
    }

    return parts
      .map((value) => String(value).padStart(2, "0"))
      .join(":");
  }

  // -----------------------------
  // SETTINGS ACTIONS
  // -----------------------------

  function handleResetSettings() {
    setSettings(DEFAULT_SETTINGS);
  }

  function handleBackup() {
    alert(
      "Backup will be connected when we add persistent time history."
    );
  }

  function handleRestore() {
    alert(
      "Restore will be connected when we add persistent time history."
    );
  }

  // -----------------------------
  // STYLES
  // -----------------------------

  const compact = settings.density === "compact";

  const pageStyle: React.CSSProperties = {
    minHeight: "100vh",
    background: colors.background,
    color: colors.text,
    transition: settings.animations
      ? "background 180ms ease, color 180ms ease"
      : "none",
  };

  const containerStyle: React.CSSProperties = {
    width: "min(1500px, calc(100% - 32px))",
    margin: "0 auto",
    padding: compact ? "18px 0 40px" : "28px 0 60px",
  };

  const cardStyle: React.CSSProperties = {
    background: colors.card,
    border: `1px solid ${colors.border}`,
    borderRadius: 16,
    padding: compact ? 16 : 22,
    boxShadow:
      settings.theme === "light" || settings.theme === "candy"
        ? "0 8px 25px rgba(0,0,0,0.06)"
        : `0 8px 30px ${colors.glow}`,
    transition: settings.animations ? "all 180ms ease" : "none",
  };

  const inputStyle: React.CSSProperties = {
    width: "100%",
    boxSizing: "border-box",
    border: `1px solid ${colors.inputBorder}`,
    borderRadius: 10,
    padding: compact ? "10px 12px" : "13px 14px",
    fontSize: 15,
    outline: "none",
    background: colors.inputBackground,
    color: colors.text,
  };

  const primaryButton: React.CSSProperties = {
    border: "none",
    borderRadius: 10,
    padding: compact ? "10px 15px" : "12px 18px",
    background: colors.primary,
    color: colors.primaryText,
    fontWeight: 800,
    fontSize: 14,
    cursor: "pointer",
    boxShadow: `0 0 16px ${colors.glow}`,
  };

  const secondaryButton: React.CSSProperties = {
    border: `1px solid ${colors.border}`,
    borderRadius: 10,
    padding: compact ? "9px 13px" : "11px 16px",
    background: colors.cardAlt,
    color: colors.text,
    fontWeight: 700,
    cursor: "pointer",
  };

  return (
    <main style={pageStyle}>
      <div style={containerStyle}>

        {/* HEADER */}

        <header
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 20,
            marginBottom: compact ? 18 : 26,
            flexWrap: "wrap",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 14,
            }}
          >
            <img
              src="/logo.png"
              alt="MRD"
              style={{
                width: compact ? 48 : 58,
                height: compact ? 48 : 58,
                objectFit: "contain",
              }}
            />

            <div>
              <div
                style={{
                  fontSize: compact ? 24 : 30,
                  fontWeight: 900,
                  letterSpacing: "-0.5px",
                }}
              >
                Time Tracker
              </div>

              <div
                style={{
                  color: colors.textMuted,
                  marginTop: 3,
                  fontSize: 13,
                }}
              >
                MRD Services • V2
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() =>
              setSettingsOpen((current) => !current)
            }
            style={secondaryButton}
          >
            ⚙️{" "}
            {settingsOpen
              ? "Close Settings"
              : "Settings"}
          </button>
        </header>

        {/* SETTINGS */}

        {settingsOpen && (
          <section
            style={{
              ...cardStyle,
              marginBottom: compact ? 16 : 22,
            }}
          >
            <h2
              style={{
                margin: "0 0 5px",
                fontSize: 21,
              }}
            >
              Customize Your Tracker
            </h2>

            <div
              style={{
                marginBottom: 18,
                color: colors.textMuted,
                fontSize: 13,
              }}
            >
              Appearance preferences are stored on this device.
            </div>

            <SettingsPanel
              settings={settings}
              colors={colors}
              onSettingsChange={setSettings}
              onBackup={handleBackup}
              onRestore={handleRestore}
              onResetSettings={handleResetSettings}
            />
          </section>
        )}

        {/* TASK ENTRY */}

        <section style={cardStyle}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              gap: 16,
              alignItems: "center",
              marginBottom: 18,
              flexWrap: "wrap",
            }}
          >
            <div>
              <h2
                style={{
                  margin: 0,
                  fontSize: 22,
                }}
              >
                New Task
              </h2>

              <div
                style={{
                  marginTop: 5,
                  color: colors.textMuted,
                  fontSize: 13,
                }}
              >
                Enter the task information that will map to Monday.
              </div>
            </div>

            <div
              style={{
                padding: "7px 11px",
                borderRadius: 999,
                background: colors.cardAlt,
                border: `1px solid ${colors.border}`,
                color: colors.accent,
                fontWeight: 800,
                fontSize: 12,
              }}
            >
              {colors.emoji} {colors.name}
            </div>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(auto-fit, minmax(230px, 1fr))",
              gap: 14,
            }}
          >
            <label>
              <div
                style={{
                  fontWeight: 800,
                  fontSize: 13,
                  marginBottom: 7,
                }}
              >
                MRD Project Number
              </div>

              <input
                value={projectNumber}
                onChange={(event) =>
                  setProjectNumber(event.target.value)
                }
                placeholder="Example: 23455"
                style={inputStyle}
              />
            </label>

            <label>
              <div
                style={{
                  fontWeight: 800,
                  fontSize: 13,
                  marginBottom: 7,
                }}
              >
                Item
              </div>

              <input
                value={item}
                onChange={(event) =>
                  setItem(event.target.value)
                }
                placeholder="Example: FEC"
                style={inputStyle}
              />
            </label>
          </div>

          <label
            style={{
              display: "block",
              marginTop: 14,
            }}
          >
            <div
              style={{
                fontWeight: 800,
                fontSize: 13,
                marginBottom: 7,
              }}
            >
              Description
            </div>

            <textarea
              value={description}
              onChange={(event) =>
                setDescription(event.target.value)
              }
              placeholder="Describe the work performed..."
              rows={3}
              style={{
                ...inputStyle,
                resize: "vertical",
                fontFamily: "inherit",
              }}
            />
          </label>

          <div
            style={{
              display: "flex",
              gap: 10,
              flexWrap: "wrap",
              marginTop: 16,
            }}
          >
            <button
              type="button"
              onClick={startTask}
              disabled={activeTask !== null}
              style={{
                ...primaryButton,
                opacity: activeTask ? 0.45 : 1,
                cursor: activeTask
                  ? "not-allowed"
                  : "pointer",
              }}
            >
              ▶ Start Task
            </button>

            <button
              type="button"
              onClick={stopTask}
              disabled={!activeTask}
              style={{
                ...secondaryButton,
                background: activeTask
                  ? colors.danger
                  : colors.cardAlt,
                color: activeTask
                  ? "#ffffff"
                  : colors.text,
                opacity: activeTask ? 1 : 0.45,
                cursor: activeTask
                  ? "pointer"
                  : "not-allowed",
              }}
            >
              ■ Stop
            </button>
          </div>
        </section>

        {/* ACTIVE TIMER */}

        <section
          style={{
            ...cardStyle,
            marginTop: compact ? 14 : 20,
            textAlign: "center",
            position:
              settings.stickyTimer && activeTask
                ? "sticky"
                : "relative",
            top:
              settings.stickyTimer && activeTask
                ? 10
                : undefined,
            zIndex:
              settings.stickyTimer && activeTask
                ? 10
                : undefined,
          }}
        >
          <div
            style={{
              color: colors.textMuted,
              textTransform: "uppercase",
              letterSpacing: 1.4,
              fontSize: 11,
              fontWeight: 900,
            }}
          >
            Current Status
          </div>

          <div
            style={{
              marginTop: 9,
              fontSize: compact ? 22 : 27,
              fontWeight: 900,
            }}
          >
            {activeTask
              ? `${activeTask.item} • ${activeTask.projectNumber}`
              : "No active timer"}
          </div>

          {activeTask && (
            <div
              style={{
                marginTop: 5,
                color: colors.textMuted,
                fontSize: 13,
              }}
            >
              {activeTask.description}
            </div>
          )}

          <div
            style={{
              marginTop: 8,
              fontSize: compact ? 32 : 42,
              fontWeight: 900,
              fontVariantNumeric: "tabular-nums",
              color: colors.accent,
              textShadow:
                settings.theme === "cyberpunk" ||
                settings.theme === "terminal"
                  ? `0 0 18px ${colors.glow}`
                  : "none",
            }}
          >
            {formatTimer(elapsedSeconds)}
          </div>
        </section>

        {/* DASHBOARD */}

        <section
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fit, minmax(240px, 1fr))",
            gap: 14,
            marginTop: compact ? 14 : 20,
          }}
        >
          <div style={cardStyle}>
            <div
              style={{
                color: colors.textMuted,
                fontSize: 12,
                fontWeight: 800,
              }}
            >
              TODAY&apos;S TIME
            </div>

            <div
              style={{
                fontSize: 28,
                fontWeight: 900,
                marginTop: 7,
              }}
            >
              0h 00m
            </div>
          </div>

          <div style={cardStyle}>
            <div
              style={{
                color: colors.textMuted,
                fontSize: 12,
                fontWeight: 800,
              }}
            >
              MONDAY QUANTITY
            </div>

            <div
              style={{
                fontSize: 28,
                fontWeight: 900,
                marginTop: 7,
              }}
            >
              0.0
            </div>
          </div>

          <div style={cardStyle}>
            <div
              style={{
                color: colors.textMuted,
                fontSize: 12,
                fontWeight: 800,
              }}
            >
              ENTRIES TODAY
            </div>

            <div
              style={{
                fontSize: 28,
                fontWeight: 900,
                marginTop: 7,
              }}
            >
              0
            </div>
          </div>
        </section>

        {/* RECENT TASKS */}

        <section
          style={{
            ...cardStyle,
            marginTop: compact ? 14 : 20,
          }}
        >
          <h2
            style={{
              margin: "0 0 6px",
              fontSize: 20,
            }}
          >
            Recent Tasks
          </h2>

          <div
            style={{
              color: colors.textMuted,
              fontSize: 14,
            }}
          >
            Tasks you use frequently will appear here for quick access.
          </div>
        </section>

        {/* HISTORY */}

        <section
          style={{
            ...cardStyle,
            marginTop: compact ? 14 : 20,
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              gap: 15,
              alignItems: "center",
              flexWrap: "wrap",
            }}
          >
            <div>
              <h2
                style={{
                  margin: "0 0 6px",
                  fontSize: 20,
                }}
              >
                Time History
              </h2>

              <div
                style={{
                  color: colors.textMuted,
                  fontSize: 14,
                }}
              >
                Your tracked work will appear here.
              </div>
            </div>

            <button
              type="button"
              style={{
                ...secondaryButton,
                color: colors.accent,
              }}
            >
              Export to Monday
            </button>
          </div>
        </section>
      </div>
    </main>
  );
}