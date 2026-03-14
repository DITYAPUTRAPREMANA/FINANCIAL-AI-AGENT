const SESSION_ID = "session_" + Math.random().toString(36).substring(2, 10);

const chatBox = document.getElementById("chat-box");
const userInput = document.getElementById("user-input");
const sendBtn = document.getElementById("send-btn");
const clearBtn = document.getElementById("clear-btn");

async function sendMessage(messageText) {
  const message = messageText || userInput.value.trim();
  if (!message) return;

  appendMessage("user", message);
  userInput.value = "";
  setLoading(true);

  const thinkingEl = appendThinking();

  try {
    const response = await fetch("/api/agent", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message, sessionId: SESSION_ID }),
    });

    const data = await response.json();

    thinkingEl.remove();

    if (!response.ok) {
      const errorMsg = data.error || "Terjadi kesalahan pada server.";
      const detailMsg = data.detail ? `\n\n_${data.detail}_` : "";
      if (response.status === 429) {
        appendMessage("bot", `⏳ **Batas request tercapai.**\n\nSilakan tunggu 1-2 menit lalu coba lagi.\n\n`);
      } else if (response.status === 401) {
        appendMessage("bot", `🔑 **API Key tidak valid.**\n\nPeriksa file \`.env\` dan pastikan \`GEMINI_API_KEY\` sudah diisi dengan benar.`);
      } else if (response.status === 503) {
        appendMessage("bot", `🌐 **Koneksi bermasalah.**\n\nGagal terhubung ke layanan eksternal. Periksa koneksi internet kamu.`);
      } else {
        appendMessage("bot", `❌ ${errorMsg}${detailMsg}`);
      }
      return;
    }

    appendBotResponse(data.reply, data.meta?.tools_used || []);
  } catch (err) {
    thinkingEl.remove();
    appendMessage("bot", "❌ Gagal terhubung ke server. Pastikan server sudah berjalan.");
    console.error(err);
  } finally {
    setLoading(false);
  }
}

function sendSuggestion(text) {
  userInput.value = text;
  sendMessage(text);
}
window.sendSuggestion = sendSuggestion;

function appendMessage(sender, text) {
  const wrapper = document.createElement("div");
  wrapper.classList.add("message", sender === "user" ? "user-message" : "bot-message");

  const avatar = document.createElement("span");
  avatar.classList.add("avatar");
  avatar.textContent = sender === "user" ? "👤" : "💰";

  const bubble = document.createElement("div");
  bubble.classList.add("bubble");
  bubble.innerHTML = formatText(text);

  wrapper.appendChild(avatar);
  wrapper.appendChild(bubble);
  chatBox.appendChild(wrapper);
  scrollToBottom();
  return wrapper;
}

function appendBotResponse(text, toolsUsed) {
  const wrapper = document.createElement("div");
  wrapper.classList.add("message", "bot-message");

  const avatar = document.createElement("span");
  avatar.classList.add("avatar");
  avatar.textContent = "💰";

  const bubble = document.createElement("div");
  bubble.classList.add("bubble");
  bubble.innerHTML = formatText(text);

  if (toolsUsed && toolsUsed.length > 0) {
    const badgesDiv = document.createElement("div");
    badgesDiv.classList.add("tools-badge");

    const uniqueTools = [...new Set(toolsUsed)];
    uniqueTools.forEach((tool) => {
      const tag = document.createElement("span");
      tag.classList.add("tool-tag");
      tag.textContent = "🔧 " + tool.replace(/_/g, " ");
      badgesDiv.appendChild(tag);
    });

    bubble.appendChild(badgesDiv);
  }

  wrapper.appendChild(avatar);
  wrapper.appendChild(bubble);
  chatBox.appendChild(wrapper);
  scrollToBottom();
}

function appendThinking() {
  const wrapper = document.createElement("div");
  wrapper.classList.add("message", "bot-message", "thinking");

  const avatar = document.createElement("span");
  avatar.classList.add("avatar");
  avatar.textContent = "💰";

  const bubble = document.createElement("div");
  bubble.classList.add("bubble");
  bubble.textContent = "🤔 Agent sedang menganalisis dan mencari data...";

  wrapper.appendChild(avatar);
  wrapper.appendChild(bubble);
  chatBox.appendChild(wrapper);
  scrollToBottom();
  return wrapper;
}

function formatText(text) {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.*?)\*/g, "<em>$1</em>")
    .replace(/`(.*?)`/g, "<code>$1</code>")
    .replace(/\n/g, "<br/>")
    .replace(/^- (.+)/gm, "<li>$1</li>")
    .replace(/(<li>.*<\/li>)/gs, "<ul>$1</ul>");
}

function setLoading(isLoading) {
  sendBtn.disabled = isLoading;
  userInput.disabled = isLoading;
  sendBtn.textContent = isLoading ? "..." : "Kirim";
}

function scrollToBottom() {
  chatBox.scrollTop = chatBox.scrollHeight;
}

sendBtn.addEventListener("click", () => sendMessage());

userInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    sendMessage();
  }
});

clearBtn.addEventListener("click", async () => {
  if (!confirm("Hapus semua riwayat percakapan?")) return;
  try {
    await fetch(`/api/agent/memory/${SESSION_ID}`, { method: "DELETE" });
    chatBox.innerHTML = "";
    appendMessage("bot", "✅ Riwayat percakapan telah dihapus. Mulai percakapan baru!");
  } catch (err) {
    console.error("Gagal menghapus memory:", err);
  }
});
