// Tiny breadboard renderer. Takes a JSON DSL describing where components
// sit on a 30-column half-size breadboard and paints an SVG.
//
// Coords are {ROW}{COL} where ROW is A-J (or "+5V"/"GND" for power rails)
// and COL is 1-30. See AGENTS.md for the DSL contract.

(function (global) {
  const COLS = 30;
  const TIE = 20;
  const PAD_X = 50;
  const PAD_TOP = 16;
  const RAIL_GAP = 10;
  const RAIL_TO_GRID = 22;
  const HALF_GAP = 36;
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
    if (row === 'GND_B') return topGridStart + 5 * TIE + HALF_GAP + 5 * TIE + RAIL_TO_GRID - 14;
    if (row === '+5V_B') return rowY('GND_B') + RAIL_GAP;
    return null;
  }

  function el(name, attrs, parent) {
    const e = document.createElementNS(NS, name);
    for (const k in attrs) e.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(e);
    return e;
  }

  // ---------- hover side panel ----------

  function resetSidePanel(panel) {
    panel.innerHTML = '<div class="bb-side-empty">Hover a component or off-board line to see its photo.</div>';
  }

  function showItemInPanel(panel, item) {
    panel.innerHTML = '';
    if (item.image_path) {
      const img = document.createElement('img');
      img.src = item.image_path;
      img.alt = item.name;
      img.className = 'bb-side-img';
      panel.appendChild(img);
    } else {
      const ph = document.createElement('div');
      ph.className = 'bb-side-noimg';
      ph.textContent = 'No photo on file';
      panel.appendChild(ph);
    }
    const nm = document.createElement('div');
    nm.className = 'bb-side-name';
    nm.textContent = item.name;
    panel.appendChild(nm);
    if (item.category || item.value) {
      const meta = document.createElement('div');
      meta.className = 'bb-side-meta';
      const bits = [];
      if (item.category) bits.push(item.category);
      if (item.value) bits.push(item.value);
      meta.textContent = bits.join(' / ');
      panel.appendChild(meta);
    }
  }

  function attachHover(g, ctx, itemId) {
    if (!g || !ctx || !ctx.sidePanel) return;
    if (itemId == null) return;
    const item = ctx.itemsById[itemId];
    if (!item) return;
    g.style.cursor = 'help';
    g.addEventListener('mouseenter', () => showItemInPanel(ctx.sidePanel, item));
    g.addEventListener('mouseleave', () => resetSidePanel(ctx.sidePanel));
  }

  // Each tie hole's "electrical node": same column + same half = same node.
  // Power rails are one node per side.
  function nodeFor(row, col) {
    if (row === '+5V_T' || row === '+5V_B') return '+5V_' + (row.endsWith('T') ? 'T' : 'B');
    if (row === 'GND_T' || row === 'GND_B') return 'GND_' + (row.endsWith('T') ? 'T' : 'B');
    return 'C' + col + '_' + ('ABCDE'.includes(row) ? 'T' : 'B');
  }

  function resolvePos(pos, hintCol) {
    if (typeof pos !== 'string') return null;
    const rail = pos.match(/^\s*(\+?5V|VCC|GND)(?:_([TB]))?(?:\s*(?:at|@)\s*(\d+))?\s*$/i);
    if (rail) {
      let name = rail[1].toUpperCase().replace('+', '');
      if (name === 'VCC') name = '5V';
      const tag = (name === '5V' ? '+5V' : 'GND');
      const top = rail[2] === 'T' || (rail[2] == null);
      const col = rail[3] ? parseInt(rail[3], 10) : (hintCol || 15);
      return { x: colX(col), y: rowY(tag + '_' + (top ? 'T' : 'B')), isRail: true, railName: tag, top, col, node: tag + '_' + (top ? 'T' : 'B') };
    }
    const m = pos.match(/^\s*([A-J])(\d{1,2})\s*$/i);
    if (!m) return null;
    const row = m[1].toUpperCase();
    const col = parseInt(m[2], 10);
    if (col < 1 || col > COLS) return null;
    const y = rowY(row);
    if (y == null) return null;
    return { x: colX(col), y, row, col, half: 'ABCDE'.includes(row) ? 'T' : 'B', node: nodeFor(row, col) };
  }

  function pickRailSide(railPos, otherPos) {
    if (!railPos.isRail) return railPos;
    if (!otherPos) return railPos;
    const wantTop = otherPos.half ? otherPos.half === 'T' : (otherPos.y < rowY('F'));
    const col = otherPos.col || railPos.col || 15;
    const node = (railPos.railName === '5V' ? '+5V_' : 'GND_') + (wantTop ? 'T' : 'B');
    return {
      x: colX(col),
      y: rowY((railPos.railName === '5V' ? '+5V_' : 'GND_') + (wantTop ? 'T' : 'B')),
      isRail: true,
      railName: railPos.railName,
      col,
      node,
    };
  }

  function totalHeight() { return rowY('+5V_B') + 18; }
  function totalWidth()  { return PAD_X * 2 + (COLS - 1) * TIE; }

  // ---------- breadboard background ----------

  function drawBoard(svg, ctx) {
    const W = totalWidth();
    const H = totalHeight();
    svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
    svg.setAttribute('width', '100%');
    svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
    svg.style.maxWidth = (W + 'px');

    const defs = el('defs', {}, svg);
    const shadow = el('filter', { id: 'bb-shadow', x: '-5%', y: '-5%', width: '110%', height: '110%' }, defs);
    el('feDropShadow', { dx: 0, dy: 1.5, stdDeviation: 1.2, 'flood-color': '#000', 'flood-opacity': 0.18 }, shadow);
    const ringFilter = el('filter', { id: 'bb-ring', x: '-50%', y: '-50%', width: '200%', height: '200%' }, defs);
    el('feGaussianBlur', { in: 'SourceGraphic', stdDeviation: 0.8 }, ringFilter);
    // Yellow outline glow applied to components on the active node when a hole
    // is hovered/clicked. Dilates the alpha channel, paints the dilated outline
    // gold, then composites with the original component on top.
    const hl = el('filter', { id: 'bb-highlight', x: '-30%', y: '-30%', width: '160%', height: '160%' }, defs);
    el('feMorphology', { in: 'SourceAlpha', operator: 'dilate', radius: 2, result: 'thick' }, hl);
    el('feFlood', { 'flood-color': '#f59e0b', 'flood-opacity': 0.95, result: 'goldFill' }, hl);
    el('feComposite', { in: 'goldFill', in2: 'thick', operator: 'in', result: 'goldOutline' }, hl);
    el('feGaussianBlur', { in: 'goldOutline', stdDeviation: 0.6, result: 'goldGlow' }, hl);
    const merge = el('feMerge', {}, hl);
    el('feMergeNode', { in: 'goldGlow' }, merge);
    el('feMergeNode', { in: 'SourceGraphic' }, merge);

    // z-stack from bottom to top:
    //   1. board (background paint)
    //   2. tie holes (clickable, have title tooltips)
    //   3. components (resistors, caps, LEDs, ICs) - pointer-events:none
    //   4. wires (curved jumpers ON TOP of components) - pointer-events:none
    //   5. overlay (text labels, hint)
    ctx.boardLayer     = el('g', { class: 'bb-board' }, svg);
    ctx.holesLayer     = el('g', { class: 'bb-holes' }, svg);
    ctx.componentLayer = el('g', { class: 'bb-components' }, svg);
    ctx.wireLayer      = el('g', { class: 'bb-wires',      'pointer-events': 'none' }, svg);
    ctx.overlayLayer   = el('g', { class: 'bb-overlay' }, svg);

    // board paint
    el('rect', { x: 8, y: 8, width: W - 16, height: H - 18, rx: 8, fill: '#f4ecd6', stroke: '#bba47a', 'stroke-width': 1.2 }, ctx.boardLayer);
    const gullyY = rowY('E') + TIE / 2 + 2;
    el('rect', { x: 8, y: gullyY, width: W - 16, height: HALF_GAP - 4, fill: '#e3d7b1' }, ctx.boardLayer);

    // Rails
    for (const side of ['T', 'B']) {
      const yPlus = rowY('+5V_' + side);
      const yGnd  = rowY('GND_' + side);
      const xMin  = colX(1) - 6;
      const xMax  = colX(COLS) + 6;
      el('line', { x1: xMin, y1: yPlus, x2: xMax, y2: yPlus, stroke: '#ef4444', 'stroke-width': 2.4, opacity: 0.5 }, ctx.boardLayer);
      el('line', { x1: xMin, y1: yGnd,  x2: xMax, y2: yGnd,  stroke: '#1f2937', 'stroke-width': 2.4, opacity: 0.6 }, ctx.boardLayer);

      for (let c = 1; c <= COLS; c++) {
        if (c === 6 || c === 11 || c === 16 || c === 21 || c === 26) continue;
        addTie(ctx, colX(c), yPlus, '+5V_' + side, '+5V', c);
        addTie(ctx, colX(c), yGnd, 'GND_' + side, 'GND', c);
      }
      el('text', { x: 14, y: yPlus + 3, 'font-size': 10, 'font-family': 'monospace', 'font-weight': 'bold', fill: '#b91c1c' }, ctx.boardLayer).textContent = '+';
      el('text', { x: 14, y: yGnd  + 3, 'font-size': 10, 'font-family': 'monospace', 'font-weight': 'bold', fill: '#1f2937' }, ctx.boardLayer).textContent = '-';
      el('text', { x: xMax + 4, y: yPlus + 3, 'font-size': 10, 'font-family': 'monospace', 'font-weight': 'bold', fill: '#b91c1c' }, ctx.boardLayer).textContent = '+';
      el('text', { x: xMax + 4, y: yGnd  + 3, 'font-size': 10, 'font-family': 'monospace', 'font-weight': 'bold', fill: '#1f2937' }, ctx.boardLayer).textContent = '-';
    }

    // Main grid
    for (let c = 1; c <= COLS; c++) {
      for (const row of ROW_LETTERS) {
        addTie(ctx, colX(c), rowY(row), nodeFor(row, c), row, c);
      }
    }

    for (let i = 0; i < ROW_LETTERS.length; i++) {
      const row = ROW_LETTERS[i];
      const y = rowY(row) + 3;
      el('text', { x: 32, y, 'font-size': 10, 'font-family': 'monospace', fill: '#7a6b3a' }, ctx.boardLayer).textContent = row;
      el('text', { x: colX(COLS) + 16, y, 'font-size': 10, 'font-family': 'monospace', fill: '#7a6b3a' }, ctx.boardLayer).textContent = row;
    }
    for (let c = 1; c <= COLS; c++) {
      if (c % 5 !== 0 && c !== 1) continue;
      const x = colX(c);
      el('text', { x, y: rowY('A') - 8, 'font-size': 9, 'font-family': 'monospace', fill: '#7a6b3a', 'text-anchor': 'middle' }, ctx.boardLayer).textContent = c;
      el('text', { x, y: rowY('J') + TIE - 4, 'font-size': 9, 'font-family': 'monospace', fill: '#7a6b3a', 'text-anchor': 'middle' }, ctx.boardLayer).textContent = c;
    }
  }

  function addTie(ctx, x, y, node, row, col) {
    const r = el('rect', {
      x: x - 2.8, y: y - 2.8, width: 5.6, height: 5.6, rx: 0.7,
      fill: '#fafaf6', stroke: '#a09275', 'stroke-width': 0.7,
      class: 'bb-tie', 'data-node': node,
    }, ctx.holesLayer);
    r.style.cursor = 'pointer';
    const labelTxt = (row === 'GND_T' || row === 'GND_B') ? 'GND@' + col
                  : (row === '+5V_T' || row === '+5V_B') ? '+5V@' + col
                  : row + col;
    const title = el('title', {}, r);
    title.textContent = labelTxt + '  (node ' + node + ')';
    r.addEventListener('mouseenter', () => highlightNode(ctx, node, true));
    r.addEventListener('mouseleave', () => highlightNode(ctx, ctx.activeNode, false));
    r.addEventListener('click', (ev) => {
      ev.stopPropagation();
      ctx.activeNode = (ctx.activeNode === node) ? null : node;
      highlightNode(ctx, ctx.activeNode, false);
    });
    if (!ctx.tiesByNode[node]) ctx.tiesByNode[node] = [];
    ctx.tiesByNode[node].push({ el: r, x, y });
  }

  // Register a component group as electrically attached to one or more nodes.
  // When the user later hovers/clicks a hole on that node, the group gets the
  // bb-highlight filter so the kid can see "these are the parts on this rail".
  function bindNodes(ctx, g, ...positions) {
    if (!g) return;
    if (!ctx.componentsByNode) ctx.componentsByNode = {};
    for (const pos of positions) {
      if (!pos) continue;
      const r = (typeof pos === 'string') ? resolvePos(pos) : pos;
      if (!r || !r.node) continue;
      if (!ctx.componentsByNode[r.node]) ctx.componentsByNode[r.node] = [];
      if (!ctx.componentsByNode[r.node].includes(g)) ctx.componentsByNode[r.node].push(g);
    }
  }

  function setComponentHighlight(g, on) {
    if (!g) return;
    const baseShadow = 'url(#bb-shadow)';
    if (on) {
      g.setAttribute('filter', 'url(#bb-highlight)');
    } else {
      const had = g.getAttribute('data-base-filter');
      g.setAttribute('filter', had || baseShadow);
    }
  }

  function highlightNode(ctx, node, hover) {
    // Reset all tie holes
    Object.values(ctx.tiesByNode).forEach(arr => arr.forEach(({ el: r }) => {
      r.setAttribute('fill', '#fafaf6');
      r.setAttribute('stroke', '#a09275');
      r.setAttribute('stroke-width', 0.7);
    }));
    // Reset all previously-highlighted components
    if (ctx.lastHighlightedComponents) {
      ctx.lastHighlightedComponents.forEach(g => setComponentHighlight(g, false));
      ctx.lastHighlightedComponents = null;
    }
    if (!node) {
      if (ctx.hintLabel) ctx.hintLabel.style.display = '';
      return;
    }
    // Highlight tie holes on the node
    (ctx.tiesByNode[node] || []).forEach(({ el: r }) => {
      r.setAttribute('fill', '#fef08a');
      r.setAttribute('stroke', '#a16207');
      r.setAttribute('stroke-width', 1.4);
    });
    // Highlight components attached to the node
    const comps = (ctx.componentsByNode && ctx.componentsByNode[node]) || [];
    comps.forEach(g => setComponentHighlight(g, true));
    ctx.lastHighlightedComponents = comps.slice();
    if (ctx.hintLabel) ctx.hintLabel.style.display = 'none';
  }

  // ---------- glyphs ----------

  function drawWire(svg, ctx, from, to, color, itemId) {
    let a = resolvePos(from);
    let b = resolvePos(to, a && a.col);
    if (!a || !b) return null;
    if (a.isRail && !b.isRail) a = pickRailSide(a, b);
    if (b.isRail && !a.isRail) b = pickRailSide(b, a);
    const colorAttr = color || '#444';
    const layer = ctx.wireLayer;

    // Every wire gets a quadratic bezier curve. Control point is offset
    // perpendicular to the wire direction, chosen so the arc bows AWAY from
    // the board surface (toward smaller Y where possible). Wires going to
    // a rail at the same edge get a small bow toward the centre instead.
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const dist = Math.hypot(dx, dy) || 1;
    const flying = Math.abs(dx) > TIE * 4 && Math.abs(dy) > TIE * 3;
    const lift = flying
      ? Math.min(Math.abs(dx) * 0.18, 42)
      : Math.min(dist * 0.18, 14);

    // Perpendicular unit vector (rotate (dx,dy) 90deg CCW)
    let px = -dy / dist, py = dx / dist;
    // Flip so the arc bows "up" (smaller Y). Both rails at the bottom?
    // arc the other way slightly so we don't dive into off-board text.
    if (a.isRail && b.isRail) {
      // Two rails - bow toward board centre
      const centreY = rowY('E') + TIE * 2.5;
      const my0 = (a.y + b.y) / 2;
      if (my0 < centreY) { px = Math.abs(px); py = Math.abs(py); }
      else               { px = -Math.abs(px); py = -Math.abs(py); }
    } else if (py > 0) {
      px = -px; py = -py;
    }

    const mx = (a.x + b.x) / 2 + px * lift;
    const my = (a.y + b.y) / 2 + py * lift;

    // Wrap wire elements in a group so we can highlight the whole jumper at
    // once when its electrical node is selected.
    const g = el('g', { class: 'bb-wire', filter: 'url(#bb-shadow)' }, layer);
    el('path', {
      d: `M${a.x} ${a.y} Q ${mx} ${my} ${b.x} ${b.y}`,
      fill: 'none', stroke: colorAttr,
      'stroke-width': flying ? 2.6 : 2.4,
      'stroke-linecap': 'round',
    }, g);
    el('circle', { cx: a.x, cy: a.y, r: 3.2, fill: colorAttr }, g);
    el('circle', { cx: b.x, cy: b.y, r: 3.2, fill: colorAttr }, g);
    el('circle', { cx: a.x - 1, cy: a.y - 1, r: 1.2, fill: '#fff', opacity: 0.55 }, g);
    el('circle', { cx: b.x - 1, cy: b.y - 1, r: 1.2, fill: '#fff', opacity: 0.55 }, g);

    bindNodes(ctx, g, a, b);
    return { a, b, flying, color: colorAttr };
  }

  // ---- Resistor colour-band code (5-band, 1% metal film) ----

  const BAND_DIGIT_COLORS = [
    '#1a1a1a', // 0 black
    '#6b3410', // 1 brown
    '#dc2626', // 2 red
    '#ea580c', // 3 orange
    '#facc15', // 4 yellow
    '#16a34a', // 5 green
    '#1d4ed8', // 6 blue
    '#7c3aed', // 7 violet
    '#6b7280', // 8 grey
    '#fafafa', // 9 white
  ];
  const BAND_GOLD   = '#d4a017';
  const BAND_SILVER = '#b8b8b8';

  function parseResistorOhms(value) {
    if (value == null) return null;
    const s = String(value).trim().toUpperCase().replace(/Ω/g, '').replace(/OHMS?/g, '');
    const m = s.match(/^([\d.]+)\s*([RKM]?)$/);
    if (!m) return null;
    const num = parseFloat(m[1]);
    if (!isFinite(num) || num <= 0) return null;
    const mult = m[2] === 'M' ? 1e6 : m[2] === 'K' ? 1e3 : 1;
    return num * mult;
  }

  function fiveBandFor(ohms) {
    if (!isFinite(ohms) || ohms <= 0) return null;
    let k = Math.floor(Math.log10(ohms)) - 2;
    let N = Math.round(ohms / Math.pow(10, k));
    if (N >= 1000) { k++; N = Math.round(ohms / Math.pow(10, k)); }
    if (N < 100 && k > -2) { k--; N = Math.round(ohms / Math.pow(10, k)); }
    if (k < -2 || k > 9 || N < 100 || N > 999) return null;
    return {
      d1:   Math.floor(N / 100),
      d2:   Math.floor((N % 100) / 10),
      d3:   N % 10,
      mult: k,
    };
  }

  function multColor(k) {
    if (k === -2) return BAND_SILVER;
    if (k === -1) return BAND_GOLD;
    return BAND_DIGIT_COLORS[k] || '#1f2937';
  }

  function drawResistor(svg, ctx, from, to, value, itemId) {
    const a = resolvePos(from);
    let b = resolvePos(to, a && a.col);
    if (!a || !b) return;
    b = b.isRail ? pickRailSide(b, a) : b;
    const angle = Math.atan2(b.y - a.y, b.x - a.x);
    const angleDeg = angle * 180 / Math.PI;
    const mx = (a.x + b.x) / 2;
    const my = (a.y + b.y) / 2;
    const fullLen = Math.hypot(b.x - a.x, b.y - a.y);
    const bodyW = 30;
    const bodyH = 11;
    const leadLen = Math.max(2, (fullLen - bodyW) / 2);

    const g = el('g', { transform: `translate(${mx} ${my}) rotate(${angleDeg})`, filter: 'url(#bb-shadow)' }, ctx.componentLayer);
    el('line', { x1: -bodyW / 2 - leadLen, y1: 0, x2: -bodyW / 2, y2: 0, stroke: '#7a6b4d', 'stroke-width': 1.4 }, g);
    el('line', { x1:  bodyW / 2 + leadLen, y1: 0, x2:  bodyW / 2, y2: 0, stroke: '#7a6b4d', 'stroke-width': 1.4 }, g);
    el('rect', { x: -bodyW / 2, y: -bodyH / 2, width: bodyW, height: bodyH, rx: 3, fill: '#d9b385', stroke: '#7a4f1f', 'stroke-width': 0.8 }, g);

    // 5-band code (1% metal film). Falls back to 3 generic stripes if the
    // value can't be parsed (e.g. "POT" or "N/A").
    const bands = fiveBandFor(parseResistorOhms(value));
    if (bands) {
      const bandSpec = [
        { x: -10,  c: BAND_DIGIT_COLORS[bands.d1] },
        { x: -6.5, c: BAND_DIGIT_COLORS[bands.d2] },
        { x: -3,   c: BAND_DIGIT_COLORS[bands.d3] },
        { x:  0.5, c: multColor(bands.mult) },
        { x:  8,   c: BAND_DIGIT_COLORS[1] }, // 1% tolerance -> brown
      ];
      const bandW = 2;
      bandSpec.forEach(({ x, c }) => {
        el('rect', {
          x: x - bandW / 2, y: -bodyH / 2,
          width: bandW, height: bodyH,
          fill: c,
          stroke: '#3b2c14', 'stroke-width': 0.25,
        }, g);
      });
    } else {
      el('rect', { x: -bodyW / 2 + 4, y: -bodyH / 2, width: 2, height: bodyH, fill: '#1f2937', opacity: 0.55 }, g);
      el('rect', { x: -bodyW / 2 + 8, y: -bodyH / 2, width: 2, height: bodyH, fill: '#dc2626', opacity: 0.6 }, g);
      el('rect', { x:  bodyW / 2 - 6, y: -bodyH / 2, width: 2, height: bodyH, fill: '#a16207', opacity: 0.6 }, g);
    }
    if (value) {
      let labelRot = -angleDeg;
      if (angleDeg > 90 || angleDeg < -90) labelRot += 180;
      el('text', {
        x: 0, y: -bodyH / 2 - 5, 'font-size': 9, 'font-family': 'monospace',
        'font-weight': 'bold', fill: '#5a3a14', 'text-anchor': 'middle',
        transform: `rotate(${labelRot})`,
      }, g).textContent = value;
    }
    bindNodes(ctx, g, a, b);
    attachHover(g, ctx, itemId);
  }

  function drawCapacitor(svg, ctx, positive, negative, value, polarised, itemId) {
    const a = resolvePos(positive);
    let b = resolvePos(negative);
    if (!a || !b) return;
    b = b.isRail ? pickRailSide(b, a) : b;
    const mx = (a.x + b.x) / 2;
    const r = 12;
    // Decide where the bulb sits. Default: above the legs (toward smaller Y).
    // But if both legs are in the bottom half AND there is an IC in the gully
    // above them, push the bulb DOWN below the J row so it doesn't sit on the
    // chip body. If both in top half, push UP above row A.
    const inTopHalf = a.y < rowY('F') && b.y < rowY('F');
    const inBottomHalf = a.y > rowY('E') + TIE && b.y > rowY('E') + TIE;
    let bulbY;
    if (inBottomHalf) {
      // Bulb sits ABOVE the legs but only if that area isn't in the gully.
      // Test: would bulbY land between E and F rows (gully zone)?
      const candidateUp = Math.min(a.y, b.y) - 28;
      if (candidateUp > rowY('E') + TIE / 2) {
        bulbY = candidateUp;     // safe, doesn't overlap chip area
      } else {
        bulbY = Math.max(a.y, b.y) + 26;  // push below the board
      }
    } else if (inTopHalf) {
      bulbY = Math.min(a.y, b.y) - 26;
    } else {
      bulbY = Math.min(a.y, b.y) - 28;
    }
    const legEndY = bulbY < a.y ? bulbY + 6 : bulbY - 6;
    el('line', { x1: a.x, y1: a.y, x2: a.x, y2: legEndY, stroke: '#666', 'stroke-width': 1.4 }, ctx.componentLayer);
    el('line', { x1: b.x, y1: b.y, x2: b.x, y2: legEndY, stroke: '#666', 'stroke-width': 1.4 }, ctx.componentLayer);
    const g = el('g', { filter: 'url(#bb-shadow)' }, ctx.componentLayer);
    el('circle', { cx: mx, cy: bulbY, r, fill: '#1e3a8a', stroke: '#0f172a', 'stroke-width': 1 }, g);
    el('circle', { cx: mx, cy: bulbY - 2, r: r - 3, fill: '#3b82f6', opacity: 0.7 }, g);
    if (value) {
      el('text', { x: mx, y: bulbY + 3, 'font-size': 8, 'font-family': 'monospace', fill: '#fafafa', 'text-anchor': 'middle', 'font-weight': 'bold' }, g).textContent = value;
    }
    if (polarised !== false) {
      el('text', { x: a.x, y: bulbY + 3.5, 'font-size': 11, 'font-family': 'monospace', 'font-weight': 'bold', fill: '#b91c1c', 'text-anchor': 'middle' }, g).textContent = '+';
      el('rect', { x: b.x - 4, y: bulbY - r + 2, width: 8, height: 2.5, fill: '#fff', opacity: 0.95 }, g);
    }
    bindNodes(ctx, g, a, b);
    attachHover(g, ctx, itemId);
  }

  function drawLed(svg, ctx, anode, cathode, color, itemId) {
    const a = resolvePos(anode);
    const c = resolvePos(cathode);
    if (!a || !c) return;
    const fills = { red: '#ef4444', green: '#10b981', blue: '#3b82f6', yellow: '#facc15', white: '#fafafa', orange: '#fb923c' };
    const fill = fills[(color || 'red').toLowerCase()] || '#ef4444';
    const stroke = (color || '').toLowerCase() === 'yellow' ? '#854d0e' : (color || '').toLowerCase() === 'white' ? '#999' : '#7f1d1d';
    const mx = (a.x + c.x) / 2;
    const my = Math.min(a.y, c.y) - 16;
    el('line', { x1: a.x, y1: a.y, x2: mx - 5, y2: my + 6, stroke: '#888', 'stroke-width': 1.2 }, ctx.componentLayer);
    el('line', { x1: c.x, y1: c.y, x2: mx + 5, y2: my + 6, stroke: '#888', 'stroke-width': 1.2 }, ctx.componentLayer);
    const g = el('g', { filter: 'url(#bb-shadow)' }, ctx.componentLayer);
    el('path', { d: `M ${mx - 9} ${my + 6} A 9 9 0 0 1 ${mx + 9} ${my + 6} L ${mx + 9} ${my + 8} L ${mx - 9} ${my + 8} Z`, fill, stroke, 'stroke-width': 1 }, g);
    el('rect', { x: mx - 10, y: my + 7, width: 20, height: 3, fill: '#374151', opacity: 0.7 }, g);
    el('ellipse', { cx: mx - 3, cy: my, rx: 3, ry: 4, fill: '#fff', opacity: 0.55 }, g);
    el('text', { x: a.x, y: a.y - 6, 'font-size': 8, 'font-family': 'monospace', 'font-weight': 'bold', fill: '#b91c1c', 'text-anchor': 'middle' }, ctx.componentLayer).textContent = '+';
    el('text', { x: c.x, y: c.y - 6, 'font-size': 8, 'font-family': 'monospace', 'font-weight': 'bold', fill: '#1f2937', 'text-anchor': 'middle' }, ctx.componentLayer).textContent = '-';
    bindNodes(ctx, g, a, c);
    attachHover(g, ctx, itemId);
  }

  // colour-code IC bodies by family so a quick glance distinguishes
  // timers / op-amps / comparators / arrays at a glance.
  const IC_FAMILY_COLOR = {
    'NE555':    { fill: '#1e293b', label: '#fde047' },
    'LM358':    { fill: '#312e81', label: '#fafafa' },
    'LM324':    { fill: '#312e81', label: '#fafafa' },
    'UA741':    { fill: '#312e81', label: '#fafafa' },
    'JRC4558':  { fill: '#312e81', label: '#fafafa' },
    'NE5532':   { fill: '#312e81', label: '#fafafa' },
    'LM393':    { fill: '#581c87', label: '#fafafa' },
    'LM339':    { fill: '#581c87', label: '#fafafa' },
    'LM386':    { fill: '#7c2d12', label: '#fafafa' },
    'TDA2030A': { fill: '#7c2d12', label: '#fafafa' },
    'TDA2822D': { fill: '#7c2d12', label: '#fafafa' },
    'PC817':    { fill: '#365314', label: '#fafafa' },
    'ULN2003':  { fill: '#1e293b', label: '#fafafa' },
    'ULN2803':  { fill: '#1e293b', label: '#fafafa' },
  };

  function icPalette(name) {
    const key = (name || '').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8);
    for (const k in IC_FAMILY_COLOR) {
      if (key.startsWith(k.replace(/[^A-Z0-9]/g, ''))) return IC_FAMILY_COLOR[k];
    }
    return { fill: '#1e293b', label: '#fafafa' };
  }

  function drawIC(svg, ctx, name, pin1_at, pins, itemId) {
    const p1 = resolvePos(pin1_at);
    if (!p1 || !p1.row || !p1.col) return;
    pins = pins || 8;
    const perSide = pins / 2;
    const x1 = colX(p1.col) - TIE / 2 + 2;
    const x2 = colX(p1.col + perSide - 1) + TIE / 2 - 2;
    const yTop = rowY('E') + TIE / 2 - 4;
    const yBot = rowY('F') - TIE / 2 + 4;
    const palette = icPalette(name);
    const g = el('g', { filter: 'url(#bb-shadow)' }, ctx.componentLayer);

    el('rect', { x: x1, y: yTop, width: x2 - x1, height: yBot - yTop, rx: 3, fill: palette.fill, stroke: '#0f172a', 'stroke-width': 1 }, g);
    el('path', {
      d: `M ${x1 + 3} ${(yTop + yBot) / 2 - 5} A 5 5 0 0 0 ${x1 + 3} ${(yTop + yBot) / 2 + 5} Z`,
      fill: '#0f172a',
    }, g);

    for (let i = 0; i < perSide; i++) {
      const xPin = colX(p1.col + i);
      el('rect', { x: xPin - 3, y: yTop - 2, width: 6, height: 4, fill: '#cbd5e1', stroke: '#475569', 'stroke-width': 0.5 }, g);
      el('rect', { x: xPin - 3, y: yBot - 2, width: 6, height: 4, fill: '#cbd5e1', stroke: '#475569', 'stroke-width': 0.5 }, g);
      el('text', { x: xPin, y: yBot + 9, 'font-size': 7, 'font-family': 'monospace', fill: palette.label, 'text-anchor': 'middle' }, g).textContent = i + 1;
      el('text', { x: xPin, y: yTop - 4, 'font-size': 7, 'font-family': 'monospace', fill: palette.label, 'text-anchor': 'middle' }, g).textContent = pins - i;
    }
    el('text', { x: (x1 + x2) / 2, y: (yTop + yBot) / 2 + 4, 'font-size': 10, 'font-family': 'monospace', fill: palette.label, 'text-anchor': 'middle', 'font-weight': 'bold' }, g).textContent = name;
    const pin1Y = p1.row === 'E' ? yTop + 4 : yBot - 4;
    el('circle', { cx: colX(p1.col), cy: pin1Y, r: 2.5, fill: '#fde047', stroke: '#a16207', 'stroke-width': 0.8 }, g);
    // Bind every pin's node so highlighting any one rail also lights the chip.
    const pinTopRow = p1.row === 'E' ? 'E' : 'F';
    const pinBotRow = p1.row === 'E' ? 'F' : 'E';
    for (let i = 0; i < perSide; i++) {
      bindNodes(ctx, g, `${pinTopRow}${p1.col + i}`, `${pinBotRow}${p1.col + i}`);
    }
    attachHover(g, ctx, itemId);
  }

  function drawTransistor(svg, ctx, at, name, package_, pinout, itemId) {
    // 3-pin TO-92 plastic transistor with rounded back. `at` is the centre pin.
    // pinout default: BC547 = "BCE" (left to right when flat-side faces you).
    const c = resolvePos(at);
    if (!c) return;
    const order = (pinout || 'CBE').toUpperCase();
    const g = el('g', { filter: 'url(#bb-shadow)' }, ctx.componentLayer);
    // Body: half-circle dome behind row of 3 pins
    const bodyW = TIE * 2 + 4;
    el('path', {
      d: `M ${c.x - bodyW / 2} ${c.y - 4} A ${bodyW / 2} ${bodyW / 2 - 6} 0 0 1 ${c.x + bodyW / 2} ${c.y - 4} L ${c.x + bodyW / 2} ${c.y + 4} L ${c.x - bodyW / 2} ${c.y + 4} Z`,
      fill: '#1c1917', stroke: '#0f0f0d', 'stroke-width': 0.8,
    }, g);
    el('line', { x1: c.x - bodyW / 2 + 2, y1: c.y + 4, x2: c.x + bodyW / 2 - 2, y2: c.y + 4, stroke: '#71717a' }, g);
    // 3 pin labels (left, centre, right)
    for (let i = -1; i <= 1; i++) {
      const x = c.x + i * TIE;
      el('line', { x1: x, y1: c.y + 4, x2: x, y2: c.y + 14, stroke: '#7a6b4d', 'stroke-width': 1.4 }, g);
      el('text', { x, y: c.y - 7, 'font-size': 7, 'font-family': 'monospace', fill: '#fafafa', 'text-anchor': 'middle' }, g).textContent = order[i + 1];
    }
    if (name) el('text', { x: c.x, y: c.y + 22, 'font-size': 8, 'font-family': 'monospace', fill: '#1c1917', 'text-anchor': 'middle', 'font-weight': 'bold' }, g).textContent = name;
    // 3 legs: at-1, at, at+1 in the same row
    bindNodes(ctx, g, `${c.row}${c.col - 1}`, `${c.row}${c.col}`, `${c.row}${c.col + 1}`);
    attachHover(g, ctx, itemId);
  }

  function drawButton(svg, ctx, at, label, itemId) {
    // 4-pin tactile button. `at` is the top-left pin. Other pins at +2 cols across,
    // and the second row of pins is 2 rows below.
    const tl = resolvePos(at);
    if (!tl) return;
    const tr = resolvePos(`${tl.row}${tl.col + 2}`);
    const blRow = ROW_LETTERS[ROW_LETTERS.indexOf(tl.row) + 2];
    const bl = blRow ? resolvePos(`${blRow}${tl.col}`) : null;
    const br = blRow ? resolvePos(`${blRow}${tl.col + 2}`) : null;
    if (!tr || !bl || !br) return;
    const cx = (tl.x + tr.x) / 2;
    const cy = (tl.y + bl.y) / 2;
    const g = el('g', { filter: 'url(#bb-shadow)' }, ctx.componentLayer);
    // square body
    const sz = 22;
    el('rect', { x: cx - sz / 2, y: cy - sz / 2, width: sz, height: sz, rx: 3, fill: '#e7e5e4', stroke: '#475569', 'stroke-width': 1.2 }, g);
    el('rect', { x: cx - sz / 2 + 2, y: cy - sz / 2 + 2, width: sz - 4, height: sz - 4, rx: 2, fill: '#fafaf9', stroke: '#a3a3a3', 'stroke-width': 0.6 }, g);
    // red plunger
    el('circle', { cx, cy, r: 5, fill: '#ef4444', stroke: '#7f1d1d', 'stroke-width': 1 }, g);
    el('circle', { cx: cx - 1.5, cy: cy - 1.5, r: 1.5, fill: '#fff', opacity: 0.7 }, g);
    if (label) el('text', { x: cx, y: cy - sz / 2 - 4, 'font-size': 8, 'font-family': 'monospace', fill: '#1f2937', 'text-anchor': 'middle', 'font-weight': 'bold' }, g).textContent = label;
    // pin dots so the kid sees which 4 holes the button straddles
    [tl, tr, bl, br].forEach(p => el('circle', { cx: p.x, cy: p.y, r: 2.6, fill: '#475569' }, g));
    bindNodes(ctx, g, tl, tr, bl, br);
    attachHover(g, ctx, itemId);
  }

  function drawPot(svg, ctx, at, value, label, itemId) {
    // 3-pin potentiometer or trimmer. `at` is the centre (wiper) pin.
    const c = resolvePos(at);
    if (!c) return;
    const g = el('g', { filter: 'url(#bb-shadow)' }, ctx.componentLayer);
    // body
    el('rect', { x: c.x - TIE - 4, y: c.y - 14, width: 2 * TIE + 8, height: 26, rx: 3, fill: '#1d4ed8', stroke: '#0f172a', 'stroke-width': 1 }, g);
    // shaft / rotation indicator
    el('circle', { cx: c.x, cy: c.y - 4, r: 6, fill: '#fafafa', stroke: '#1e293b', 'stroke-width': 1 }, g);
    el('line', { x1: c.x, y1: c.y - 4, x2: c.x + 4, y2: c.y - 8, stroke: '#1e293b', 'stroke-width': 1.2 }, g);
    // labels
    el('text', { x: c.x, y: c.y + 8, 'font-size': 7, 'font-family': 'monospace', fill: '#fafafa', 'text-anchor': 'middle' }, g).textContent = value || 'POT';
    if (label) el('text', { x: c.x, y: c.y - 18, 'font-size': 7, 'font-family': 'monospace', fill: '#1f2937', 'text-anchor': 'middle' }, g).textContent = label;
    // pin dots
    el('circle', { cx: c.x - TIE, cy: c.y, r: 2.6, fill: '#475569' }, g);
    el('circle', { cx: c.x,        cy: c.y, r: 2.6, fill: '#475569' }, g);
    el('circle', { cx: c.x + TIE, cy: c.y, r: 2.6, fill: '#475569' }, g);
    bindNodes(ctx, g, `${c.row}${c.col - 1}`, `${c.row}${c.col}`, `${c.row}${c.col + 1}`);
    attachHover(g, ctx, itemId);
  }

  function drawModule(svg, ctx, comp) {
    // Sensor / display module. Rectangular PCB with labelled pins.
    // comp: { type:'module', name, pins:[{label,at},...] }
    const pins = comp.pins || [];
    if (!pins.length) return;
    const positions = pins.map(p => resolvePos(p.at)).filter(Boolean);
    if (!positions.length) return;
    const minX = Math.min(...positions.map(p => p.x));
    const maxX = Math.max(...positions.map(p => p.x));
    const baseY = positions[0].y;
    const above = baseY < rowY('F');  // module sits above pins if on top half
    const bodyW = (maxX - minX) + TIE + 8;
    const bodyH = 30;
    const bodyY = above ? baseY - bodyH - 6 : baseY + 6;
    const g = el('g', { filter: 'url(#bb-shadow)' }, ctx.componentLayer);
    // PCB body in green
    el('rect', { x: minX - 6, y: bodyY, width: bodyW, height: bodyH, rx: 3, fill: '#0f4c2a', stroke: '#052e16', 'stroke-width': 1 }, g);
    el('rect', { x: minX - 4, y: bodyY + 2, width: bodyW - 4, height: bodyH - 4, rx: 2, fill: '#166534', opacity: 0.7 }, g);
    // module name
    el('text', { x: (minX + maxX) / 2, y: bodyY + bodyH / 2 + 4, 'font-size': 10, 'font-family': 'monospace', 'font-weight': 'bold', fill: '#fafafa', 'text-anchor': 'middle' }, g).textContent = comp.name || 'MODULE';
    // pin headers + labels
    positions.forEach((p, i) => {
      const pinY = above ? bodyY + bodyH : bodyY;
      el('rect', { x: p.x - 3, y: pinY - 2, width: 6, height: 4, fill: '#a3a3a3', stroke: '#525252', 'stroke-width': 0.5 }, g);
      el('line', { x1: p.x, y1: pinY + (above ? 2 : -2), x2: p.x, y2: p.y, stroke: '#7a6b4d', 'stroke-width': 1.4 }, g);
      const label = pins[i] && pins[i].label;
      if (label) {
        const ly = above ? bodyY + bodyH + 12 : bodyY - 4;
        el('text', { x: p.x, y: ly, 'font-size': 7, 'font-family': 'monospace', fill: '#1f2937', 'text-anchor': 'middle' }, g).textContent = label;
      }
    });
    bindNodes(ctx, g, ...positions);
    attachHover(g, ctx, comp.item_id);
  }

  function drawServo(svg, ctx, comp) {
    // 3-pin servo connector. Often plugs into 3 adjacent breadboard holes.
    // Treat as a small module with pins labelled SIG / +5V / GND.
    return drawModule(svg, ctx, {
      type: 'module',
      name: comp.name || 'SG90 Servo',
      pins: comp.pins || [
        { label: 'SIG', at: comp.signal },
        { label: '+',   at: comp.power  || comp.vcc },
        { label: '-',   at: comp.ground || comp.gnd },
      ].filter(p => p.at),
    });
  }

  function shortPinLabel(from) {
    if (!from) return '?';
    const m = from.match(/\b(5V|VCC|VIN|3V3|GND|D\d{1,2}|A\d|SDA|SCL|TX|RX|MOSI|MISO|SCK|CS)\b/i);
    if (m) return m[0].toUpperCase();
    return (from.split(/[\s(]/)[0] || '?').slice(0, 6);
  }

  function pickArrivalColor(label) {
    if (/^(5V|VCC|VIN|3V3)/i.test(label)) return '#dc2626';
    if (/^GND/i.test(label)) return '#1f2937';
    if (/^D\d/i.test(label)) return '#1d4ed8';
    if (/^A\d/i.test(label)) return '#7c3aed';
    return '#6b7280';
  }

  function isArrivalFromTop(pos) {
    if (pos.isRail) return pos.y < (rowY('A') + rowY('J')) / 2;
    return 'ABCDE'.includes(pos.row);
  }

  function drawArrival(svg, ctx, e, topEdgeY, botEdgeY) {
    if (!e.to) return false;
    const pos = resolvePos(e.to);
    if (!pos) return false;

    const fromTop = isArrivalFromTop(pos);
    const label = shortPinLabel(e.from);
    const color = pickArrivalColor(label);

    const g = el('g', { class: 'bb-arrival' }, ctx.overlayLayer);

    let yStart, yEnd, labelY, dir;
    if (fromTop) {
      yStart = topEdgeY + 10;
      yEnd = pos.y - 4;
      labelY = topEdgeY + 6;
      dir = 1;
    } else {
      yStart = botEdgeY - 10;
      yEnd = pos.y + 4;
      labelY = botEdgeY - 1;
      dir = -1;
    }

    // Dashed feed wire from board edge to the hole, so it's clearly an
    // "incoming from off-board" wire and not confused with a real jumper.
    el('line', {
      x1: pos.x, y1: yStart, x2: pos.x, y2: yEnd,
      stroke: color, 'stroke-width': 1.4, 'stroke-linecap': 'round',
      'stroke-dasharray': '3,2',
    }, g);

    // Solid arrowhead at the hole end
    const tx = pos.x, ty = yEnd;
    el('path', {
      d: `M ${tx} ${ty} L ${tx - 3} ${ty - dir * 5} L ${tx + 3} ${ty - dir * 5} z`,
      fill: color,
    }, g);

    // Pill label at the edge
    const padX = 3, padY = 1;
    const txt = el('text', {
      x: pos.x, y: labelY,
      'font-size': 8, 'font-family': 'monospace', 'font-weight': 'bold',
      fill: '#fff', 'text-anchor': 'middle',
    }, g);
    txt.textContent = label;
    // Measure-free pill: width based on label length
    const pillW = Math.max(label.length * 5 + padX * 2, 14);
    const pillH = 10;
    const px = pos.x - pillW / 2;
    const py = labelY - pillH + 2;
    const pill = el('rect', {
      x: px, y: py, width: pillW, height: pillH,
      rx: 2, fill: color,
    }, g);
    // Move pill behind the text
    g.insertBefore(pill, txt);

    bindNodes(ctx, g, pos);
    attachHover(g, ctx, e.item_id);
    return { fromTop };
  }

  function drawExternals(svg, ctx, externals) {
    if (!externals || !externals.length) return;
    const W = totalWidth();

    // First pass: draw an arrival arrow + pin badge on the board for every
    // external whose "to" parses as a board hole or rail. This makes the
    // Arduino-side connections visible instead of hidden in the text list.
    const TOP_EDGE_Y = -22;
    const BOT_EDGE_Y = rowY('+5V_B') + 24;
    let needTop = false, needBot = false;
    externals.forEach(e => {
      const res = drawArrival(svg, ctx, e, TOP_EDGE_Y, BOT_EDGE_Y);
      if (res && res.fromTop) needTop = true;
      else if (res) needBot = true;
    });

    // Make room above/below for the arrival graphics.
    const vb = svg.getAttribute('viewBox').split(' ').map(Number);
    if (needTop) {
      const shift = Math.abs(TOP_EDGE_Y) + 6;
      vb[1] -= shift;
      vb[3] += shift;
    }

    // Push the text list down past any bottom arrivals.
    const botExtra = needBot ? (BOT_EDGE_Y - rowY('+5V_B')) + 4 : 0;
    let y = rowY('+5V_B') + 24 + botExtra;
    el('text', { x: PAD_X, y, 'font-size': 10, 'font-family': 'system-ui, sans-serif', fill: '#1f2937', 'font-weight': 'bold' }, ctx.overlayLayer).textContent = 'Off-board:';
    y += 13;
    externals.forEach(e => {
      const txt = `${e.from || '?'}  →  ${e.to || '?'}`;
      const g = el('g', { class: 'bb-ext-row' }, ctx.overlayLayer);
      // Transparent hit-box so the whole row is hoverable, not just the glyph edges.
      el('rect', { x: PAD_X, y: y - 9, width: W - PAD_X * 2, height: 12, fill: 'transparent' }, g);
      el('text', { x: PAD_X + 10, y, 'font-size': 10, 'font-family': 'system-ui, sans-serif', fill: '#374151' }, g).textContent = txt;
      attachHover(g, ctx, e.item_id);
      y += 13;
    });
    vb[3] = Math.max(vb[3], (y + 8) - vb[1]);
    svg.setAttribute('viewBox', vb.join(' '));
  }

  function drawHint(svg, ctx) {
    const W = totalWidth();
    const t = el('text', {
      x: W / 2, y: rowY('+5V_B') + 14,
      'font-size': 9, 'font-family': 'system-ui, sans-serif',
      fill: '#9c9482', 'text-anchor': 'middle', 'font-style': 'italic',
    }, ctx.overlayLayer);
    t.textContent = 'Tap any hole to see all the others connected to it.';
    ctx.hintLabel = t;
  }

  // ---------- entry point ----------

  function render(container, layout, itemsById) {
    if (typeof layout === 'string') {
      try { layout = JSON.parse(layout); } catch (e) {
        container.textContent = 'Invalid breadboard JSON: ' + e.message;
        return;
      }
    }
    container.innerHTML = '';

    // Build flex wrapper: SVG on the left, image side-panel on the right.
    const wrapper = document.createElement('div');
    wrapper.className = 'bb-wrapper';

    const svgCol = document.createElement('div');
    svgCol.className = 'bb-svg-col';

    const sidePanel = document.createElement('aside');
    sidePanel.className = 'bb-side';
    resetSidePanel(sidePanel);

    wrapper.appendChild(svgCol);
    wrapper.appendChild(sidePanel);
    container.appendChild(wrapper);

    const svg = document.createElementNS(NS, 'svg');
    svgCol.appendChild(svg);

    const ctx = {
      tiesByNode: {},
      activeNode: null,
      itemsById: itemsById || {},
      sidePanel,
    };

    drawBoard(svg, ctx);

    // Click on empty board clears the highlight.
    svg.addEventListener('click', () => { ctx.activeNode = null; highlightNode(ctx, null, false); });

    const comps = layout.components || [];
    comps.filter(c => c.type === 'wire').forEach(c => drawWire(svg, ctx, c.from, c.to, c.color, c.item_id));
    comps.filter(c => c.type === 'resistor').forEach(c => drawResistor(svg, ctx, c.from, c.to, c.value, c.item_id));
    comps.filter(c => c.type === 'capacitor').forEach(c => drawCapacitor(svg, ctx, c.positive, c.negative, c.value, c.polarised, c.item_id));
    comps.filter(c => c.type === 'led').forEach(c => drawLed(svg, ctx, c.anode, c.cathode, c.color, c.item_id));
    comps.filter(c => c.type === 'button' || c.type === 'switch').forEach(c => drawButton(svg, ctx, c.at, c.label, c.item_id));
    comps.filter(c => c.type === 'pot' || c.type === 'trimmer').forEach(c => drawPot(svg, ctx, c.at, c.value, c.label, c.item_id));
    comps.filter(c => c.type === 'transistor').forEach(c => drawTransistor(svg, ctx, c.at, c.name, c.package, c.pinout, c.item_id));
    comps.filter(c => c.type === 'module').forEach(c => drawModule(svg, ctx, c));
    comps.filter(c => c.type === 'servo').forEach(c => drawServo(svg, ctx, c));
    comps.filter(c => c.type === 'ic').forEach(c => drawIC(svg, ctx, c.name, c.pin1_at, c.pins, c.item_id));

    drawExternals(svg, ctx, layout.external);
    drawHint(svg, ctx);
  }

  function findAndRender() {
    document.querySelectorAll('[data-breadboard]').forEach(node => {
      try {
        const src = node.textContent.trim();
        if (!src) return;
        let itemsById = {};
        if (node.dataset.items) {
          try { itemsById = JSON.parse(node.dataset.items); } catch (e) { itemsById = {}; }
        }
        const target = document.createElement('div');
        target.className = 'breadboard-render';
        node.parentNode.insertBefore(target, node.nextSibling);
        node.style.display = 'none';
        render(target, src, itemsById);
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
