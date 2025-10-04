import React from "react";

export default function Toolbar({ tool, setTool, color, setColor, lineWidth, setLineWidth, sendImageToBackend, undo }) {
  return (
    <div style={{ padding: 10, background: "#f0f0f0", display: "flex", gap: 10 }}>
      <button onClick={() => setTool("pen")} style={{ background: tool === "pen" ? "#ddd" : "#fff" }}>Pen</button>
      <button onClick={() => setTool("eraser")} style={{ background: tool === "eraser" ? "#ddd" : "#fff" }}>Eraser</button>
      <input type="color" value={color} onChange={(e) => setColor(e.target.value)} />
      <input type="range" min="1" max="10" value={lineWidth} onChange={(e) => setLineWidth(Number(e.target.value))} />
      <button onClick={undo}>Undo</button>
      <button onClick={sendImageToBackend}>Clean (AI)</button>
    </div>
  );
}
