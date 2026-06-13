<?php /** @var string|null $page_title */ ?>
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title><?= e($page_title ?? 'Inventory') ?></title>

  <!-- Set the dark class BEFORE Tailwind loads to avoid a light-mode flash. -->
  <script>
    (function () {
      try {
        var stored = localStorage.getItem('theme');
        var isDark = stored === 'dark'
          || (stored == null && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches);
        if (isDark) document.documentElement.classList.add('dark');
      } catch (e) {}
    })();
  </script>

  <script src="https://cdn.tailwindcss.com?plugins=typography"></script>
  <script>
    tailwind.config = { darkMode: 'class' };
  </script>
  <link rel="stylesheet" href="/assets/style.css?v=2">

  <style type="text/tailwindcss">
    @layer components {
      .btn        { @apply inline-flex items-center gap-1 px-4 py-2 rounded-md font-medium border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 no-underline cursor-pointer transition-colors; }
      .btn-sm     { @apply px-2.5 py-1 text-sm; }
      .btn-primary{ @apply bg-blue-600 hover:bg-blue-700 text-white border-blue-600 dark:border-blue-500; }
      .btn-danger { @apply bg-red-600 hover:bg-red-700 text-white border-red-600 dark:border-red-500; }
      .btn-link   { @apply text-blue-600 dark:text-blue-400 hover:underline cursor-pointer; }

      .form-input { @apply w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent; }
      .form-label { @apply block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1; }

      .card       { @apply bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm; }
      .card-body  { @apply p-4 sm:p-5; }

      .tag-chip   { @apply inline-flex items-center gap-1 px-3 py-1 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors no-underline cursor-pointer text-sm; }
      .tag-chip.active { @apply bg-blue-600 dark:bg-blue-500 text-white hover:bg-blue-700; }

      .table-default { @apply w-full bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-gray-100; }
      .table-default thead th { @apply bg-gray-50 dark:bg-gray-900/60 text-left font-semibold text-gray-700 dark:text-gray-200 px-3 py-2 border-b border-gray-200 dark:border-gray-700; }
      .table-default tbody td { @apply px-3 py-2 border-b border-gray-100 dark:border-gray-700 align-top; }
      .table-default tbody tr:hover td { @apply bg-blue-50/40 dark:bg-blue-900/20; }
      .num        { @apply text-right font-mono tabular-nums; }
    }
  </style>
</head>
<body class="bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 min-h-screen">

<header class="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-10">
  <nav class="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
    <a href="/" class="font-semibold text-gray-900 dark:text-gray-100 no-underline text-lg">Edge Devices Inventory</a>
    <div class="flex items-center gap-1">
      <a href="/items.php" class="px-3 py-1.5 rounded-md text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 no-underline">Items</a>
      <a href="/projects.php" class="px-3 py-1.5 rounded-md text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 no-underline">Projects</a>
      <button id="theme-toggle" type="button"
              class="ml-2 px-3 py-1.5 rounded-md border border-gray-200 dark:border-gray-600 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer"
              aria-label="Toggle dark mode" title="Toggle dark mode">
        <span class="hidden dark:inline">Light mode</span>
        <span class="inline dark:hidden">Dark mode</span>
      </button>
    </div>
  </nav>
</header>

<script>
  (function () {
    var btn = document.getElementById('theme-toggle');
    if (!btn) return;
    btn.addEventListener('click', function () {
      var isDark = document.documentElement.classList.toggle('dark');
      try { localStorage.setItem('theme', isDark ? 'dark' : 'light'); } catch (e) {}
      window.dispatchEvent(new CustomEvent('theme-changed', { detail: { dark: isDark } }));
    });
  })();
</script>

<main class="max-w-7xl mx-auto px-4 py-6">
<?php $flashes = get_flashes(); if ($flashes): ?>
  <div class="mb-4 rounded-md border border-amber-300 dark:border-amber-700/60 bg-amber-50 dark:bg-amber-900/20 px-4 py-3 text-amber-900 dark:text-amber-200">
    <ul class="list-disc list-inside space-y-1">
      <?php foreach ($flashes as $m): ?>
        <li><?= e($m) ?></li>
      <?php endforeach ?>
    </ul>
  </div>
<?php endif ?>
