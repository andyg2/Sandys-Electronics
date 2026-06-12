// Tiny breadboard renderer. Takes a JSON DSL describing where components
// sit on a 30-column half-size breadboard and paints an SVG.
//
// Coords are {ROW}{COL} where ROW is A-J (or "+5V"/"GND" for power rails)
// and COL is 1-30. See AGENTS.md for the DSL contract.

(function (global) {
  const COLS = 30;
  const TIE = 18;          // pixel spacing between tie points
  const PAD = 40;
  const RAIL_GAP = 8;      // pixels between the two top/bottom rails
  const HALF_GAP = 30;     // pixels between A-E half and F-J half
  const ROW_LETTERS = ['A','B','C','D','E','F','G','H','I','J'];

  function colX(col)   { return PAD + (col - 1) * TIE; }
  function rowY(row) {
    if (row === '+5V_T') return PAD;
    if (row === 'GND_T') return PAD + RAIL_GAP;
    if (row === 'GND_B') return PAD + RAIL_GAP + 22 + 5 * TIE + HALF_GAP + 5 * TIE + 4;
    if (row === '+5V_B') return rowY('GND_B') + RAIL_GAP;
    const idx = ROW_LETTERS.indexOf(row);
    if (idx < 0) return null;
    const base = PAD + RAIL_GAP + 22;  // below top rails
    if (idx <= 4) return base + idx * TIE;
    return base + 5 * TIE + HALF_GAP + (idx - 5) * TIE;
  }

  // Resolve a position string like "E5" or "+5V" to {x, y, label}.
  // Rails resolve to whichever (top or bottom) is closer to col.
  function resolvePos(pos, defaultCol = 15) {
    if (typeof pos !== 'string') return null;
    const railMatch = pos.match(/^([+-]?5V|GND|VCC)(?:_([TB]))?(?:\s*(?:at|@)\s*(\d+))?$/i);
    if (railMatch) {
      let name = railMatch[1].toUpperCase();
      if (name === 'VCC') name = '+5V';
      const top = railMatch[2] !== 'B'; // default to top
      const col = railMatch[3] ? parseInt(railMatch[3], 10) : defaultCol;
      return { x: colX(col), y: rowY((name === '+5V' ? '+5V_' : 'GND_') + (top ? 'T' : 'B')), tag: name, col };
    }
    const m = pos.match(/^([A-J])(\d{1,2})$/i);
    if (!m) return null;
    const row = m[1].toUpperCase();
    const col = parseInt(m[2], 10);
    if (col < 1 || col > COLS) return null;
    const y = rowY(row);
    if (y == null) return null;
    return { x: colX(col), y, tag: row + col, row, col };
  }

  function el(name, attrs, parent) {
    const e = document.createElementNS('http://www.w3.org/2000/svg', name);
    for (const k in attrs) e.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(e);
    return e;
  }

  function drawBoard(svg) {
    const W = PAD * 2 + COLS * TIE;
    const H = rowY('+5V_B') + PAD;
    svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
    svg.setAttribute('width', '100%');
    svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
    svg.style.maxWidth = (W + 'px');

    // Board background
    el('rect', { x: 12, y: 12, width: W - 24, height: H - 24, rx: 6, fill: '#f5efe2', stroke: '#bca87a', 'stroke-width': 1 }, svg);

    // Center gully
    const gullyY = PAD + RAIL_GAP + 22 + 5 * TIE - 2;
    el('rect', { x: 12, y: gullyY, width: W - 24, height: HALF_GAP + 4, fill: '#e6dfca' }, svg);

    // Rails (top + bottom, red = +5V, blue/black = GND)
    for (const side of ['T', 'B']) {
      const yPlus = rowY('+5V_' + side);
      const yGnd  = rowY('GND_' + side);
      // Coloured rail stripes
      el('line', { x1: PAD - 6, y1: yPlus, x2: PAD + (COLS - 1) * TIE + 6, y2: yPlus, stroke: '#ef4444', 'stroke-width': 2, opacity: 0.5 }, svg);
      el('line', { x1: PAD - 6, y1: yGnd,  x2: PAD + (COLS - 1) * TIE + 6, y2: yGnd,  stroke: '#1f2937', 'stroke-width': 2, opacity: 0.55 }, svg);
      // Tie holes along each rail
      for (let c = 1; c <= COLS; c++) {
        if (c === 6 || c === 11 || c === 16 || c === 21 || c === 26) continue;  // standard 5-col gap
        const x = colX(c);
        el('circle', { cx: x, cy: yPlus, r: 2.4, fill: '#fff', stroke: '#9c9482', 'stroke-width': 0.6 }, svg);
        el('circle', { cx: x, cy: yGnd,  r: 2.4, fill: '#fff', stroke: '#9c9482', 'stroke-width': 0.6 }, svg);
      }
      // Rail labels
      el('text', { x: 6, y: yPlus + 3, 'font-size': 9, 'font-family': 'monospace', fill: '#b91c1c' }, svg).textContent = '+';
      el('text', { x: 6, y: yGnd  + 3, 'font-size': 9, 'font-family': 'monospace', fill: '#1f2937' }, svg).textContent = '-';
    }

    // Main grid tie holes
    for (let c = 1; c <= COLS; c++) {
      for (const row of ROW_LETTERS) {
        const y = rowY(row);
        const x = colX(c);
        el('circle', { cx: x, cy: y, r: 2.4, fill: '#fff', stroke: '#9c9482', 'stroke-width': 0.6 }, svg);
      }
    }

    // Row letters (A-E, F-J)
    for (let i = 0; i < ROW_LETTERS.length; i++) {
      const row = ROW_LETTERS[i];
      const y = rowY(row) + 3;
      el('text', { x: 22, y, 'font-size': 9, 'font-family': 'monospace', fill: '#7a6b3a' }, svg).textContent = row;
      el('text', { x: PAD + (COLS - 1) * TIE + 10, y, 'font-size': 9, 'font-family': 'monospace', fill: '#7a6b3a' }, svg).textContent = row;
    }

    // Column numbers (every 5)
    for (let c = 1; c <= COLS; c++) {
      if (c % 5 !== 0 && c !== 1) continue;
      const x = colX(c);
      el('text', { x, y: PAD + RAIL_GAP + 18, 'font-size': 8, 'font-family': 'monospace', fill: '#7a6b3a', 'text-anchor': 'middle' }, svg).textContent = c;
      el('text', { x, y: rowY('GND_B') - 6, 'font-size': 8, 'font-family': 'monospace', fill: '#7a6b3a', 'text-anchor': 'middle' }, svg).textContent = c;
    }
  }

  // ------- component glyphs -------

  function drawWire(svg, from, to, color) {
    const a = resolvePos(from);
    const b = resolvePos(to, a ? a.col : 15);
    if (!a || !b) return;
    el('line', { x1: a.x, y1: a.y, x2: b.x, y2: b.y, stroke: color || '#444', 'stroke-width': 2.2, 'stroke-linecap': 'round' }, svg);
    // small dot at each end
    el('circle', { cx: a.x, cy: a.y, r: 3, fill: color || '#444' }, svg);
    el('circle', { cx: b.x, cy: b.y, r: 3, fill: color || '#444' }, svg);
  }

  function drawResistor(svg, from, to, value) {
    const a = resolvePos(from);
    const b = resolvePos(to);
    if (!a || !b) return;
    const mx = (a.x + b.x) / 2;
    const my = (a.y + b.y) / 2;
    const ang = Math.atan2(b.y - a.y, b.x - a.x);
    const len = Math.hypot(b.x - a.x, b.y - a.y);
    const bodyW = Math.max(28, len - 14);
    // body (vintage beige resistor)
    const g = el('g', { transform: `translate(${mx} ${my}) rotate(${ang * 180 / Math.PI})` }, svg);
    el('line', { x1: -len / 2, y1: 0, x2: -bodyW / 2, y2: 0, stroke: '#7a6b4d', 'stroke-width': 1.5 }, g);
    el('line', { x1:  bodyW / 2, y1: 0, x2:  len / 2, y2: 0, stroke: '#7a6b4d', 'stroke-width': 1.5 }, g);
    el('rect', { x: -bodyW / 2, y: -5, width: bodyW, height: 10, rx: 3, fill: '#d4a574', stroke: '#7a4f1f', 'stroke-width': 0.6 }, g);
    if (value) {
      el('text', { x: 0, y: -8, 'font-size': 8, 'font-family': 'monospace', fill: '#5a3a14', 'text-anchor': 'middle' }, g).textContent = value;
    }
  }

  function drawLed(svg, anode, cathode, color) {
    const a = resolvePos(anode);
    const c = resolvePos(cathode);
    if (!a || !c) return;
    const fills = { red: '#ef4444', green: '#10b981', blue: '#3b82f6', yellow: '#facc15', white: '#fafafa' };
    const fill = fills[(color || 'red').toLowerCase()] || '#ef4444';
    // wire from anode to cathode through the LED bulb
    const mx = (a.x + c.x) / 2;
    const my = (a.y + c.y) / 2;
    el('line', { x1: a.x, y1: a.y, x2: mx, y2: my, stroke: '#666', 'stroke-width': 1.2 }, svg);
    el('line', { x1: c.x, y1: c.y, x2: mx, y2: my, stroke: '#666', 'stroke-width': 1.2 }, svg);
    el('circle', { cx: mx, cy: my, r: 6, fill, stroke: '#7f1d1d', 'stroke-width': 0.8, opacity: 0.85 }, svg);
    el('text', { x: a.x, y: a.y - 6, 'font-size': 7, 'font-family': 'monospace', fill: '#b91c1c', 'text-anchor': 'middle' }, svg).textContent = '+';
    el('text', { x: c.x, y: c.y - 6, 'font-size': 7, 'font-family': 'monospace', fill: '#1f2937', 'text-anchor': 'middle' }, svg).textContent = '-';
  }

  function drawCapacitor(svg, positive, negative, value, polarised) {
    const a = resolvePos(positive);
    const b = resolvePos(negative);
    if (!a || !b) return;
    el('line', { x1: a.x, y1: a.y, x2: a.x, y2: a.y - 14, stroke: '#666', 'stroke-width': 1.2 }, svg);
    el('line', { x1: b.x, y1: b.y, x2: b.x, y2: b.y - 22, stroke: '#666', 'stroke-width': 1.2 }, svg);
    const cx = (a.x + b.x) / 2;
    const cy = Math.min(a.y, b.y) - 22;
    el('circle', { cx, cy: cy - 4, r: 11, fill: '#1e3a8a', stroke: '#1e293b', 'stroke-width': 1 }, svg);
    if (value) {
      el('text', { x: cx, y: cy - 2, 'font-size': 7, 'font-family': 'monospace', fill: '#fafafa', 'text-anchor': 'middle' }, svg).textContent = value;
    }
    if (polarised !== false) {
      el('text', { x: a.x, y: a.y - 18, 'font-size': 7, 'font-family': 'monospace', fill: '#b91c1c', 'text-anchor': 'middle' }, svg).textContent = '+';
    }
  }

  function drawIC(svg, name, pin1_at, pins) {
    const p1 = resolvePos(pin1_at);
    if (!p1 || !p1.row || !p1.col) return;
    pins = pins || 8;
    const perSide = pins / 2;
    // IC body spans cols p1.col to p1.col + perSide - 1, straddling the gap.
    // Pins per side go down one row of holes, so the body lives in rows E and F
    // (or wherever pin 1 is). Standard placement: pin 1 in row E or F.
    const x1 = colX(p1.col) - TIE / 2 + 2;
    const x2 = colX(p1.col + perSide - 1) + TIE / 2 - 2;
    const gullyTop = rowY('E') + 6;
    const gullyBottom = rowY('F') - 6;
    el('rect', { x: x1, y: gullyTop, width: x2 - x1, height: gullyBottom - gullyTop, rx: 2, fill: '#1f2937', stroke: '#000', 'stroke-width': 0.6 }, svg);
    // notch
    el('circle', { cx: x1 + 6, cy: (gullyTop + gullyBottom) / 2, r: 2, fill: '#374151' }, svg);
    // label
    el('text', { x: (x1 + x2) / 2, y: (gullyTop + gullyBottom) / 2 + 3, 'font-size': 9, 'font-family': 'monospace', fill: '#fafafa', 'text-anchor': 'middle', 'font-weight': 'bold' }, svg).textContent = name;
    // pin1 dot
    el('circle', { cx: colX(p1.col), cy: rowY(p1.row), r: 2.4, fill: '#fde047', stroke: '#a16207', 'stroke-width': 0.8 }, svg);
  }

  function drawButton(svg, pos, label) {
    // 4-pin tactile straddling rows
    const p = resolvePos(pos);
    if (!p) return;
    el('rect', { x: p.x - 8, y: p.y - 8, width: 16, height: 16, rx: 2, fill: '#fafafa', stroke: '#555', 'stroke-width': 1 }, svg);
    el('circle', { cx: p.x, cy: p.y, r: 4, fill: '#ef4444', stroke: '#7f1d1d' }, svg);
    if (label) {
      el('text', { x: p.x, y: p.y - 12, 'font-size': 7, 'font-family': 'monospace', fill: '#1f2937', 'text-anchor': 'middle' }, svg).textContent = label;
    }
  }

  function drawExternals(svg, externals) {
    if (!externals || !externals.length) return;
    const W = PAD * 2 + COLS * TIE;
    let y = rowY('+5V_B') + 14;
    el('text', { x: PAD, y, 'font-size': 9, 'font-family': 'system-ui, sans-serif', fill: '#374151', 'font-weight': 'bold' }, svg).textContent = 'Off-board:';
    y += 12;
    externals.forEach(e => {
      el('text', { x: PAD + 8, y, 'font-size': 9, 'font-family': 'system-ui, sans-serif', fill: '#374151' }, svg).textContent =
        `• ${e.from || '?'}  →  ${e.to || '?'}`;
      y += 11;
    });
    // grow viewbox
    const vb = svg.getAttribute('viewBox').split(' ').map(Number);
    vb[3] = Math.max(vb[3], y + 6);
    svg.setAttribute('viewBox', vb.join(' '));
  }

  // ------- entry point -------

  function render(container, layout) {
    if (typeof layout === 'string') {
      try { layout = JSON.parse(layout); } catch (e) {
        container.textContent = 'Invalid breadboard JSON: ' + e.message;
        return;
      }
    }
    container.innerHTML = '';
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    container.appendChild(svg);

    drawBoard(svg);

    // Wires first so they sit under components
    (layout.components || []).filter(c => c.type === 'wire').forEach(c => drawWire(svg, c.from, c.to, c.color));
    (layout.components || []).filter(c => c.type === 'resistor').forEach(c => drawResistor(svg, c.from, c.to, c.value));
    (layout.components || []).filter(c => c.type === 'capacitor').forEach(c => drawCapacitor(svg, c.positive, c.negative, c.value, c.polarised));
    (layout.components || []).filter(c => c.type === 'led').forEach(c => drawLed(svg, c.anode, c.cathode, c.color));
    (layout.components || []).filter(c => c.type === 'button' || c.type === 'switch').forEach(c => drawButton(svg, c.at, c.label));
    (layout.components || []).filter(c => c.type === 'ic').forEach(c => drawIC(svg, c.name, c.pin1_at, c.pins));

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
