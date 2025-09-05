// api/chat.js
import fetch from "node-fetch";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { message } = req.body;

    if (!message || message.trim() === "") {
      return res.status(400).json({ error: "Message is required" });
    }

    // ========= GEMINI =========
    let geminiReply = null;
    try {
      const geminiResponse = await fetch(
        "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=" +
          process.env.GEMINI_API_KEY,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: message }] }],
          }),
        }
      );

      const geminiData = await geminiResponse.json();
      console.log("Gemini Response:", geminiData);

      if (geminiData.candidates?.[0]?.content?.parts?.[0]?.text) {
        geminiReply = geminiData.candidates[0].content.parts[0].text;
      } else {
        geminiReply = null;
      }
    } catch (err) {
      console.error("Gemini Error:", err.message);
      geminiReply = null;
    }

    // ========= DEEPAI =========
    let deepAIReply = null;
    try {
      const deepAIResponse = await fetch("https://api.deepai.org/api/text-generator", {
        method: "POST",
        headers: {
          "Api-Key": process.env.DEEPAI_API_KEY,
        },
        body: new URLSearchParams({ text: message }),
      });

      const deepAIData = await deepAIResponse.json();
      console.log("DeepAI Response:", deepAIData);

      if (deepAIData.output) {
        deepAIReply = deepAIData.output;
      } else {
        deepAIReply = null;
      }
    } catch (err) {
      console.error("DeepAI Error:", err.message);
      deepAIReply = null;
    }

    // ========= ENSEMBLE =========
    let finalReply = null;
    if (geminiReply && deepAIReply) {
      finalReply = `${geminiReply}\n\n---\nDeepAI juga bilang:\n${deepAIReply}`;
    } else if (geminiReply) {
      finalReply = geminiReply;
    } else if (deepAIReply) {
      finalReply = deepAIReply;
    } else {
      finalReply = "⚠️ Tidak ada hasil ensemble.";
    }

    return res.status(200).json({
      gemini: geminiReply || "❌ Tidak ada respon Gemini.",
      deepai: deepAIReply || "❌ Tidak ada respon DeepAI.",
      ensemble: finalReply,
    });
  } catch (err) {
    console.error("Server Error:", err.message);
    return res.status(500).json({ error: "Internal Server Error" });
  }
}
