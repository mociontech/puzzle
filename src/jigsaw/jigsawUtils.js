// Genera geometría SVG para piezas tipo rompecabezas y mantiene compatibilidad
// de pestañas entre vecinos (1 = sale, -1 = entra, 0 = borde).

function randomEdge() { return Math.random() > 0.5 ? 1 : -1; }

/** Construye el path SVG 0..1 de la pieza con “pestañas” */
export function buildPath(p, tab = 0.22) {
  const r4 = v => Number(v.toFixed(4));
  const knob = (side, dir) => {
    if (dir === 0) return "";
    const k = tab, h = 0.42; // tamaño y “curva” de la pestaña
    if (side === "top") {
      return ` C ${r4(0.28)} 0, ${r4(0.5 - h*k)} ${r4(-dir*k)}, ${r4(0.5)} ${r4(-dir*k)}
               C ${r4(0.5 + h*k)} ${r4(-dir*k)}, ${r4(0.72)} 0, 0.82 0`;
    }
    if (side === "right") {
      return ` C 1 ${r4(0.28)}, ${r4(1+dir*k)} ${r4(0.5 - h*k)}, ${r4(1+dir*k)} 0.5
               C ${r4(1+dir*k)} ${r4(0.5 + h*k)}, 1 ${r4(0.72)}, 1 0.82`;
    }
    if (side === "bottom") {
      return ` C 0.72 1, ${r4(0.5 + h*k)} ${r4(1+dir*k)}, 0.5 ${r4(1+dir*k)}
               C ${r4(0.5 - h*k)} ${r4(1+dir*k)}, 0.28 1, 0.18 1`;
    }
    // left
    return ` C 0 ${r4(0.72)}, ${r4(-dir*k)} ${r4(0.5 + h*k)}, ${r4(-dir*k)} 0.5
             C ${r4(-dir*k)} ${r4(0.5 - h*k)}, 0 ${r4(0.28)}, 0 0.18`;
  };

  const t = p.top, r = p.right, b = p.bottom, l = p.left;
  return `
    M 0 0 L 0.18 0 ${knob("top", t)} L 1 0
    L 1 0.18 ${knob("right", r)} L 1 1
    L 0.82 1 ${knob("bottom", b)} L 0 1
    L 0 0.82 ${knob("left", l)} Z
  `.replace(/\s+/g, " ");
}

/** Genera la lista de piezas con bordes compatibles y su path */
export function generatePieces(rows, cols) {
  const pieces = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const top    = r === 0        ? 0 : (pieces[(r-1)*cols + c].bottom * -1);
      const left   = c === 0        ? 0 : (pieces[r*cols + (c-1)].right  * -1);
      const right  = c === cols - 1 ? 0 : randomEdge();
      const bottom = r === rows - 1 ? 0 : randomEdge();
      pieces.push({ r, c, top, right, bottom, left, d: "" });
    }
  }
  for (const p of pieces) p.d = buildPath(p, 0.22);
  return pieces;
}

