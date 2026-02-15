import { useState, useEffect } from "react";
import { getUser, getOnboarded, setOnboarded, type StoredUser } from "@/lib/storage";
import { Login } from "./pages/Login";
import { Dashboard } from "./pages/Dashboard";
import { RoomView } from "./pages/RoomView";
import { Settings } from "./pages/Settings";
import { WrongQuestions } from "./pages/WrongQuestions";
import { Onboarding } from "./pages/Onboarding";

type Page =
  | { name: "login" }
  | { name: "onboarding" }
  | { name: "dashboard" }
  | { name: "room"; roomId: string }
  | { name: "settings" }
  | { name: "wrongQuestions" };

export function Popup() {
  const [user, setUser] = useState<StoredUser | null>(null);
  const [page, setPage] = useState<Page>({ name: "login" });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getUser().then(async (u) => {
      if (u) {
        setUser(u);
        const onboarded = await getOnboarded();
        setPage(onboarded ? { name: "dashboard" } : { name: "onboarding" });
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

  const handleLogin = async (u: StoredUser) => {
    setUser(u);
    const onboarded = await getOnboarded();
    setPage(onboarded ? { name: "dashboard" } : { name: "onboarding" });
  };

  const handleOnboardingComplete = async () => {
    await setOnboarded();
    setPage({ name: "dashboard" });
  };

  const handleLogout = () => {
    setUser(null);
    setPage({ name: "login" });
  };

  switch (page.name) {
    case "login":
      return <Login onLogin={handleLogin} />;
    case "onboarding":
      return <Onboarding onComplete={handleOnboardingComplete} />;
    case "dashboard":
      return (
        <Dashboard
          user={user!}
          onOpenRoom={(roomId) => setPage({ name: "room", roomId })}
          onOpenSettings={() => setPage({ name: "settings" })}
          onOpenWrongQuestions={() => setPage({ name: "wrongQuestions" })}
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
    case "wrongQuestions":
      return <WrongQuestions onBack={() => setPage({ name: "dashboard" })} />;
  }
}
