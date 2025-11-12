// src/jigsaw/jigsawClassic.js

function rndTab() { return Math.random() > 0.5 ? 1 : -1; }

/**
 * Path de una pieza 1x1 con pestañas clásicas redondeadas.
 * top/right/bottom/left = -1 (cavidad), 0 (borde), 1 (saliente)
 * k (profundidad) y w (ancho) ajustan el look.
 */
function buildClassicPath({ top, right, bottom, left }, k = 0.16, w = 0.42) {
  const t = (dir) => dir === 0
    ? `L 1 0`
    : `
      L ${0.5 - w/2} 0
      C ${0.5 - w/2 + 0.15*w} 0, ${0.5 - 0.18*w} ${-k*dir}, ${0.5} ${-k*dir}
      C ${0.5 + 0.18*w} ${-k*dir}, ${0.5 + w/2 - 0.15*w} 0, ${0.5 + w/2} 0
      L 1 0`.replace(/\s+/g, " ");

  const r = (dir) => dir === 0
    ? `L 1 1`
    : `
      L 1 ${0.5 - w/2}
      C 1 ${0.5 - w/2 + 0.15*w}, ${1 + k*dir} ${0.5 - 0.18*w}, ${1 + k*dir} ${0.5}
      C ${1 + k*dir} ${0.5 + 0.18*w}, 1 ${0.5 + w/2 - 0.15*w}, 1 ${0.5 + w/2}
      L 1 1`.replace(/\s+/g, " ");

  const b = (dir) => dir === 0
    ? `L 0 1`
    : `
      L ${0.5 + w/2} 1
      C ${0.5 + w/2 - 0.15*w} 1, ${0.5 + 0.18*w} ${1 + k*dir}, ${0.5} ${1 + k*dir}
      C ${0.5 - 0.18*w} ${1 + k*dir}, ${0.5 - w/2 + 0.15*w} 1, ${0.5 - w/2} 1
      L 0 1`.replace(/\s+/g, " ");

  const l = (dir) => dir === 0
    ? `L 0 0`
    : `
      L 0 ${0.5 + w/2}
      C 0 ${0.5 + w/2 - 0.15*w}, ${0 - k*dir} ${0.5 + 0.18*w}, ${0 - k*dir} ${0.5}
      C ${0 - k*dir} ${0.5 - 0.18*w}, 0 ${0.5 - w/2 + 0.15*w}, 0 ${0.5 - w/2}
      L 0 0`.replace(/\s+/g, " ");

  return (`
    M 0 0
    ${t(top)}
    ${r(right)}
    ${b(bottom)}
    ${l(left)}
    Z
  `).replace(/\s+/g, " ");
}

/** Genera piezas compatibles entre vecinas */
export function generatePiecesClassic(rows, cols, knob = 0.16, width = 0.42) {
  const pieces = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const i = r*cols + c;
      const top    = r === 0        ? 0 : (pieces[i - cols].bottom * -1);
      const left   = c === 0        ? 0 : (pieces[i - 1].right  * -1);
      const right  = c === cols - 1 ? 0 : rndTab();
      const bottom = r === rows - 1 ? 0 : rndTab();
      const edges  = { top, right, bottom, left };
      pieces.push({ r, c, ...edges, d: buildClassicPath(edges, knob, width) });
    }
  }
  return pieces;
}


