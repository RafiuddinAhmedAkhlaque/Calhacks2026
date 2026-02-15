import { Router } from "express";
import multer from "multer";
import { db } from "../db/index.js";
import { documents } from "../db/schema.js";
import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import { generateAndStoreQuestions } from "../services/quizGenerator.js";
import { authenticate } from "../middleware.js";
import fs from "fs/promises";

const router = Router();
router.use(authenticate);

const upload = multer({
  dest: "uploads/",
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (_req, file, cb) => {
    const allowed = [
      "application/pdf",
      "text/plain",
      "text/markdown",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];
    // Also allow by extension
    const ext = file.originalname.split(".").pop()?.toLowerCase();
    if (
      allowed.includes(file.mimetype) ||
      ["pdf", "txt", "md", "doc", "docx"].includes(ext || "")
    ) {
      cb(null, true);
    } else {
      cb(new Error("Unsupported file type"));
    }
  },
});

// POST /api/documents/upload
router.post("/upload", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      res.status(400).json({ error: "No file uploaded" });
      return;
    }

    const { roomId } = req.body;
    if (!roomId) {
      res.status(400).json({ error: "roomId is required" });
      return;
    }

    // Extract text content
    let content: string;
    const ext = req.file.originalname.split(".").pop()?.toLowerCase();

    if (ext === "pdf") {
      // Dynamic import for pdf-parse
      const pdfParse = (await import("pdf-parse")).default;
      const buffer = await fs.readFile(req.file.path);
      const pdf = await pdfParse(buffer);
      content = pdf.text;
    } else {
      // Plain text / markdown
      content = await fs.readFile(req.file.path, "utf-8");
    }

    // Clean up temp file
    await fs.unlink(req.file.path).catch(() => {});

    if (!content || content.trim().length < 50) {
      res
        .status(400)
        .json({ error: "Document is too short to generate questions" });
      return;
    }

    // Store document
    const docId = nanoid();
    const now = new Date().toISOString();
    await db.insert(documents).values({
      id: docId,
      roomId,
      filename: req.file.originalname,
      content: content.slice(0, 50000), // cap stored content
      uploadedBy: req.userId!,
      createdAt: now,
    });

    // Generate quiz questions
    let questionCount = 0;
    try {
      questionCount = await generateAndStoreQuestions(docId, roomId, content);
    } catch (err) {
      console.error("[Documents] Quiz generation failed:", err);
      // Still return success - doc is stored, questions can be retried
    }

    res.json({
      id: docId,
      roomId,
      filename: req.file.originalname,
      uploadedBy: req.userId!,
      questionCount,
      createdAt: now,
    });
  } catch (error) {
    console.error("[Documents] Upload error:", error);
    res.status(500).json({ error: "Failed to process document" });
  }
});

// GET /api/documents/:roomId
router.get("/:roomId", async (req, res) => {
  try {
    const docs = await db
      .select({
        id: documents.id,
        roomId: documents.roomId,
        filename: documents.filename,
        uploadedBy: documents.uploadedBy,
        createdAt: documents.createdAt,
      })
      .from(documents)
      .where(eq(documents.roomId, req.params.roomId));

    // Count questions for each doc
    const { questions: questionsTable } = await import("../db/schema.js");
    const result = [];
    for (const doc of docs) {
      const qs = await db
        .select()
        .from(questionsTable)
        .where(eq(questionsTable.documentId, doc.id));
      result.push({ ...doc, questionCount: qs.length });
    }

    res.json(result);
  } catch (error) {
    console.error("[Documents] Error listing documents:", error);
    res.status(500).json({ error: "Failed to list documents" });
  }
});

export default router;
