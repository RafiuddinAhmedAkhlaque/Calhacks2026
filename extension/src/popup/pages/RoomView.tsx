import { useState, useEffect } from "react";
import { getRoom, getLeaderboard, uploadDocument, getRoomDocuments } from "@/lib/api";
import { saveSettings, getSettings } from "@/lib/storage";
import { joinSocketRoom, leaveSocketRoom, onLeaderboardUpdate } from "@/lib/socket";
import type { StoredUser } from "@/lib/storage";
import type { Room, LeaderboardEntry, Document as DocType } from "@/lib/types";

interface RoomViewProps {
  roomId: string;
  user: StoredUser;
  onBack: () => void;
}

export function RoomView({ roomId, user, onBack }: RoomViewProps) {
  const [room, setRoom] = useState<Room | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [documents, setDocuments] = useState<DocType[]>([]);
  const [tab, setTab] = useState<"leaderboard" | "documents">("leaderboard");
  const [uploading, setUploading] = useState(false);
  const [isActive, setIsActive] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    loadData();
    checkActive();

    // Join Socket.io room for real-time updates
    joinSocketRoom(roomId);
    const unsubscribe = onLeaderboardUpdate((lb) => {
      setLeaderboard(lb as LeaderboardEntry[]);
    });

    return () => {
      leaveSocketRoom(roomId);
      unsubscribe();
    };
  }, [roomId]);

  const loadData = async () => {
    try {
      const [r, lb, docs] = await Promise.all([
        getRoom(roomId),
        getLeaderboard(roomId),
        getRoomDocuments(roomId),
      ]);
      setRoom(r);
      setLeaderboard(lb);
      setDocuments(docs);
    } catch (err) {
      console.error("Failed to load room data:", err);
    }
  };

  const checkActive = async () => {
    const settings = await getSettings();
    setIsActive(settings.activeRoomId === roomId);
  };

  const toggleActive = async () => {
    const newValue = isActive ? null : roomId;
    await saveSettings({ activeRoomId: newValue });
    setIsActive(!isActive);
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError("");
    try {
      await uploadDocument(roomId, file);
      const docs = await getRoomDocuments(roomId);
      setDocuments(docs);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const getRankEmoji = (rank: number) => {
    switch (rank) {
      case 1:
        return "🥇";
      case 2:
        return "🥈";
      case 3:
        return "🥉";
      default:
        return `#${rank}`;
    }
  };

  if (!room) {
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
        <div className="flex-1 min-w-0">
          <h2 className="text-sm font-bold text-white truncate">{room.name}</h2>
          <p className="text-xs text-slate-500">
            Code:{" "}
            <span className="font-mono text-slate-400">{room.inviteCode}</span>
          </p>
        </div>
        <button
          onClick={toggleActive}
          className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
            isActive
              ? "bg-green-500/20 text-green-400 border border-green-500/30"
              : "bg-slate-800 text-slate-400 border border-slate-700 hover:border-indigo-500/30"
          }`}
        >
          {isActive ? "Active" : "Set Active"}
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-800">
        <button
          onClick={() => setTab("leaderboard")}
          className={`flex-1 py-2.5 text-sm font-medium transition-colors cursor-pointer ${
            tab === "leaderboard"
              ? "text-indigo-400 border-b-2 border-indigo-400"
              : "text-slate-500 hover:text-slate-300"
          }`}
        >
          Leaderboard
        </button>
        <button
          onClick={() => setTab("documents")}
          className={`flex-1 py-2.5 text-sm font-medium transition-colors cursor-pointer ${
            tab === "documents"
              ? "text-indigo-400 border-b-2 border-indigo-400"
              : "text-slate-500 hover:text-slate-300"
          }`}
        >
          Documents ({documents.length})
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 py-3">
        {tab === "leaderboard" ? (
          leaderboard.length === 0 ? (
            <div className="text-center py-10">
              <div className="text-3xl mb-3">🏆</div>
              <p className="text-slate-400 text-sm">No scores yet</p>
              <p className="text-slate-500 text-xs mt-1">
                Complete quizzes to climb the ranks!
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {leaderboard.map((entry) => (
                <div
                  key={entry.userId}
                  className={`flex items-center gap-3 p-3 rounded-xl border transition-colors ${
                    entry.userId === user.id
                      ? "bg-indigo-500/10 border-indigo-500/30"
                      : "bg-slate-800/30 border-slate-700/50"
                  }`}
                >
                  <div className="text-lg w-8 text-center">
                    {getRankEmoji(entry.rank)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold text-white truncate">
                      {entry.username}
                      {entry.userId === user.id && (
                        <span className="text-indigo-400 ml-1">(you)</span>
                      )}
                    </div>
                    <div className="text-xs text-slate-500">
                      {entry.quizzesCompleted} quizzes · {entry.streak} streak
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-bold text-indigo-400">
                      {entry.score}
                    </div>
                    <div className="text-xs text-slate-500">pts</div>
                  </div>
                </div>
              ))}
            </div>
          )
        ) : (
          <div className="space-y-3">
            {/* Upload */}
            <label
              className={`flex items-center justify-center gap-2 p-4 border-2 border-dashed
                          rounded-xl transition-colors cursor-pointer
                          ${
                            uploading
                              ? "border-indigo-500/30 bg-indigo-500/5"
                              : "border-slate-700 hover:border-indigo-500/40 hover:bg-slate-800/50"
                          }`}
            >
              <input
                type="file"
                accept=".pdf,.txt,.md,.doc,.docx"
                onChange={handleUpload}
                className="hidden"
                disabled={uploading}
              />
              {uploading ? (
                <span className="text-sm text-indigo-400">Uploading & generating questions...</span>
              ) : (
                <>
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
                    className="text-slate-400"
                  >
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="17 8 12 3 7 8" />
                    <line x1="12" x2="12" y1="3" y2="15" />
                  </svg>
                  <span className="text-sm text-slate-400">
                    Upload study material (PDF, TXT, MD)
                  </span>
                </>
              )}
            </label>

            {error && (
              <div className="text-red-400 text-xs bg-red-400/10 px-3 py-2 rounded-lg">
                {error}
              </div>
            )}

            {/* Document List */}
            {documents.map((doc) => (
              <div
                key={doc.id}
                className="flex items-center gap-3 p-3 bg-slate-800/30 border border-slate-700/50 rounded-xl"
              >
                <div className="text-xl">📄</div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-white truncate">
                    {doc.filename}
                  </div>
                  <div className="text-xs text-slate-500">
                    {doc.questionCount} questions generated
                  </div>
                </div>
              </div>
            ))}

            {documents.length === 0 && !uploading && (
              <p className="text-center text-slate-500 text-xs py-4">
                Upload documents to generate quiz questions for your room.
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
