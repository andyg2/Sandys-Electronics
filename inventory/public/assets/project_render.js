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
