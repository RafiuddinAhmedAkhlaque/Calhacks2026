import { useState, useEffect } from "react";
import { getWrongQuestions } from "@/lib/api";
import type { WrongQuestionReview } from "@/lib/types";

interface WrongQuestionsProps {
  onBack: () => void;
}

export function WrongQuestions({ onBack }: WrongQuestionsProps) {
  const [questions, setQuestions] = useState<WrongQuestionReview[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadQuestions();
  }, []);

  const loadQuestions = async () => {
    try {
      const q = await getWrongQuestions();
      setQuestions(q);
    } catch (err) {
      console.error("Failed to load wrong questions:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[500px]">
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
        <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[500px]">
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          padding: "12px 16px",
          borderBottom: "1px solid var(--border)",
        }}
      >
        <button
          onClick={onBack}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 30,
            height: 30,
            background: "transparent",
            border: "1px solid var(--border)",
            borderRadius: "var(--radius-sm)",
            color: "var(--text-secondary)",
            cursor: "pointer",
            transition: "all 0.15s",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.borderColor =
              "var(--border-accent)";
            (e.currentTarget as HTMLButtonElement).style.color = "var(--accent)";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.borderColor =
              "var(--border)";
            (e.currentTarget as HTMLButtonElement).style.color =
              "var(--text-secondary)";
          }}
        >
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
          >
            <path d="m15 18-6-6 6-6" />
          </svg>
        </button>
        <h2
          style={{
            fontSize: 13,
            fontFamily: "var(--font-display)",
            fontWeight: 700,
            color: "var(--text-primary)",
            letterSpacing: "0.05em",
            textTransform: "uppercase",
          }}
        >
          Wrong Questions
        </h2>
      </div>

      {/* Questions List */}
      <div
        style={{
          flex: 1,
          flexDirection: "column",
          padding: "16px"
        }}
      >
        {questions.length === 0 ? (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              height: "100%",
              gap: 12,
            }}
          >
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: "var(--radius-md)",
                background: "var(--bg-surface)",
                border: "1px solid var(--border)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="var(--success)"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <div
              style={{
                fontSize: 12,
                color: "var(--text-secondary)",
                textAlign: "center",
              }}
            >
              No wrong answers yet!
              <br />
              Keep up the great work.
            </div>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {questions.map((q) => (
              <div
                key={q.id}
                style={{
                  background: "var(--bg-surface)",
                  border: "1px solid var(--border)",
                  borderRadius: "var(--radius-sm)",
                  padding: "12px",
                }}
              >
                {/* Question */}
                <div
                  style={{
                    fontSize: 12,
                    color: "var(--text-primary)",
                    fontWeight: 600,
                    marginBottom: 8,
                    lineHeight: 1.4,
                  }}
                >
                  {q.question}
                </div>

                {/* Your Answer */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: 6,
                    marginBottom: 4,
                  }}
                >
                  <div
                    style={{
                      fontSize: 10,
                      color: "var(--danger)",
                      fontWeight: 600,
                    }}
                  >
                    ✗
                  </div>
                  <div
                    style={{
                      flex: 1,
                      fontSize: 11,
                      color: "var(--danger)",
                    }}
                  >
                    Your answer: {q.options[q.selectedIndex] ?? "Unknown"}
                  </div>
                </div>

                {/* Correct Answer */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: 6,
                  }}
                >
                  <div
                    style={{
                      fontSize: 10,
                      color: "var(--success)",
                      fontWeight: 600,
                    }}
                  >
                    ✓
                  </div>
                  <div
                    style={{
                      flex: 1,
                      fontSize: 11,
                      color: "var(--success)",
                    }}
                  >
                    Correct: {q.options[q.correctIndex] ?? "Unknown"}
                  </div>
                </div>

                {/* Date */}
                <div
                  style={{
                    marginTop: 8,
                    paddingTop: 8,
                    borderTop: "1px solid var(--border)",
                    fontSize: 10,
                    color: "var(--text-muted)",
                    fontFamily: "var(--font-display)",
                  }}
                >
                  {new Date(q.createdAt).toLocaleDateString()} at{" "}
                  {new Date(q.createdAt).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
