// src/jigsaw/jigsawClassic.js

function rndTab() { return Math.random() > 0.5 ? 1 : -1; }

/**
 * Forma simple clásica: un (1) semicírculo por lado y bordes rectos.
 * s: +1 pestaña que SALE, -1 hueco que ENTRA, 0 borde recto
 * tabR: radio del conector en coordenadas de celda (0..0.5)
 */
export function buildSimpleCircular(
  { top, right, bottom, left },
  tabR = 0.18   // 0.16–0.22 imita el look de referencia
) {
  const cx = 0.5, cy = 0.5;
  const arc = (x, y, r, sweep) => `A ${r} ${r} 0 0 ${sweep} ${x} ${y}`;

  const topEdge = (s) => {
    if (s === 0) return `L 1 0`;
    const y = 0, sweep = s > 0 ? 1 : 0; // +1 hacia abajo
    return [`L ${cx - tabR} ${y}`, arc(cx + tabR, y, tabR, sweep), `L 1 ${y}`].join(" ");
  };

  const rightEdge = (s) => {
    if (s === 0) return `L 1 1`;
    const x = 1, sweep = s > 0 ? 1 : 0; // +1 hacia la derecha
    return [`L ${x} ${cy - tabR}`, arc(x, cy + tabR, tabR, sweep), `L ${x} 1`].join(" ");
  };

  const bottomEdge = (s) => {
    if (s === 0) return `L 0 1`;
    const y = 1, sweep = s > 0 ? 1 : 0; // +1 hacia arriba
    return [`L ${cx + tabR} ${y}`, arc(cx - tabR, y, tabR, sweep), `L 0 ${y}`].join(" ");
  };

  const leftEdge = (s) => {
    if (s === 0) return `L 0 0`;
    const x = 0, sweep = s > 0 ? 1 : 0; // +1 hacia la izquierda
    return [`L ${x} ${cy + tabR}`, arc(x, cy - tabR, tabR, sweep), `L ${x} 0`].join(" ");
  };

  return (`
    M 0 0
    ${topEdge(top)}
    ${rightEdge(right)}
    ${bottomEdge(bottom)}
    ${leftEdge(left)}
    Z
  `.replace(/\s+/g, " "));
}

// Alias para mantener compatibilidad con el generador
const buildClassicPath = buildSimpleCircular;

/**
 * Genera paths de piezas con conectores consistentes entre vecinas.
 * Devuelve [{ r, c, top, right, bottom, left, d }, ...]
 */
export function generatePiecesClassic(rows, cols, tabR = 0.18) {
  const pieces = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const i = r * cols + c;
      const top    = r === 0        ? 0 : (pieces[i - cols].bottom * -1);
      const left   = c === 0        ? 0 : (pieces[i - 1].right  * -1);
      const right  = c === cols - 1 ? 0 : rndTab();
      const bottom = r === rows - 1 ? 0 : rndTab();
      const edges  = { top, right, bottom, left };
      pieces.push({ r, c, ...edges, d: buildClassicPath(edges, tabR) });
    }
  }
  return pieces;
}
