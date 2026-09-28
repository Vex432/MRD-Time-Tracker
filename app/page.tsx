"use client";

import { useEffect, useMemo, useState } from "react";

type Task = {
  project: string;
  desc: string;
};

type ActiveTask = Task & {
  start: string;
};

type Entry = {
  id: number;
  project: string;
  desc: string;
  start: string;
  end: string;
  seconds: number;
  trackedHours: string;
  billedHours: string;
  adjustmentNote: string;
};

type ThemeMode = "light" | "dark";

type ButtonPreset = {
  name: string;
  start: string;
  stop: string;
  export: string;
  edit: string;
  delete: string;
  collapse: string;
};

type ThemeSettings = {
  mode: ThemeMode;
  preset: ButtonPreset;
};

type DayGroup = {
  dateKey: string;
  prettyDate: string;
  entries: Entry[];
  totalTrackedHours: string;
  totalBilledHours: string;
};

const STORAGE_KEY = "time-tracker-data-v10";
const THEME_KEY = "time-tracker-theme-v3";
const DAY_COLLAPSE_KEY = "time-tracker-day-collapse-v3";
const DELETE_AFTER_DAYS = 30;
const WARNING_AT_DAYS = 25;

const BUTTON_PRESETS = {
  Classic: {
    name: "Classic",
    start: "#2563eb",
    stop: "#dc2626",
    export: "#059669",
    edit: "#2563eb",
    delete: "#dc2626",
    collapse: "#7c3aed",
  },
  Ocean: {
    name: "Ocean",
    start: "#0891b2",
    stop: "#1e3a8a",
    export: "#0f766e",
    edit: "#06b6d4",
    delete: "#f97316",
    collapse: "#334155",
  },
  Forest: {
    name: "Forest",
    start: "#166534",
    stop: "#7f1d1d",
    export: "#15803d",
    edit: "#22c55e",
    delete: "#b91c1c",
    collapse: "#3f6212",
  },
  Sunset: {
    name: "Sunset",
    start: "#f97316",
    stop: "#dc2626",
    export: "#eab308",
    edit: "#fb923c",
    delete: "#b91c1c",
    collapse: "#9333ea",
  },
  Midnight: {
    name: "Midnight",
    start: "#3b82f6",
    stop: "#ef4444",
    export: "#10b981",
    edit: "#60a5fa",
    delete: "#f87171",
    collapse: "#8b5cf6",
  },
} as const;

function getSeconds(start: string, end: string) {
  return Math.max(
    0,
    Math.round((new Date(end).getTime() - new Date(start).getTime()) / 1000)
  );
}

function formatTrackedHours(seconds: number) {
  return (seconds / 3600).toFixed(2);
}

function roundSecondsToBilledTenth(seconds: number) {
  if (seconds <= 0) return "0.00";
  const blocks = Math.ceil(seconds / 360);
  return (blocks / 10).toFixed(2);
}

function formatDateOnly(value: string) {
  const d = new Date(value);
  return `${String(d.getMonth() + 1).padStart(2, "0")}/${String(
    d.getDate()
  ).padStart(2, "0")}/${d.getFullYear()}`;
}

