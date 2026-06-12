// Client-side faceted filter for items.php.
// Tags re-cloud progressively: clicking a tag narrows the table AND the tag cloud
// to only tags present in the remaining items, with live-recomputed counts and sizes.
// Initial state is read from the URL; every interaction writes back via replaceState.

(function () {
  const search = document.getElementById('item-search');
  if (!search) return;

  const categorySelect = document.getElementById('category-filter');
  const clearBtn       = document.getElementById('clear-filters');
  const tableBody      = document.querySelector('#items-table tbody');
  const rows           = Array.from(tableBody.querySelectorAll('tr'));
  const resultCount    = document.getElementById('result-count');
  const emptyState     = document.getElementById('empty-state');
  const activeTagsBar  = document.getElementById('active-tags');
  const tagCloud       = document.getElementById('tag-cloud');

  // Slug -> display name. Populated from the server-rendered cloud once at load.
  const tagNamesBySlug = {};
  // Cloud chip element by slug, so we can update text + size in place.
  const cloudChipBySlug = {};
  if (tagCloud) {
    tagCloud.querySelectorAll('[data-tag-slug]').forEach(el => {
      const slug = el.dataset.tagSlug;
      tagNamesBySlug[slug] = el.dataset.tagName || slug;
      cloudChipBySlug[slug] = el;
    });
  }

  const activeTagSlugs = new Set();
  // Sort state: null = default (server order), or { key: 'name', type: 'string', dir: 'asc'|'desc' }.
  let activeSort = null;

  // Sortable header config. Source of truth for type+key matches the <th data-*> attrs.
  const sortableHeaders = Array.from(document.querySelectorAll('th.sortable'));
  const sortTypeByKey = {};
  sortableHeaders.forEach(th => {
    sortTypeByKey[th.dataset.sortKey] = th.dataset.sortType || 'string';
  });

  // Initial state from URL.
  const params = new URLSearchParams(location.search);
  if (params.get('q')) search.value = params.get('q');
  if (params.get('category')) categorySelect.value = params.get('category');
  (params.get('tags') || '').split(',').filter(Boolean).forEach(t => activeTagSlugs.add(t));
  if (params.get('sort')) {
    let raw = params.get('sort');
    let dir = 'asc';
    if (raw.startsWith('-')) { dir = 'desc'; raw = raw.slice(1); }
    if (sortTypeByKey[raw]) {
      activeSort = { key: raw, type: sortTypeByKey[raw], dir };
    }
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

  function toggleTag(slug) {
    if (activeTagSlugs.has(slug)) activeTagSlugs.delete(slug);
    else activeTagSlugs.add(slug);
    renderActiveTags();
    applyFilter();
    rebuildTagCloud();
    updateUrl();
  }

  // Returns true if the row passes every filter EXCEPT tag matching.
  // Used both for the actual table filter and for the cloud's facet counts.
  function rowPassesNonTagFilters(row, q, cat) {
    const hay  = row.dataset.search || '';
    const rCat = row.dataset.category || '';
    if (q && !hay.includes(q)) return false;
    if (cat && rCat !== cat) return false;
    return true;
  }

  function rowPassesActiveTags(row) {
    if (activeTagSlugs.size === 0) return true;
    const rTags = (row.dataset.tags || '').split(',').filter(Boolean);
    for (const slug of activeTagSlugs) {
      if (!rTags.includes(slug)) return false;
    }
    return true;
  }

  function applyFilter() {
    const q   = search.value.trim().toLowerCase();
    const cat = categorySelect.value;
    let visible = 0;
    rows.forEach(row => {
      const show = rowPassesNonTagFilters(row, q, cat) && rowPassesActiveTags(row);
      row.classList.toggle('hidden', !show);
      if (show) visible++;
    });
    resultCount.textContent = visible + ' of ' + rows.length + ' items';
    emptyState.classList.toggle('hidden', visible !== 0);
  }

  // Recompute cloud against the current visible set (after all filters).
  // Tags absent in the visible set are hidden unless they're active (you must
  // be able to click them off again). Counts and sizes recompute live.
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
    for (const k in tagCounts) {
      if (tagCounts[k] > maxCount) maxCount = tagCounts[k];
    }

    Object.entries(cloudChipBySlug).forEach(([slug, chip]) => {
      const isActive = activeTagSlugs.has(slug);
      const cnt = tagCounts[slug] || 0;

      if (cnt === 0 && !isActive) {
        chip.classList.add('hidden');
        return;
      }
      chip.classList.remove('hidden');
      chip.classList.toggle('active', isActive);

      const countEl = chip.querySelector('.tag-count');
      if (countEl) countEl.textContent = '(' + cnt + ')';

      const sizeBase = isActive && cnt === 0 ? 1 : cnt;
      const size = maxCount > 1
        ? 12 + (Math.log(Math.max(1, sizeBase)) / Math.log(maxCount)) * 12
        : 14;
      chip.style.fontSize = size.toFixed(1) + 'px';
    });
  }

  function updateUrl() {
    const p = new URLSearchParams();
    if (search.value.trim())     p.set('q', search.value.trim());
    if (categorySelect.value)    p.set('category', categorySelect.value);
    if (activeTagSlugs.size > 0) p.set('tags', [...activeTagSlugs].join(','));
    if (activeSort)              p.set('sort', (activeSort.dir === 'desc' ? '-' : '') + activeSort.key);
    const qs = p.toString();
    history.replaceState({}, '', qs ? '?' + qs : location.pathname);
  }

  function dsKey(key) {
    // 'free' -> 'sortFree', 'category' -> 'sortCategory'
    return 'sort' + key.charAt(0).toUpperCase() + key.slice(1);
  }

  function compareRows(a, b, key, type, dir) {
    const va = a.dataset[dsKey(key)] || '';
    const vb = b.dataset[dsKey(key)] || '';
    let cmp;
    if (type === 'number') {
      cmp = Number(va) - Number(vb);
    } else {
      cmp = va.localeCompare(vb);
    }
    if (cmp === 0) {
      // Stable tiebreaker by name so equal numeric values stay alphabetical.
      cmp = (a.dataset.sortName || '').localeCompare(b.dataset.sortName || '');
    }
    return dir === 'desc' ? -cmp : cmp;
  }

  function applySort() {
    // Update visual indicators on headers regardless.
    sortableHeaders.forEach(th => {
      if (activeSort && th.dataset.sortKey === activeSort.key) {
        th.setAttribute('data-sort-active', activeSort.dir);
      } else {
        th.removeAttribute('data-sort-active');
      }
    });

    if (!activeSort) return; // Server already gave us default order.

    const sorted = rows.slice().sort((a, b) =>
      compareRows(a, b, activeSort.key, activeSort.type, activeSort.dir)
    );
    const frag = document.createDocumentFragment();
    sorted.forEach(r => frag.appendChild(r));
    tableBody.appendChild(frag);
  }

  function cycleSort(key) {
    const type = sortTypeByKey[key] || 'string';
    if (!activeSort || activeSort.key !== key) {
      activeSort = { key, type, dir: 'asc' };
    } else if (activeSort.dir === 'asc') {
      activeSort = { key, type, dir: 'desc' };
    } else {
      activeSort = null; // back to default order
      // Restore original server order from rows[] (which captures load-time order).
      const frag = document.createDocumentFragment();
      rows.forEach(r => frag.appendChild(r));
      tableBody.appendChild(frag);
    }
    applySort();
    updateUrl();
  }

  // Wire up.
  search.addEventListener('input', () => {
    applyFilter();
    rebuildTagCloud();
    updateUrl();
  });
  categorySelect.addEventListener('change', () => {
    applyFilter();
    rebuildTagCloud();
    updateUrl();
  });
  clearBtn.addEventListener('click', () => {
    search.value = '';
    categorySelect.value = '';
    activeTagSlugs.clear();
    activeSort = null;
    renderActiveTags();
    // Restore original row order in DOM.
    const frag = document.createDocumentFragment();
    rows.forEach(r => frag.appendChild(r));
    tableBody.appendChild(frag);
    applyFilter();
    applySort();
    rebuildTagCloud();
    updateUrl();
  });

  sortableHeaders.forEach(th => {
    th.addEventListener('click', () => cycleSort(th.dataset.sortKey));
  });

  if (tagCloud) {
    tagCloud.querySelectorAll('[data-tag-slug]').forEach(el => {
      el.addEventListener('click', e => {
        e.preventDefault();
        toggleTag(el.dataset.tagSlug);
      });
    });
  }

  renderActiveTags();
  applySort();
  applyFilter();
  rebuildTagCloud();
})();
