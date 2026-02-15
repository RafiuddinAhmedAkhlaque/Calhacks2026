import { useState, useEffect } from "react";
import {
  getSettings,
  saveSettings,
  getTimeTracking,
  saveTimeTracking,
} from "@/lib/storage";
import type { ScrollStopSettings, DomainConfig } from "@/lib/types";
import type { TimeTrackingData } from "@/lib/storage";

interface SettingsProps {
  onBack: () => void;
}

export function Settings({ onBack }: SettingsProps) {
  const [settings, setSettings] = useState<ScrollStopSettings | null>(null);
  const [timeData, setTimeData] = useState<TimeTrackingData>({});
  const [newDomain, setNewDomain] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    (async () => {
      const s = await getSettings();
      const t = await getTimeTracking();
      setSettings(s);
      setTimeData(t);
    })();
  }, []);

  const handleSave = async (updates: Partial<ScrollStopSettings>) => {
    if (!settings) return;
    const updated = { ...settings, ...updates };
    await saveSettings(updated);
    setSettings(updated);
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  };

  const toggleDomain = (index: number) => {
    if (!settings) return;
    const domains = [...settings.trackedDomains];
    domains[index] = { ...domains[index], enabled: !domains[index].enabled };
    handleSave({ trackedDomains: domains });
  };

  const addDomain = () => {
    if (!settings || !newDomain.trim()) return;
    const domain = newDomain
      .trim()
      .replace(/^(https?:\/\/)?(www\.)?/, "")
      .replace(/\/.*$/, "");
    if (settings.trackedDomains.some((d) => d.domain === domain)) return;
    const domains: DomainConfig[] = [
      ...settings.trackedDomains,
      { domain, enabled: true },
    ];
    handleSave({ trackedDomains: domains });
    setNewDomain("");
  };

  const removeDomain = (index: number) => {
    if (!settings) return;
    const domains = settings.trackedDomains.filter((_, i) => i !== index);
    handleSave({ trackedDomains: domains });
  };

  const resetAllTime = async () => {
    await saveTimeTracking({});
    setTimeData({});
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}m ${s}s`;
  };

  if (!settings) {
    return (
      <div className="flex items-center justify-center h-[500px]">
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
    <div className="page-enter flex flex-col h-[500px]">
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
          Settings
        </h2>
        {saved && (
          <span
            style={{
              marginLeft: "auto",
              fontSize: 10,
              fontFamily: "var(--font-display)",
              fontWeight: 700,
              letterSpacing: "0.06em",
              textTransform: "uppercase",
              color: "var(--success)",
              background: "var(--success-dim)",
              padding: "4px 10px",
              borderRadius: "var(--radius-sm)",
            }}
          >
            Saved
          </span>
        )}
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: "16px" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          {/* Time Limit */}
          <div>
            <label
              style={{
                display: "block",
                fontFamily: "var(--font-display)",
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                color: "var(--text-muted)",
                marginBottom: 12,
              }}
            >
              Time limit
            </label>
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <div
                style={{
                  flex: 1,
                  height: "50%",
                  background: "var(--bg-elevated)",
                  borderRadius: 4,
                  padding: "1px 0",
                }}
              >
                <input
                  type="range"
                  min={1}
                  max={60}
                  value={settings.timeLimitMinutes}
                  onChange={(e) =>
                    handleSave({ timeLimitMinutes: parseInt(e.target.value) })
                  }
                />
              </div>
              <div
                style={{
                  minWidth: 52,
                  textAlign: "right",
                  fontFamily: "var(--font-display)",
                  fontSize: 16,
                  fontWeight: 700,
                  color: "var(--text-primary)",
                }}
              >
                {settings.timeLimitMinutes}
                <span
                  style={{
                    fontSize: 10,
                    color: "var(--text-muted)",
                    marginLeft: 2,
                  }}
                >
                  min
                </span>
              </div>
            </div>
          </div>

          {/* Tracked Domains */}
          <div>
            <label
              style={{
                display: "block",
                fontFamily: "var(--font-display)",
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                color: "var(--text-muted)",
                marginBottom: 10,
              }}
            >
              Tracked domains
            </label>
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              {settings.trackedDomains.map((d, i) => (
                <div
                  key={d.domain}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    padding: "10px 12px",
                    background: "var(--bg-surface)",
                    borderRadius: "var(--radius-sm)",
                    border: "1px solid var(--border)",
                  }}
                >
                  {/* Toggle */}
                  <button
                    onClick={() => toggleDomain(i)}
                    style={{
                      width: 34,
                      height: 18,
                      borderRadius: 9,
                      background: d.enabled
                        ? "var(--accent)"
                        : "var(--bg-elevated)",
                      border: d.enabled
                        ? "1px solid var(--accent)"
                        : "1px solid var(--border)",
                      position: "relative",
                      cursor: "pointer",
                      transition: "background 0.2s, border-color 0.2s",
                      padding: 0,
                      flexShrink: 0,
                    }}
                  >
                    <div
                      style={{
                        position: "absolute",
                        top: 2,
                        left: d.enabled ? 17 : 2,
                        width: 12,
                        height: 12,
                        borderRadius: "50%",
                        background: d.enabled
                          ? "var(--text-inverse)"
                          : "var(--text-muted)",
                        transition: "left 0.2s, background 0.2s",
                      }}
                    />
                  </button>

                  <span
                    style={{
                      flex: 1,
                      fontSize: 13,
                      color: d.enabled
                        ? "var(--text-primary)"
                        : "var(--text-muted)",
                      transition: "color 0.15s",
                    }}
                  >
                    {d.domain}
                  </span>

                  {timeData[d.domain] && (
                    <span
                      style={{
                        fontSize: 10,
                        fontFamily: "var(--font-display)",
                        color: timeData[d.domain].blocked
                          ? "var(--danger)"
                          : "var(--text-muted)",
                        letterSpacing: "0.02em",
                      }}
                    >
                      {formatTime(timeData[d.domain].totalSeconds)}
                    </span>
                  )}

                  <button
                    onClick={() => removeDomain(i)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      width: 20,
                      height: 20,
                      background: "transparent",
                      border: "none",
                      color: "var(--text-muted)",
                      cursor: "pointer",
                      padding: 0,
                      transition: "color 0.15s",
                      opacity: 0.5,
                    }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLButtonElement).style.color =
                        "var(--danger)";
                      (e.currentTarget as HTMLButtonElement).style.opacity =
                        "1";
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLButtonElement).style.color =
                        "var(--text-muted)";
                      (e.currentTarget as HTMLButtonElement).style.opacity =
                        "0.5";
                    }}
                  >
                    <svg
                      width="12"
                      height="12"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M18 6 6 18" />
                      <path d="m6 6 12 12" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>

            {/* Add Domain */}
            <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
              <input
                type="text"
                value={newDomain}
                onChange={(e) => setNewDomain(e.target.value)}
                placeholder="add domain..."
                onKeyDown={(e) => e.key === "Enter" && addDomain()}
                style={{
                  flex: 1,
                  padding: "10px 14px",
                  background: "var(--bg-surface)",
                  border: "1px solid var(--border)",
                  borderRadius: "var(--radius-sm)",
                  color: "var(--text-primary)",
                  fontSize: 13,
                  fontFamily: "var(--font-body)",
                  outline: "none",
                  transition: "border-color 0.2s, box-shadow 0.2s",
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = "var(--border-accent)";
                  e.target.style.boxShadow = "0 0 0 3px var(--accent-dim)";
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = "var(--border)";
                  e.target.style.boxShadow = "none";
                }}
              />
              <button
                onClick={addDomain}
                style={{
                  padding: "10px 16px",
                  background: "var(--accent)",
                  color: "var(--text-inverse)",
                  fontSize: 11,
                  fontFamily: "var(--font-display)",
                  fontWeight: 700,
                  letterSpacing: "0.06em",
                  textTransform: "uppercase",
                  border: "none",
                  borderRadius: "var(--radius-sm)",
                  cursor: "pointer",
                  transition: "background 0.15s",
                }}
                onMouseEnter={(e) => {
                  (e.target as HTMLButtonElement).style.background =
                    "var(--accent-hover)";
                }}
                onMouseLeave={(e) => {
                  (e.target as HTMLButtonElement).style.background =
                    "var(--accent)";
                }}
              >
                Add
              </button>
            </div>
          </div>

          {/* Time Tracking Stats */}
          {Object.keys(timeData).length > 0 && (
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
          )}
        </div>
      </div>
    </div>
  );
}
