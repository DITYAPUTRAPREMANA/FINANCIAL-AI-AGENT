import { GoogleGenAI } from "@google/genai";
import { toolDeclarations, handleToolCall } from "./tools.js";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
const GEMINI_MODEL = "gemini-2.5-flash";
const MAX_ITERATIONS = 10;

const SYSTEM_INSTRUCTION = `Kamu adalah SmartFinBot, asisten keuangan pribadi yang cerdas dan edukatif untuk pengguna Indonesia.

Kemampuanmu:
- Mengecek harga cryptocurrency secara real-time
- Mengonversi kurs mata uang
- Menghitung bunga majemuk, ROI, DCA, dan cicilan pinjaman
- Mencari berita pasar keuangan terbaru
- Melacak dan menghitung nilai portofolio aset
- Memberikan edukasi dan saran finansial

Aturan penting:
1. Selalu gunakan tools yang tersedia untuk data real-time — jangan mengarang angka
2. Jawab dalam Bahasa Indonesia yang ramah dan mudah dipahami
3. Tambahkan disclaimer bahwa ini adalah edukasi, BUKAN saran investasi resmi
4. Jika user menyebut beberapa aset sekaligus, gunakan track_portfolio
5. Untuk pertanyaan strategi, gunakan get_financial_advice
6. Selalu format angka dalam Rupiah (IDR) kecuali diminta lain
7. Berikan konteks dan penjelasan, bukan sekadar angka mentah`;

const memoryStore = new Map();

export function getMemory(sessionId) {
  if (!memoryStore.has(sessionId)) {
    memoryStore.set(sessionId, {
      history: [],
      userProfile: { riskProfile: null, assets: [] },
      createdAt: new Date().toISOString(),
    });
  }
  return memoryStore.get(sessionId);
}

export function updateMemory(sessionId, role, content) {
  const memory = getMemory(sessionId);
  memory.history.push({ role, parts: [{ text: content }] });

  if (memory.history.length > 20) {
    memory.history = memory.history.slice(-20);
  }

  memoryStore.set(sessionId, memory);
}

export function clearMemory(sessionId) {
  memoryStore.delete(sessionId);
  return { message: "Riwayat percakapan telah dihapus." };
}

export async function runAgent(userMessage, sessionId) {
  const memory = getMemory(sessionId);

  updateMemory(sessionId, "user", userMessage);

  const contents = memory.history.map(({ role, parts }) => ({ role, parts }));

  let iterations = 0;

  while (iterations < MAX_ITERATIONS) {
    iterations++;

    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        temperature: 0.7,
        tools: [{ functionDeclarations: toolDeclarations }],
      },
    });

    const candidate = response.candidates?.[0];
    if (!candidate) throw new Error("Tidak ada respons dari Gemini");

    const parts = candidate.content?.parts || [];

    const functionCalls = parts.filter((p) => p.functionCall);

    if (functionCalls.length === 0) {
      const textPart = parts.find((p) => p.text);
      const finalAnswer = textPart?.text || "Maaf, saya tidak dapat memberikan jawaban saat ini.";

      updateMemory(sessionId, "model", finalAnswer);

      return {
        answer: finalAnswer,
        iterations,
        sessionId,
        toolsUsed: memory.toolsUsed || [],
      };
    }

    const toolResults = [];
    if (!memory.toolsUsed) memory.toolsUsed = [];

    for (const part of functionCalls) {
      const { name, args } = part.functionCall;
      console.log(`[Agent] Tool call: ${name}`, args);

      memory.toolsUsed.push(name);
      const result = await handleToolCall(name, args, memory);

      toolResults.push({
        functionResponse: {
          name,
          response: { result },
        },
      });
    }

    contents.push({ role: "model", parts });

    contents.push({ role: "user", parts: toolResults });

    const toolNames = functionCalls.map((p) => p.functionCall.name).join(", ");
    console.log(`[Agent] Iteration ${iterations}: Used tools: ${toolNames}`);
  }

  throw new Error("Agent melebihi batas iterasi maksimal.");
}
