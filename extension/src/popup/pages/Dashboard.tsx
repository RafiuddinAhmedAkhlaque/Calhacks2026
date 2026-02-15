import { useState, useEffect } from "react";
import { getMyRooms, createRoom, joinRoom } from "@/lib/api";
import { clearUser, type StoredUser } from "@/lib/storage";
import type { Room } from "@/lib/types";

interface DashboardProps {
  user: StoredUser;
  onOpenRoom: (roomId: string) => void;
  onOpenSettings: () => void;
  onLogout: () => void;
}

export function Dashboard({
  user,
  onOpenRoom,
  onOpenSettings,
  onLogout,
}: DashboardProps) {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [showJoin, setShowJoin] = useState(false);
  const [newRoomName, setNewRoomName] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    loadRooms();
  }, []);

  const loadRooms = async () => {
    try {
      const r = await getMyRooms();
      setRooms(r);
    } catch (err) {
      console.error("Failed to load rooms:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRoomName.trim()) return;
    setError("");
    try {
      const room = await createRoom(newRoomName.trim());
      setRooms((prev) => [...prev, room]);
      setShowCreate(false);
      setNewRoomName("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create room");
    }
  };

  const handleJoinRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!joinCode.trim()) return;
    setError("");
    try {
      const room = await joinRoom(joinCode.trim());
      setRooms((prev) => [...prev, room]);
      setShowJoin(false);
      setJoinCode("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to join room");
    }
  };

  const handleLogout = async () => {
    await clearUser();
    onLogout();
  };

  const inputStyle: React.CSSProperties = {
    flex: 1,
    padding: '10px 14px',
    background: 'var(--bg-surface)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-sm)',
    color: 'var(--text-primary)',
    fontSize: 13,
    fontFamily: 'var(--font-body)',
    outline: 'none',
    transition: 'border-color 0.2s, box-shadow 0.2s',
  };

  const smallBtnStyle: React.CSSProperties = {
    padding: '10px 16px',
    background: 'var(--accent)',
    color: 'var(--text-inverse)',
    fontSize: 11,
    fontFamily: 'var(--font-display)',
    fontWeight: 700,
    letterSpacing: '0.06em',
    textTransform: 'uppercase',
    border: 'none',
    borderRadius: 'var(--radius-sm)',
    cursor: 'pointer',
    transition: 'background 0.15s',
  };

  return (
    <div className="page-enter flex flex-col h-[500px]">
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '14px 16px',
          borderBottom: '1px solid var(--border)',
        }}
      >
        <div>
          <h1
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 14,
              fontWeight: 700,
              color: 'var(--text-primary)',
              letterSpacing: '-0.01em',
              margin: 0,
            }}
          >
            SCROLLSTOP
          </h1>
          <p
            style={{
              fontSize: 12,
              color: 'var(--text-muted)',
              margin: '2px 0 0',
            }}
          >
            {user.username}
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <button
            onClick={onOpenSettings}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 32,
              height: 32,
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
            title="Settings"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
              <circle cx="12" cy="12" r="3" />
            </svg>
          </button>
          <button
            onClick={handleLogout}
            style={{
              fontSize: 11,
              fontFamily: 'var(--font-body)',
              fontWeight: 500,
              color: 'var(--text-muted)',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '6px 8px',
              transition: 'color 0.15s',
            }}
            onMouseEnter={(e) => {
              (e.target as HTMLButtonElement).style.color = 'var(--danger)';
            }}
            onMouseLeave={(e) => {
              (e.target as HTMLButtonElement).style.color = 'var(--text-muted)';
            }}
          >
            Log out
          </button>
        </div>
      </div>

      {/* Action buttons */}
      <div style={{ display: 'flex', gap: 8, padding: '12px 16px' }}>
        <button
          onClick={() => { setShowCreate(true); setShowJoin(false); }}
          style={{
            flex: 1,
            padding: '10px 0',
            background: 'var(--accent)',
            color: 'var(--text-inverse)',
            fontFamily: 'var(--font-display)',
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
            border: 'none',
            borderRadius: 'var(--radius-sm)',
            cursor: 'pointer',
            transition: 'all 0.15s',
          }}
          onMouseEnter={(e) => {
            (e.target as HTMLButtonElement).style.background = 'var(--accent-hover)';
            (e.target as HTMLButtonElement).style.transform = 'translateY(-1px)';
          }}
          onMouseLeave={(e) => {
            (e.target as HTMLButtonElement).style.background = 'var(--accent)';
            (e.target as HTMLButtonElement).style.transform = 'translateY(0)';
          }}
        >
          + Create Room
        </button>
        <button
          onClick={() => { setShowJoin(true); setShowCreate(false); }}
          style={{
            flex: 1,
            padding: '10px 0',
            background: 'var(--bg-surface)',
            color: 'var(--text-primary)',
            fontFamily: 'var(--font-display)',
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-sm)',
            cursor: 'pointer',
            transition: 'all 0.15s',
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--border-accent)';
            (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-1px)';
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--border)';
            (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(0)';
          }}
        >
          Join Room
        </button>
      </div>

      {/* Create / Join Forms */}
      {showCreate && (
        <form onSubmit={handleCreateRoom} style={{ padding: '0 16px 10px', display: 'flex', gap: 8 }}>
          <input
            type="text"
            value={newRoomName}
            onChange={(e) => setNewRoomName(e.target.value)}
            placeholder="Room name..."
            autoFocus
            style={inputStyle}
            onFocus={(e) => {
              e.target.style.borderColor = 'var(--border-accent)';
              e.target.style.boxShadow = '0 0 0 3px var(--accent-dim)';
            }}
            onBlur={(e) => {
              e.target.style.borderColor = 'var(--border)';
              e.target.style.boxShadow = 'none';
            }}
          />
          <button type="submit" style={smallBtnStyle}>Create</button>
        </form>
      )}

      {showJoin && (
        <form onSubmit={handleJoinRoom} style={{ padding: '0 16px 10px', display: 'flex', gap: 8 }}>
          <input
            type="text"
            value={joinCode}
            onChange={(e) => setJoinCode(e.target.value)}
            placeholder="Invite code..."
            autoFocus
            style={inputStyle}
            onFocus={(e) => {
              e.target.style.borderColor = 'var(--border-accent)';
              e.target.style.boxShadow = '0 0 0 3px var(--accent-dim)';
            }}
            onBlur={(e) => {
              e.target.style.borderColor = 'var(--border)';
              e.target.style.boxShadow = 'none';
            }}
          />
          <button type="submit" style={smallBtnStyle}>Join</button>
        </form>
      )}

      {error && (
        <div style={{
          margin: '0 16px 8px',
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

      {/* Rooms List */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '0 16px 16px' }}>
        {loading ? (
          <div className="flex items-center justify-center" style={{ paddingTop: 60 }}>
            <div
              style={{
                width: 24,
                height: 24,
                border: '2px solid var(--bg-elevated)',
                borderTopColor: 'var(--accent)',
                borderRadius: '50%',
                animation: 'spin 0.7s linear infinite',
              }}
            />
            <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
          </div>
        ) : rooms.length === 0 ? (
          <div style={{ textAlign: 'center', paddingTop: 48 }}>
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
                <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
                <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
              </svg>
            </div>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 4 }}>No rooms yet</p>
            <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>
              Create a room or join with an invite code
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {rooms.map((room, i) => (
              <button
                key={room.id}
                onClick={() => onOpenRoom(room.id)}
                style={{
                  width: '100%',
                  textAlign: 'left',
                  padding: '14px 16px',
                  background: 'var(--bg-surface)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-md)',
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  animation: `staggerIn 0.3s ease-out ${i * 0.05}s both`,
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--border-accent)';
                  (e.currentTarget as HTMLButtonElement).style.background = 'var(--bg-elevated)';
                  (e.currentTarget as HTMLButtonElement).style.transform = 'translateX(2px)';
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--border)';
                  (e.currentTarget as HTMLButtonElement).style.background = 'var(--bg-surface)';
                  (e.currentTarget as HTMLButtonElement).style.transform = 'translateX(0)';
                }}
              >
                <div>
                  <div
                    style={{
                      fontSize: 13,
                      fontWeight: 600,
                      color: 'var(--text-primary)',
                      marginBottom: 4,
                    }}
                  >
                    {room.name}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span>{room.members?.length || 0} member{room.members?.length !== 1 ? "s" : ""}</span>
                    <span style={{ color: 'var(--text-muted)', opacity: 0.4 }}>|</span>
                    <span style={{ fontFamily: 'var(--font-display)', fontSize: 10, color: 'var(--text-secondary)', letterSpacing: '0.04em' }}>
                      {room.inviteCode}
                    </span>
                  </div>
                </div>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="m9 18 6-6-6-6" />
                </svg>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
