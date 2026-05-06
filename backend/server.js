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

// ------------------ Checking Backend ------------------
app.get("/", (req, res) => {
  res.send("Backend alive. Routes loaded.");
});

app.use(express.json());
// ------------------ Middleware ------------------
app.use(cors());

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
      'You are an advanced AI solver. Analyze the provided image which may contain mathematical equations (from basic arithmetic to calculus), word problems, or general questions. ' +
      'Solve the problem step-by-step and provide a clear, accurate final answer. ' +
      'If it is a math problem, show your working. ' +
      'If it is a general question, provide a detailed and helpful response.';

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

    const url = `https://generativelanguage.googleapis.com/v1beta/${MODEL_ID}:generateContent?key=${GEMINI_API_KEY}`;

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
      const errorMessage = data?.error?.message || "Gemini API failed";
      return res.status(500).json({
        error: `Gemini Error: ${errorMessage}`,
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
