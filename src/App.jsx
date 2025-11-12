import { useState } from "react";
import Splash from "./ui/Splash";
import ScenarioSelect from "./ui/ScenarioSelect";
import Puzzle20 from "./rompecabezas/Puzzle20";
import JigsawSVG from "./jigsaw/JigsawSVG";           // <-- opción B
import Header from "./ui/Header";
import "./ui/ui.css";

export default function App() {
  const [screen, setScreen] = useState("home"); // home | select | play
  const [img, setImg] = useState("/images/esc1.jpg");
  const [lastMoves, setLastMoves] = useState(null);
  const [mode, setMode] = useState("grid");     // "grid" (A) | "jigsaw" (B)

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

  // PLAY
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

      {/* Render según modo */}
      {mode === "grid" ? (
        <Puzzle20 image={img} width={1200} onWin={(moves) => setLastMoves(moves)} />
      ) : (
        <JigsawSVG imageSrc={img} rows={3} cols={5} onSolved={() => setLastMoves(0)} />
      )}

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





