// src/jigsaw/JigsawSVG.jsx
import { useEffect, useMemo, useRef, useState } from "react";
import { generatePiecesClassic } from "./jigsawClassic";
import "./jigsaw.css";

const SNAP_THRESH = 0.35;             // distancia (en celdas) para hacer snap
const LOCK_ON_SNAP = false;           // si true, bloquea la pieza al encajar
const IMG_FIT = "cover";
const PRESERVE = IMG_FIT === "cover" ? "xMidYMid slice" : "xMidYMid meet";

const BOARD_STROKE = "rgba(255,255,255,.55)";
const BOARD_RADIUS = 0.28;

export default function JigsawSVG({
  imageSrc,
  rows = 3,
  cols = 5,
  onSolved,               // callback(totalMoves)
  className = ""
}) {
  // geometría base de las piezas
  const base = useMemo(
    () => generatePiecesClassic(rows, cols, 0.18),  // tabR clásico
    [rows, cols]
  );

  // estado runtime
  const [pieces, setPieces] = useState(() => scatter(base));
  const [moves, setMoves] = useState(0);

  // refs auxiliares
  const svgRef = useRef(null);
  const scaleRef = useRef({ sx: 1, sy: 1 });
  const solvedRef = useRef(false);     // evitar doble onSolved
  const dragSessionRef = useRef(0);    // asegurar 1 movimiento por arrastre

  // medir tamaño para convertir px -> unidades del viewBox
  useEffect(() => {
    function measure() {
      if (!svgRef.current) return;
      const r = svgRef.current.getBoundingClientRect();
      scaleRef.current = { sx: r.width / cols, sy: r.height / rows };
    }
    measure();
    const ro = new ResizeObserver(measure);
    if (svgRef.current) ro.observe(svgRef.current);
    return () => ro.disconnect();
  }, [cols, rows]);

  // notificar completado (una sola vez)
  useEffect(() => {
    const done = pieces.every(p => p.tx === 0 && p.ty === 0);
    if (done && !solvedRef.current) {
      solvedRef.current = true;
      onSolved?.(moves);
    }
  }, [pieces, moves, onSolved]);

  return (
    <div className={className} style={{ width: "100%", height: "100%" }}>
      <div className="pzl-toolbar" style={{ marginBottom: 8 }}>
        <button
          onClick={() => {
            setPieces(scatter(base));
            setMoves(0);
            solvedRef.current = false;
          }}
        >
          Mezclar
        </button>
        <span>Movimientos: {moves}</span>
      </div>

      <svg
        ref={svgRef}
        className="jig"
        viewBox={`0 0 ${cols} ${rows}`}
        width="100%"
        height="100%"
        style={{ touchAction: "none" }}
        shapeRendering="geometricPrecision"
      >
        <defs>
          <clipPath id="board-clip">
            <rect
              x="0"
              y="0"
              width={cols}
              height={rows}
              rx={BOARD_RADIUS}
              ry={BOARD_RADIUS}
            />
          </clipPath>
        </defs>

        <g clipPath="url(#board-clip)">
          {pieces
            .slice()
            .sort((a, b) => a.z - b.z)
            .map((p) => {
              const id = `piece-${p.r}-${p.c}`;
              return (
                <g
                  key={id}
                  className="jig-piece"
                  transform={`translate(${p.c + p.tx}, ${p.r + p.ty})`}
                  onPointerDown={(e) => startDrag(e, p.r, p.c)}
                  pointerEvents="all"
                >
                  <clipPath id={`clip-${id}`}>
                    <path d={p.d} />
                  </clipPath>

                  <image
                    href={imageSrc}
                    x={-p.c}
                    y={-p.r}
                    width={cols}
                    height={rows}
                    preserveAspectRatio={PRESERVE}
                    clipPath={`url(#clip-${id})`}
                    pointerEvents="all"
                    draggable="false"
                  />

                  {/* bordes de la pieza */}
                  <path
                    d={p.d}
                    fill="none"
                    stroke="rgba(0,0,0,.55)"
                    strokeWidth={0.06}
                    strokeLinejoin="round"
                    strokeLinecap="round"
                    strokeMiterlimit={1}
                  />
                  <path
                    d={p.d}
                    fill="none"
                    stroke="rgba(255,255,255,.45)"
                    strokeWidth={0.02}
                    strokeLinejoin="round"
                    strokeLinecap="round"
                    strokeMiterlimit={1}
                  />
                </g>
              );
            })}
        </g>

        {/* marco */}
        <rect
          x="0"
          y="0"
          width={cols}
          height={rows}
          rx={BOARD_RADIUS}
          ry={BOARD_RADIUS}
          fill="none"
          stroke={BOARD_STROKE}
          strokeWidth="0.06"
          pointerEvents="none"
        />
      </svg>
    </div>
  );

  // --- helpers ---

  function scatter(list) {
    // dispersa alrededor de su celda (máx ±0.9 celdas)
    return list.map((p, i) => ({
      ...p,
      tx: Math.random() * 1.8 - 0.9,
      ty: Math.random() * 1.8 - 0.9,
      locked: false,
      z: i
    }));
  }

  function startDrag(e, r, c) {
    e.preventDefault();
    e.stopPropagation();

    const target = e.currentTarget;
    const cur = pieces.find((x) => x.r === r && x.c === c);
    if (!target || !cur || (LOCK_ON_SNAP && cur.locked)) return;

    // lleva la pieza al frente
    setPieces((ps) => {
      const maxZ = Math.max(...ps.map((x) => x.z));
      return ps.map((x) => (x.r === r && x.c === c ? { ...x, z: maxZ + 1 } : x));
    });

    const { sx, sy } = scaleRef.current;
    target.setPointerCapture(e.pointerId);

    const start = { x: e.clientX, y: e.clientY };
    let initTx = cur.tx,
      initTy = cur.ty;

    const MIN_MOVE = 0.02;
    let moved = false;
    let finishedOnce = false;

    // id de sesión para asegurar +1 movimiento por drag
    const sessionId = ++dragSessionRef.current;
    let counted = false;

    const onMove = (ev) => {
      ev.preventDefault();
      const dx = (ev.clientX - start.x) / sx;
      const dy = (ev.clientY - start.y) / sy;
      if (!moved && Math.hypot(dx, dy) >= MIN_MOVE) moved = true;
      setPieces((ps) =>
        ps.map((x) =>
          x.r === r && x.c === c ? { ...x, tx: initTx + dx, ty: initTy + dy } : x
        )
      );
    };

    const finish = () => {
      if (finishedOnce) return;
      if (sessionId !== dragSessionRef.current) return; // ignora sesiones viejas
      finishedOnce = true;

      try {
        target.releasePointerCapture(e.pointerId);
      } catch {}
      target.removeEventListener("pointermove", onMove);
      target.removeEventListener("pointerup", finish);
      target.removeEventListener("pointercancel", finish);

      setPieces((ps) => {
        const idx = ps.findIndex((x) => x.r === r && x.c === c);
        if (idx < 0) return ps;
        const p = ps[idx];
        const snapped = Math.hypot(p.tx, p.ty) <= SNAP_THRESH;

        const next = ps.map((x, i) => {
          if (i !== idx) return x;
          if (snapped) return { ...x, tx: 0, ty: 0, locked: LOCK_ON_SNAP ? true : false };
          return x;
        });

        if (moved && !counted) {
          counted = true;
          setMoves((m) => m + 1);
        }
        return next;
      });
    };

    target.addEventListener("pointermove", onMove, { passive: false });
    target.addEventListener("pointerup", finish, { passive: false, once: true });
    target.addEventListener("pointercancel", finish, { passive: false, once: true });
  }
}


