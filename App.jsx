import React, { useState } from "react";
import AuthForm from "./components/AuthForm";
import Dashboard from "./pages/Dashboard";
import CanvasBoard from "./components/CanvasBoard";

export default function App() {
  const [authenticated, setAuthenticated] = useState(!!localStorage.getItem("token"));
  const [currentDiagram, setCurrentDiagram] = useState(null);

  if (!authenticated) return <AuthForm onAuth={() => setAuthenticated(true)} />;

  if (!currentDiagram) return <Dashboard onOpenDiagram={setCurrentDiagram} />;

  return <CanvasBoard diagram={currentDiagram} onBack={() => setCurrentDiagram(null)} />;
}
