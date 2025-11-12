import { useEffect, useMemo, useRef, useState } from "react";
import { generatePiecesClassic } from "./jigsawClassic"; // ← tu generador de piezas
import "./jigsaw.css";

/** ===== Ajustes ===== */
const SNAP_THRESH = 0.35;            // distancia (en celdas) para encajar
const LOCK_ON_SNAP = false;          // true = bloquea la pieza al encajar
const IMG_FIT = "cover";             // "cover" (sin bandas) | "contain" (toda la imagen)
const PRESERVE = IMG_FIT === "cover" ? "xMidYMid slice" : "xMidYMid meet";

const BOARD_STROKE = "rgba(255,255,255,.55)"; // contorno tablero
const BOARD_RADIUS = 0.28;                    // radio de borde redondeado tablero

export default function JigsawSVG({
  imageSrc,
  rows = 3,          // ← cambia estos para dificultad
  cols = 5,          // p.ej. rows=4, cols=6
  onSolved,
}) {
  /** 1) Geometría de piezas clásicas */
  const base = useMemo(
    // (rows, cols, radio-tabs, profundidad-tabs) – ajusta si quieres
    () => generatePiecesClassic(rows, cols, 0.16, 0.42),
    [rows, cols]
  );

  /** 2) Estado */
  const [pieces, setPieces] = useState(() => scatter(base));
  const [moves, setMoves] = useState(0);

  /** 3) Escala px->unidades para arrastre preciso */
  const svgRef = useRef(null);
  const scaleRef = useRef({ sx: 1, sy: 1 });
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

  /** 4) Solución */
  useEffect(() => {
    if (pieces.every(p => p.tx === 0 && p.ty === 0) && onSolved) onSolved();
  }, [pieces, onSolved]);

  /** Ref de gesto para evitar dobles conteos */
  const gestureRef = useRef({
    active: false,
    id: 0,
    moved: false,
    counted: false,
    pointerId: null
  });

  return (
    <div className="jig-wrap">
      <div className="pzl-toolbar" style={{ marginBottom: 8 }}>
        <button
          onClick={() => { setPieces(scatter(base)); setMoves(0); }}
          className="btn btn-ghost"
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
        height="auto"
        style={{ touchAction: "none" }}
        shapeRendering="geometricPrecision"
      >
        {/* Clip global del tablero: evita ver “negro” fuera del borde */}
        <defs>
          <clipPath id="board-clip">
            <rect
              x="0" y="0" width={cols} height={rows}
              rx={BOARD_RADIUS} ry={BOARD_RADIUS}
            />
          </clipPath>
        </defs>

        {/* Piezas dentro del rectángulo redondeado */}
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
                  {/* máscara individual */}
                  <clipPath id={`clip-${id}`}>
                    <path d={p.d} />
                  </clipPath>

                  {/* imagen recortada por la máscara */}
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

                  {/* borde de pieza */}
                  <path d={p.d} fill="none" stroke="rgba(0,0,0,.55)" strokeWidth={0.06}/>
                  <path d={p.d} fill="none" stroke="rgba(255,255,255,.45)" strokeWidth={0.02}/>
                </g>
              );
            })}
        </g>

        {/* Contorno del tablero por encima */}
        <rect
          x="0" y="0" width={cols} height={rows}
          rx={BOARD_RADIUS} ry={BOARD_RADIUS}
          fill="none"
          stroke={BOARD_STROKE}
          strokeWidth="0.06"
          pointerEvents="none"
        />
      </svg>
    </div>
  );

  /* ============ helpers ============ */

  function scatter(list) {
    return list.map((p, i) => ({
      ...p,
      tx: (Math.random() * 1.8 - 0.9), // dispersión inicial
      ty: (Math.random() * 1.8 - 0.9),
      locked: false,
      z: i
    }));
  }

  function startDrag(e, r, c) {
    e.preventDefault();
    e.stopPropagation();

    const target = e.currentTarget;
    const cur = pieces.find(x => x.r === r && x.c === c);
    if (!target || !cur || (LOCK_ON_SNAP && cur.locked)) return;

    // Traer al frente
    setPieces(ps => {
      const maxZ = Math.max(...ps.map(x => x.z));
      return ps.map(x => (x.r === r && x.c === c) ? { ...x, z: maxZ + 1 } : x);
    });

    const { sx, sy } = scaleRef.current;

    // token único del gesto
    const token = Date.now() + Math.random();
    gestureRef.current = {
      active: true,
      id: token,
      moved: false,
      counted: false,
      pointerId: e.pointerId
    };

    try { target.setPointerCapture(e.pointerId); } catch {}

    const start = { x: e.clientX, y: e.clientY };
    let initTx = cur.tx, initTy = cur.ty;

    const MIN_MOVE = 0.02; // ~2% de una celda
    const onMove = (ev) => {
      ev.preventDefault();
      const dx = (ev.clientX - start.x) / sx;
      const dy = (ev.clientY - start.y) / sy;

      if (!gestureRef.current.moved && Math.hypot(dx, dy) >= MIN_MOVE) {
        gestureRef.current.moved = true;
      }

      setPieces(ps => ps.map(x =>
        (x.r === r && x.c === c) ? { ...x, tx: initTx + dx, ty: initTy + dy } : x
      ));
    };

    let finishedOnce = false;
    const finish = () => {
      if (finishedOnce) return;             // anti pointerup + pointercancel
      finishedOnce = true;

      try { target.releasePointerCapture(gestureRef.current.pointerId); } catch {}
      target.removeEventListener("pointermove", onMove);
      target.removeEventListener("pointerup", finish);
      target.removeEventListener("pointercancel", finish);

      setPieces(ps => {
        const idx = ps.findIndex(x => x.r === r && x.c === c);
        if (idx < 0) return ps;
        const p = ps[idx];
        const snapped = Math.hypot(p.tx, p.ty) <= SNAP_THRESH;

        const next = ps.map((x, i) => {
          if (i !== idx) return x;
          if (snapped) {
            return { ...x, tx: 0, ty: 0, locked: LOCK_ON_SNAP ? true : false };
          }
          return x;
        });

        // Contar exactamente 1 movimiento por gesto real
        const g = gestureRef.current;
        if (g.active && !g.counted && g.id === token && g.moved) {
          setMoves(m => m + 1);
          g.counted = true;
        }
        g.active = false;

        return next;
      });
    };

    target.addEventListener("pointermove", onMove, { passive: false });
    target.addEventListener("pointerup", finish, { passive: false });
    target.addEventListener("pointercancel", finish, { passive: false });
  }
}

