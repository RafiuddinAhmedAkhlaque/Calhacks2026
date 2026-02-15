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

  const getRankDisplay = (rank: number) => {
    switch (rank) {
      case 1: return { label: "1ST", color: "var(--accent)" };
      case 2: return { label: "2ND", color: "var(--text-secondary)" };
      case 3: return { label: "3RD", color: "#B87333" };
      default: return { label: `#${rank}`, color: "var(--text-muted)" };
    }
  };

  if (!room) {
    return (
      <div className="flex items-center justify-center h-[500px]">
        <div
          style={{
            width: 28,
            height: 28,
            border: '2px solid var(--bg-elevated)',
            borderTopColor: 'var(--accent)',
            borderRadius: '50%',
            animation: 'spin 0.7s linear infinite',
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
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          padding: '12px 16px',
          borderBottom: '1px solid var(--border)',
        }}
      >
        <button
          onClick={onBack}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 30,
            height: 30,
            background: 'transparent',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-sm)',
            color: 'var(--text-secondary)',
            cursor: 'pointer',
            transition: 'all 0.15s',
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--border-accent)';
            (e.currentTarget as HTMLButtonElement).style.color = 'var(--accent)';
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--border)';
            (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-secondary)';
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="m15 18-6-6 6-6" />
          </svg>
        </button>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h2
            style={{
              fontSize: 13,
              fontWeight: 700,
              color: 'var(--text-primary)',
              margin: 0,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {room.name}
          </h2>
          <p style={{ fontSize: 10, color: 'var(--text-muted)', margin: '2px 0 0', fontFamily: 'var(--font-display)', letterSpacing: '0.04em' }}>
            {room.inviteCode}
          </p>
        </div>
        <button
          onClick={toggleActive}
          style={{
            padding: '6px 14px',
            fontSize: 10,
            fontFamily: 'var(--font-display)',
            fontWeight: 700,
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
            borderRadius: 'var(--radius-sm)',
            border: isActive ? '1px solid rgba(74, 222, 128, 0.3)' : '1px solid var(--border)',
            background: isActive ? 'var(--success-dim)' : 'var(--bg-surface)',
            color: isActive ? 'var(--success)' : 'var(--text-secondary)',
            cursor: 'pointer',
            transition: 'all 0.2s',
            animation: isActive ? 'pulseGlow 2s ease-in-out infinite' : 'none',
            ...(isActive ? { '--accent-glow': 'rgba(74, 222, 128, 0.2)' } as React.CSSProperties : {}),
          }}
          onMouseEnter={(e) => {
            if (!isActive) {
              (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--border-accent)';
              (e.currentTarget as HTMLButtonElement).style.color = 'var(--accent)';
            }
          }}
          onMouseLeave={(e) => {
            if (!isActive) {
              (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--border)';
              (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-secondary)';
            }
          }}
        >
          {isActive ? "Active" : "Set Active"}
        </button>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: '1px solid var(--border)' }}>
        {(["leaderboard", "documents"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            style={{
              flex: 1,
              padding: '10px 0',
              fontSize: 11,
              fontFamily: 'var(--font-display)',
              fontWeight: 700,
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              background: 'transparent',
              border: 'none',
              borderBottom: tab === t ? '2px solid var(--accent)' : '2px solid transparent',
              color: tab === t ? 'var(--accent)' : 'var(--text-muted)',
              cursor: 'pointer',
              transition: 'color 0.15s',
            }}
            onMouseEnter={(e) => {
              if (tab !== t) (e.target as HTMLButtonElement).style.color = 'var(--text-secondary)';
            }}
            onMouseLeave={(e) => {
              if (tab !== t) (e.target as HTMLButtonElement).style.color = 'var(--text-muted)';
            }}
          >
            {t === "documents" ? `Docs (${documents.length})` : "Ranks"}
          </button>
        ))}
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '12px 16px' }}>
        {tab === "leaderboard" ? (
          leaderboard.length === 0 ? (
            <div style={{ textAlign: 'center', paddingTop: 40 }}>
              <div
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--bg-surface)',
                  border: '1px solid var(--border)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: 14,
                }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
                  <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
                  <path d="M4 22h16" />
                  <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
                  <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
                  <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
                </svg>
              </div>
              <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 4 }}>No scores yet</p>
              <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                Complete quizzes to climb the ranks
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {leaderboard.map((entry, i) => {
                const rank = getRankDisplay(entry.rank);
                const isYou = entry.userId === user.id;
                return (
                  <div
                    key={entry.userId}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                      padding: '12px 14px',
                      borderRadius: 'var(--radius-md)',
                      border: isYou ? '1px solid var(--border-accent)' : '1px solid var(--border)',
                      background: isYou ? 'var(--accent-dim)' : 'var(--bg-surface)',
                      transition: 'all 0.15s',
                      animation: `staggerIn 0.3s ease-out ${i * 0.06}s both`,
                    }}
                  >
                    {/* Rank badge */}
                    <div
                      style={{
                        width: 32,
                        height: 32,
                        minWidth: 32,
                        borderRadius: 'var(--radius-sm)',
                        background: entry.rank <= 3 ? `${rank.color}15` : 'var(--bg-elevated)',
                        border: `1px solid ${entry.rank <= 3 ? `${rank.color}30` : 'var(--border)'}`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontFamily: 'var(--font-display)',
                        fontSize: 10,
                        fontWeight: 700,
                        color: rank.color,
                        letterSpacing: '0.02em',
                      }}
                    >
                      {rank.label}
                    </div>

                    {/* Name & stats */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{
                        fontSize: 13,
                        fontWeight: 600,
                        color: 'var(--text-primary)',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}>
                        {entry.username}
                        {isYou && (
                          <span style={{ color: 'var(--accent)', fontSize: 11, marginLeft: 4, fontWeight: 500 }}>you</span>
                        )}
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                        {entry.quizzesCompleted} quizzes · {entry.streak} streak
                      </div>
                    </div>

                    {/* Score */}
                    <div style={{ textAlign: 'right' }}>
                      <div style={{
                        fontFamily: 'var(--font-display)',
                        fontSize: 15,
                        fontWeight: 700,
                        color: isYou ? 'var(--accent)' : 'var(--text-primary)',
                      }}>
                        {entry.score}
                      </div>
                      <div style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'var(--font-display)', letterSpacing: '0.06em' }}>PTS</div>
                    </div>
                  </div>
                );
              })}
            </div>
          )
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {/* Upload area */}
            <label
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                padding: '20px 16px',
                border: uploading ? '1.5px dashed var(--accent)' : '1.5px dashed rgba(255,255,255,0.08)',
                borderRadius: 'var(--radius-md)',
                background: uploading ? 'var(--accent-dim)' : 'var(--bg-surface)',
                cursor: uploading ? 'wait' : 'pointer',
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => {
                if (!uploading) {
                  (e.currentTarget as HTMLLabelElement).style.borderColor = 'var(--border-accent)';
                  (e.currentTarget as HTMLLabelElement).style.background = 'var(--bg-elevated)';
                }
              }}
              onMouseLeave={(e) => {
                if (!uploading) {
                  (e.currentTarget as HTMLLabelElement).style.borderColor = 'rgba(255,255,255,0.08)';
                  (e.currentTarget as HTMLLabelElement).style.background = 'var(--bg-surface)';
                }
              }}
            >
              <input
                type="file"
                accept=".pdf,.txt,.md,.doc,.docx"
                onChange={handleUpload}
                style={{ display: 'none' }}
                disabled={uploading}
              />
              {uploading ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div
                    style={{
                      width: 16,
                      height: 16,
                      border: '2px solid var(--accent-dim)',
                      borderTopColor: 'var(--accent)',
                      borderRadius: '50%',
                      animation: 'spin 0.7s linear infinite',
                    }}
                  />
                  <span style={{ fontSize: 12, color: 'var(--accent)', fontWeight: 500 }}>
                    Generating questions...
                  </span>
                </div>
              ) : (
                <>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="17 8 12 3 7 8" />
                    <line x1="12" x2="12" y1="3" y2="15" />
                  </svg>
                  <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                    Upload study material
                  </span>
                  <span style={{ fontSize: 10, color: 'var(--text-muted)', opacity: 0.6 }}>
                    PDF, TXT, MD
                  </span>
                </>
              )}
            </label>

            {error && (
              <div style={{
                fontSize: 12,
                color: 'var(--danger)',
                background: 'var(--danger-dim)',
                padding: '8px 12px',
                borderRadius: 'var(--radius-sm)',
                fontWeight: 500,
              }}>
                {error}
              </div>
            )}

            {/* Document list */}
            {documents.map((doc, i) => (
              <div
                key={doc.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '12px 14px',
                  background: 'var(--bg-surface)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-md)',
                  animation: `staggerIn 0.3s ease-out ${i * 0.05}s both`,
                }}
              >
                <div
                  style={{
                    width: 32,
                    height: 32,
                    minWidth: 32,
                    borderRadius: 'var(--radius-sm)',
                    background: 'var(--accent-dim)',
                    border: '1px solid var(--border-accent)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                  </svg>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontSize: 12,
                    fontWeight: 600,
                    color: 'var(--text-primary)',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}>
                    {doc.filename}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                    {doc.questionCount} questions
                  </div>
                </div>
              </div>
            ))}

            {documents.length === 0 && !uploading && (
              <p style={{ textAlign: 'center', fontSize: 11, color: 'var(--text-muted)', padding: '12px 0' }}>
                Upload documents to generate quiz questions.
              </p>
            )}
          </div>
        )}
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  );
}
