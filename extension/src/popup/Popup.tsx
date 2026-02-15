import { useState, useEffect } from "react";
import { getUser, type StoredUser } from "@/lib/storage";
import { Login } from "./pages/Login";
import { Dashboard } from "./pages/Dashboard";
import { RoomView } from "./pages/RoomView";
import { Settings } from "./pages/Settings";

type Page =
  | { name: "login" }
  | { name: "dashboard" }
  | { name: "room"; roomId: string }
  | { name: "settings" };

export function Popup() {
  const [user, setUser] = useState<StoredUser | null>(null);
  const [page, setPage] = useState<Page>({ name: "login" });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getUser().then((u) => {
      if (u) {
        setUser(u);
        setPage({ name: "dashboard" });
      }
      setLoading(false);
    });
  }, []);

  if (loading) {
    return (
      <div
        className="flex items-center justify-center h-full w-full"
        style={{ background: "var(--bg-deep)" }}
      >
        <div className="flex flex-col items-center gap-4">
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
          <span
            style={{
              fontFamily: "var(--font-display)",
              fontSize: 11,
              letterSpacing: "0.15em",
              textTransform: "uppercase" as const,
              color: "var(--text-muted)",
            }}
          >
            Loading
          </span>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
      </div>
    );
  }

  const handleLogin = (u: StoredUser) => {
    setUser(u);
    setPage({ name: "dashboard" });
  };

  const handleLogout = () => {
    setUser(null);
    setPage({ name: "login" });
  };

  switch (page.name) {
    case "login":
      return <Login onLogin={handleLogin} />;
    case "dashboard":
      return (
        <Dashboard
          user={user!}
          onOpenRoom={(roomId) => setPage({ name: "room", roomId })}
          onOpenSettings={() => setPage({ name: "settings" })}
          onLogout={handleLogout}
        />
      );
    case "room":
      return (
        <RoomView
          roomId={page.roomId}
          user={user!}
          onBack={() => setPage({ name: "dashboard" })}
        />
      );
    case "settings":
      return <Settings onBack={() => setPage({ name: "dashboard" })} />;
  }
}
