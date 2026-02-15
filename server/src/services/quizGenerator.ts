import OpenAI from "openai";
import { db } from "../db/index.js";
import { questions } from "../db/schema.js";
import { nanoid } from "nanoid";
import { eq } from "drizzle-orm";

// Groq uses an OpenAI-compatible API
const groq = new OpenAI({
  apiKey: process.env.GROQ_API_KEY || "missing",
  baseURL: "https://api.groq.com/openai/v1",
});

interface GeneratedQuestion {
  question: string;
  options: string[];
  correctIndex: number;
}

// Retry helper with exponential backoff
async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 3000
): Promise<T> {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error: any) {
      const status = error?.status || error?.statusCode;
      const isRetryable = status === 429 || status === 503;

      if (!isRetryable || attempt === maxRetries) {
        throw error;
      }

      const delay = baseDelay * Math.pow(2, attempt);
      console.log(
        `[QuizGen] Rate limited. Retrying in ${delay / 1000}s (attempt ${attempt + 1}/${maxRetries})...`
      );
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
  throw new Error("Max retries exceeded");
}

export async function generateQuestionsFromText(
  text: string,
  count: number = 10
): Promise<GeneratedQuestion[]> {
  const prompt = `You are a quiz question generator. Given the following study material, generate exactly ${count} multiple-choice questions. Each question should:
1. Test understanding of key concepts from the material
2. Have exactly 4 options (A, B, C, D)
3. Have exactly one correct answer
4. Be clear and unambiguous

Study Material:
---
${text.slice(0, 8000)}
---

Respond ONLY with a valid JSON array. No markdown, no code fences, just the raw JSON. Each object must have:
- "question": string (the question text)
- "options": string[] (exactly 4 options)
- "correctIndex": number (0-3, index of the correct option)

Example: [{"question": "What is X?", "options": ["A", "B", "C", "D"], "correctIndex": 2}]`;

  return withRetry(async () => {
    console.log("[QuizGen] Sending request to Groq...");

    const response = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
    });

    const content = response.choices[0]?.message?.content?.trim();
    if (!content) throw new Error("Empty response from Groq");

    console.log("[QuizGen] Got response, parsing JSON...");

    // Extract JSON from response (handle markdown code blocks)
    const jsonMatch = content.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      console.error("[QuizGen] Raw response:", content.slice(0, 500));
      throw new Error("No JSON array found in response");
    }

    const parsed: GeneratedQuestion[] = JSON.parse(jsonMatch[0]);

    // Validate
    const valid = parsed.filter(
      (q) =>
        q.question &&
        Array.isArray(q.options) &&
        q.options.length === 4 &&
        typeof q.correctIndex === "number" &&
        q.correctIndex >= 0 &&
        q.correctIndex <= 3
    );

    console.log(
      `[QuizGen] Generated ${valid.length} valid questions out of ${parsed.length}`
    );
    return valid;
  });
}

export async function generateAndStoreQuestions(
  documentId: string,
  roomId: string,
  text: string
): Promise<number> {
  const generated = await generateQuestionsFromText(text, 10);
  const now = new Date().toISOString();

  for (const q of generated) {
    await db.insert(questions).values({
      id: nanoid(),
      documentId,
      roomId,
      question: q.question,
      options: JSON.stringify(q.options),
      correctIndex: q.correctIndex,
      createdAt: now,
    });
  }

  return generated.length;
}

export async function getRandomQuestions(roomId: string, count: number = 5) {
  const allQuestions = await db
    .select()
    .from(questions)
    .where(eq(questions.roomId, roomId));

  if (allQuestions.length === 0) {
    return [];
  }

  // Shuffle and pick
  const shuffled = allQuestions.sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count).map((q) => ({
    id: q.id,
    question: q.question,
    options: JSON.parse(q.options) as string[],
    correctIndex: q.correctIndex,
  }));
}
