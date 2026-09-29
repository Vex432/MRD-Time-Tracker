"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from "react";

import SettingsPanel from "../components/SettingsPanel";
import EditEntryModal from "../components/EditEntryModal";
import { themes } from "../lib/themes";
import {
  DEFAULT_SETTINGS,
  loadSettings,
  saveSettings,
} from "../lib/storage";

import type {
  ActiveTask,
  RecentTask,
  TimeEntry,
  TrackerBackup,
  TrackerSettings,
} from "../types/tracker";

/* =========================================================
   STORAGE
========================================================= */

const STORAGE = {
  entries: "mrd-v2-entries",
  active: "mrd-v2-active-task",
  recent: "mrd-v2-recent-tasks",
};

const RETENTION_DAYS = 30;
const WARNING_DAYS = 25;

/* =========================================================
   HELPERS
========================================================= */

function makeId() {
  return `${Date.now()}-${Math.random()
    .toString(16)
    .slice(2)}`;
}

function secondsBetween(start: number, end: number) {
  return Math.max(
    0,
    Math.floor((end - start) / 1000)
  );
}

function quantityFromSeconds(seconds: number) {
  if (seconds <= 0) return 0;

  // Round UP to next 0.1 hour.
  return Math.ceil(seconds / 360) / 10;
}

function taskKey(
  projectNumber: string,
  item: string,
  description: string
) {
  return `${projectNumber
    .trim()
    .toLowerCase()}||${item
    .trim()
    .toLowerCase()}||${description
    .trim()
    .toLowerCase()}`;
}

