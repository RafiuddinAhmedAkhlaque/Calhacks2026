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
      <div className="flex items-center justify-center h-[500px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-400" />
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
