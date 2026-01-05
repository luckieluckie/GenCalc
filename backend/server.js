// server.js
const express = require("express");
const multer = require("multer");
const cors = require("cors");
require("dotenv").config();

// ------------------ Node fetch (safe for all Node versions) ------------------
const fetch = (...args) =>
  import("node-fetch").then(({ default: fetch }) => fetch(...args));

const app = express();
const port = process.env.PORT || 5000;

// ------------------ Middleware ------------------
app.use(express.json());

app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:3000",
  })
);

// ------------------ Multer (in-memory upload) ------------------
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5 MB
  },
});

// ------------------ Config ------------------
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const MODEL_ID = process.env.GENAI_MODEL_ID || "models/gemini-1.5-flash";

if (!GEMINI_API_KEY) {
  console.error("❌ GEMINI_API_KEY is missing");
  process.exit(1);
}

// ------------------ Health Check ------------------
app.get("/", (req, res) => {
  res.json({ status: "GenCalc backend running" });
});

// ------------------ Clean Gemini Output ------------------
function cleanGeminiOutput(text) {
  if (!text) return "";

  return text
    .replace(/\\boxed\{([^}]+)\}/g, "$1")
    .replace(/\$/g, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

// ------------------ Process Image ------------------
app.post("/process-image", upload.single("image"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No image uploaded" });
    }

    const base64Image = req.file.buffer.toString("base64");

    const instruction =
      'Calculate the equation given in the image.'+
      ' Use only the symbols +, -, *, / and parenthesis.'+
      ' Detect decimals (e.g. 2.5 + 3.5).'+
      ' Return only the computed numeric solution and short explanation if needed.';

    const requestBody = {
      contents: [
        {
          parts: [
            {
              inlineData: {
                mimeType: req.file.mimetype || "image/png",
                data: base64Image,
              },
            },
            {
              text: instruction,
            },
          ],
        },
      ],
    };

    const url = `https://generativelanguage.googleapis.com/v1/${MODEL_ID}:generateContent?key=${GEMINI_API_KEY}`;

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("❌ Gemini API error:", data);
      return res.status(500).json({
        error: "Gemini API failed",
        details: data,
      });
    }

    // Defensive extraction
    const parts = data?.candidates?.[0]?.content?.parts || [];

    const rawText = parts
      .filter((p) => typeof p.text === "string")
      .map((p) => p.text)
      .join("\n");

    const cleanedText = cleanGeminiOutput(rawText);

    if (!cleanedText) {
      return res.status(500).json({
        error: "Failed to extract answer from image",
      });
    }

    res.json({ solution: cleanedText });
  } catch (err) {
    console.error("❌ Server error:", err);
    res.status(500).json({
      error: "Internal server error",
      details: err.message,
    });
  }
});

// ------------------ Start Server ------------------
app.listen(port, () => {
  console.log(`✅ Server running on http://localhost:${port}`);
  console.log("Using model:", MODEL_ID);
});
