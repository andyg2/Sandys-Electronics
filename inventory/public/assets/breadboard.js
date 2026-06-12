// Tiny breadboard renderer. Takes a JSON DSL describing where components
// sit on a 30-column half-size breadboard and paints an SVG.
//
// Coords are {ROW}{COL} where ROW is A-J (or "+5V"/"GND" for power rails)
// and COL is 1-30. See AGENTS.md for the DSL contract.

(function (global) {
  const COLS = 30;
  const TIE = 20;           // pixel spacing between tie points
  const PAD_X = 50;
  const PAD_TOP = 16;
  const RAIL_GAP = 10;      // pixels between the two top/bottom rails
  const RAIL_TO_GRID = 22;  // distance from inner rail to the first row of holes
  const HALF_GAP = 36;      // gully between rows E and F
  const ROW_LETTERS = ['A','B','C','D','E','F','G','H','I','J'];
  const NS = 'http://www.w3.org/2000/svg';

  function colX(col) { return PAD_X + (col - 1) * TIE; }

  function rowY(row) {
    if (row === '+5V_T') return PAD_TOP;
    if (row === 'GND_T') return PAD_TOP + RAIL_GAP;
    const topGridStart = PAD_TOP + RAIL_GAP + RAIL_TO_GRID;
    const idx = ROW_LETTERS.indexOf(row);
    if (idx >= 0) {
      if (idx <= 4) return topGridStart + idx * TIE;
      return topGridStart + 5 * TIE + HALF_GAP + (idx - 5) * TIE;
    }
    if (row === 'GND_B') {
      return topGridStart + 5 * TIE + HALF_GAP + 5 * TIE + RAIL_TO_GRID - 14;
    }
    if (row === '+5V_B') return rowY('GND_B') + RAIL_GAP;
    return null;
  }

  function el(name, attrs, parent) {
    const e = document.createElementNS(NS, name);
    for (const k in attrs) e.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(e);
    return e;
  }

  // Position parser. Returns { x, y, row, col, isRail, railName, half }.
  function resolvePos(pos, hintCol) {
    if (typeof pos !== 'string') return null;
    const rail = pos.match(/^\s*(\+?5V|VCC|GND)(?:_([TB]))?(?:\s*(?:at|@)\s*(\d+))?\s*$/i);
    if (rail) {
      let name = rail[1].toUpperCase().replace('+', '');
      if (name === 'VCC') name = '5V';
      const tag = (name === '5V' ? '+5V' : 'GND');
      const top = rail[2] === 'T' || (rail[2] == null && hintRailSide(hintCol) === 'T');
      const col = rail[3] ? parseInt(rail[3], 10) : (hintCol || 15);
      return { x: colX(col), y: rowY(tag + '_' + (top ? 'T' : 'B')), isRail: true, railName: tag, top, col };
    }
    const m = pos.match(/^\s*([A-J])(\d{1,2})\s*$/i);
    if (!m) return null;
    const row = m[1].toUpperCase();
    const col = parseInt(m[2], 10);
    if (col < 1 || col > COLS) return null;
    const y = rowY(row);
    if (y == null) return null;
    return { x: colX(col), y, row, col, half: 'ABCDE'.includes(row) ? 'T' : 'B' };
  }

  function hintRailSide() { return 'T'; }

  // Decide whether a rail node should resolve to top or bottom rail given
  // its "other end" - used so wires don't pointlessly cross the board.
  function pickRailSide(railPos, otherPos) {
    if (!railPos.isRail) return railPos;
    if (!otherPos) return railPos;
    const wantTop = otherPos.half ? otherPos.half === 'T' : (otherPos.y < rowY('F'));
    const col = railPos.col || otherPos.col || 15;
    return {
      x: colX(col),
      y: rowY((railPos.railName === '5V' ? '+5V_' : 'GND_') + (wantTop ? 'T' : 'B')),
      isRail: true,
      railName: railPos.railName,
      col,
    };
  }

  function totalHeight() { return rowY('+5V_B') + 18; }
  function totalWidth()  { return PAD_X * 2 + (COLS - 1) * TIE; }

  // ---------- breadboard background ----------

  function drawBoard(svg) {
    const W = totalWidth();
    const H = totalHeight();
    svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
    svg.setAttribute('width', '100%');
    svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
    svg.style.maxWidth = (W + 'px');

    // shadow
    const defs = el('defs', {}, svg);
    const shadow = el('filter', { id: 'bb-shadow', x: '-5%', y: '-5%', width: '110%', height: '110%' }, defs);
    el('feDropShadow', { dx: 0, dy: 1.5, stdDeviation: 1.2, 'flood-color': '#000', 'flood-opacity': 0.18 }, shadow);

    // Board
    el('rect', { x: 8, y: 8, width: W - 16, height: H - 18, rx: 8, fill: '#f4ecd6', stroke: '#bba47a', 'stroke-width': 1.2 }, svg);

    // Center gully (the line that separates the IC from itself)
    const gullyY = rowY('E') + TIE / 2 + 2;
    el('rect', { x: 8, y: gullyY, width: W - 16, height: HALF_GAP - 4, fill: '#e3d7b1' }, svg);

    // Rails
    for (const side of ['T', 'B']) {
      const yPlus = rowY('+5V_' + side);
      const yGnd  = rowY('GND_' + side);
      const xMin  = colX(1) - 6;
      const xMax  = colX(COLS) + 6;
      el('line', { x1: xMin, y1: yPlus, x2: xMax, y2: yPlus, stroke: '#ef4444', 'stroke-width': 2.4, opacity: 0.5 }, svg);
      el('line', { x1: xMin, y1: yGnd,  x2: xMax, y2: yGnd,  stroke: '#1f2937', 'stroke-width': 2.4, opacity: 0.6 }, svg);
      // tie holes (skip a hole every 5 cols to match real breadboard gaps)
      for (let c = 1; c <= COLS; c++) {
        if (c === 6 || c === 11 || c === 16 || c === 21 || c === 26) continue;
        const x = colX(c);
        drawTieHole(svg, x, yPlus);
        drawTieHole(svg, x, yGnd);
      }
      el('text', { x: 14, y: yPlus + 3, 'font-size': 10, 'font-family': 'monospace', 'font-weight': 'bold', fill: '#b91c1c' }, svg).textContent = '+';
      el('text', { x: 14, y: yGnd  + 3, 'font-size': 10, 'font-family': 'monospace', 'font-weight': 'bold', fill: '#1f2937' }, svg).textContent = '-';
      el('text', { x: xMax + 4, y: yPlus + 3, 'font-size': 10, 'font-family': 'monospace', 'font-weight': 'bold', fill: '#b91c1c' }, svg).textContent = '+';
      el('text', { x: xMax + 4, y: yGnd  + 3, 'font-size': 10, 'font-family': 'monospace', 'font-weight': 'bold', fill: '#1f2937' }, svg).textContent = '-';
    }

    // Main grid tie holes
    for (let c = 1; c <= COLS; c++) {
      for (const row of ROW_LETTERS) {
        drawTieHole(svg, colX(c), rowY(row));
      }
    }

    // Row letters on both sides
    for (let i = 0; i < ROW_LETTERS.length; i++) {
      const row = ROW_LETTERS[i];
      const y = rowY(row) + 3;
      el('text', { x: 32, y, 'font-size': 10, 'font-family': 'monospace', fill: '#7a6b3a' }, svg).textContent = row;
      el('text', { x: colX(COLS) + 16, y, 'font-size': 10, 'font-family': 'monospace', fill: '#7a6b3a' }, svg).textContent = row;
    }

    // Column numbers (every 5)
    for (let c = 1; c <= COLS; c++) {
      if (c % 5 !== 0 && c !== 1) continue;
      const x = colX(c);
      el('text', { x, y: rowY('A') - 8, 'font-size': 9, 'font-family': 'monospace', fill: '#7a6b3a', 'text-anchor': 'middle' }, svg).textContent = c;
      el('text', { x, y: rowY('J') + TIE - 4, 'font-size': 9, 'font-family': 'monospace', fill: '#7a6b3a', 'text-anchor': 'middle' }, svg).textContent = c;
    }
  }

  function drawTieHole(svg, x, y) {
    el('rect', { x: x - 2.6, y: y - 2.6, width: 5.2, height: 5.2, rx: 0.6, fill: '#fafaf6', stroke: '#a09275', 'stroke-width': 0.7 }, svg);
  }

  // ---------- glyphs ----------

  function drawWire(svg, from, to, color) {
    let a = resolvePos(from);
    let b = resolvePos(to, a && a.col);
    if (!a || !b) return;
    if (a.isRail && !b.isRail) a = pickRailSide(a, b);
    if (b.isRail && !a.isRail) b = pickRailSide(b, a);
    const colorAttr = color || '#444';

    // Long jumpers arc above the board
    const dx = Math.abs(b.x - a.x);
    const dy = Math.abs(b.y - a.y);
    const flying = dx > TIE * 4 && dy > TIE * 3;

    if (flying) {
      const mx = (a.x + b.x) / 2;
      const my = Math.min(a.y, b.y) - Math.min(dx * 0.18, 40);
      el('path', {
        d: `M${a.x} ${a.y} Q ${mx} ${my} ${b.x} ${b.y}`,
        fill: 'none', stroke: colorAttr, 'stroke-width': 2.4, 'stroke-linecap': 'round',
        filter: 'url(#bb-shadow)',
      }, svg);
    } else {
      el('line', {
        x1: a.x, y1: a.y, x2: b.x, y2: b.y, stroke: colorAttr,
        'stroke-width': 2.4, 'stroke-linecap': 'round',
        filter: 'url(#bb-shadow)',
      }, svg);
    }
    el('circle', { cx: a.x, cy: a.y, r: 3, fill: colorAttr }, svg);
    el('circle', { cx: b.x, cy: b.y, r: 3, fill: colorAttr }, svg);
  }

  function drawResistor(svg, from, to, value) {
    const a = resolvePos(from);
    let b = resolvePos(to, a && a.col);
    if (!a || !b) return;
    b = b.isRail ? pickRailSide(b, a) : b;
    const angle = Math.atan2(b.y - a.y, b.x - a.x);
    const mx = (a.x + b.x) / 2;
    const my = (a.y + b.y) / 2;
    const fullLen = Math.hypot(b.x - a.x, b.y - a.y);
    const bodyW = 30;
    const bodyH = 11;
    const leadLen = Math.max(2, (fullLen - bodyW) / 2);

    const angleDeg = angle * 180 / Math.PI;
    const g = el('g', { transform: `translate(${mx} ${my}) rotate(${angleDeg})`, filter: 'url(#bb-shadow)' }, svg);
    // leads
    el('line', { x1: -bodyW / 2 - leadLen, y1: 0, x2: -bodyW / 2, y2: 0, stroke: '#7a6b4d', 'stroke-width': 1.4 }, g);
    el('line', { x1:  bodyW / 2 + leadLen, y1: 0, x2:  bodyW / 2, y2: 0, stroke: '#7a6b4d', 'stroke-width': 1.4 }, g);
    // body
    el('rect', { x: -bodyW / 2, y: -bodyH / 2, width: bodyW, height: bodyH, rx: 3, fill: '#d9b385', stroke: '#7a4f1f', 'stroke-width': 0.8 }, g);
    // colour band hints
    el('rect', { x: -bodyW / 2 + 4, y: -bodyH / 2, width: 2, height: bodyH, fill: '#1f2937', opacity: 0.55 }, g);
    el('rect', { x: -bodyW / 2 + 8, y: -bodyH / 2, width: 2, height: bodyH, fill: '#dc2626', opacity: 0.6 }, g);
    el('rect', { x:  bodyW / 2 - 6, y: -bodyH / 2, width: 2, height: bodyH, fill: '#a16207', opacity: 0.6 }, g);
    if (value) {
      // Counter-rotate the label so it stays upright regardless of resistor angle.
      // Flip 180 if the resistor is "upside down" so text reads left-to-right.
      let labelRot = -angleDeg;
      if (angleDeg > 90 || angleDeg < -90) labelRot += 180;
      const above = el('text', {
        x: 0, y: -bodyH / 2 - 5, 'font-size': 9, 'font-family': 'monospace',
        'font-weight': 'bold', fill: '#5a3a14', 'text-anchor': 'middle',
        transform: `rotate(${labelRot})`,
      }, g);
      above.textContent = value;
    }
  }

  function drawCapacitor(svg, positive, negative, value, polarised) {
    const a = resolvePos(positive);
    let b = resolvePos(negative);
    if (!a || !b) return;
    b = b.isRail ? pickRailSide(b, a) : b;
    const mx = (a.x + b.x) / 2;
    const top = Math.min(a.y, b.y);
    const bulbY = top - 28;
    const r = 12;
    // legs from the tie points up to the bulb
    el('line', { x1: a.x, y1: a.y, x2: a.x, y2: bulbY + 6, stroke: '#666', 'stroke-width': 1.4 }, svg);
    el('line', { x1: b.x, y1: b.y, x2: b.x, y2: bulbY + 6, stroke: '#666', 'stroke-width': 1.4 }, svg);
    // body
    const g = el('g', { filter: 'url(#bb-shadow)' }, svg);
    el('circle', { cx: mx, cy: bulbY, r, fill: '#1e3a8a', stroke: '#0f172a', 'stroke-width': 1 }, g);
    el('circle', { cx: mx, cy: bulbY - 2, r: r - 3, fill: '#3b82f6', opacity: 0.7 }, g);
    if (value) {
      el('text', { x: mx, y: bulbY + 3, 'font-size': 8, 'font-family': 'monospace', fill: '#fafafa', 'text-anchor': 'middle', 'font-weight': 'bold' }, g).textContent = value;
    }
    if (polarised !== false) {
      // + sticker near the positive leg
      el('text', { x: a.x, y: bulbY + 4, 'font-size': 11, 'font-family': 'monospace', 'font-weight': 'bold', fill: '#fff', 'text-anchor': 'middle' }, g).textContent = '+';
      el('text', { x: a.x - 0.5, y: bulbY + 3.5, 'font-size': 11, 'font-family': 'monospace', 'font-weight': 'bold', fill: '#b91c1c', 'text-anchor': 'middle' }, g).textContent = '+';
      // white stripe on the - side
      el('rect', { x: b.x - 4, y: bulbY - r + 2, width: 8, height: 2.5, fill: '#fff', opacity: 0.95 }, g);
    }
  }

  function drawLed(svg, anode, cathode, color) {
    const a = resolvePos(anode);
    const c = resolvePos(cathode);
    if (!a || !c) return;
    const fills = { red: '#ef4444', green: '#10b981', blue: '#3b82f6', yellow: '#facc15', white: '#fafafa', orange: '#fb923c' };
    const fill = fills[(color || 'red').toLowerCase()] || '#ef4444';
    const stroke = (color || '').toLowerCase() === 'yellow' ? '#854d0e' : '#7f1d1d';
    const mx = (a.x + c.x) / 2;
    const my = Math.min(a.y, c.y) - 16;

    // Long anode leg (kid trick: long leg = +)
    el('line', { x1: a.x, y1: a.y, x2: mx - 5, y2: my + 6, stroke: '#888', 'stroke-width': 1.2 }, svg);
    el('line', { x1: c.x, y1: c.y, x2: mx + 5, y2: my + 6, stroke: '#888', 'stroke-width': 1.2 }, svg);

    // Dome shape - half circle on top + flat ring on bottom
    const g = el('g', { filter: 'url(#bb-shadow)' }, svg);
    el('path', {
      d: `M ${mx - 9} ${my + 6} A 9 9 0 0 1 ${mx + 9} ${my + 6} L ${mx + 9} ${my + 8} L ${mx - 9} ${my + 8} Z`,
      fill, stroke, 'stroke-width': 1,
    }, g);
    // base ring
    el('rect', { x: mx - 10, y: my + 7, width: 20, height: 3, fill: '#374151', opacity: 0.7 }, g);
    // inner shine
    el('ellipse', { cx: mx - 3, cy: my, rx: 3, ry: 4, fill: '#fff', opacity: 0.55 }, g);

    // + / - labels under the tie points
    el('text', { x: a.x, y: a.y - 6, 'font-size': 8, 'font-family': 'monospace', 'font-weight': 'bold', fill: '#b91c1c', 'text-anchor': 'middle' }, svg).textContent = '+';
    el('text', { x: c.x, y: c.y - 6, 'font-size': 8, 'font-family': 'monospace', 'font-weight': 'bold', fill: '#1f2937', 'text-anchor': 'middle' }, svg).textContent = '-';
  }

  function drawIC(svg, name, pin1_at, pins) {
    const p1 = resolvePos(pin1_at);
    if (!p1 || !p1.row || !p1.col) return;
    pins = pins || 8;
    const perSide = pins / 2;

    // Body straddles the gully, from col p1.col to p1.col + perSide - 1
    const x1 = colX(p1.col) - TIE / 2 + 2;
    const x2 = colX(p1.col + perSide - 1) + TIE / 2 - 2;
    const yTop = rowY('E') + TIE / 2 - 4;
    const yBot = rowY('F') - TIE / 2 + 4;
    const g = el('g', { filter: 'url(#bb-shadow)' }, svg);

    // Chip body (slate gray-black)
    el('rect', { x: x1, y: yTop, width: x2 - x1, height: yBot - yTop, rx: 3, fill: '#1e293b', stroke: '#0f172a', 'stroke-width': 1 }, g);

    // Notch on the left (half-circle bite out of the body)
    el('path', {
      d: `M ${x1 + 3} ${(yTop + yBot) / 2 - 5} A 5 5 0 0 0 ${x1 + 3} ${(yTop + yBot) / 2 + 5} Z`,
      fill: '#0f172a',
    }, g);

    // Pins along both sides as small silver rectangles
    for (let i = 0; i < perSide; i++) {
      const xPin = colX(p1.col + i);
      el('rect', { x: xPin - 3, y: yTop - 2, width: 6, height: 4, fill: '#cbd5e1', stroke: '#475569', 'stroke-width': 0.5 }, g);
      el('rect', { x: xPin - 3, y: yBot - 2, width: 6, height: 4, fill: '#cbd5e1', stroke: '#475569', 'stroke-width': 0.5 }, g);
    }

    // Pin numbers (small, off the side of the chip body)
    for (let i = 0; i < perSide; i++) {
      const xPin = colX(p1.col + i);
      // Bottom pins: 1..perSide left-to-right
      el('text', { x: xPin, y: yBot + 9, 'font-size': 7, 'font-family': 'monospace', fill: '#cbd5e1', 'text-anchor': 'middle' }, g).textContent = i + 1;
      // Top pins: pins...perSide+1 (right-to-left from the notch)
      el('text', { x: xPin, y: yTop - 4, 'font-size': 7, 'font-family': 'monospace', fill: '#cbd5e1', 'text-anchor': 'middle' }, g).textContent = (pins - i);
    }

    // Chip label centered
    el('text', { x: (x1 + x2) / 2, y: (yTop + yBot) / 2 + 4, 'font-size': 10, 'font-family': 'monospace', fill: '#fafafa', 'text-anchor': 'middle', 'font-weight': 'bold' }, g).textContent = name;

    // Yellow pin-1 marker as a small dot in the corner of the chip body
    // closest to pin 1 (bottom-left = top-half side, so use yTop area).
    const pin1Y = p1.row === 'E' ? yTop + 4 : yBot - 4;
    el('circle', { cx: colX(p1.col), cy: pin1Y, r: 2.5, fill: '#fde047', stroke: '#a16207', 'stroke-width': 0.8 }, g);
  }

  function drawButton(svg, pos, label) {
    const p = resolvePos(pos);
    if (!p) return;
    const g = el('g', { filter: 'url(#bb-shadow)' }, svg);
    el('rect', { x: p.x - 10, y: p.y - 10, width: 20, height: 20, rx: 3, fill: '#fafafa', stroke: '#475569', 'stroke-width': 1.2 }, g);
    el('circle', { cx: p.x, cy: p.y, r: 5, fill: '#ef4444', stroke: '#7f1d1d', 'stroke-width': 1 }, g);
    el('circle', { cx: p.x - 1.5, cy: p.y - 1.5, r: 1.5, fill: '#fff', opacity: 0.7 }, g);
    if (label) {
      el('text', { x: p.x, y: p.y - 14, 'font-size': 8, 'font-family': 'monospace', fill: '#1f2937', 'text-anchor': 'middle', 'font-weight': 'bold' }, svg).textContent = label;
    }
  }

  function drawExternals(svg, externals) {
    if (!externals || !externals.length) return;
    const W = totalWidth();
    let y = rowY('+5V_B') + 24;
    el('text', { x: PAD_X, y, 'font-size': 10, 'font-family': 'system-ui, sans-serif', fill: '#1f2937', 'font-weight': 'bold' }, svg).textContent = 'Off-board:';
    y += 13;
    externals.forEach(e => {
      el('text', { x: PAD_X + 10, y, 'font-size': 10, 'font-family': 'system-ui, sans-serif', fill: '#374151' }, svg).textContent =
        `${e.from || '?'}  →  ${e.to || '?'}`;
      y += 13;
    });
    const vb = svg.getAttribute('viewBox').split(' ').map(Number);
    vb[3] = Math.max(vb[3], y + 8);
    svg.setAttribute('viewBox', vb.join(' '));
  }

  // ---------- entry point ----------

  function render(container, layout) {
    if (typeof layout === 'string') {
      try { layout = JSON.parse(layout); } catch (e) {
        container.textContent = 'Invalid breadboard JSON: ' + e.message;
        return;
      }
    }
    container.innerHTML = '';
    const svg = document.createElementNS(NS, 'svg');
    container.appendChild(svg);

    drawBoard(svg);

    const comps = layout.components || [];
    comps.filter(c => c.type === 'wire').forEach(c => drawWire(svg, c.from, c.to, c.color));
    comps.filter(c => c.type === 'resistor').forEach(c => drawResistor(svg, c.from, c.to, c.value));
    comps.filter(c => c.type === 'capacitor').forEach(c => drawCapacitor(svg, c.positive, c.negative, c.value, c.polarised));
    comps.filter(c => c.type === 'led').forEach(c => drawLed(svg, c.anode, c.cathode, c.color));
    comps.filter(c => c.type === 'button' || c.type === 'switch').forEach(c => drawButton(svg, c.at, c.label));
    comps.filter(c => c.type === 'ic').forEach(c => drawIC(svg, c.name, c.pin1_at, c.pins));

    drawExternals(svg, layout.external);
  }

  function findAndRender() {
    document.querySelectorAll('[data-breadboard]').forEach(node => {
      try {
        const src = node.textContent.trim();
        if (!src) return;
        const target = document.createElement('div');
        target.className = 'breadboard-render';
        node.parentNode.insertBefore(target, node.nextSibling);
        node.style.display = 'none';
        render(target, src);
      } catch (e) {
        console.warn('breadboard render failed', e);
      }
    });
  }

  global.Breadboard = { render, findAndRender };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', findAndRender);
  } else {
    findAndRender();
  }
})(window);
