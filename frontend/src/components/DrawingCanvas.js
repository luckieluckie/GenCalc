import React, { useRef, useState, useEffect } from "react";
import "./DrawingCanvas.css";

const colors = [
  "#000000",
  "#ef4444",
  "#22c55e",
  "#3b82f6",
  "#eab308",
  "#ec4899",
  "#06b6d4",
  "#f97316",
  "#a855f7",
  "#ffffff",
];

export default function DrawingCanvas({ onShare }) {
  const canvasRef = useRef(null);
  const ctxRef = useRef(null);

  const [drawing, setDrawing] = useState(false);
  const [color, setColor] = useState("#000000");
  const [history, setHistory] = useState([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    canvas.width = 740;
    canvas.height = 500;

    const ctx = canvas.getContext("2d");
    ctx.lineCap = "round";
    ctx.lineWidth = 4;
    ctx.strokeStyle = color;
    ctxRef.current = ctx;
  }, []);

  useEffect(() => {
    if (ctxRef.current) ctxRef.current.strokeStyle = color;
  }, [color]);

  const start = (e) => {
    ctxRef.current.beginPath();
    ctxRef.current.moveTo(e.nativeEvent.offsetX, e.nativeEvent.offsetY);
    setDrawing(true);
  };

  const draw = (e) => {
    if (!drawing) return;
    ctxRef.current.lineTo(e.nativeEvent.offsetX, e.nativeEvent.offsetY);
    ctxRef.current.stroke();
  };

  const stop = () => {
    if (!drawing) return;
    ctxRef.current.closePath();
    setDrawing(false);
    setHistory((h) => [...h, canvasRef.current.toDataURL()]);
  };

  const undo = () => {
    if (!history.length) return;
    const newHistory = history.slice(0, -1);
    setHistory(newHistory);
    const img = new Image();
    img.src = newHistory[newHistory.length - 1];
    img.onload = () => {
      ctxRef.current.clearRect(0, 0, 740, 500);
      if (newHistory.length) ctxRef.current.drawImage(img, 0, 0);
    };
  };

  const reset = () => {
    ctxRef.current.clearRect(0, 0, 740, 500);
    setHistory([]);
  };

  const share = async () => {
    const canvas = canvasRef.current;

    canvas.toBlob((blob) => {
        if (!blob) return;

        const formData = new FormData();
        formData.append("image", blob, "canvas.png");

        onShare(formData);
    }, "image/png");
  };


  return (
    <div className="board">
        <canvas
        ref={canvasRef}
        className="canvas-surface"
        onMouseDown={start}
        onMouseMove={draw}
        onMouseUp={stop}
        onMouseLeave={stop}
        />

        <div className="controls">
        <div className="palette">
            {colors.map((c) => (
            <button
                key={c}
                className={`color-btn ${color === c ? "active" : ""}`}
                style={{ background: c }}
                onClick={() => setColor(c)}
            />
            ))}
        </div>

        <div className="actions">
            <button className="action-btn" onClick={undo}>Undo</button>
            <button className="action-btn" onClick={reset}>Reset</button>
            <button className="action-btn primary" onClick={share}>Share</button>
        </div>
        </div>
    </div>
    );

}