function formatPrettyDate(value: string) {
  return new Date(value).toLocaleDateString([], {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function formatDateTime(value: string) {
  return new Date(value).toLocaleString();
}

function formatDuration(seconds: number) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;

  if (h > 0) return `${h}h ${m}m ${s}s`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

function formatMinutes(seconds: number) {
  return (seconds / 60).toFixed(2);
}

function csvEscape(value: string) {
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

function toDateTimeLocalValue(value: string) {
  const d = new Date(value);
  const offset = d.getTimezoneOffset();
  const local = new Date(d.getTime() - offset * 60000);
  return local.toISOString().slice(0, 16);
}

function daysOld(dateIso: string) {
  const diff = Date.now() - new Date(dateIso).getTime();
  return diff / (1000 * 60 * 60 * 24);
}

function isSameTask(a: Task, b: Task) {
  return a.project === b.project && a.desc === b.desc;
}

function getEntryKey(entry: Pick<Entry, "project" | "desc" | "start">) {
  return `${formatDateOnly(entry.start)}__${entry.project}__${entry.desc}`;
}

function getUniqueProjects(entries: Entry[], recentTasks: Task[]) {
  const seen = new Set<string>();
  const projects: string[] = [];

  for (const task of recentTasks) {
    const p = task.project.trim();
    if (p && !seen.has(p)) {
      seen.add(p);
      projects.push(p);
    }
  }

  for (const entry of entries) {
    const p = entry.project.trim();
    if (p && !seen.has(p)) {
      seen.add(p);
      projects.push(p);
    }
  }

  return projects.sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
}

function makeEntryFromActive(active: ActiveTask): Entry {
  const end = new Date().toISOString();
  const seconds = getSeconds(active.start, end);

  return {
    id: Date.now() + Math.floor(Math.random() * 1000),
    project: active.project,
    desc: active.desc,
    start: active.start,
    end,
    seconds,
    trackedHours: formatTrackedHours(seconds),
    billedHours: roundSecondsToBilledTenth(seconds),
    adjustmentNote: "",
  };
}

export default function Home() {
  const [project, setProject] = useState("");
  const [desc, setDesc] = useState("");
  const [active, setActive] = useState<ActiveTask | null>(null);
  const [entries, setEntries] = useState<Entry[]>([]);
  const [recentTasks, setRecentTasks] = useState<Task[]>([]);
  const [now, setNow] = useState(Date.now());
  const [showWarning, setShowWarning] = useState(false);
  const [warningCount, setWarningCount] = useState(0);
  const [filterText, setFilterText] = useState("");
  const [projectSelect, setProjectSelect] = useState("");
  const [collapsedDays, setCollapsedDays] = useState<Record<string, boolean>>({});
  const [theme, setTheme] = useState<ThemeSettings>({
    mode: "light",
    preset: BUTTON_PRESETS.Classic,
  });

  const [editingId, setEditingId] = useState<number | null>(null);
  const [editProject, setEditProject] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [editStart, setEditStart] = useState("");
  const [editEnd, setEditEnd] = useState("");
  const [editNote, setEditNote] = useState("");

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      let loadedEntries: Entry[] = (parsed.entries || []).map((entry: Entry) => ({
        ...entry,
        trackedHours: entry.trackedHours || formatTrackedHours(entry.seconds),
        billedHours: entry.billedHours || roundSecondsToBilledTenth(entry.seconds),
      }));

      const warningEntries = loadedEntries.filter(
        (e) => daysOld(e.end) >= WARNING_AT_DAYS && daysOld(e.end) < DELETE_AFTER_DAYS
      );
      setShowWarning(warningEntries.length > 0);
      setWarningCount(warningEntries.length);

      loadedEntries = loadedEntries.filter((e) => daysOld(e.end) < DELETE_AFTER_DAYS);

      setEntries(
        loadedEntries.sort((a, b) => new Date(b.end).getTime() - new Date(a.end).getTime())
      );
      setActive(parsed.active || null);
      setRecentTasks(parsed.recentTasks || []);
    }

    const savedTheme = localStorage.getItem(THEME_KEY);
    if (savedTheme) {
      try {
        const parsedTheme = JSON.parse(savedTheme);
        setTheme({
          mode: parsedTheme.mode === "dark" ? "dark" : "light",
          preset:
            BUTTON_PRESETS[
              parsedTheme.preset?.name as keyof typeof BUTTON_PRESETS
            ] || BUTTON_PRESETS.Classic,
        });
      } catch {}
    }

    const savedCollapsedDays = localStorage.getItem(DAY_COLLAPSE_KEY);
    if (savedCollapsedDays) {
      try {
        setCollapsedDays(JSON.parse(savedCollapsedDays));
      } catch {}
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ entries, active, recentTasks })
    );
  }, [entries, active, recentTasks]);

  useEffect(() => {
    localStorage.setItem(THEME_KEY, JSON.stringify(theme));
  }, [theme]);

  useEffect(() => {
    localStorage.setItem(DAY_COLLAPSE_KEY, JSON.stringify(collapsedDays));
  }, [collapsedDays]);

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const colors = useMemo(() => {
    const dark = theme.mode === "dark";
    return {
      pageBg: dark ? "#0f172a" : "#f3f4f6",
      cardBg: dark ? "#111827" : "#ffffff",
      cardBorder: dark ? "#334155" : "#d1d5db",
      text: dark ? "#f8fafc" : "#111827",
      muted: dark ? "#94a3b8" : "#6b7280",
      inputBg: dark ? "#0f172a" : "#ffffff",
      inputBorder: dark ? "#475569" : "#cbd5e1",
      tableHead: dark ? "#1e293b" : "#f3f4f6",
      tableBorder: dark ? "#334155" : "#e5e7eb",
      pillBg: dark ? "#1e293b" : "#e5e7eb",
      pillText: dark ? "#f8fafc" : "#111827",
      statusBg: dark ? "#082f49" : "#ecfeff",
      statusBorder: dark ? "#155e75" : "#a5f3fc",
      emptyBg: dark ? "#111827" : "#f9fafb",
      emptyBorder: dark ? "#334155" : "#e5e7eb",
      warningBg: dark ? "#78350f" : "#fef3c7",
      warningBorder: dark ? "#d97706" : "#f59e0b",
      warningText: dark ? "#fef3c7" : "#92400e",
      mutedBtn: dark ? "#475569" : "#6b7280",
    };
  }, [theme]);

  function addRecent(task: Task) {
    setRecentTasks((prev) => {
      const filtered = prev.filter((t) => !isSameTask(t, task));
      return [task, ...filtered].slice(0, 8);
    });
  }

  function upsertEntry(newEntry: Entry) {
    setEntries((prev) => {
      const newKey = getEntryKey(newEntry);
      const existingIndex = prev.findIndex((entry) => getEntryKey(entry) === newKey);

      if (existingIndex === -1) {
        return [newEntry, ...prev].sort(
          (a, b) => new Date(b.end).getTime() - new Date(a.end).getTime()
        );
      }

      const existing = prev[existingIndex];
      const totalSeconds = existing.seconds + newEntry.seconds;
      const merged: Entry = {
        ...existing,
        start:
          new Date(existing.start).getTime() <= new Date(newEntry.start).getTime()
            ? existing.start
            : newEntry.start,
        end:
          new Date(existing.end).getTime() >= new Date(newEntry.end).getTime()
            ? existing.end
            : newEntry.end,
        seconds: totalSeconds,
        trackedHours: formatTrackedHours(totalSeconds),
        billedHours: roundSecondsToBilledTenth(totalSeconds),
      };

      const copy = [...prev];
      copy[existingIndex] = merged;
      return copy.sort((a, b) => new Date(b.end).getTime() - new Date(a.end).getTime());
    });
  }

  function finishActiveTask() {
    if (!active) return;
    upsertEntry(makeEntryFromActive(active));
    setActive(null);
  }

  function startTask() {
    if (!project.trim() || !desc.trim()) return;
    if (active) {
      upsertEntry(makeEntryFromActive(active));
    }

    const task = {
      project: project.trim(),
      desc: desc.trim(),
    };

    setActive({
      ...task,
      start: new Date().toISOString(),
    });
    addRecent(task);
    setProject("");
    setDesc("");
    setProjectSelect("");
  }

  function switchTask(task: Task) {
    if (active && isSameTask(active, task)) return;
    if (active) {
      upsertEntry(makeEntryFromActive(active));
    }

    setActive({
      ...task,
      start: new Date().toISOString(),
    });
    addRecent(task);
  }

  function exportCSV() {
    const rows = entries.map((e) => [
      `${e.project} - ${e.desc}`,
      e.project,
      e.billedHours,
      e.desc,
    ]);

    const csv = [["Item", "MRD Project Number", "Quantity", "Description"], ...rows]
      .map((r) => r.map((c) => csvEscape(String(c))).join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `monday-export-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function startEdit(entry: Entry) {
    setEditingId(entry.id);
    setEditProject(entry.project);
    setEditDesc(entry.desc);
    setEditStart(toDateTimeLocalValue(entry.start));
    setEditEnd(toDateTimeLocalValue(entry.end));
    setEditNote(entry.adjustmentNote || "");
  }

  function cancelEdit() {
    setEditingId(null);
    setEditProject("");
    setEditDesc("");
    setEditStart("");
    setEditEnd("");
    setEditNote("");
  }

  function saveEdit(id: number) {
    if (!editProject.trim() || !editDesc.trim() || !editStart || !editEnd) return;

    const startIso = new Date(editStart).toISOString();
    const endIso = new Date(editEnd).toISOString();

    if (new Date(endIso).getTime() <= new Date(startIso).getTime()) {
      alert("End time must be after start time.");
      return;
    }

    const seconds = getSeconds(startIso, endIso);

    setEntries((prev) =>
      prev
        .map((entry) =>
          entry.id === id
            ? {
                ...entry,
                project: editProject.trim(),
                desc: editDesc.trim(),
                start: startIso,
                end: endIso,
                seconds,
                trackedHours: formatTrackedHours(seconds),
                billedHours: roundSecondsToBilledTenth(seconds),
                adjustmentNote: editNote.trim(),
              }
            : entry
        )
        .sort((a, b) => new Date(b.end).getTime() - new Date(a.end).getTime())
    );

    addRecent({ project: editProject.trim(), desc: editDesc.trim() });
    cancelEdit();
  }

  function deleteEntry(id: number) {
    const confirmed = window.confirm("Delete this entry?");
    if (!confirmed) return;
    if (editingId === id) cancelEdit();
    setEntries((prev) => prev.filter((entry) => entry.id !== id));
  }

  function deleteDay(dateKey: string) {
    const confirmed = window.confirm(`Delete all entries for ${dateKey}?`);
    if (!confirmed) return;
    setEntries((prev) => prev.filter((entry) => formatDateOnly(entry.start) !== dateKey));
  }

  function toggleDay(dateKey: string) {
    setCollapsedDays((prev) => ({
      ...prev,
      [dateKey]: !prev[dateKey],
    }));
  }

  const totalTrackedHours = useMemo(() => {
    return entries.reduce((sum, e) => sum + Number(e.trackedHours), 0).toFixed(2);
  }, [entries]);

  const totalBilledHours = useMemo(() => {
    return entries.reduce((sum, e) => sum + Number(e.billedHours), 0).toFixed(2);
  }, [entries]);

  const runningSeconds = active
    ? getSeconds(active.start, new Date(now).toISOString())
    : 0;

  const runningTrackedHours = formatTrackedHours(runningSeconds);
  const runningBilledHours = roundSecondsToBilledTenth(runningSeconds);

  const uniqueProjects = useMemo(() => {
    return getUniqueProjects(entries, recentTasks);
  }, [entries, recentTasks]);

  const filteredEntries = useMemo(() => {
    const q = filterText.trim().toLowerCase();
    if (!q) return entries;

    return entries.filter((entry) => {
      const haystack = [
        entry.project,
        entry.desc,
        entry.adjustmentNote,
        formatDateOnly(entry.start),
      ]
        .join(" ")
        .toLowerCase();

      return haystack.includes(q);
    });
  }, [entries, filterText]);

  const groupedEntries = useMemo<DayGroup[]>(() => {
    const groups = new Map<string, Entry[]>();

    for (const entry of filteredEntries) {
      const key = formatDateOnly(entry.start);
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(entry);
    }

    return Array.from(groups.entries())
      .map(([dateKey, groupEntries]) => ({
        dateKey,
        prettyDate: formatPrettyDate(groupEntries[0].start),
        entries: groupEntries.sort(
          (a, b) => new Date(b.end).getTime() - new Date(a.end).getTime()
        ),
        totalTrackedHours: groupEntries
          .reduce((sum, entry) => sum + Number(entry.trackedHours), 0)
          .toFixed(2),
        totalBilledHours: groupEntries
          .reduce((sum, entry) => sum + Number(entry.billedHours), 0)
          .toFixed(2),
      }))
      .sort((a, b) => new Date(b.dateKey).getTime() - new Date(a.dateKey).getTime());
  }, [filteredEntries]);

  const pageStyle: React.CSSProperties = {
    minHeight: "100vh",
    background: colors.pageBg,
    padding: "32px 20px",
    fontFamily: "Arial, sans-serif",
    color: colors.text,
  };

  const cardStyle: React.CSSProperties = {
    background: colors.cardBg,
    border: `1px solid ${colors.cardBorder}`,
    borderRadius: "14px",
    padding: "20px",
    marginBottom: "20px",
    boxShadow:
      theme.mode === "dark"
        ? "0 1px 3px rgba(0,0,0,0.35)"
        : "0 1px 3px rgba(0,0,0,0.06)",
  };

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "14px",
    fontSize: "16px",
    borderRadius: "10px",
    border: `1px solid ${colors.inputBorder}`,
    outline: "none",
    background: colors.inputBg,
    color: colors.text,
  };

  const buttonBase: React.CSSProperties = {
    border: "none",
    borderRadius: "10px",
    padding: "12px 18px",
    color: "white",
    fontSize: "15px",
    cursor: "pointer",
    fontWeight: 600,
  };

  const thStyle: React.CSSProperties = {
    textAlign: "left",
    background: colors.tableHead,
    padding: "12px",
    borderBottom: `1px solid ${colors.cardBorder}`,
    color: colors.text,
  };

  const tdStyle: React.CSSProperties = {
    padding: "12px",
    borderBottom: `1px solid ${colors.tableBorder}`,
    color: colors.text,
    verticalAlign: "top",
  };

  return (
    <main style={pageStyle}>
      <div style={{ maxWidth: "1280px", margin: "0 auto" }}>
        {showWarning && (
          <div
            style={{
              background: colors.warningBg,
              color: colors.warningText,
              border: `1px solid ${colors.warningBorder}`,
              borderRadius: 12,
              padding: 14,
              marginBottom: 18,
              fontWeight: 600,
            }}
          >
            ⚠️ {warningCount} entr{warningCount === 1 ? "y is" : "ies are"} older than {WARNING_AT_DAYS} days and will be deleted at {DELETE_AFTER_DAYS} days.
          </div>
        )}

        <div style={{ marginBottom: 24 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
            <img
              src="/logo.png"
              alt="MRD Logo"
              style={{ height: 44, width: "auto", objectFit: "contain" }}
            />
            <h1 style={{ fontSize: 36, margin: 0, color: colors.text }}>Time Tracker</h1>
          </div>
          <p style={{ margin: 0, color: colors.muted, fontSize: 16 }}>
            One active timer, compiled task totals, quick switching, edit support, filtering, collapsible days, and Monday-ready export.
          </p>
        </div>

        <section style={cardStyle}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              gap: 16,
              flexWrap: "wrap",
              alignItems: "flex-start",
            }}
          >
            <div style={{ flex: 1, minWidth: 320 }}>
              <h2 style={{ fontSize: 24, margin: "0 0 16px 0", color: colors.text }}>
                Task Entry
              </h2>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 2fr",
                  gap: 12,
                  marginBottom: 12,
                }}
              >
                <select
                  value={projectSelect}
                  onChange={(e) => {
                    const value = e.target.value;
                    setProjectSelect(value);
                    if (value) setProject(value);
                  }}
                  style={inputStyle}
                >
                  <option value="">Previous project numbers</option>
                  {uniqueProjects.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>

                <div />

                <input
                  placeholder="MRD Project Number"
                  value={project}
                  onChange={(e) => setProject(e.target.value)}
                  style={inputStyle}
                />
                <input
                  placeholder="Description"
                  value={desc}
                  onChange={(e) => setDesc(e.target.value)}
                  style={inputStyle}
                />
              </div>

              <div
                style={{
                  display: "flex",
                  gap: 12,
                  flexWrap: "wrap",
                  marginBottom: 18,
                }}
              >
                <button onClick={startTask} style={{ ...buttonBase, background: theme.preset.start }}>
                  Start
                </button>
                <button onClick={finishActiveTask} style={{ ...buttonBase, background: theme.preset.stop }}>
                  Stop
                </button>
                <button onClick={exportCSV} style={{ ...buttonBase, background: theme.preset.export }}>
                  Export Monday CSV
                </button>
              </div>

              <div>
                <div style={{ fontWeight: 700, marginBottom: 10, color: colors.text }}>
                  Switch Projects
                </div>
                <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                  {recentTasks.length === 0 ? (
                    <span style={{ color: colors.muted }}>No projects to switch to yet.</span>
                  ) : (
                    recentTasks.map((t, i) => (
                      <div
                        key={`${t.project}-${t.desc}-${i}`}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          background: colors.pillBg,
                          border: `1px solid ${colors.inputBorder}`,
                          borderRadius: 999,
                          padding: "8px 10px",
                          gap: 8,
                        }}
                      >
                        <button
                          onClick={() => switchTask(t)}
                          style={{
                            background: "transparent",
                            border: "none",
                            cursor: "pointer",
                            fontSize: 14,
                            color: colors.pillText,
                          }}
                        >
                          {t.project} | {t.desc}
                        </button>
                        <button
                          onClick={() =>
                            setRecentTasks((prev) => prev.filter((_, idx) => idx !== i))
                          }
                          style={{
                            background: theme.preset.delete,
                            color: "white",
                            border: "none",
                            borderRadius: "50%",
                            width: 22,
                            height: 22,
                            cursor: "pointer",
                            fontSize: 14,
                            lineHeight: "22px",
                            textAlign: "center",
                            padding: 0,
                          }}
                          title="Remove project"
                        >
                          ×
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            <div style={{ width: 320, maxWidth: "100%" }}>
              <h2 style={{ fontSize: 24, margin: "0 0 16px 0", color: colors.text }}>
                Appearance
              </h2>

              <div style={{ marginBottom: 16 }}>
                <div style={{ marginBottom: 8, fontWeight: 700, color: colors.text }}>Theme</div>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  <button
                    onClick={() => setTheme((prev) => ({ ...prev, mode: "light" }))}
                    style={{
                      ...buttonBase,
                      background: theme.mode === "light" ? theme.preset.start : colors.mutedBtn,
                      padding: "10px 14px",
                    }}
                  >
                    Light
                  </button>
                  <button
                    onClick={() => setTheme((prev) => ({ ...prev, mode: "dark" }))}
                    style={{
                      ...buttonBase,
                      background: theme.mode === "dark" ? theme.preset.start : colors.mutedBtn,
                      padding: "10px 14px",
                    }}
                  >
                    Dark
                  </button>
                </div>
              </div>

              <div>
                <div style={{ marginBottom: 8, fontWeight: 700, color: colors.text }}>
                  Button Style
                </div>
                <select
                  value={theme.preset.name}
                  onChange={(e) =>
                    setTheme((prev) => ({
                      ...prev,
                      preset: BUTTON_PRESETS[e.target.value as keyof typeof BUTTON_PRESETS],
                    }))
                  }
                  style={inputStyle}
                >
                  {Object.keys(BUTTON_PRESETS).map((name) => (
                    <option key={name} value={name}>
                      {name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </section>

        <section style={cardStyle}>
          <h2 style={{ fontSize: 24, margin: "0 0 16px 0", color: colors.text }}>
            Current Status
          </h2>

          {active ? (
            <div
              style={{
                background: colors.statusBg,
                border: `1px solid ${colors.statusBorder}`,
                borderRadius: 10,
                padding: 14,
                lineHeight: 1.8,
                color: colors.text,
              }}
            >
              <div><strong>Project:</strong> {active.project}</div>
              <div><strong>Description:</strong> {active.desc}</div>
              <div><strong>Started:</strong> {formatDateTime(active.start)}</div>
              <div><strong>Running:</strong> {formatDuration(runningSeconds)}</div>
              <div><strong>Running Minutes:</strong> {formatMinutes(runningSeconds)}</div>
              <div><strong>Tracked Hours:</strong> {runningTrackedHours}</div>
              <div><strong>Billed Hours:</strong> {runningBilledHours}</div>
            </div>
          ) : (
            <div
              style={{
                background: colors.emptyBg,
                border: `1px solid ${colors.emptyBorder}`,
                borderRadius: 10,
                padding: 14,
                color: colors.muted,
              }}
            >
              No active timer running.
            </div>
          )}
        </section>

        <section style={cardStyle}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: 12,
              flexWrap: "wrap",
              marginBottom: 14,
            }}
          >
            <h2 style={{ fontSize: 24, margin: 0, color: colors.text }}>Entries</h2>
            <div style={{ display: "flex", gap: 16, flexWrap: "wrap", fontWeight: 700, color: colors.text }}>
              <span>Total Tracked Hours: {totalTrackedHours}</span>
              <span>Total Billed Hours: {totalBilledHours}</span>
            </div>
          </div>

          <div style={{ marginBottom: 16 }}>
            <input
              placeholder="Filter by project, description, note, or date"
              value={filterText}
              onChange={(e) => setFilterText(e.target.value)}
              style={inputStyle}
            />
          </div>

          {groupedEntries.length === 0 ? (
            <div
              style={{
                padding: "18px 12px",
                color: colors.muted,
                textAlign: "center",
              }}
            >
              No entries found.
            </div>
          ) : (
            groupedEntries.map((group) => {
              const isCollapsed = !!collapsedDays[group.dateKey];

              return (
                <div key={group.dateKey} style={{ marginBottom: 24 }}>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      gap: 12,
                      flexWrap: "wrap",
                      marginBottom: 10,
                    }}
                  >
                    <div style={{ fontWeight: 700, fontSize: 18, color: colors.text }}>
                      {group.prettyDate}
                    </div>
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
                      <div style={{ fontWeight: 700, color: colors.text }}>
                        Tracked: {group.totalTrackedHours} | Billed: {group.totalBilledHours}
                      </div>
                      <button
                        onClick={() => toggleDay(group.dateKey)}
                        style={{
                          ...buttonBase,
                          background: theme.preset.collapse,
                          padding: "8px 12px",
                        }}
                      >
                        {isCollapsed ? "Expand" : "Collapse"}
                      </button>
                      <button
                        onClick={() => deleteDay(group.dateKey)}
                        style={{
                          ...buttonBase,
                          background: theme.preset.delete,
                          padding: "8px 12px",
                        }}
                      >
                        Delete Day
                      </button>
                    </div>
                  </div>

                  {!isCollapsed && (
                    <div style={{ overflowX: "auto" }}>
                      <table
                        style={{ width: "100%", borderCollapse: "collapse", minWidth: "1250px" }}
                      >
                        <thead>
                          <tr>
                            <th style={thStyle}>Project</th>
                            <th style={thStyle}>Description</th>
                            <th style={thStyle}>Start</th>
                            <th style={thStyle}>End</th>
                            <th style={thStyle}>Duration</th>
                            <th style={thStyle}>Minutes</th>
                            <th style={thStyle}>Tracked Hours</th>
                            <th style={thStyle}>Billed Hours</th>
                            <th style={thStyle}>Adjustment Note</th>
                            <th style={thStyle}>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {group.entries.map((entry) => {
                            const isEditing = editingId === entry.id;

                            if (isEditing) {
                              return (
                                <tr key={entry.id}>
                                  <td style={tdStyle}>
                                    <input
                                      value={editProject}
                                      onChange={(ev) => setEditProject(ev.target.value)}
                                      style={{ ...inputStyle, padding: "8px 10px", fontSize: 14 }}
                                    />
                                  </td>
                                  <td style={tdStyle}>
                                    <input
                                      value={editDesc}
                                      onChange={(ev) => setEditDesc(ev.target.value)}
                                      style={{ ...inputStyle, padding: "8px 10px", fontSize: 14 }}
                                    />
                                  </td>
                                  <td style={tdStyle}>
                                    <input
                                      type="datetime-local"
                                      value={editStart}
                                      onChange={(ev) => setEditStart(ev.target.value)}
                                      style={{ ...inputStyle, padding: "8px 10px", fontSize: 14 }}
                                    />
                                  </td>
                                  <td style={tdStyle}>
                                    <input
                                      type="datetime-local"
                                      value={editEnd}
                                      onChange={(ev) => setEditEnd(ev.target.value)}
                                      style={{ ...inputStyle, padding: "8px 10px", fontSize: 14 }}
                                    />
                                  </td>
                                  <td style={tdStyle}>Auto</td>
                                  <td style={tdStyle}>Auto</td>
                                  <td style={tdStyle}>Auto</td>
                                  <td style={tdStyle}>Auto</td>
                                  <td style={tdStyle}>
                                    <input
                                      value={editNote}
                                      onChange={(ev) => setEditNote(ev.target.value)}
                                      placeholder="Optional note"
                                      style={{ ...inputStyle, padding: "8px 10px", fontSize: 14 }}
                                    />
                                  </td>
                                  <td style={tdStyle}>
                                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                                      <button
                                        onClick={() => saveEdit(entry.id)}
                                        style={{ ...buttonBase, background: theme.preset.edit, padding: "8px 12px" }}
                                      >
                                        Save
                                      </button>
                                      <button
                                        onClick={cancelEdit}
                                        style={{ ...buttonBase, background: colors.mutedBtn, padding: "8px 12px" }}
                                      >
                                        Cancel
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              );
                            }

                            return (
                              <tr key={entry.id}>
                                <td style={tdStyle}>{entry.project}</td>
                                <td style={tdStyle}>{entry.desc}</td>
                                <td style={tdStyle}>{formatDateTime(entry.start)}</td>
                                <td style={tdStyle}>{formatDateTime(entry.end)}</td>
                                <td style={tdStyle}>{formatDuration(entry.seconds)}</td>
                                <td style={tdStyle}>{formatMinutes(entry.seconds)}</td>
                                <td style={tdStyle}>{entry.trackedHours}</td>
                                <td style={tdStyle}>{entry.billedHours}</td>
                                <td style={tdStyle}>{entry.adjustmentNote || "—"}</td>
                                <td style={tdStyle}>
                                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                                    <button
                                      onClick={() => startEdit(entry)}
                                      style={{ ...buttonBase, background: theme.preset.edit, padding: "8px 12px" }}
                                    >
                                      Edit
                                    </button>
                                    <button
                                      onClick={() => deleteEntry(entry.id)}
                                      style={{ ...buttonBase, background: theme.preset.delete, padding: "8px 12px" }}
                                    >
                                      Delete
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </section>
      </div>
    </main>
  );
}
