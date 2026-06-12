// Client-side faceted filter for projects.php.
// Combines text search, difficulty pills, tag chips (progressive narrowing),
// and column sorting. State mirrored to URL via replaceState.

(function () {
  const search = document.getElementById('project-search');
  if (!search) return;

  const clearBtn      = document.getElementById('clear-filters');
  const tableBody     = document.querySelector('#projects-table tbody');
  const rows          = Array.from(tableBody.querySelectorAll('tr'));
  const resultCount   = document.getElementById('result-count');
  const emptyState    = document.getElementById('empty-state');
  const activeTagsBar = document.getElementById('active-tags');
  const tagCloud      = document.getElementById('tag-cloud');
  const diffPills     = Array.from(document.querySelectorAll('#difficulty-filter .diff-pill'));

  const tagNamesBySlug = {};
  const cloudChipBySlug = {};
  if (tagCloud) {
    tagCloud.querySelectorAll('[data-tag-slug]').forEach(el => {
      const slug = el.dataset.tagSlug;
      tagNamesBySlug[slug] = el.dataset.tagName || slug;
      cloudChipBySlug[slug] = el;
    });
  }

  const activeTagSlugs = new Set();
  let activeDiff = '';
  let activeSort = null;

  const sortableHeaders = Array.from(document.querySelectorAll('#projects-table th.sortable'));
  const sortTypeByKey = {};
  sortableHeaders.forEach(th => {
    sortTypeByKey[th.dataset.sortKey] = th.dataset.sortType || 'string';
  });

  // Initial state from URL.
  const params = new URLSearchParams(location.search);
  if (params.get('q'))    search.value = params.get('q');
  if (params.get('diff')) activeDiff   = params.get('diff');
  (params.get('tags') || '').split(',').filter(Boolean).forEach(t => activeTagSlugs.add(t));
  if (params.get('sort')) {
    let raw = params.get('sort');
    let dir = 'asc';
    if (raw.startsWith('-')) { dir = 'desc'; raw = raw.slice(1); }
    if (sortTypeByKey[raw]) activeSort = { key: raw, type: sortTypeByKey[raw], dir };
  }

  function renderActiveTags() {
    activeTagsBar.innerHTML = '';
    if (activeTagSlugs.size === 0) {
      activeTagsBar.classList.add('hidden');
      return;
    }
    activeTagsBar.classList.remove('hidden');
    activeTagSlugs.forEach(slug => {
      const chip = document.createElement('button');
      chip.type = 'button';
      chip.className = 'tag-chip active';
      chip.innerHTML = (tagNamesBySlug[slug] || slug) +
        ' <span class="ml-1 text-white/80">&times;</span>';
      chip.addEventListener('click', () => toggleTag(slug));
      activeTagsBar.appendChild(chip);
    });
  }

  function renderDiffPills() {
    diffPills.forEach(pill => {
      pill.classList.toggle('active', pill.dataset.diff === activeDiff);
    });
  }

  function toggleTag(slug) {
    if (activeTagSlugs.has(slug)) activeTagSlugs.delete(slug);
    else activeTagSlugs.add(slug);
    renderActiveTags();
    applyFilter();
    rebuildTagCloud();
    updateUrl();
  }

  function rowPassesNonTagFilters(row, q, diff) {
    if (q && !(row.dataset.search || '').includes(q)) return false;
    if (diff && (row.dataset.diff || '') !== diff) return false;
    return true;
  }
  function rowPassesActiveTags(row) {
    if (activeTagSlugs.size === 0) return true;
    const rTags = (row.dataset.tags || '').split(',').filter(Boolean);
    for (const slug of activeTagSlugs) if (!rTags.includes(slug)) return false;
    return true;
  }

  function applyFilter() {
    const q = search.value.trim().toLowerCase();
    let visible = 0;
    rows.forEach(row => {
      const show = rowPassesNonTagFilters(row, q, activeDiff) && rowPassesActiveTags(row);
      row.classList.toggle('hidden', !show);
      if (show) visible++;
    });
    resultCount.textContent = visible + ' of ' + rows.length + ' projects';
    emptyState.classList.toggle('hidden', visible !== 0);
  }

  function rebuildTagCloud() {
    if (!tagCloud) return;
    const tagCounts = {};
    rows.forEach(row => {
      if (row.classList.contains('hidden')) return;
      (row.dataset.tags || '').split(',').filter(Boolean).forEach(slug => {
        tagCounts[slug] = (tagCounts[slug] || 0) + 1;
      });
    });

    let maxCount = 1;
    for (const k in tagCounts) if (tagCounts[k] > maxCount) maxCount = tagCounts[k];

    Object.entries(cloudChipBySlug).forEach(([slug, chip]) => {
      const isActive = activeTagSlugs.has(slug);
      const cnt = tagCounts[slug] || 0;
      if (cnt === 0 && !isActive) { chip.classList.add('hidden'); return; }
      chip.classList.remove('hidden');
      chip.classList.toggle('active', isActive);
      const countEl = chip.querySelector('.tag-count');
      if (countEl) countEl.textContent = '(' + cnt + ')';
      const sizeBase = isActive && cnt === 0 ? 1 : cnt;
      const size = maxCount > 1 ? 12 + (Math.log(Math.max(1, sizeBase)) / Math.log(maxCount)) * 12 : 14;
      chip.style.fontSize = size.toFixed(1) + 'px';
    });
  }

  function updateUrl() {
    const p = new URLSearchParams();
    if (search.value.trim())     p.set('q', search.value.trim());
    if (activeDiff)              p.set('diff', activeDiff);
    if (activeTagSlugs.size > 0) p.set('tags', [...activeTagSlugs].join(','));
    if (activeSort)              p.set('sort', (activeSort.dir === 'desc' ? '-' : '') + activeSort.key);
    const qs = p.toString();
    history.replaceState({}, '', qs ? '?' + qs : location.pathname);
  }

  function dsKey(k) { return 'sort' + k.charAt(0).toUpperCase() + k.slice(1); }
  function compareRows(a, b, key, type, dir) {
    const va = a.dataset[dsKey(key)] || '';
    const vb = b.dataset[dsKey(key)] || '';
    let cmp = (type === 'number') ? (Number(va) - Number(vb)) : va.localeCompare(vb);
    if (cmp === 0) cmp = (a.dataset.sortName || '').localeCompare(b.dataset.sortName || '');
    return dir === 'desc' ? -cmp : cmp;
  }
  function applySort() {
    sortableHeaders.forEach(th => {
      if (activeSort && th.dataset.sortKey === activeSort.key) {
        th.setAttribute('data-sort-active', activeSort.dir);
      } else {
        th.removeAttribute('data-sort-active');
      }
    });
    if (!activeSort) return;
    const sorted = rows.slice().sort((a, b) =>
      compareRows(a, b, activeSort.key, activeSort.type, activeSort.dir)
    );
    const frag = document.createDocumentFragment();
    sorted.forEach(r => frag.appendChild(r));
    tableBody.appendChild(frag);
  }
  function cycleSort(key) {
    const type = sortTypeByKey[key] || 'string';
    if (!activeSort || activeSort.key !== key)        activeSort = { key, type, dir: 'asc' };
    else if (activeSort.dir === 'asc')                activeSort = { key, type, dir: 'desc' };
    else {
      activeSort = null;
      const frag = document.createDocumentFragment();
      rows.forEach(r => frag.appendChild(r));
      tableBody.appendChild(frag);
    }
    applySort();
    updateUrl();
  }

  // Wire up.
  search.addEventListener('input', () => { applyFilter(); rebuildTagCloud(); updateUrl(); });
  diffPills.forEach(pill => {
    pill.addEventListener('click', () => {
      activeDiff = pill.dataset.diff;
      renderDiffPills();
      applyFilter();
      rebuildTagCloud();
      updateUrl();
    });
  });
  clearBtn.addEventListener('click', () => {
    search.value = '';
    activeDiff = '';
    activeTagSlugs.clear();
    activeSort = null;
    renderActiveTags();
    renderDiffPills();
    const frag = document.createDocumentFragment();
    rows.forEach(r => frag.appendChild(r));
    tableBody.appendChild(frag);
    applyFilter();
    applySort();
    rebuildTagCloud();
    updateUrl();
  });
  if (tagCloud) {
    tagCloud.querySelectorAll('[data-tag-slug]').forEach(el => {
      el.addEventListener('click', e => { e.preventDefault(); toggleTag(el.dataset.tagSlug); });
    });
  }
  sortableHeaders.forEach(th => {
    th.addEventListener('click', () => cycleSort(th.dataset.sortKey));
  });

  renderActiveTags();
  renderDiffPills();
  applySort();
  applyFilter();
  rebuildTagCloud();
})();
