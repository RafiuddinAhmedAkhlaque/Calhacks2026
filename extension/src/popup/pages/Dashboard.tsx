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

  return (
    <div className="flex flex-col h-[500px]">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800">
        <div>
          <h1 className="text-lg font-bold text-white">ScrollStop</h1>
          <p className="text-xs text-slate-400">Hey, {user.username}</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onOpenSettings}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
            title="Settings"
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
              <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
              <circle cx="12" cy="12" r="3" />
            </svg>
          </button>
          <button
            onClick={handleLogout}
            className="text-xs text-slate-500 hover:text-red-400 transition-colors cursor-pointer"
          >
            Logout
          </button>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2 px-4 py-3">
        <button
          onClick={() => {
            setShowCreate(true);
            setShowJoin(false);
          }}
          className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm
                     font-semibold rounded-xl transition-colors cursor-pointer"
        >
          Create Room
        </button>
        <button
          onClick={() => {
            setShowJoin(true);
            setShowCreate(false);
          }}
          className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-white text-sm
                     font-semibold rounded-xl border border-slate-700 transition-colors cursor-pointer"
        >
          Join Room
        </button>
      </div>

      {/* Create / Join Forms */}
      {showCreate && (
        <form onSubmit={handleCreateRoom} className="px-4 pb-3">
          <div className="flex gap-2">
            <input
              type="text"
              value={newRoomName}
              onChange={(e) => setNewRoomName(e.target.value)}
              placeholder="Room name..."
              autoFocus
              className="flex-1 px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg
                         text-white placeholder-slate-500 text-sm focus:outline-none
                         focus:ring-2 focus:ring-indigo-500"
            />
            <button
              type="submit"
              className="px-4 py-2 bg-indigo-600 text-white text-sm rounded-lg
                         hover:bg-indigo-500 transition-colors cursor-pointer"
            >
              Create
            </button>
          </div>
        </form>
      )}

      {showJoin && (
        <form onSubmit={handleJoinRoom} className="px-4 pb-3">
          <div className="flex gap-2">
            <input
              type="text"
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value)}
              placeholder="Invite code..."
              autoFocus
              className="flex-1 px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg
                         text-white placeholder-slate-500 text-sm focus:outline-none
                         focus:ring-2 focus:ring-indigo-500"
            />
            <button
              type="submit"
              className="px-4 py-2 bg-indigo-600 text-white text-sm rounded-lg
                         hover:bg-indigo-500 transition-colors cursor-pointer"
            >
              Join
            </button>
          </div>
        </form>
      )}

      {error && (
        <div className="mx-4 mb-2 text-red-400 text-xs bg-red-400/10 px-3 py-2 rounded-lg">
          {error}
        </div>
      )}

      {/* Rooms List */}
      <div className="flex-1 overflow-y-auto px-4 pb-4">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-400" />
          </div>
        ) : rooms.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-3xl mb-3">📚</div>
            <p className="text-slate-400 text-sm">No rooms yet</p>
            <p className="text-slate-500 text-xs mt-1">
              Create one or join with an invite code
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {rooms.map((room) => (
              <button
                key={room.id}
                onClick={() => onOpenRoom(room.id)}
                className="w-full text-left p-4 bg-slate-800/50 hover:bg-slate-800
                           border border-slate-700/50 hover:border-indigo-500/30
                           rounded-xl transition-all group cursor-pointer"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-semibold text-white group-hover:text-indigo-300 transition-colors">
                      {room.name}
                    </div>
                    <div className="text-xs text-slate-500 mt-1">
                      {room.members?.length || 0} member
                      {room.members?.length !== 1 ? "s" : ""} · Code:{" "}
                      <span className="text-slate-400 font-mono">
                        {room.inviteCode}
                      </span>
                    </div>
                  </div>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="text-slate-600 group-hover:text-indigo-400 transition-colors"
                  >
                    <path d="m9 18 6-6-6-6" />
                  </svg>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
