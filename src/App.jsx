import { useState } from "react";
import Splash from "./ui/Splash";
import ScenarioSelect from "./ui/ScenarioSelect";
import Puzzle20 from "./rompecabezas/Puzzle20";
import JigsawSVG from "./jigsaw/JigsawSVG";
import Header from "./ui/Header";
import "./ui/ui.css";

export default function App() {
  const [screen, setScreen] = useState("home"); // home | select | play
  const [img, setImg] = useState("/images/esc1.jpg");
  const [lastMoves, setLastMoves] = useState(null);
  const [mode, setMode] = useState("grid");     // "grid" (A) | "jigsaw" (B)

  // mismo layout para ambos modos
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
          setLastMoves(null);
          setScreen("play");
        }}
        onBack={() => setScreen("home")}
      />
    );
  }

  return (
    <div className="game-wrap">
      <Header showBack onBack={() => setScreen("select")} />

      {/* Toggle de modo A/B */}
      <div style={{display:"flex",justifyContent:"center",gap:12,margin:"4px 0 12px"}}>
        <button
          className={`btn ${mode==="grid"?"btn-primary":"btn-ghost"}`}
          onClick={()=>setMode("grid")}
        >Modo A: Cuadrícula</button>
        <button
          className={`btn ${mode==="jigsaw"?"btn-primary":"btn-ghost"}`}
          onClick={()=>setMode("jigsaw")}
        >Modo B: Piezas</button>
      </div>

      {/* Marco único 16:9 para ambos modos */}
      <div className="board">
        {mode === "grid" ? (
          // Opción A – llenando el marco
          <Puzzle20
            image={img}
            rows={ROWS}
            cols={COLS}
            className="fill"
            onWin={(moves) => setLastMoves(moves)}
          />
        ) : (
          // Opción B – llenando el marco
          <JigsawSVG
            imageSrc={img}
            rows={ROWS}
            cols={COLS}
            className="fill"
            onSolved={() => setLastMoves(0)}
          />
        )}
      </div>

      {lastMoves != null && (
        <div className="pzl-overlay">
          <div className="pzl-card">
            <h2>¡Puzzle completado! 🎉</h2>
            {mode==="grid" && (
              <div className="subtle">Movimientos: <b>{lastMoves}</b></div>
            )}
            <div style={{ display:"flex", gap:10, justifyContent:"center", marginTop:10 }}>
              <button className="btn btn-primary" onClick={() => setScreen("home")}>
                Volver al Inicio
              </button>
              <button className="btn btn-ghost" onClick={() => setScreen("select")}>
                Elegir otro puzzle
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
