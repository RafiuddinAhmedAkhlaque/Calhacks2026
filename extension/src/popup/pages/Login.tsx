import { useState } from "react";
import { login } from "@/lib/api";
import { saveUser, type StoredUser } from "@/lib/storage";

interface LoginProps {
  onLogin: (user: StoredUser) => void;
}

export function Login({ onLogin }: LoginProps) {
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) return;

    setLoading(true);
    setError("");

    try {
      const { user, token } = await login(username.trim());
      const stored: StoredUser = {
        id: user.id,
        username: user.username,
        token,
      };
      await saveUser(stored);
      onLogin(stored);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to login");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center h-[500px] px-8">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-extrabold text-white tracking-tight mb-2">
          🛑 ScrollStop
        </h1>
        <p className="text-sm text-slate-400 leading-relaxed">
          Stop doomscrolling. Compete with friends.
          <br />
          Learn something instead.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="w-full max-w-xs space-y-4">
        <div>
          <label
            htmlFor="username"
            className="block text-xs font-medium text-slate-400 mb-1.5"
          >
            Choose a username
          </label>
          <input
            id="username"
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Enter username..."
            autoFocus
            className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl
                       text-white placeholder-slate-500 text-sm
                       focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent
                       transition-all"
          />
        </div>

        {error && (
          <div className="text-red-400 text-xs bg-red-400/10 px-3 py-2 rounded-lg">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading || !username.trim()}
          className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-700
                     disabled:text-slate-500 text-white font-semibold text-sm rounded-xl
                     transition-all duration-200 cursor-pointer disabled:cursor-not-allowed"
        >
          {loading ? "Connecting..." : "Get Started"}
        </button>
      </form>

      <p className="text-xs text-slate-500 mt-6 text-center">
        No account needed — just pick a name and go.
      </p>
    </div>
  );
}
