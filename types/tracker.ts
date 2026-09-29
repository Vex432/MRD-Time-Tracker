export type ThemeName =
  | "light"
  | "dark"
  | "ocean"
  | "sunset"
  | "cyberpunk"
  | "forest"
  | "midnight"
  | "candy"
  | "ember"
  | "terminal";

export type LayoutDensity = "comfortable" | "compact";

export type TimerDisplay = "hours-minutes" | "clock";

/**
 * One completed segment of tracked work.
 *
 * Example:
 * 9:00–9:25 FEC
 * 9:25–9:40 EXIF
 * 9:40–10:10 FEC
 *
 * Each segment stays separate internally even when the UI
 * combines matching tasks for totals/reporting.
 */
export type TimeEntry = {
  id: string;

  // Monday / task information entered by the employee
  projectNumber: string;
  item: string;
  description: string;

  // Exact timestamps in milliseconds
  start: number;
  end: number;

  // Optional explanation when someone manually changes an entry
  adjustmentNote?: string;
};

/**
 * The task currently being timed.
 *
 * This is stored separately from completed entries so an
 * accidental browser refresh does not destroy a running timer.
 */
export type ActiveTask = {
  projectNumber: string;
  item: string;
  description: string;
  start: number;
};

/**
 * A reusable task displayed in Recent Tasks / Quick Switch.
 */
export type RecentTask = {
  projectNumber: string;
  item: string;
  description: string;

  // Used for sorting recently used tasks.
  lastUsed: number;

  // Pinned tasks stay at the top of Quick Switch.
  pinned: boolean;
};

/**
 * User-specific appearance and behavior preferences.
 */
export type TrackerSettings = {
  theme: ThemeName;

  density: LayoutDensity;

  timerDisplay: TimerDisplay;

  showSeconds: boolean;

  animations: boolean;

  stickyTimer: boolean;

  collapseHistory: boolean;
};

/**
 * Full portable backup format.
 *
 * This lets an employee move their tracker data to another
 * computer/browser without needing a shared database.
 */
export type TrackerBackup = {
  version: 2;

  exportedAt: number;

  entries: TimeEntry[];

  recentTasks: RecentTask[];

  settings: TrackerSettings;

  // Preserve a running timer when creating a backup.
  activeTask?: ActiveTask | null;
};

/**
 * Combined task used for displaying summarized history.
 *
 * Individual TimeEntry segments remain untouched underneath.
 */
export type AggregatedTask = {
  key: string;

  projectNumber: string;

  item: string;

  description: string;

  totalSeconds: number;

  segmentCount: number;

  entries: TimeEntry[];
};

/**
 * Date grouping used by Time History.
 */
export type DayGroup = {
  dateKey: string;

  dateLabel: string;

  entries: TimeEntry[];

  totalSeconds: number;
};

/**
 * Structure used when previewing/exporting a row to Monday.
 */
export type MondayExportRow = {
  item: string;

  projectNumber: string;

  date: string;

  quantity: number;

  description: string;
};