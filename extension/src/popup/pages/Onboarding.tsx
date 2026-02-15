interface OnboardingProps {
  onComplete: () => void;
}

const steps = [
  {
    title: "Upload Documents",
    description:
      "Upload your study materials (PDFs, notes, docs) to a room. Quiz questions are automatically generated from your content.",
  },
  {
    title: "Set Your Room Active",
    description:
      "Activate a room in the room view. Only the active room's questions will appear when you get blocked from doomscrolling.",
  },
  {
    title: "Compete With Friends",
    description:
      "Share your room's invite code with friends. Everyone competes on the leaderboard by answering questions correctly.",
  },
];

export function Onboarding({ onComplete }: OnboardingProps) {
  return (
    <div
      className="page-enter flex flex-col h-full"
      style={{ overflowY: "auto" }}
    >
      {/* Decorative top bar */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: 3,
          background: "linear-gradient(90deg, var(--accent), transparent)",
        }}
      />

      {/* Header */}
      <div style={{ textAlign: "center", padding: "28px 24px 20px" }}>
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            width: 48,
            height: 48,
            borderRadius: "var(--radius-md)",
            background: "var(--accent-dim)",
            border: "1px solid var(--border-accent)",
            marginBottom: 20,
          }}
        >
          <svg
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            stroke="var(--accent)"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <line x1="8" y1="12" x2="16" y2="12" />
          </svg>
        </div>

        <h1
          style={{
            fontFamily: "var(--font-display)",
            fontSize: 18,
            fontWeight: 700,
            color: "var(--text-primary)",
            letterSpacing: "-0.02em",
            marginBottom: 6,
          }}
        >
          HOW IT WORKS
        </h1>
        <p
          style={{
            fontFamily: "var(--font-body)",
            fontSize: 13,
            color: "var(--text-secondary)",
            lineHeight: 1.5,
          }}
        >
          Three steps to stop doomscrolling
        </p>
      </div>

      {/* Steps */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 10,
          padding: "0 16px",
        }}
      >
        {steps.map((step, i) => (
          <div
            key={i}
            style={{
              display: "flex",
              gap: 12,
              padding: "14px 16px",
              background: "var(--bg-surface)",
              border: "1px solid var(--border)",
              borderRadius: "var(--radius-md)",
            }}
          >
            <div
              style={{
                width: 28,
                height: 28,
                minWidth: 28,
                borderRadius: "50%",
                background: "var(--accent-dim)",
                border: "1px solid var(--border-accent)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontFamily: "var(--font-display)",
                fontSize: 12,
                fontWeight: 700,
                color: "var(--accent)",
              }}
            >
              {i + 1}
            </div>
            <div>
              <div
                style={{
                  fontFamily: "var(--font-display)",
                  fontSize: 10,
                  fontWeight: 700,
                  letterSpacing: "0.12em",
                  textTransform: "uppercase",
                  color: "var(--text-muted)",
                  marginBottom: 4,
                }}
              >
                {step.title}
              </div>
              <p
                style={{
                  fontFamily: "var(--font-body)",
                  fontSize: 13,
                  color: "var(--text-secondary)",
                  lineHeight: 1.6,
                  margin: 0,
                }}
              >
                {step.description}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Get Started button */}
      <div style={{ padding: "20px 16px 24px", marginTop: "auto" }}>
        <button
          onClick={onComplete}
          style={{
            width: "100%",
            padding: "12px 0",
            background: "var(--accent)",
            color: "var(--text-inverse)",
            fontFamily: "var(--font-display)",
            fontSize: 12,
            fontWeight: 700,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            border: "none",
            borderRadius: "var(--radius-md)",
            cursor: "pointer",
            transition: "all 0.2s",
          }}
          onMouseEnter={(e) => {
            (e.target as HTMLButtonElement).style.background =
              "var(--accent-hover)";
            (e.target as HTMLButtonElement).style.transform =
              "translateY(-1px)";
          }}
          onMouseLeave={(e) => {
            (e.target as HTMLButtonElement).style.background = "var(--accent)";
            (e.target as HTMLButtonElement).style.transform = "translateY(0)";
          }}
        >
          Get Started
        </button>
      </div>
    </div>
  );
}
