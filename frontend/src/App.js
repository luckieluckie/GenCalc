import React, { useState } from "react";
import DrawingCanvas from "./components/DrawingCanvas";
import "./App.css";

function App() {
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);


  const handleShare = async (formData) => {
    if (loading) return;

    try {
      setLoading(true);
      setResult("Processing…");

      const baseUrl = process.env.REACT_APP_API_URL || `http://${window.location.hostname}:5000`;
      const backendUrl = `${baseUrl}/process-image`;
      const res = await fetch(backendUrl, {
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
    <div className="app-container">
      <h1 className="app-title">GenCalc</h1>

      <DrawingCanvas onShare={handleShare} disabled={loading} />

      {/* RESULT BOX */}
      <div className={`result-box ${loading ? 'loading' : result ? 'loaded' : ''}`}>
        {result || "Result will appear here"}
      </div>
    </div>
  );

}

export default App;
