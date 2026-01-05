import React, { useState } from "react";
import DrawingCanvas from "./components/DrawingCanvas";

function App() {
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);

  const handleShare = async (formData) => {
    if (loading) return;

    try {
      setLoading(true);
      setResult("Processing…");

      const res = await fetch("http://localhost:5000/process-image", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (data.error) {
        setResult(data.error);
      } else {
        setResult(data.solution);
      }
    } catch (err) {
      setResult("Failed to process image");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#0f172a",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        paddingTop: 40,
        gap: 16,
      }}
    >
      <h1
        style={{
          color: "#e5e7eb",
          margin: 0,
          marginBottom: 8,
        }}
      >
        GenCalc
      </h1>

      <DrawingCanvas onShare={handleShare} disabled={loading} />

      {/* RESULT BOX */}
      <div
        style={{
          width: 780,
          minHeight: 70,
          background: "#020617",
          border: "2px solid #1e293b",
          borderRadius: 12,
          padding: "14px 18px",
          color: "#e5e7eb",
          fontSize: 20,
          whiteSpace: "pre-wrap",
          lineHeight: 1.5,
          textAlign: "left",
        }}
      >
        {result || "Result will appear here"}
      </div>
    </div>
  );

}

export default App;
