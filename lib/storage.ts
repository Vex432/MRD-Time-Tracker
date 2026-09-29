import type {
  RecentTask,
  TimeEntry,
  TrackerBackup,
  TrackerSettings,
} from "../types/tracker";

export const STORAGE_KEYS = {
  entries: "mrd-time-tracker-v2-entries",
  recentTasks: "mrd-time-tracker-v2-recent-tasks",
  settings: "mrd-time-tracker-v2-settings",
} as const;

export const DEFAULT_SETTINGS: TrackerSettings = {
  theme: "light",
  density: "comfortable",
  timerDisplay: "clock",
  showSeconds: true,
  animations: true,
  stickyTimer: true,
  collapseHistory: false,
};

function safeParse<T>(value: string | null, fallback: T): T {
  if (!value) return fallback;

  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

export function loadEntries(): TimeEntry[] {
  if (typeof window === "undefined") return [];

  return safeParse<TimeEntry[]>(
    localStorage.getItem(STORAGE_KEYS.entries),
    []
  );
}

export function saveEntries(entries: TimeEntry[]) {
  if (typeof window === "undefined") return;

  localStorage.setItem(
    STORAGE_KEYS.entries,
    JSON.stringify(entries)
  );
}

export function loadRecentTasks(): RecentTask[] {
  if (typeof window === "undefined") return [];

  return safeParse<RecentTask[]>(
    localStorage.getItem(STORAGE_KEYS.recentTasks),
    []
  );
}

export function saveRecentTasks(tasks: RecentTask[]) {
  if (typeof window === "undefined") return;

  localStorage.setItem(
    STORAGE_KEYS.recentTasks,
    JSON.stringify(tasks)
  );
}

export function loadSettings(): TrackerSettings {
  if (typeof window === "undefined") {
    return DEFAULT_SETTINGS;
  }

  const saved = safeParse<Partial<TrackerSettings>>(
    localStorage.getItem(STORAGE_KEYS.settings),
    {}
  );

  return {
    ...DEFAULT_SETTINGS,
    ...saved,
  };
}

export function saveSettings(settings: TrackerSettings) {
  if (typeof window === "undefined") return;

  localStorage.setItem(
    STORAGE_KEYS.settings,
    JSON.stringify(settings)
  );
}

export function createBackup(
  entries: TimeEntry[],
  recentTasks: RecentTask[],
  settings: TrackerSettings
): TrackerBackup {
  return {
    version: 2,
    exportedAt: Date.now(),
    entries,
    recentTasks,
    settings,
  };
}

export function downloadBackup(backup: TrackerBackup) {
  const blob = new Blob(
    [JSON.stringify(backup, null, 2)],
    { type: "application/json" }
  );

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  const date = new Date()
    .toISOString()
    .slice(0, 10);

  link.href = url;
  link.download = `mrd-time-tracker-backup-${date}.json`;

  document.body.appendChild(link);
  link.click();
  link.remove();

  URL.revokeObjectURL(url);
}

export function clearTrackerData() {
  if (typeof window === "undefined") return;

  localStorage.removeItem(STORAGE_KEYS.entries);
  localStorage.removeItem(STORAGE_KEYS.recentTasks);
}

export function resetTrackerSettings() {
  if (typeof window === "undefined") return;

  localStorage.removeItem(STORAGE_KEYS.settings);
}