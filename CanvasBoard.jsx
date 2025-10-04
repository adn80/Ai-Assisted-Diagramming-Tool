import React, { useRef, useEffect, useState } from "react";
import io from "socket.io-client";
import Toolbar from "./Toolbar";

const socket = io("http://localhost:8000");

export default function CanvasBoard({ diagram, onBack }) {
  const canvasRef = useRef(null);
  const ctxRef = useRef(null);
  const drawing = useRef(false);

  const [tool, setTool] = useState("pen");
  const [color, setColor] = useState("#000000");
  const [lineWidth, setLineWidth] = useState(2);
  const [undoStack, setUndoStack] = useState([]);
  const [preview, setPreview] = useState(null);

  // Setup canvas + sockets
  useEffect(() => {
    const canvas = canvasRef.current;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight - 80;
    const ctx = canvas.getContext("2d");
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctxRef.current = ctx;

    socket.on("beginPath", ({ x, y }) => {
      ctx.beginPath();
      ctx.moveTo(x, y);
    });

    socket.on("draw", ({ x, y, color, lineWidth }) => {
      ctx.strokeStyle = color;
      ctx.lineWidth = lineWidth;
      ctx.lineTo(x, y);
      ctx.stroke();
    });

    return () => {
      socket.off("beginPath");
      socket.off("draw");
    };
  }, []);

  // Drawing events
  const handleMouseDown = (e) => {
    drawing.current = true;
    const { offsetX, offsetY } = e.nativeEvent;
    ctxRef.current.beginPath();
    ctxRef.current.moveTo(offsetX, offsetY);
    pushUndo();
    socket.emit("beginPath", { x: offsetX, y: offsetY });
  };

  const handleMouseMove = (e) => {
    if (!drawing.current) return;
    const { offsetX, offsetY } = e.nativeEvent;
    ctxRef.current.strokeStyle = tool === "eraser" ? "#ffffff" : color;
    ctxRef.current.lineWidth = lineWidth;
    ctxRef.current.lineTo(offsetX, offsetY);
    ctxRef.current.stroke();
    socket.emit("draw", { x: offsetX, y: offsetY, color, lineWidth });
  };

  const handleMouseUp = () => {
    drawing.current = false;
  };

  // Undo
  const pushUndo = () => {
    const snapshot = canvasRef.current.toDataURL();
    setUndoStack((prev) => [...prev, snapshot]);
  };

  const undo = () => {
    if (undoStack.length === 0) return;
    const last = undoStack[undoStack.length - 1];
    setUndoStack(undoStack.slice(0, -1));
    const img = new Image();
    img.src = last;
    img.onload = () => {
      ctxRef.current.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      ctxRef.current.drawImage(img, 0, 0);
    };
  };

  // AI cleanup
  const captureCanvasBlob = () => {
    return new Promise((resolve) => {
      canvasRef.current.toBlob((blob) => resolve(blob), "image/png");
    });
  };

  const sendImageToBackend = async () => {
    const blob = await captureCanvasBlob();
    const formData = new FormData();
    formData.append("image", blob);

    const response = await fetch("http://localhost:8000/ai/cleanup", {
      method: "POST",
      body: formData,
    });
    const data = await response.json();
    setPreview(data);
  };

  const applyPreview = () => {
    if (!preview) return;
    if (preview.type === "image") {
      const img = new Image();
      img.src = preview.cleanedImage;
      img.onload = () => {
        ctxRef.current.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
        ctxRef.current.drawImage(img, 0, 0);
      };
    }
    setPreview(null);
  };

  // Save diagram
  const saveDiagram = async () => {
    const blob = await captureCanvasBlob();
    const formData = new FormData();
    formData.append("image", blob);
    await fetch("http://localhost:8000/diagrams", {
      method: "POST",
      headers: { Authorization: "Bearer " + localStorage.getItem("token") },
      body: formData,
    });
    alert("Diagram saved!");
  };

  return (
    <div>
      <Toolbar
        tool={tool}
        setTool={setTool}
        color={color}
        setColor={setColor}
        lineWidth={lineWidth}
        setLineWidth={setLineWidth}
        sendImageToBackend={sendImageToBackend}
        undo={undo}
      />
      <button onClick={onBack}>Back</button>
      <button onClick={saveDiagram}>Save</button>

      <canvas
        ref={canvasRef}
        style={{ border: "1px solid #ccc", cursor: tool === "pen" ? "crosshair" : "default" }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
      />

      {preview && (
        <div style={{ position: "absolute", top: 100, left: 50, background: "#fff", padding: 20 }}>
          <h3>AI Preview</h3>
          {preview.type === "image" && <img src={preview.cleanedImage} alt="cleaned" width={400} />}
          <button onClick={applyPreview}>Apply</button>
          <button onClick={() => setPreview(null)}>Cancel</button>
        </div>
      )}
    </div>
  );
}
