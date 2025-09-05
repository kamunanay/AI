const chatBox = document.getElementById("chat-box");
const input = document.getElementById("user-input");
const sendBtn = document.getElementById("send-btn");

function addMessage(text, role) {
  const msg = document.createElement("div");
  msg.classList.add("message", role);
  msg.textContent = text;
  chatBox.appendChild(msg);
  chatBox.scrollTop = chatBox.scrollHeight;
}

async function sendMessage() {
  const message = input.value.trim();
  if (!message) return;

  addMessage(message, "user");
  input.value = "";

  // loading bubble
  const loading = document.createElement("div");
  loading.classList.add("message", "ai");
  loading.textContent = "Mengetik...";
  chatBox.appendChild(loading);
  chatBox.scrollTop = chatBox.scrollHeight;

  try {
    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message })
    });
    const data = await res.json();

    chatBox.removeChild(loading);

    addMessage(data.final || "❌ Tidak ada hasil ensemble.", "ai");
    document.getElementById("gemini").textContent =
      data.gemini || "❌ Tidak ada respon Gemini.";
    document.getElementById("deepai").textContent =
      data.deepai || "❌ Tidak ada respon DeepAI.";
    document.getElementById("final").textContent =
      data.final || "❌ Tidak ada hasil ensemble.";
  } catch (err) {
    chatBox.removeChild(loading);
    addMessage("⚠️ Error koneksi ke server.", "ai");
  }
}

sendBtn.addEventListener("click", sendMessage);
input.addEventListener("keypress", (e) => {
  if (e.key === "Enter") sendMessage();
});
