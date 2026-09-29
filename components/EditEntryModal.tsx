"use client";

import { useEffect, useMemo, useState } from "react";

import type { TimeEntry } from "../types/tracker";
import type { ThemeColors } from "../lib/themes";

type Props = {
  entry: TimeEntry | null;
  colors: ThemeColors;
  onClose: () => void;
  onSave: (entry: TimeEntry) => void;
};

function pad(value: number) {
  return String(value).padStart(2, "0");
}

function dateInputValue(timestamp: number) {
  const date = new Date(timestamp);

  return `${date.getFullYear()}-${pad(
    date.getMonth() + 1
  )}-${pad(date.getDate())}`;
}

function timeInputValue(timestamp: number) {
  const date = new Date(timestamp);

  return `${pad(date.getHours())}:${pad(
    date.getMinutes()
  )}`;
}

function combineDateTime(date: string, time: string) {
  const [year, month, day] = date
    .split("-")
    .map(Number);

  const [hours, minutes] = time
    .split(":")
    .map(Number);

  return new Date(
    year,
    month - 1,
    day,
    hours,
    minutes,
    0,
    0
  ).getTime();
}

function formatDuration(totalSeconds: number) {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor(
    (totalSeconds % 3600) / 60
  );
  const seconds = totalSeconds % 60;

  return `${hours}h ${minutes}m ${seconds}s`;
}

function mondayQuantity(seconds: number) {
  if (seconds <= 0) return 0;

  return Math.ceil(seconds / 360) / 10;
}

