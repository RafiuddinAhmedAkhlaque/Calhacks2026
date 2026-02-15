import { useState, useEffect } from "react";
import {
  getSettings,
  getTimeTracking,
  saveTimeTracking,
} from "@/lib/storage";
import type { ScrollStopSettings } from "@/lib/types";
import type { TimeTrackingData } from "@/lib/storage";

interface ActivityProps {
  onBack: () => void;
}

export function Activity({ onBack }: ActivityProps) {
  const [settings, setSettings] = useState<ScrollStopSettings | null>(null);
  const [timeData, setTimeData] = useState<TimeTrackingData>({});

  useEffect(() => {
    (async () => {
      const s = await getSettings();
      const t = await getTimeTracking();
      setSettings(s);
      setTimeData(t);
    })();
  }, []);

  useEffect(() => {
    const id = setInterval(async () => {
      const t = await getTimeTracking();
      setTimeData(t);
    }, 1000);

    return () => clearInterval(id);
  }, []);

  const resetAllTime = async () => {
    await saveTimeTracking({});
    setTimeData({});
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}m ${s}s`;
  };

  if (!settings) {
    return (
      <div className="flex items-center justify-center h-full">
        <div
          style={{
            width: 28,
            height: 28,
            border: "2px solid var(--bg-elevated)",
            borderTopColor: "var(--accent)",
            borderRadius: "50%",
            animation: "spin 0.7s linear infinite",
          }}
        />
        <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
      </div>
    );
  }

  return (
    <div className="page-enter flex flex-col h-full">
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          padding: "12px 16px",
          borderBottom: "1px solid var(--border)",
        }}
      >
        <button
          onClick={onBack}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 30,
            height: 30,
            background: "transparent",
            border: "1px solid var(--border)",
            borderRadius: "var(--radius-sm)",
            color: "var(--text-secondary)",
            cursor: "pointer",
            transition: "all 0.15s",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.borderColor =
              "var(--border-accent)";
            (e.currentTarget as HTMLButtonElement).style.color =
              "var(--accent)";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.borderColor =
              "var(--border)";
            (e.currentTarget as HTMLButtonElement).style.color =
              "var(--text-secondary)";
          }}
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="m15 18-6-6 6-6" />
          </svg>
        </button>
        <h2
          style={{
            fontSize: 13,
            fontWeight: 700,
            color: "var(--text-primary)",
            margin: 0,
            fontFamily: "var(--font-display)",
            letterSpacing: "0.04em",
            textTransform: "uppercase",
          }}
        >
          Activity
        </h2>
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: "16px" }}>
        {Object.keys(timeData).length > 0 ? (
          <div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 10,
              }}
            >
              <label
                style={{
                  fontFamily: "var(--font-display)",
                  fontSize: 10,
                  fontWeight: 700,
                  letterSpacing: "0.12em",
                  textTransform: "uppercase",
                  color: "var(--text-muted)",
                }}
              >
                Time tracked
              </label>
              <button
                onClick={resetAllTime}
                style={{
                  fontSize: 10,
                  fontFamily: "var(--font-display)",
                  fontWeight: 700,
                  letterSpacing: "0.04em",
                  textTransform: "uppercase",
                  color: "var(--danger)",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  padding: "2px 0",
                  transition: "opacity 0.15s",
                  opacity: 0.7,
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.opacity = "1";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.opacity =
                    "0.7";
                }}
              >
                Reset all
              </button>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              {Object.entries(timeData).map(([domain, data]) => {
                const pct =
                  settings.timeLimitMinutes > 0
                    ? Math.min(
                        (data.totalSeconds /
                          (settings.timeLimitMinutes * 60)) *
                          100,
                        100,
                      )
                    : 0;
                return (
                  <div
                    key={domain}
                    style={{
                      padding: "10px 12px",
                      background: "var(--bg-surface)",
                      borderRadius: "var(--radius-sm)",
                      border: "1px solid var(--border)",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginBottom: 6,
                      }}
                    >
                      <span
                        style={{
                          fontSize: 12,
                          color: "var(--text-secondary)",
                        }}
                      >
                        {domain}
                      </span>
                      <span
                        style={{
                          fontSize: 11,
                          fontFamily: "var(--font-display)",
                          fontWeight: 700,
                          color: data.blocked
                            ? "var(--danger)"
                            : "var(--text-primary)",
                        }}
                      >
                        {formatTime(data.totalSeconds)}
                        {data.blocked && (
                          <span
                            style={{
                              marginLeft: 6,
                              fontSize: 9,
                              padding: "2px 6px",
                              borderRadius: 4,
                              background: "var(--danger-dim)",
                              color: "var(--danger)",
                              letterSpacing: "0.06em",
                              textTransform: "uppercase",
                            }}
                          >
                            Blocked
                          </span>
                        )}
                      </span>
                    </div>
                    {/* Progress bar */}
                    <div
                      style={{
                        height: 3,
                        background: "var(--bg-elevated)",
                        borderRadius: 3,
                        overflow: "hidden",
                      }}
                    >
                      <div
                        style={{
                          height: "100%",
                          width: `${pct}%`,
                          background: data.blocked
                            ? "var(--danger)"
                            : pct > 75
                              ? "var(--warning)"
                              : "var(--accent)",
                          borderRadius: 3,
                          transition: "width 0.4s ease",
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div style={{ textAlign: "center", paddingTop: 48 }}>
            <p
              style={{
                fontSize: 13,
                color: "var(--text-secondary)",
                marginBottom: 4,
              }}
            >
              No time tracking data yet
            </p>
            <p style={{ fontSize: 11, color: "var(--text-muted)" }}>
              Browse a tracked domain to start recording
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
