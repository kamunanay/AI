// api/chat.js
import fetch from "node-fetch";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { message } = req.body;

  if (!message) {
    return res.status(400).json({ error: "Message is required" });
  }

  try {
    // ===== GEMINI =====
    let geminiText = null;
    try {
      const geminiRes = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${process.env.GEMINI_API_KEY}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: message }] }]
          })
        }
      );

      const geminiData = await geminiRes.json();
      console.log("Gemini Response:", geminiData);

      geminiText =
        geminiData?.candidates?.[0]?.content?.parts?.[0]?.text || null;
    } catch (err) {
      console.error("Gemini Error:", err);
    }

    // ===== DEEPAI =====
    let deepText = null;
    try {
      const deepRes = await fetch("https://api.deepai.org/api/text-generator", {
        method: "POST",
        headers: {
          "Api-Key": process.env.DEEPAI_API_KEY,
          "Content-Type": "application/x-www-form-urlencoded"
        },
        body: new URLSearchParams({ text: message })
      });

      const deepData = await deepRes.json();
      console.log("DeepAI Response:", deepData);

      deepText = deepData?.output || null;
    } catch (err) {
      console.error("DeepAI Error:", err);
    }

    // ===== Gabungan / Ensemble =====
    let finalText = null;
    if (geminiText && deepText) {
      finalText = `[Gemini]: ${geminiText}\n\n[DeepAI]: ${deepText}`;
    } else if (geminiText) {
      finalText = `[Gemini]: ${geminiText}`;
    } else if (deepText) {
      finalText = `[DeepAI]: ${deepText}`;
    }

    if (!finalText) {
      return res.status(500).json({
        error: "Tidak ada hasil ensemble",
        gemini: geminiText,
        deepai: deepText
      });
    }

    return res.status(200).json({
      gemini: geminiText,
      deepai: deepText,
      ensemble: finalText
    });
  } catch (err) {
    console.error("Handler Error:", err);
    return res.status(500).json({ error: "Internal Server Error" });
  }
        }