function dateKey(timestamp: number) {
  const date = new Date(timestamp);

  const year = date.getFullYear();
  const month = String(
    date.getMonth() + 1
  ).padStart(2, "0");
  const day = String(
    date.getDate()
  ).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function dateLabel(timestamp: number) {
  return new Date(timestamp).toLocaleDateString(
    undefined,
    {
      weekday: "long",
      month: "short",
      day: "numeric",
      year: "numeric",
    }
  );
}

function timeLabel(timestamp: number) {
  return new Date(timestamp).toLocaleTimeString(
    [],
    {
      hour: "numeric",
      minute: "2-digit",
    }
  );
}

function csvEscape(value: string | number) {
  const text = String(value ?? "");

  if (
    text.includes(",") ||
    text.includes('"') ||
    text.includes("\n")
  ) {
    return `"${text.replace(/"/g, '""')}"`;
  }

  return text;
}

function loadJSON<T>(
  key: string,
  fallback: T
): T {
  if (typeof window === "undefined") {
    return fallback;
  }

  try {
    const raw = localStorage.getItem(key);

    if (!raw) {
      return fallback;
    }

    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

/* =========================================================
   MAIN
========================================================= */

export default function Home() {
  /* -------------------------
     SETTINGS
  ------------------------- */

  const [settings, setSettings] =
    useState<TrackerSettings>(
      DEFAULT_SETTINGS
    );

  const [settingsOpen, setSettingsOpen] =
    useState(false);

  /* -------------------------
     TASK FORM
  ------------------------- */

  const [
    projectNumber,
    setProjectNumber,
  ] = useState("");

  const [item, setItem] = useState("");

  const [
    description,
    setDescription,
  ] = useState("");

  /* -------------------------
     TRACKER DATA
  ------------------------- */

  const [entries, setEntries] = useState<
    TimeEntry[]
  >([]);

  const [
    recentTasks,
    setRecentTasks,
  ] = useState<RecentTask[]>([]);

  const [
    activeTask,
    setActiveTask,
  ] = useState<ActiveTask | null>(
    null
  );

  const [
    elapsedSeconds,
    setElapsedSeconds,
  ] = useState(0);

  const [loaded, setLoaded] =
    useState(false);

  /* -------------------------
     HISTORY
  ------------------------- */

  const [
    collapsedDays,
    setCollapsedDays,
  ] = useState<
    Record<string, boolean>
  >({});

  const [search, setSearch] =
    useState("");

  /* -------------------------
     EDITOR
  ------------------------- */

  const [
    editingEntry,
    setEditingEntry,
  ] = useState<TimeEntry | null>(
    null
  );

  /* -------------------------
     RESTORE
  ------------------------- */

  const restoreInputRef =
    useRef<HTMLInputElement | null>(
      null
    );

  /* =========================================================
     THEME
  ========================================================= */

  const colors = useMemo(
    () => themes[settings.theme],
    [settings.theme]
  );

  const compact =
    settings.density === "compact";

  /* =========================================================
     INITIAL LOAD
  ========================================================= */

  useEffect(() => {
    const savedSettings =
      loadSettings();

    let savedEntries =
      loadJSON<TimeEntry[]>(
        STORAGE.entries,
        []
      );

    const savedActive =
      loadJSON<ActiveTask | null>(
        STORAGE.active,
        null
      );

    let savedRecent =
      loadJSON<RecentTask[]>(
        STORAGE.recent,
        []
      );

    savedRecent = savedRecent.map(
      (task) => ({
        ...task,
        pinned:
          task.pinned ?? false,
      })
    );

    const cutoff =
      Date.now() -
      RETENTION_DAYS *
        24 *
        60 *
        60 *
        1000;

    savedEntries =
      savedEntries.filter(
        (entry) =>
          entry.end >= cutoff
      );

    setSettings(savedSettings);
    setEntries(savedEntries);
    setActiveTask(savedActive);
    setRecentTasks(savedRecent);

    setLoaded(true);
  }, []);

  /* =========================================================
     PERSIST DATA
  ========================================================= */

  useEffect(() => {
    if (!loaded) return;

    localStorage.setItem(
      STORAGE.entries,
      JSON.stringify(entries)
    );
  }, [entries, loaded]);

  useEffect(() => {
    if (!loaded) return;

    localStorage.setItem(
      STORAGE.recent,
      JSON.stringify(recentTasks)
    );
  }, [recentTasks, loaded]);

  useEffect(() => {
    if (!loaded) return;

    if (activeTask) {
      localStorage.setItem(
        STORAGE.active,
        JSON.stringify(activeTask)
      );
    } else {
      localStorage.removeItem(
        STORAGE.active
      );
    }
  }, [activeTask, loaded]);

  useEffect(() => {
    if (!loaded) return;

    saveSettings(settings);
  }, [settings, loaded]);

  /* =========================================================
     LIVE TIMER
  ========================================================= */

  useEffect(() => {
    if (!activeTask) {
      setElapsedSeconds(0);
      return;
    }

    function updateTimer() {
      if (!activeTask) return;

      setElapsedSeconds(
        Math.max(
          0,
          Math.floor(
            (Date.now() -
              activeTask.start) /
              1000
          )
        )
      );
    }

    updateTimer();

    const interval =
      window.setInterval(
        updateTimer,
        1000
      );

    return () =>
      window.clearInterval(
        interval
      );
  }, [activeTask]);

  /* =========================================================
     TIME FORMAT
  ========================================================= */

  function formatDuration(
    seconds: number
  ) {
    const hours = Math.floor(
      seconds / 3600
    );

    const minutes = Math.floor(
      (seconds % 3600) / 60
    );

    const secs =
      seconds % 60;

    if (
      settings.timerDisplay ===
      "hours-minutes"
    ) {
      if (settings.showSeconds) {
        return `${hours}h ${minutes}m ${secs}s`;
      }

      return `${hours}h ${minutes}m`;
    }

    const values = [
      hours,
      minutes,
    ];

    if (settings.showSeconds) {
      values.push(secs);
    }

    return values
      .map((value) =>
        String(value).padStart(
          2,
          "0"
        )
      )
      .join(":");
  }

  /* =========================================================
     RECENT TASKS
  ========================================================= */

  function rememberTask(task: {
    projectNumber: string;
    item: string;
    description: string;
  }) {
    const key = taskKey(
      task.projectNumber,
      task.item,
      task.description
    );

    setRecentTasks(
      (previous) => {
        const existing =
          previous.find(
            (recent) =>
              taskKey(
                recent.projectNumber,
                recent.item,
                recent.description
              ) === key
          );

        const updated: RecentTask =
          {
            projectNumber:
              task.projectNumber,

            item: task.item,

            description:
              task.description,

            lastUsed:
              Date.now(),

            pinned:
              existing?.pinned ??
              false,
          };

        const remaining =
          previous.filter(
            (recent) =>
              taskKey(
                recent.projectNumber,
                recent.item,
                recent.description
              ) !== key
          );

        return [
          updated,
          ...remaining,
        ].slice(0, 30);
      }
    );
  }

  function togglePin(
    task: RecentTask
  ) {
    const key = taskKey(
      task.projectNumber,
      task.item,
      task.description
    );

    setRecentTasks(
      (previous) =>
        previous.map(
          (recent) =>
            taskKey(
              recent.projectNumber,
              recent.item,
              recent.description
            ) === key
              ? {
                  ...recent,
                  pinned:
                    !recent.pinned,
                }
              : recent
        )
    );
  }

  function removeRecentTask(
    task: RecentTask
  ) {
    const key = taskKey(
      task.projectNumber,
      task.item,
      task.description
    );

    setRecentTasks(
      (previous) =>
        previous.filter(
          (recent) =>
            taskKey(
              recent.projectNumber,
              recent.item,
              recent.description
            ) !== key
        )
    );
  }

  /* =========================================================
     FINISH ACTIVE SEGMENT
  ========================================================= */

  function finishActiveTask(
    end = Date.now()
  ) {
    if (!activeTask) {
      return null;
    }

    const finalEnd = Math.max(
      end,
      activeTask.start
    );

    const entry: TimeEntry = {
      id: makeId(),

      projectNumber:
        activeTask.projectNumber,

      item: activeTask.item,

      description:
        activeTask.description,

      start:
        activeTask.start,

      end: finalEnd,
    };

    setEntries((previous) => [
      entry,
      ...previous,
    ]);

    rememberTask(activeTask);

    return entry;
  }

  /* =========================================================
     VALIDATION
  ========================================================= */

  function validateTask(
    project: string,
    taskItem: string,
    taskDescription: string
  ) {
    if (!project.trim()) {
      alert(
        "Enter an MRD Project Number."
      );
      return false;
    }

    if (!taskItem.trim()) {
      alert("Enter an Item.");
      return false;
    }

    if (!taskDescription.trim()) {
      alert(
        "Enter a Description."
      );
      return false;
    }

    return true;
  }

  /* =========================================================
     START
  ========================================================= */

  function startTask() {
    const project =
      projectNumber.trim();

    const taskItem =
      item.trim();

    const taskDescription =
      description.trim();

    if (
      !validateTask(
        project,
        taskItem,
        taskDescription
      )
    ) {
      return;
    }

    if (activeTask) {
      switchToTask({
        projectNumber: project,
        item: taskItem,
        description:
          taskDescription,
      });

      return;
    }

    const newTask: ActiveTask =
      {
        projectNumber: project,
        item: taskItem,
        description:
          taskDescription,
        start: Date.now(),
      };

    setActiveTask(newTask);

    rememberTask(newTask);
  }

  /* =========================================================
     STOP
  ========================================================= */

  function stopTask() {
    if (!activeTask) return;

    finishActiveTask();

    setActiveTask(null);
  }

  /* =========================================================
     SWITCH TASK
  ========================================================= */

  function switchToTask(task: {
    projectNumber: string;
    item: string;
    description: string;
  }) {
    const now = Date.now();

    if (activeTask) {
      const currentKey =
        taskKey(
          activeTask.projectNumber,
          activeTask.item,
          activeTask.description
        );

      const nextKey = taskKey(
        task.projectNumber,
        task.item,
        task.description
      );

      if (
        currentKey === nextKey
      ) {
        return;
      }

      finishActiveTask(now);
    }

    const nextTask: ActiveTask =
      {
        projectNumber:
          task.projectNumber,

        item: task.item,

        description:
          task.description,

        start: now,
      };

    setActiveTask(nextTask);

    setProjectNumber(
      task.projectNumber
    );

    setItem(task.item);

    setDescription(
      task.description
    );

    rememberTask(nextTask);
  }

  /* =========================================================
     DELETE ENTRY
  ========================================================= */

  function deleteEntry(
    entry: TimeEntry
  ) {
    const seconds =
      secondsBetween(
        entry.start,
        entry.end
      );

    const confirmed =
      window.confirm(
        `Delete this entry?\n\n${entry.item} • ${entry.projectNumber}\n${formatDuration(
          seconds
        )}`
      );

    if (!confirmed) return;

    setEntries(
      (previous) =>
        previous.filter(
          (current) =>
            current.id !==
            entry.id
        )
    );
  }

  /* =========================================================
     EDIT ENTRY
  ========================================================= */

  function editEntry(
    entry: TimeEntry
  ) {
    setEditingEntry(entry);
  }

  function saveEditedEntry(
    updatedEntry: TimeEntry
  ) {
    setEntries(
      (previous) =>
        previous.map(
          (entry) =>
            entry.id ===
            updatedEntry.id
              ? updatedEntry
              : entry
        )
    );

    rememberTask({
      projectNumber:
        updatedEntry.projectNumber,

      item:
        updatedEntry.item,

      description:
        updatedEntry.description,
    });

    setEditingEntry(null);
  }

  /* =========================================================
     TODAY
  ========================================================= */

  const todayKey =
    dateKey(Date.now());

  const todayEntries =
    useMemo(
      () =>
        entries.filter(
          (entry) =>
            dateKey(
              entry.start
            ) === todayKey
        ),
      [entries, todayKey]
    );

  const todaySavedSeconds =
    useMemo(
      () =>
        todayEntries.reduce(
          (total, entry) =>
            total +
            secondsBetween(
              entry.start,
              entry.end
            ),
          0
        ),
      [todayEntries]
    );

  const todayTotalSeconds =
    todaySavedSeconds +
    (activeTask
      ? elapsedSeconds
      : 0);

  const mondayQuantity =
    quantityFromSeconds(
      todayTotalSeconds
    );

  /* =========================================================
     SORT RECENT
  ========================================================= */

  const sortedRecentTasks =
    useMemo(() => {
      return [
        ...recentTasks,
      ].sort((a, b) => {
        if (
          a.pinned !==
          b.pinned
        ) {
          return a.pinned
            ? -1
            : 1;
        }

        return (
          b.lastUsed -
          a.lastUsed
        );
      });
    }, [recentTasks]);

  /* =========================================================
     FILTER HISTORY
  ========================================================= */

  const filteredEntries =
    useMemo(() => {
      const query =
        search
          .trim()
          .toLowerCase();

      if (!query) {
        return entries;
      }

      return entries.filter(
        (entry) =>
          entry.projectNumber
            .toLowerCase()
            .includes(query) ||
          entry.item
            .toLowerCase()
            .includes(query) ||
          entry.description
            .toLowerCase()
            .includes(query)
      );
    }, [entries, search]);

  /* =========================================================
     GROUP HISTORY
  ========================================================= */

  const groupedDays =
    useMemo(() => {
      const groups = new Map<
        string,
        TimeEntry[]
      >();

      [
        ...filteredEntries,
      ]
        .sort(
          (a, b) =>
            b.start -
            a.start
        )
        .forEach((entry) => {
          const key =
            dateKey(
              entry.start
            );

          if (
            !groups.has(key)
          ) {
            groups.set(
              key,
              []
            );
          }

          groups
            .get(key)!
            .push(entry);
        });

      return Array.from(
        groups.entries()
      );
    }, [filteredEntries]);

  /* =========================================================
     RETENTION WARNING
  ========================================================= */

  const oldestEntryAge =
    useMemo(() => {
      if (
        entries.length === 0
      ) {
        return 0;
      }

      const oldest = Math.min(
        ...entries.map(
          (entry) =>
            entry.end
        )
      );

      return Math.floor(
        (Date.now() -
          oldest) /
          (24 *
            60 *
            60 *
            1000)
      );
    }, [entries]);

  /* =========================================================
     EXPORT MONDAY CSV
  ========================================================= */

  function exportMondayCSV() {
    if (
      entries.length === 0
    ) {
      alert(
        "There are no saved entries to export."
      );
      return;
    }

    const groups = new Map<
      string,
      {
        projectNumber: string;
        item: string;
        description: string;
        date: string;
        seconds: number;
      }
    >();

    entries.forEach(
      (entry) => {
        const day =
          dateKey(
            entry.start
          );

        const key = `${day}||${taskKey(
          entry.projectNumber,
          entry.item,
          entry.description
        )}`;

        const existing =
          groups.get(key);

        const seconds =
          secondsBetween(
            entry.start,
            entry.end
          );

        if (existing) {
          existing.seconds +=
            seconds;
        } else {
          groups.set(key, {
            projectNumber:
              entry.projectNumber,

            item:
              entry.item,

            description:
              entry.description,

            date: day,

            seconds,
          });
        }
      }
    );

    const header = [
      "Item",
      "MRD Project Number",
      "Quantity of time",
      "Description",
    ];

    const rows =
      Array.from(
        groups.values()
      )
        .sort((a, b) =>
          b.date.localeCompare(
            a.date
          )
        )
        .map((group) => [
          group.item,
          group.projectNumber,
          quantityFromSeconds(
            group.seconds
          ).toFixed(1),
          group.description,
        ]);

    const csv = [
      header
        .map(csvEscape)
        .join(","),

      ...rows.map((row) =>
        row
          .map(csvEscape)
          .join(",")
      ),
    ].join("\n");

    const blob =
      new Blob([csv], {
        type: "text/csv;charset=utf-8;",
      });

    const url =
      URL.createObjectURL(
        blob
      );

    const link =
      document.createElement(
        "a"
      );

    link.href = url;

    link.download =
      `MRD-Monday-Time-${dateKey(
        Date.now()
      )}.csv`;

    document.body.appendChild(
      link
    );

    link.click();
    link.remove();

    URL.revokeObjectURL(
      url
    );
  }

  /* =========================================================
     BACKUP
  ========================================================= */

  function handleBackup() {
    const backup: TrackerBackup =
      {
        version: 2,

        exportedAt:
          Date.now(),

        entries,

        recentTasks,

        settings,

        activeTask,
      };

    const blob =
      new Blob(
        [
          JSON.stringify(
            backup,
            null,
            2
          ),
        ],
        {
          type: "application/json",
        }
      );

    const url =
      URL.createObjectURL(
        blob
      );

    const link =
      document.createElement(
        "a"
      );

    link.href = url;

    link.download =
      `MRD-Time-Tracker-Backup-${dateKey(
        Date.now()
      )}.json`;

    document.body.appendChild(
      link
    );

    link.click();
    link.remove();

    URL.revokeObjectURL(
      url
    );
  }

  /* =========================================================
     RESTORE
  ========================================================= */

  function handleRestore() {
    restoreInputRef.current?.click();
  }

  async function restoreBackupFile(
    event: React.ChangeEvent<HTMLInputElement>
  ) {
    const file =
      event.target.files?.[0];

    if (!file) return;

    try {
      const text =
        await file.text();

      const backup =
        JSON.parse(
          text
        ) as TrackerBackup;

      if (
        backup.version !== 2
      ) {
        throw new Error(
          "Unsupported backup version."
        );
      }

      if (
        !Array.isArray(
          backup.entries
        )
      ) {
        throw new Error(
          "Backup is missing entries."
        );
      }

      const confirmed =
        window.confirm(
          "Restore this backup?\n\nThis replaces the tracker data currently stored in this browser."
        );

      if (!confirmed) {
        event.target.value =
          "";
        return;
      }

      setEntries(
        backup.entries
      );

      setRecentTasks(
        (
          backup.recentTasks ??
          []
        ).map((task) => ({
          ...task,

          pinned:
            task.pinned ??
            false,
        }))
      );

      setSettings({
        ...DEFAULT_SETTINGS,
        ...(backup.settings ??
          {}),
      });

      setActiveTask(
        backup.activeTask ??
          null
      );

      alert(
        "Backup restored successfully."
      );
    } catch (error) {
      console.error(error);

      alert(
        "That file could not be restored. Make sure it is an MRD Time Tracker V2 backup."
      );
    }

    event.target.value = "";
  }

  /* =========================================================
     RESET SETTINGS
  ========================================================= */

  function handleResetSettings() {
    const confirmed =
      window.confirm(
        "Reset appearance and display preferences?\n\nYour time entries will NOT be deleted."
      );

    if (!confirmed) return;

    setSettings(
      DEFAULT_SETTINGS
    );
  }

  /* =========================================================
     STYLES
  ========================================================= */

  const pageStyle: CSSProperties =
    {
      minHeight: "100vh",

      background:
        colors.background,

      color: colors.text,

      transition:
        settings.animations
          ? "background 180ms ease, color 180ms ease"
          : "none",
    };

  const containerStyle: CSSProperties =
    {
      width:
        "min(1500px, calc(100% - 32px))",

      margin: "0 auto",

      padding: compact
        ? "18px 0 40px"
        : "28px 0 60px",
    };

  const cardStyle: CSSProperties =
    {
      background:
        colors.card,

      border: `1px solid ${colors.border}`,

      borderRadius: 16,

      padding: compact
        ? 16
        : 22,

      boxShadow:
        settings.theme ===
          "light" ||
        settings.theme ===
          "candy"
          ? "0 8px 25px rgba(0,0,0,0.06)"
          : `0 8px 30px ${colors.glow}`,

      transition:
        settings.animations
          ? "all 180ms ease"
          : "none",
    };

  const inputStyle: CSSProperties =
    {
      width: "100%",

      boxSizing:
        "border-box",

      border: `1px solid ${colors.inputBorder}`,

      borderRadius: 10,

      padding: compact
        ? "10px 12px"
        : "13px 14px",

      fontSize: 15,

      outline: "none",

      background:
        colors.inputBackground,

      color: colors.text,
    };

  const buttonStyle: CSSProperties =
    {
      border: "none",

      borderRadius: 10,

      padding: compact
        ? "10px 14px"
        : "12px 17px",

      fontWeight: 800,

      cursor: "pointer",
    };

  const secondaryButton: CSSProperties =
    {
      ...buttonStyle,

      border: `1px solid ${colors.border}`,

      background:
        colors.cardAlt,

      color: colors.text,
    };

  /* =========================================================
     RENDER
  ========================================================= */

  return (
    <main style={pageStyle}>
      {/* EDIT ENTRY MODAL */}

      <EditEntryModal
        entry={editingEntry}
        colors={colors}
        onClose={() =>
          setEditingEntry(
            null
          )
        }
        onSave={
          saveEditedEntry
        }
      />

      {/* HIDDEN RESTORE INPUT */}

      <input
        ref={restoreInputRef}
        type="file"
        accept=".json,application/json"
        onChange={
          restoreBackupFile
        }
        style={{
          display: "none",
        }}
      />

      <div
        style={containerStyle}
      >
        {/* HEADER */}

        <header
          style={{
            display: "flex",

            justifyContent:
              "space-between",

            alignItems:
              "center",

            gap: 18,

            marginBottom: 22,

            flexWrap: "wrap",
          }}
        >
          <div
            style={{
              display: "flex",

              alignItems:
                "center",

              gap: 14,
            }}
          >
            <img
              src="/logo.png"
              alt="MRD"
              style={{
                width: compact
                  ? 48
                  : 58,

                height: compact
                  ? 48
                  : 58,

                objectFit:
                  "contain",
              }}
            />

            <div>
              <div
                style={{
                  fontSize:
                    compact
                      ? 24
                      : 30,

                  fontWeight:
                    900,
                }}
              >
                Time Tracker
              </div>

              <div
                style={{
                  color:
                    colors.textMuted,

                  fontSize: 13,

                  marginTop: 3,
                }}
              >
                MRD Services • V2
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() =>
              setSettingsOpen(
                (current) =>
                  !current
              )
            }
            style={
              secondaryButton
            }
          >
            ⚙️{" "}
            {settingsOpen
              ? "Close Settings"
              : "Settings"}
          </button>
        </header>

        {/* RETENTION WARNING */}

        {oldestEntryAge >=
          WARNING_DAYS && (
          <div
            style={{
              ...cardStyle,

              border: `1px solid ${colors.warning}`,

              marginBottom: 18,
            }}
          >
            <strong>
              ⚠ Time history
              warning
            </strong>

            <div
              style={{
                marginTop: 5,

                color:
                  colors.textMuted,

                fontSize: 13,
              }}
            >
              Some entries are{" "}
              {oldestEntryAge} days
              old. Entries are
              automatically removed
              after{" "}
              {RETENTION_DAYS} days.
              Export or back up
              anything you need to
              keep.
            </div>
          </div>
        )}

        {/* SETTINGS */}

        {settingsOpen && (
          <section
            style={{
              ...cardStyle,

              marginBottom: 20,
            }}
          >
            <h2
              style={{
                margin:
                  "0 0 5px",
              }}
            >
              Customize Your
              Tracker
            </h2>

            <div
              style={{
                color:
                  colors.textMuted,

                fontSize: 13,

                marginBottom: 18,
              }}
            >
              Your preferences are
              stored on this
              browser.
            </div>

            <SettingsPanel
              settings={
                settings
              }
              colors={colors}
              onSettingsChange={
                setSettings
              }
              onBackup={
                handleBackup
              }
              onRestore={
                handleRestore
              }
              onResetSettings={
                handleResetSettings
              }
            />
          </section>
        )}

        {/* TASK ENTRY */}

        <section
          style={cardStyle}
        >
          <div
            style={{
              display: "flex",

              justifyContent:
                "space-between",

              gap: 15,

              alignItems:
                "center",

              flexWrap: "wrap",

              marginBottom: 18,
            }}
          >
            <div>
              <h2
                style={{
                  margin: 0,
                }}
              >
                {activeTask
                  ? "Switch to Another Task"
                  : "Start a Task"}
              </h2>

              <div
                style={{
                  color:
                    colors.textMuted,

                  fontSize: 13,

                  marginTop: 5,
                }}
              >
                Enter the task
                information that
                will map to Monday.
              </div>
            </div>

            <div
              style={{
                padding:
                  "7px 11px",

                borderRadius: 999,

                background:
                  colors.cardAlt,

                border: `1px solid ${colors.border}`,

                color:
                  colors.accent,

                fontWeight: 800,

                fontSize: 12,
              }}
            >
              {colors.emoji}{" "}
              {colors.name}
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
                MRD Project
                Number
              </div>

              <input
                value={
                  projectNumber
                }
                onChange={(
                  event
                ) =>
                  setProjectNumber(
                    event
                      .target
                      .value
                  )
                }
                placeholder="Example: 23455"
                style={
                  inputStyle
                }
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
                onChange={(
                  event
                ) =>
                  setItem(
                    event
                      .target
                      .value
                  )
                }
                placeholder="Example: FEC"
                style={
                  inputStyle
                }
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
              value={
                description
              }
              onChange={(
                event
              ) =>
                setDescription(
                  event.target
                    .value
                )
              }
              placeholder="Describe the work performed..."
              rows={3}
              style={{
                ...inputStyle,

                resize:
                  "vertical",

                fontFamily:
                  "inherit",
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
              onClick={
                startTask
              }
              style={{
                ...buttonStyle,

                background:
                  colors.primary,

                color:
                  colors.primaryText,

                boxShadow: `0 0 16px ${colors.glow}`,
              }}
            >
              {activeTask
                ? "⇄ Switch to This Task"
                : "▶ Start Task"}
            </button>

            <button
              type="button"
              onClick={
                stopTask
              }
              disabled={
                !activeTask
              }
              style={{
                ...buttonStyle,

                background:
                  activeTask
                    ? colors.danger
                    : colors.cardAlt,

                color:
                  activeTask
                    ? "#ffffff"
                    : colors.textMuted,

                opacity:
                  activeTask
                    ? 1
                    : 0.45,

                cursor:
                  activeTask
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

            marginTop: 18,

            textAlign:
              "center",

            position:
              settings.stickyTimer &&
              activeTask
                ? "sticky"
                : "relative",

            top:
              settings.stickyTimer &&
              activeTask
                ? 10
                : undefined,

            zIndex:
              settings.stickyTimer &&
              activeTask
                ? 20
                : undefined,
          }}
        >
          <div
            style={{
              color:
                colors.textMuted,

              textTransform:
                "uppercase",

              letterSpacing: 1.4,

              fontSize: 11,

              fontWeight: 900,
            }}
          >
            Current Status
          </div>

          <div
            style={{
              marginTop: 8,

              fontSize: compact
                ? 21
                : 27,

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
                color:
                  colors.textMuted,

                fontSize: 13,

                marginTop: 5,
              }}
            >
              {
                activeTask.description
              }
            </div>
          )}

          <div
            style={{
              marginTop: 10,

              fontSize: compact
                ? 34
                : 44,

              fontWeight: 900,

              fontVariantNumeric:
                "tabular-nums",

              color:
                colors.accent,

              textShadow:
                settings.theme ===
                  "cyberpunk" ||
                settings.theme ===
                  "terminal"
                  ? `0 0 18px ${colors.glow}`
                  : "none",
            }}
          >
            {formatDuration(
              elapsedSeconds
            )}
          </div>
        </section>

        {/* DASHBOARD */}

        <section
          style={{
            display: "grid",

            gridTemplateColumns:
              "repeat(auto-fit, minmax(220px, 1fr))",

            gap: 14,

            marginTop: 18,
          }}
        >
          <div
            style={cardStyle}
          >
            <div
              style={{
                color:
                  colors.textMuted,

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
              {formatDuration(
                todayTotalSeconds
              )}
            </div>
          </div>

          <div
            style={cardStyle}
          >
            <div
              style={{
                color:
                  colors.textMuted,

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
              {mondayQuantity.toFixed(
                1
              )}
            </div>
          </div>

          <div
            style={cardStyle}
          >
            <div
              style={{
                color:
                  colors.textMuted,

                fontSize: 12,

                fontWeight: 800,
              }}
            >
              SAVED ENTRIES TODAY
            </div>

            <div
              style={{
                fontSize: 28,

                fontWeight: 900,

                marginTop: 7,
              }}
            >
              {
                todayEntries.length
              }
            </div>
          </div>
        </section>

        {/* QUICK SWITCH */}

        <section
          style={{
            ...cardStyle,

            marginTop: 18,
          }}
        >
          <div
            style={{
              display: "flex",

              justifyContent:
                "space-between",

              alignItems:
                "center",

              gap: 12,

              flexWrap: "wrap",
            }}
          >
            <div>
              <h2
                style={{
                  margin: 0,
                }}
              >
                Quick Switch
              </h2>

              <div
                style={{
                  color:
                    colors.textMuted,

                  fontSize: 13,

                  marginTop: 5,
                }}
              >
                One click saves
                the current segment
                and starts the
                selected task.
              </div>
            </div>

            <div
              style={{
                color:
                  colors.textMuted,

                fontSize: 12,
              }}
            >
              ⭐ Pinned tasks stay
              first
            </div>
          </div>

          {sortedRecentTasks.length ===
          0 ? (
            <div
              style={{
                color:
                  colors.textMuted,

                marginTop: 16,
              }}
            >
              Start a task and it
              will appear here.
            </div>
          ) : (
            <div
              style={{
                display: "grid",

                gridTemplateColumns:
                  "repeat(auto-fit, minmax(260px, 1fr))",

                gap: 12,

                marginTop: 16,
              }}
            >
              {sortedRecentTasks.map(
                (task) => {
                  const key =
                    taskKey(
                      task.projectNumber,
                      task.item,
                      task.description
                    );

                  const isCurrent =
                    Boolean(
                      activeTask &&
                        taskKey(
                          activeTask.projectNumber,
                          activeTask.item,
                          activeTask.description
                        ) === key
                    );

                  return (
                    <div
                      key={key}
                      style={{
                        border: `1px solid ${
                          isCurrent
                            ? colors.accent
                            : colors.border
                        }`,

                        background:
                          colors.cardAlt,

                        borderRadius: 12,

                        padding: 13,
                      }}
                    >
                      <div
                        style={{
                          display:
                            "flex",

                          justifyContent:
                            "space-between",

                          gap: 10,
                        }}
                      >
                        <div>
                          <div
                            style={{
                              fontWeight:
                                900,
                            }}
                          >
                            {
                              task.item
                            }
                          </div>

                          <div
                            style={{
                              color:
                                colors.accent,

                              fontWeight:
                                800,

                              fontSize:
                                13,

                              marginTop:
                                2,
                            }}
                          >
                            {
                              task.projectNumber
                            }
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() =>
                            togglePin(
                              task
                            )
                          }
                          title={
                            task.pinned
                              ? "Unpin task"
                              : "Pin task"
                          }
                          style={{
                            border:
                              "none",

                            background:
                              "transparent",

                            cursor:
                              "pointer",

                            fontSize:
                              19,
                          }}
                        >
                          {task.pinned
                            ? "⭐"
                            : "☆"}
                        </button>
                      </div>

                      <div
                        style={{
                          color:
                            colors.textMuted,

                          fontSize: 13,

                          marginTop: 8,

                          minHeight: 36,
                        }}
                      >
                        {
                          task.description
                        }
                      </div>

                      <div
                        style={{
                          display:
                            "flex",

                          gap: 8,

                          marginTop:
                            11,
                        }}
                      >
                        <button
                          type="button"
                          disabled={
                            isCurrent
                          }
                          onClick={() =>
                            switchToTask(
                              task
                            )
                          }
                          style={{
                            ...buttonStyle,

                            flex: 1,

                            padding:
                              "9px 10px",

                            background:
                              isCurrent
                                ? colors.success
                                : colors.primary,

                            color:
                              isCurrent
                                ? "#ffffff"
                                : colors.primaryText,

                            opacity:
                              isCurrent
                                ? 0.75
                                : 1,

                            cursor:
                              isCurrent
                                ? "default"
                                : "pointer",
                          }}
                        >
                          {isCurrent
                            ? "● Active"
                            : activeTask
                            ? "⇄ Switch"
                            : "▶ Start"}
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            removeRecentTask(
                              task
                            )
                          }
                          title="Remove from Quick Switch"
                          style={{
                            ...secondaryButton,

                            padding:
                              "9px 11px",
                          }}
                        >
                          ×
                        </button>
                      </div>
                    </div>
                  );
                }
              )}
            </div>
          )}
        </section>

        {/* HISTORY */}

        <section
          style={{
            ...cardStyle,

            marginTop: 18,
          }}
        >
          <div
            style={{
              display: "flex",

              justifyContent:
                "space-between",

              alignItems:
                "center",

              gap: 15,

              flexWrap: "wrap",
            }}
          >
            <div>
              <h2
                style={{
                  margin: 0,
                }}
              >
                Time History
              </h2>

              <div
                style={{
                  color:
                    colors.textMuted,

                  fontSize: 13,

                  marginTop: 5,
                }}
              >
                Completed timer
                segments are saved
                automatically.
              </div>
            </div>

            <button
              type="button"
              onClick={
                exportMondayCSV
              }
              style={{
                ...buttonStyle,

                background:
                  colors.secondary,

                color:
                  colors.secondaryText,
              }}
            >
              Export Monday CSV
            </button>
          </div>

          <input
            value={search}
            onChange={(event) =>
              setSearch(
                event.target.value
              )
            }
            placeholder="Filter by project, item or description..."
            style={{
              ...inputStyle,

              marginTop: 16,
            }}
          />

          {groupedDays.length ===
          0 ? (
            <div
              style={{
                textAlign:
                  "center",

                color:
                  colors.textMuted,

                padding:
                  "32px 10px 16px",
              }}
            >
              No saved time entries
              yet.
            </div>
          ) : (
            <div
              style={{
                display: "grid",

                gap: 14,

                marginTop: 16,
              }}
            >
              {groupedDays.map(
                ([
                  day,
                  dayEntries,
                ]) => {
                  const daySeconds =
                    dayEntries.reduce(
                      (
                        total,
                        entry
                      ) =>
                        total +
                        secondsBetween(
                          entry.start,
                          entry.end
                        ),
                      0
                    );

                  const collapsed =
                    collapsedDays[
                      day
                    ] ??
                    settings.collapseHistory;

                  return (
                    <div
                      key={day}
                      style={{
                        border: `1px solid ${colors.border}`,

                        borderRadius:
                          12,

                        overflow:
                          "hidden",
                      }}
                    >
                      <button
                        type="button"
                        onClick={() =>
                          setCollapsedDays(
                            (
                              previous
                            ) => ({
                              ...previous,

                              [day]:
                                !collapsed,
                            })
                          )
                        }
                        style={{
                          width:
                            "100%",

                          border:
                            "none",

                          background:
                            colors.cardAlt,

                          color:
                            colors.text,

                          padding:
                            "13px 15px",

                          cursor:
                            "pointer",

                          display:
                            "flex",

                          justifyContent:
                            "space-between",

                          alignItems:
                            "center",

                          gap: 12,

                          textAlign:
                            "left",
                        }}
                      >
                        <div>
                          <strong>
                            {dateLabel(
                              dayEntries[0]
                                .start
                            )}
                          </strong>

                          <div
                            style={{
                              color:
                                colors.textMuted,

                              fontSize:
                                12,

                              marginTop:
                                3,
                            }}
                          >
                            {
                              dayEntries.length
                            }{" "}
                            segment
                            {dayEntries.length ===
                            1
                              ? ""
                              : "s"}
                          </div>
                        </div>

                        <div
                          style={{
                            display:
                              "flex",

                            alignItems:
                              "center",

                            gap: 12,
                          }}
                        >
                          <strong>
                            {formatDuration(
                              daySeconds
                            )}
                          </strong>

                          <span>
                            {collapsed
                              ? "▸"
                              : "▾"}
                          </span>
                        </div>
                      </button>

                      {!collapsed &&
                        dayEntries.map(
                          (
                            entry
                          ) => {
                            const seconds =
                              secondsBetween(
                                entry.start,
                                entry.end
                              );

                            return (
                              <div
                                key={
                                  entry.id
                                }
                                style={{
                                  padding:
                                    "14px 15px",

                                  borderTop: `1px solid ${colors.border}`,

                                  display:
                                    "grid",

                                  gridTemplateColumns:
                                    "minmax(170px, 1.2fr) minmax(220px, 2fr) auto",

                                  gap: 14,

                                  alignItems:
                                    "center",
                                }}
                              >
                                <div>
                                  <div
                                    style={{
                                      fontWeight:
                                        900,
                                    }}
                                  >
                                    {
                                      entry.item
                                    }
                                  </div>

                                  <div
                                    style={{
                                      color:
                                        colors.accent,

                                      fontWeight:
                                        800,

                                      fontSize:
                                        13,

                                      marginTop:
                                        2,
                                    }}
                                  >
                                    {
                                      entry.projectNumber
                                    }
                                  </div>

                                  <div
                                    style={{
                                      color:
                                        colors.textMuted,

                                      fontSize:
                                        12,

                                      marginTop:
                                        4,
                                    }}
                                  >
                                    {timeLabel(
                                      entry.start
                                    )}{" "}
                                    –{" "}
                                    {timeLabel(
                                      entry.end
                                    )}
                                  </div>
                                </div>

                                <div>
                                  <div>
                                    {
                                      entry.description
                                    }
                                  </div>

                                  {entry.adjustmentNote && (
                                    <div
                                      style={{
                                        color:
                                          colors.warning,

                                        fontSize:
                                          12,

                                        marginTop:
                                          5,
                                      }}
                                    >
                                      Adjustment:{" "}
                                      {
                                        entry.adjustmentNote
                                      }
                                    </div>
                                  )}
                                </div>

                                <div
                                  style={{
                                    textAlign:
                                      "right",
                                  }}
                                >
                                  <div
                                    style={{
                                      fontWeight:
                                        900,

                                      marginBottom:
                                        3,
                                    }}
                                  >
                                    {formatDuration(
                                      seconds
                                    )}
                                  </div>

                                  <div
                                    style={{
                                      color:
                                        colors.textMuted,

                                      fontSize:
                                        12,
                                    }}
                                  >
                                    Monday:{" "}
                                    {quantityFromSeconds(
                                      seconds
                                    ).toFixed(
                                      1
                                    )}
                                  </div>

                                  <div
                                    style={{
                                      display:
                                        "flex",

                                      gap: 6,

                                      justifyContent:
                                        "flex-end",

                                      marginTop:
                                        8,
                                    }}
                                  >
                                    <button
                                      type="button"
                                      onClick={() =>
                                        editEntry(
                                          entry
                                        )
                                      }
                                      style={{
                                        ...secondaryButton,

                                        padding:
                                          "6px 9px",

                                        fontSize:
                                          12,
                                      }}
                                    >
                                      Edit
                                    </button>

                                    <button
                                      type="button"
                                      onClick={() =>
                                        deleteEntry(
                                          entry
                                        )
                                      }
                                      style={{
                                        ...buttonStyle,

                                        padding:
                                          "6px 9px",

                                        fontSize:
                                          12,

                                        background:
                                          colors.danger,

                                        color:
                                          "#ffffff",
                                      }}
                                    >
                                      Delete
                                    </button>
                                  </div>
                                </div>
                              </div>
                            );
                          }
                        )}
                    </div>
                  );
                }
              )}
            </div>
          )}
        </section>

        <footer
          style={{
            textAlign: "center",

            color:
              colors.textMuted,

            fontSize: 12,

            marginTop: 24,
          }}
        >
          MRD Time Tracker V2 •
          Data is stored locally
          in this browser
        </footer>
      </div>
    </main>
  );
}