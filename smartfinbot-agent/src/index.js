import "dotenv/config";
import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import { runAgent, clearMemory, getMemory } from "./agent.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "../public")));

function classifyError(err) {
  const msg = err.message || "";

  if (msg.includes("429") || msg.includes("RESOURCE_EXHAUSTED") || msg.includes("quota")) {
    return {
      status: 429,
      error: "⏳ Batas request Gemini API tercapai. Tunggu 1-2 menit lalu coba lagi.",
      detail: "Free tier limit: 20 request/menit, 1500 request/hari.",
    };
  }

  if (msg.includes("API_KEY_INVALID") || msg.includes("API key not valid")) {
    return {
      status: 401,
      error: "🔑 Gemini API Key tidak valid. Periksa file .env kamu.",
      detail: "Pastikan GEMINI_API_KEY sudah diisi dengan benar di file .env",
    };
  }

  if (msg.includes("SAFETY") || msg.includes("safety")) {
    return {
      status: 400,
      error: "⚠️ Pertanyaan ini tidak dapat diproses karena melanggar kebijakan keamanan.",
      detail: "Coba ubah pertanyaan kamu.",
    };
  }

  if (msg.includes("fetch failed") || msg.includes("ECONNREFUSED") || msg.includes("network")) {
    return {
      status: 503,
      error: "🌐 Gagal terhubung ke layanan eksternal. Periksa koneksi internet kamu.",
      detail: msg,
    };
  }

  if (msg.includes("iterasi maksimal")) {
    return {
      status: 500,
      error: "🔄 Agent membutuhkan terlalu banyak langkah. Coba pertanyaan yang lebih spesifik.",
      detail: msg,
    };
  }

  return {
    status: 500,
    error: "❌ Terjadi kesalahan pada server. Silakan coba lagi.",
    detail: msg,
  };
}

app.post("/api/agent", async (req, res) => {
  if (!req.body || typeof req.body !== "object") {
    return res.status(400).json({ error: "Request body harus berupa JSON." });
  }

  const { message, sessionId } = req.body;

  if (!message || typeof message !== "string" || message.trim() === "") {
    return res.status(400).json({ error: "Field 'message' tidak boleh kosong." });
  }

  if (message.trim().length > 1000) {
    return res.status(400).json({ error: "Pesan terlalu panjang. Maksimal 1000 karakter." });
  }

  if (!sessionId || typeof sessionId !== "string") {
    return res.status(400).json({ error: "Field 'sessionId' diperlukan." });
  }

  try {
    console.log(`[Server] Session: ${sessionId} | Message: ${message.trim()}`);

    const result = await runAgent(message.trim(), sessionId);

    return res.status(200).json({
      reply: result.answer,
      meta: {
        iterations: result.iterations,
        tools_used: result.toolsUsed,
        session_id: sessionId,
      },
    });
  } catch (err) {
    console.error("[Server] Error:", err.message);
    const { status, error, detail } = classifyError(err);
    return res.status(status).json({ error, detail });
  }
});

app.delete("/api/agent/memory/:sessionId", (req, res) => {
  try {
    const { sessionId } = req.params;
    const result = clearMemory(sessionId);
    return res.status(200).json(result);
  } catch (err) {
    return res.status(500).json({ error: "Gagal menghapus memory: " + err.message });
  }
});

app.get("/api/agent/memory/:sessionId", (req, res) => {
  try {
    const { sessionId } = req.params;
    const memory = getMemory(sessionId);
    return res.status(200).json({
      session_id: sessionId,
      message_count: memory.history.length,
      created_at: memory.createdAt,
      history_preview: memory.history.slice(-5).map((h) => ({
        role: h.role,
        preview: (h.parts[0]?.text || "").substring(0, 100) + "...",
      })),
    });
  } catch (err) {
    return res.status(500).json({ error: "Gagal membaca memory: " + err.message });
  }
});

app.use((req, res) => {
  res.status(404).json({ error: `Route '${req.path}' tidak ditemukan.` });
});

app.use((err, req, res, next) => {
  console.error("[Server] Unhandled error:", err);
  res.status(500).json({ error: "Terjadi kesalahan tak terduga." });
});

app.listen(PORT, () => {
  console.log(`\n🤖 SmartFinBot Agent berjalan di http://localhost:${PORT}`);
  console.log(`📡 Endpoint: POST http://localhost:${PORT}/api/agent`);
  console.log(`🧠 Memory:   GET  http://localhost:${PORT}/api/agent/memory/:sessionId\n`);
});
