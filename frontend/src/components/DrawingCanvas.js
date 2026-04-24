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
    ctx.strokeStyle = "#000000";
    
    // Fill canvas with a soft moss green-white initially
    ctx.fillStyle = "#f0f7f2";
    ctx.fillRect(0, 0, 740, 500);

    ctxRef.current = ctx;
  }, []);

  useEffect(() => {
    if (ctxRef.current) ctxRef.current.strokeStyle = color;
  }, [color]);

  const getCoordinates = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    let clientX, clientY;
    if (e.touches && e.touches.length > 0) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY
    };
  };

  const start = (e) => {
    const { x, y } = getCoordinates(e);
    ctxRef.current.beginPath();
    ctxRef.current.moveTo(x, y);
    setDrawing(true);
  };

  const draw = (e) => {
    if (!drawing) return;
    const { x, y } = getCoordinates(e);
    ctxRef.current.lineTo(x, y);
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
    
    // Always fill soft green-white before drawing previous state, or as the blank state
    ctxRef.current.fillStyle = "#f0f7f2";
    ctxRef.current.fillRect(0, 0, 740, 500);

    if (newHistory.length) {
      const img = new Image();
      img.src = newHistory[newHistory.length - 1];
      img.onload = () => {
        ctxRef.current.drawImage(img, 0, 0);
      };
    }
  };

  const reset = () => {
    ctxRef.current.fillStyle = "#f0f7f2";
    ctxRef.current.fillRect(0, 0, 740, 500);
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
        onTouchStart={start}
        onTouchMove={draw}
        onTouchEnd={stop}
        onTouchCancel={stop}
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
