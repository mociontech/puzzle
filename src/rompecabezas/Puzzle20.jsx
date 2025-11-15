// src/rompecabezas/Puzzle20.jsx
import { useMemo, useState, useEffect, useRef } from "react";
import "./puzzle20.css";

export default function Puzzle20({
  image,
  rows = 3,
  cols = 5,
  onWin,
  className = "",
}) {
  const ROWS = rows;
  const COLS = cols;
  const COUNT = ROWS * COLS;

  function makeTiles() {
    return Array.from({ length: COUNT }, (_, i) => ({
      correctIndex: i,
      index: i,
    }));
  }

  function shuffle(arr) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    // evita que salga ya ordenado
    if (a.every((t, i) => t.correctIndex === i)) [a[0], a[1]] = [a[1], a[0]];
    return a.map((t, i) => ({ ...t, index: i }));
  }

  const baseTiles = useMemo(() => makeTiles(), []);
  const [tiles, setTiles] = useState(() => shuffle(baseTiles));
  const [moves, setMoves] = useState(0);
  const [selected, setSelected] = useState(null);
  const wrapRef = useRef(null);

  const solved = tiles.every((t, i) => t.correctIndex === i);

  useEffect(() => {
    if (solved && onWin) onWin(moves);
  }, [solved, onWin, moves]);

  function swap(i, j) {
    if (i === j) return;
    setTiles((prev) => {
      const next = [...prev];
      [next[i], next[j]] = [next[j], next[i]];
      return next.map((t, idx) => ({ ...t, index: idx }));
    });
    setMoves((m) => m + 1);
  }

  function onDragStart(e, i) {
    e.dataTransfer.setData("text/plain", String(i));
  }

  function onDrop(e, j) {
    e.preventDefault();
    const i = Number(e.dataTransfer.getData("text/plain"));
    swap(i, j);
  }

  function onDragOver(e) {
    e.preventDefault();
  }

  function handleClick(i) {
    setSelected((sel) => (sel == null ? i : (swap(sel, i), null)));
  }

  function reset() {
    setTiles(shuffle(baseTiles));
    setMoves(0);
    setSelected(null);
  }

  return (
    <div
      ref={wrapRef}
      className={`pzl-wrap ${className}`}
      style={{ width: "100%", height: "100%" }}
    >
      <div className="pzl-toolbar">
        <button onClick={reset}>Mezclar</button>
        <span>Movimientos: {moves}</span>
        {solved && <span className="ok">¡Completado! 🎉</span>}
      </div>

      {/* ⬇️ EL TABLERO REAL (grid 3x5) */}
      <div
        className="pzl-board"
        style={{ "--rows": ROWS, "--cols": COLS }}
        role="grid"
      >
        {tiles.map((t, curPos) => {
          const row = Math.floor(t.correctIndex / COLS);
          const col = t.correctIndex % COLS;

          const bgPosX = (col / (COLS - 1)) * 100;
          const bgPosY = (row / (ROWS - 1)) * 100;

          return (
            <div
              key={curPos}
              className={`pzl-tile ${selected === curPos ? "sel" : ""}`}
              draggable
              onDragStart={(e) => onDragStart(e, curPos)}
              onDrop={(e) => onDrop(e, curPos)}
              onDragOver={onDragOver}
              onClick={() => handleClick(curPos)}
              style={{
                backgroundImage: `url(${image})`,
                backgroundSize: `${COLS * 100}% ${ROWS * 100}%`,
                backgroundPosition: `${bgPosX}% ${bgPosY}%`,
              }}
            />
          );
        })}
      </div>
    </div>
  );
}
