/**
 * Shared Lesson 2 chrome: top task nav + optional left level sidebar.
 * Set body[data-task] to overview | schema | link | sql
 * Set body[data-level] for schema/link pages: overview | 1 | 2 | 3 | 4
 */
(function () {
    const task = document.body.getAttribute('data-task') || 'overview';
    const level = document.body.getAttribute('data-level') || '';

    function topClass(on) {
        return on
            ? 'px-2.5 py-1.5 rounded-lg border border-indigo-300 bg-indigo-50 text-indigo-800'
            : 'px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50';
    }

    function sideClass(on) {
        return on
            ? 'block px-3 py-2 rounded-xl text-sm font-bold border border-indigo-200 bg-indigo-50 text-indigo-800'
            : 'block px-3 py-2 rounded-xl text-sm font-bold border border-transparent text-slate-600 hover:bg-slate-50';
    }

    const header = document.getElementById('lesson-header');
    if (header) {
        header.className = 'bg-white border-b border-slate-200/80 sticky top-0 z-50 shadow-sm shrink-0';
        header.innerHTML = `
            <div class="px-4 py-3 flex flex-wrap items-center justify-between gap-3">
                <div class="flex items-center space-x-3">
                    <div class="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center text-indigo-500 text-xl">
                        <i class="fa-solid fa-book-open"></i>
                    </div>
                    <div>
                        <h1 class="font-bold text-xl leading-tight text-slate-800">Lesson 2</h1>
                        <p class="text-xs text-slate-500 font-medium">Schemas, relationships, and SQL</p>
                    </div>
                </div>
                <nav class="ml-auto flex flex-wrap items-center gap-1.5 text-xs font-bold">
                    <a href="overview.html" class="${topClass(task === 'overview')}">Overview</a>
                    <a href="column-overview.html" class="${topClass(task === 'schema')}">Task 1: Schema</a>
                    <a href="link-overview.html" class="${topClass(task === 'link')}">Task 2: Relationships</a>
                    <a href="sql-functions.html" class="${topClass(task === 'sql')}">Task 3: SQL</a>
                </nav>
            </div>`;
    }

    const sidebar = document.getElementById('lesson-sidebar');
    if (!sidebar) return;

    sidebar.className = 'w-64 shrink-0 border-r border-slate-200 bg-white overflow-y-auto';

    if (task === 'schema') {
        sidebar.innerHTML = `
            <nav class="p-3 space-y-1">
                <a href="column-overview.html" class="${sideClass(level === 'overview')}">Task overview</a>
                <a href="column-easy.html" class="${sideClass(level === '1')}">Level 1 · Library</a>
                <a href="column.html" class="${sideClass(level === '2')}">Level 2 · Instagram</a>
                <a href="column-hard.html" class="${sideClass(level === '3')}">Level 3 · School</a>
            </nav>`;
        return;
    }

    if (task === 'link') {
        sidebar.innerHTML = `
            <nav class="p-3 space-y-1">
                <a href="link-overview.html" class="${sideClass(level === 'overview')}">Task overview</a>
                <a href="link-1.html" class="${sideClass(level === '1')}">Level 1 · Form class</a>
                <a href="link-2.html" class="${sideClass(level === '2')}">Level 2 · Student cards</a>
                <a href="link-3.html" class="${sideClass(level === '3')}">Level 3 · School clubs</a>
                <a href="link-4.html" class="${sideClass(level === '4')}">Level 4 · Cinema</a>
            </nav>`;
    }
})();
