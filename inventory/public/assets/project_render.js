// Render orchestration for the project detail page:
//   1. Parse #md-source markdown into #md-rendered via marked.js
//   2. Convert ```mermaid code blocks into <div class="mermaid"> placeholders
//   3. Apply highlight.js to remaining <pre><code> blocks
//   4. Wrap every <pre> code block with a hover-to-copy button
//   5. Hand the assembled .mermaid elements to mermaid.run()
//
// Libraries (marked / hljs / mermaid) are loaded via <script src=...> on the page.
// Any of them missing degrades to plain text without erroring.

(function () {
  const ready = (fn) => document.readyState === 'loading'
    ? document.addEventListener('DOMContentLoaded', fn)
    : fn();

  ready(async () => {
    renderMarkdown();
    convertMermaidCodeBlocks();
    applySyntaxHighlight();
    document.querySelectorAll('pre').forEach(addCopyButton);
    addMarkdownHeadingIds();
    buildSectionNav();
    await runMermaid();
  });

  function renderMarkdown() {
    const src = document.getElementById('md-source');
    const target = document.getElementById('md-rendered');
    if (!src || !target || typeof marked === 'undefined') return;
    marked.setOptions({ breaks: true, gfm: true });
    // PHP wraps the description in <script type="text/markdown"> with
    // htmlspecialchars(), so textContent returns "&lt;div&gt;" literally for
    // any embedded HTML. Decode entities before parsing so inline <img> /
    // <div> tags reach marked.js as real HTML.
    const decoder = document.createElement('textarea');
    decoder.innerHTML = src.textContent;
    target.innerHTML = marked.parse(decoder.value);
  }

  function convertMermaidCodeBlocks() {
    // marked renders ```mermaid as <pre><code class="language-mermaid">...
    // mermaid wants <div class="mermaid"> with the raw source.
    document.querySelectorAll('pre code.language-mermaid').forEach(code => {
      const div = document.createElement('div');
      div.className = 'mermaid';
      div.textContent = code.textContent;
      const pre = code.parentElement;
      pre.parentElement.replaceChild(div, pre);
    });
  }

  function applySyntaxHighlight() {
    if (typeof hljs === 'undefined') return;
    document.querySelectorAll('pre code').forEach(block => {
      try { hljs.highlightElement(block); } catch (e) { /* ignore */ }
    });
  }

  function addCopyButton(pre) {
    if (pre.classList.contains('mermaid')) return;
    if (pre.dataset.copyAttached) return;
    pre.dataset.copyAttached = '1';

    const wrap = document.createElement('div');
    wrap.className = 'relative group';
    pre.parentNode.insertBefore(wrap, pre);
    wrap.appendChild(pre);

    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'absolute top-2 right-2 z-10 text-xs px-2 py-1 rounded ' +
                    'bg-gray-700/80 hover:bg-gray-600 text-gray-100 ' +
                    'opacity-0 group-hover:opacity-100 focus:opacity-100 transition';
    btn.textContent = 'Copy';
    btn.addEventListener('click', async () => {
      const text = (pre.querySelector('code') || pre).innerText;
      try {
        await navigator.clipboard.writeText(text);
        flash(btn, 'Copied', 'bg-green-600');
      } catch (e) {
        // Fallback: select the text and let the user hit Ctrl-C
        const range = document.createRange();
        range.selectNodeContents(pre.querySelector('code') || pre);
        const sel = window.getSelection();
        sel.removeAllRanges();
        sel.addRange(range);
        flash(btn, 'Select+Copy', 'bg-amber-600');
      }
    });
    wrap.appendChild(btn);
  }

  function flash(btn, label, addClass) {
    const original = btn.textContent;
    btn.textContent = label;
    btn.classList.add(addClass);
    setTimeout(() => {
      btn.textContent = original;
      btn.classList.remove(addClass);
    }, 1500);
  }

  function slugify(s) {
    return (s || '').toLowerCase().trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'section';
  }

  // Stamp every h2/h3 inside the rendered markdown with an id so the in-page
  // nav can jump straight to it. Disambiguate duplicates with -2, -3, ...
  function addMarkdownHeadingIds() {
    const container = document.getElementById('md-rendered');
    if (!container) return;
    const seen = Object.create(null);
    container.querySelectorAll('h2, h3').forEach(h => {
      if (h.id) return;
      const base = 'md-' + slugify(h.textContent);
      let id = base, n = 1;
      while (seen[id]) id = base + '-' + (++n);
      seen[id] = true;
      h.id = id;
    });
  }

  // Build the "On this page" chip strip between Tags and the power-supply panel.
  // Order: markdown h2's (in document order, which means they sit inside the
  // description card and come first), then the top-level cards in the order
  // they appear in the DOM.
  function buildSectionNav() {
    const nav  = document.getElementById('project-nav');
    const list = document.getElementById('project-nav-links');
    if (!nav || !list) return;

    const items = [];
    const seenIds = Object.create(null);

    // Walk the DOM in order so the nav reads top-to-bottom of the page.
    const candidates = document.querySelectorAll(
      '#md-rendered h2, [data-project-section]'
    );
    candidates.forEach(el => {
      let id, label;
      if (el.matches('[data-project-section]')) {
        id = el.id;
        label = el.dataset.projectSection;
      } else {
        id = el.id;
        label = (el.textContent || '').trim();
      }
      if (!id || !label || seenIds[id]) return;
      seenIds[id] = true;
      items.push({ id, label });
    });

    if (!items.length) return;

    list.innerHTML = '';
    items.forEach(({ id, label }) => {
      const a = document.createElement('a');
      a.href = '#' + id;
      a.textContent = label;
      a.className = 'inline-block px-2 py-0.5 rounded-full text-xs ' +
                    'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 ' +
                    'hover:bg-blue-100 dark:hover:bg-blue-900/40 ' +
                    'hover:text-blue-700 dark:hover:text-blue-300 ' +
                    'no-underline transition-colors';
      list.appendChild(a);
    });
    nav.classList.remove('hidden');
  }

  async function runMermaid() {
    if (typeof mermaid === 'undefined') return;
    const nodes = document.querySelectorAll('.mermaid');
    if (!nodes.length) return;
    try {
      await mermaid.run({ nodes: Array.from(nodes) });
    } catch (e) {
      console.warn('Mermaid render failed:', e);
    }
  }
})();
