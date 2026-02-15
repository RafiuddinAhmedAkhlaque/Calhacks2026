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
    <div className="page-enter flex flex-col items-center justify-center h-full px-10">
      {/* Decorative top bar */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: 3,
          background: 'linear-gradient(90deg, var(--accent), transparent)',
        }}
      />

      <div className="text-center mb-10">
        {/* Logo mark */}
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 48,
            height: 48,
            borderRadius: 'var(--radius-md)',
            background: 'var(--accent-dim)',
            border: '1px solid var(--border-accent)',
            marginBottom: 20,
          }}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <line x1="8" y1="12" x2="16" y2="12" />
          </svg>
        </div>

        <h1
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 22,
            fontWeight: 700,
            color: 'var(--text-primary)',
            letterSpacing: '-0.02em',
            marginBottom: 8,
          }}
        >
          SCROLLSTOP
        </h1>
        <p
          style={{
            fontFamily: 'var(--font-body)',
            fontSize: 13,
            color: 'var(--text-secondary)',
            lineHeight: 1.6,
            maxWidth: 240,
            margin: '0 auto',
          }}
        >
          Stop doomscrolling. Compete with friends.
          <br />
          <span style={{ color: 'var(--accent)' }}>Learn something instead.</span>
        </p>
      </div>

      <form onSubmit={handleSubmit} className="w-full max-w-xs" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div>
          <label
            htmlFor="username"
            style={{
              display: 'block',
              fontFamily: 'var(--font-display)',
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: '0.12em',
              textTransform: 'uppercase' as const,
              color: 'var(--text-muted)',
              marginBottom: 8,
            }}
          >
            Username
          </label>
          <input
            id="username"
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="pick a name..."
            autoFocus
            style={{
              width: '100%',
              padding: '12px 16px',
              background: 'var(--bg-surface)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-md)',
              color: 'var(--text-primary)',
              fontSize: 14,
              fontFamily: 'var(--font-body)',
              outline: 'none',
              transition: 'border-color 0.2s, box-shadow 0.2s',
            }}
            onFocus={(e) => {
              e.target.style.borderColor = 'var(--border-accent)';
              e.target.style.boxShadow = '0 0 0 3px var(--accent-dim)';
            }}
            onBlur={(e) => {
              e.target.style.borderColor = 'var(--border)';
              e.target.style.boxShadow = 'none';
            }}
          />
        </div>

        {error && (
          <div
            style={{
              fontSize: 12,
              color: 'var(--danger)',
              background: 'var(--danger-dim)',
              padding: '8px 12px',
              borderRadius: 'var(--radius-sm)',
              fontWeight: 500,
            }}
          >
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading || !username.trim()}
          style={{
            width: '100%',
            padding: '12px 0',
            background: loading || !username.trim() ? 'var(--bg-elevated)' : 'var(--accent)',
            color: loading || !username.trim() ? 'var(--text-muted)' : 'var(--text-inverse)',
            fontFamily: 'var(--font-display)',
            fontSize: 12,
            fontWeight: 700,
            letterSpacing: '0.08em',
            textTransform: 'uppercase' as const,
            border: 'none',
            borderRadius: 'var(--radius-md)',
            cursor: loading || !username.trim() ? 'not-allowed' : 'pointer',
            transition: 'all 0.2s',
          }}
          onMouseEnter={(e) => {
            if (!loading && username.trim()) {
              (e.target as HTMLButtonElement).style.background = 'var(--accent-hover)';
              (e.target as HTMLButtonElement).style.transform = 'translateY(-1px)';
            }
          }}
          onMouseLeave={(e) => {
            if (!loading && username.trim()) {
              (e.target as HTMLButtonElement).style.background = 'var(--accent)';
              (e.target as HTMLButtonElement).style.transform = 'translateY(0)';
            }
          }}
        >
          {loading ? "Connecting..." : "Get Started"}
        </button>
      </form>

      <p
        style={{
          fontSize: 11,
          color: 'var(--text-muted)',
          marginTop: 24,
          textAlign: 'center',
        }}
      >
        No account needed — just pick a name.
      </p>
    </div>
  );
}
