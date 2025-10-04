import React, { useEffect, useState } from "react";

export default function Dashboard({ onOpenDiagram }) {
  const [diagrams, setDiagrams] = useState([]);

  useEffect(() => {
    fetch("http://localhost:8000/diagrams", {
      headers: { Authorization: "Bearer " + localStorage.getItem("token") },
    })
      .then((res) => res.json())
      .then(setDiagrams);
  }, []);

  return (
    <div style={{ padding: 20 }}>
      <h2>Your Diagrams</h2>
      <button onClick={() => onOpenDiagram(null)}>+ New Diagram</button>
      <ul>
        {diagrams.map((d) => (
          <li key={d.id} onClick={() => onOpenDiagram(d)} style={{ cursor: "pointer" }}>
            {d.title || "Untitled Diagram"}
          </li>
        ))}
      </ul>
    </div>
  );
}