export default function EditEntryModal({
  entry,
  colors,
  onClose,
  onSave,
}: Props) {
  const [projectNumber, setProjectNumber] =
    useState("");

  const [item, setItem] = useState("");
  const [description, setDescription] =
    useState("");

  const [date, setDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");

  const [adjustmentNote, setAdjustmentNote] =
    useState("");

  const [error, setError] = useState("");

  useEffect(() => {
    if (!entry) return;

    setProjectNumber(entry.projectNumber);
    setItem(entry.item);
    setDescription(entry.description);

    setDate(dateInputValue(entry.start));
    setStartTime(timeInputValue(entry.start));
    setEndTime(timeInputValue(entry.end));

    setAdjustmentNote(
      entry.adjustmentNote ?? ""
    );

    setError("");
  }, [entry]);

  const calculated = useMemo(() => {
    if (!date || !startTime || !endTime) {
      return {
        start: 0,
        end: 0,
        seconds: 0,
        valid: false,
      };
    }

    const start = combineDateTime(
      date,
      startTime
    );

    const end = combineDateTime(
      date,
      endTime
    );

    const seconds = Math.floor(
      (end - start) / 1000
    );

    return {
      start,
      end,
      seconds: Math.max(0, seconds),
      valid: end > start,
    };
  }, [date, startTime, endTime]);

  if (!entry) return null;

  const inputStyle: React.CSSProperties = {
    width: "100%",
    boxSizing: "border-box",
    border: `1px solid ${colors.inputBorder}`,
    borderRadius: 9,
    padding: "11px 12px",
    background: colors.inputBackground,
    color: colors.text,
    fontSize: 14,
    outline: "none",
  };

  const labelStyle: React.CSSProperties = {
    display: "block",
    fontSize: 12,
    fontWeight: 800,
    marginBottom: 6,
    color: colors.text,
  };

  const secondaryButton: React.CSSProperties = {
    border: `1px solid ${colors.border}`,
    borderRadius: 9,
    padding: "10px 15px",
    background: colors.cardAlt,
    color: colors.text,
    fontWeight: 800,
    cursor: "pointer",
  };

function save() {
  if (!entry) return;

  setError("");

    if (!projectNumber.trim()) {
      setError(
        "MRD Project Number cannot be blank."
      );
      return;
    }

    if (!item.trim()) {
      setError("Item cannot be blank.");
      return;
    }

    if (!description.trim()) {
      setError(
        "Description cannot be blank."
      );
      return;
    }

    if (!date || !startTime || !endTime) {
      setError(
        "Date, start time and end time are required."
      );
      return;
    }

    if (!calculated.valid) {
      setError(
        "End time must be later than start time."
      );
      return;
    }

 onSave({
  ...entry,

  id: entry.id,

  projectNumber:
    projectNumber.trim(),

  item: item.trim(),

  description:
    description.trim(),

  start: calculated.start,
  end: calculated.end,

  adjustmentNote:
    adjustmentNote.trim() ||
    undefined,
});
  }

  return (
    <div
      onMouseDown={(event) => {
        if (
          event.target ===
          event.currentTarget
        ) {
          onClose();
        }
      }}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 1000,

        background:
          "rgba(0, 0, 0, 0.65)",

        display: "flex",
        alignItems: "center",
        justifyContent: "center",

        padding: 20,
      }}
    >
      <div
        style={{
          width: "min(650px, 100%)",

          maxHeight: "90vh",
          overflowY: "auto",

          background: colors.card,

          color: colors.text,

          border: `1px solid ${colors.border}`,

          borderRadius: 16,

          padding: 22,

          boxShadow:
            "0 25px 80px rgba(0,0,0,.45)",
        }}
      >
        {/* HEADER */}

        <div
          style={{
            display: "flex",
            justifyContent:
              "space-between",
            alignItems: "center",
            gap: 15,
          }}
        >
          <div>
            <h2
              style={{
                margin: 0,
                fontSize: 22,
              }}
            >
              Edit Time Entry
            </h2>

            <div
              style={{
                color:
                  colors.textMuted,
                fontSize: 13,
                marginTop: 5,
              }}
            >
              Correct task details or
              timing without deleting the
              entry.
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            style={{
              border: "none",
              background:
                "transparent",
              color: colors.text,
              cursor: "pointer",
              fontSize: 25,
            }}
          >
            ×
          </button>
        </div>

        {/* PROJECT + ITEM */}

        <div
          style={{
            display: "grid",

            gridTemplateColumns:
              "repeat(auto-fit, minmax(220px, 1fr))",

            gap: 13,

            marginTop: 20,
          }}
        >
          <label>
            <span style={labelStyle}>
              MRD Project Number
            </span>

            <input
              value={projectNumber}
              onChange={(event) =>
                setProjectNumber(
                  event.target.value
                )
              }
              style={inputStyle}
            />
          </label>

          <label>
            <span style={labelStyle}>
              Item
            </span>

            <input
              value={item}
              onChange={(event) =>
                setItem(
                  event.target.value
                )
              }
              style={inputStyle}
            />
          </label>
        </div>

        {/* DESCRIPTION */}

        <label
          style={{
            display: "block",
            marginTop: 14,
          }}
        >
          <span style={labelStyle}>
            Description
          </span>

          <textarea
            value={description}
            onChange={(event) =>
              setDescription(
                event.target.value
              )
            }
            rows={3}
            style={{
              ...inputStyle,
              resize: "vertical",
              fontFamily: "inherit",
            }}
          />
        </label>

        {/* DATE */}

        <label
          style={{
            display: "block",
            marginTop: 14,
          }}
        >
          <span style={labelStyle}>
            Date
          </span>

          <input
            type="date"
            value={date}
            onChange={(event) =>
              setDate(
                event.target.value
              )
            }
            style={inputStyle}
          />
        </label>

        {/* START / END */}

        <div
          style={{
            display: "grid",

            gridTemplateColumns:
              "repeat(auto-fit, minmax(200px, 1fr))",

            gap: 13,

            marginTop: 14,
          }}
        >
          <label>
            <span style={labelStyle}>
              Start Time
            </span>

            <input
              type="time"
              value={startTime}
              onChange={(event) =>
                setStartTime(
                  event.target.value
                )
              }
              style={inputStyle}
            />
          </label>

          <label>
            <span style={labelStyle}>
              End Time
            </span>

            <input
              type="time"
              value={endTime}
              onChange={(event) =>
                setEndTime(
                  event.target.value
                )
              }
              style={inputStyle}
            />
          </label>
        </div>

        {/* CALCULATED PREVIEW */}

        <div
          style={{
            display: "grid",

            gridTemplateColumns:
              "repeat(2, minmax(0, 1fr))",

            gap: 12,

            marginTop: 16,
          }}
        >
          <div
            style={{
              padding: 14,

              borderRadius: 11,

              background:
                colors.cardAlt,

              border: `1px solid ${colors.border}`,
            }}
          >
            <div
              style={{
                color:
                  colors.textMuted,
                fontSize: 11,
                fontWeight: 800,
              }}
            >
              ACTUAL DURATION
            </div>

            <div
              style={{
                fontSize: 21,
                fontWeight: 900,
                marginTop: 5,
              }}
            >
              {calculated.valid
                ? formatDuration(
                    calculated.seconds
                  )
                : "—"}
            </div>
          </div>

          <div
            style={{
              padding: 14,

              borderRadius: 11,

              background:
                colors.cardAlt,

              border: `1px solid ${colors.border}`,
            }}
          >
            <div
              style={{
                color:
                  colors.textMuted,
                fontSize: 11,
                fontWeight: 800,
              }}
            >
              MONDAY QUANTITY
            </div>

            <div
              style={{
                fontSize: 21,
                fontWeight: 900,
                marginTop: 5,
                color: colors.accent,
              }}
            >
              {calculated.valid
                ? mondayQuantity(
                    calculated.seconds
                  ).toFixed(1)
                : "—"}
            </div>
          </div>
        </div>

        {/* NOTE */}

        <label
          style={{
            display: "block",
            marginTop: 16,
          }}
        >
          <span style={labelStyle}>
            Adjustment Note
          </span>

          <textarea
            value={adjustmentNote}
            onChange={(event) =>
              setAdjustmentNote(
                event.target.value
              )
            }
            placeholder="Example: Forgot to stop timer at 3:42 PM"
            rows={2}
            style={{
              ...inputStyle,
              resize: "vertical",
              fontFamily: "inherit",
            }}
          />
        </label>

        {error && (
          <div
            style={{
              marginTop: 14,

              padding: "10px 12px",

              borderRadius: 9,

              background:
                colors.cardAlt,

              border: `1px solid ${colors.danger}`,

              color: colors.danger,

              fontSize: 13,

              fontWeight: 700,
            }}
          >
            {error}
          </div>
        )}

        {/* BUTTONS */}

        <div
          style={{
            display: "flex",
            justifyContent:
              "flex-end",
            gap: 10,
            marginTop: 20,
          }}
        >
          <button
            type="button"
            onClick={onClose}
            style={secondaryButton}
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={save}
            style={{
              border: "none",

              borderRadius: 9,

              padding: "10px 16px",

              background:
                colors.primary,

              color:
                colors.primaryText,

              fontWeight: 900,

              cursor: "pointer",

              boxShadow: `0 0 15px ${colors.glow}`,
            }}
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}