import { useState, useEffect } from "react";
import {
  getSettings,
  saveSettings,
  getTimeTracking,
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
    const domain = newDomain.trim().replace(/^(https?:\/\/)?(www\.)?/, "").replace(/\/.*$/, "");
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

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}m ${s}s`;
  };

  if (!settings) {
    return (
      <div className="flex items-center justify-center h-[500px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-400" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[500px]">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-800">
        <button
          onClick={onBack}
          className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="m15 18-6-6 6-6" />
          </svg>
        </button>
        <h2 className="text-sm font-bold text-white">Settings</h2>
        {saved && (
          <span className="ml-auto text-xs text-green-400">Saved!</span>
        )}
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-6">
        {/* Time Limit */}
        <div>
          <label className="block text-xs font-medium text-slate-400 mb-2">
            Time limit before quiz interrupt
          </label>
          <div className="flex items-center gap-3">
            <input
              type="range"
              min={1}
              max={60}
              value={settings.timeLimitMinutes}
              onChange={(e) =>
                handleSave({ timeLimitMinutes: parseInt(e.target.value) })
              }
              className="flex-1 accent-indigo-500"
            />
            <span className="text-sm font-semibold text-white min-w-[48px] text-right">
              {settings.timeLimitMinutes} min
            </span>
          </div>
        </div>

        {/* Tracked Domains */}
        <div>
          <label className="block text-xs font-medium text-slate-400 mb-2">
            Tracked domains
          </label>
          <div className="space-y-1.5">
            {settings.trackedDomains.map((d, i) => (
              <div
                key={d.domain}
                className="flex items-center gap-2 p-2.5 bg-slate-800/50 rounded-lg"
              >
                <button
                  onClick={() => toggleDomain(i)}
                  className={`w-9 h-5 rounded-full transition-colors relative cursor-pointer ${
                    d.enabled ? "bg-indigo-600" : "bg-slate-700"
                  }`}
                >
                  <div
                    className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${
                      d.enabled ? "left-4.5" : "left-0.5"
                    }`}
                  />
                </button>
                <span
                  className={`flex-1 text-sm ${
                    d.enabled ? "text-white" : "text-slate-500"
                  }`}
                >
                  {d.domain}
                </span>
                {timeData[d.domain] && (
                  <span className="text-xs text-slate-500">
                    {formatTime(timeData[d.domain].totalSeconds)}
                  </span>
                )}
                <button
                  onClick={() => removeDomain(i)}
                  className="text-slate-600 hover:text-red-400 transition-colors cursor-pointer"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
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
          <div className="flex gap-2 mt-2">
            <input
              type="text"
              value={newDomain}
              onChange={(e) => setNewDomain(e.target.value)}
              placeholder="Add domain (e.g. netflix.com)"
              onKeyDown={(e) => e.key === "Enter" && addDomain()}
              className="flex-1 px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg
                         text-white placeholder-slate-500 text-sm focus:outline-none
                         focus:ring-2 focus:ring-indigo-500"
            />
            <button
              onClick={addDomain}
              className="px-3 py-2 bg-indigo-600 text-white text-sm rounded-lg
                         hover:bg-indigo-500 transition-colors cursor-pointer"
            >
              Add
            </button>
          </div>
        </div>

        {/* Time Tracking Stats */}
        {Object.keys(timeData).length > 0 && (
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-2">
              Time tracked today
            </label>
            <div className="space-y-1.5">
              {Object.entries(timeData).map(([domain, data]) => (
                <div
                  key={domain}
                  className="flex items-center justify-between p-2.5 bg-slate-800/30 rounded-lg"
                >
                  <span className="text-sm text-slate-300">{domain}</span>
                  <span
                    className={`text-sm font-semibold ${
                      data.blocked ? "text-red-400" : "text-slate-400"
                    }`}
                  >
                    {formatTime(data.totalSeconds)}
                    {data.blocked && " (blocked)"}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
