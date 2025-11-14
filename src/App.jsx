// src/App.jsx
import { useState } from "react";
import Splash from "./ui/Splash";
import ScenarioSelect from "./ui/ScenarioSelect";
import Puzzle20 from "./rompecabezas/Puzzle20";
import JigsawSVG from "./jigsaw/JigsawSVG";
import Header from "./ui/Header";
import "./ui/ui.css";

export default function App() {
  const [screen, setScreen] = useState("home");  // home | select | play
  const [img, setImg] = useState("/images/esc1.jpg");
  const [lastMoves, setLastMoves] = useState(null); // <- se usa para A y B
  const [mode, setMode] = useState("grid");         // "grid" (A) | "jigsaw" (B)

  const ROWS = 3;
  const COLS = 5;

  if (screen === "home") {
    return <Splash onStart={() => setScreen("select")} />;
  }

  if (screen === "select") {
    return (
      <ScenarioSelect
        onPick={(picked) => {
          setImg(picked);
          setLastMoves(null);     // reset marcador al cambiar imagen
          setScreen("play");
        }}
        onBack={() => setScreen("home")}
      />
    );
  }

  return (
    <div className="game-wrap">
      <Header showBack onBack={() => { setScreen("select"); setLastMoves(null); }} />

      {/* Toggle de modo A/B */}
      <div style={{display:"flex",justifyContent:"center",gap:12,margin:"4px 0 12px"}}>
        <button
          className={`btn ${mode==="grid"?"btn-primary":"btn-ghost"}`}
          onClick={()=>{ setMode("grid"); setLastMoves(null); }}
        >Modo A: Cuadrícula</button>
        <button
          className={`btn ${mode==="jigsaw"?"btn-primary":"btn-ghost"}`}
          onClick={()=>{ setMode("jigsaw"); setLastMoves(null); }}
        >Modo B: Piezas</button>
      </div>

      {/* Marco 16:9 */}
      <div className="board">
        {mode === "grid" ? (
          <Puzzle20
            image={img}
            rows={ROWS}
            cols={COLS}
            className="fill"
            onWin={(moves) => setLastMoves(moves)}     // ← A manda total
          />
        ) : (
          <JigsawSVG
            imageSrc={img}
            rows={ROWS}
            cols={COLS}
            onSolved={(totalMoves) => setLastMoves(totalMoves)} // ← B manda total
          />
        )}
      </div>

      {/* Overlay único para A y B */}
      {lastMoves != null && (
        <div className="pzl-overlay">
          <div className="pzl-card">
            <h2>¡Rompecabezas completado! 🎉</h2>
            <div className="subtle">Movimientos: <b>{lastMoves}</b></div>
            <div style={{ display:"flex", gap:10, justifyContent:"center", marginTop:10 }}>
              <button className="btn btn-primary"
                      onClick={() => { setScreen("home"); setLastMoves(null); }}>
                Volver al Inicio
              </button>
              <button className="btn btn-ghost"
                      onClick={() => { setScreen("select"); setLastMoves(null); }}>
                Elegir otro puzzle
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
