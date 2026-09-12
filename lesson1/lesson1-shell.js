/**
 * Shared Lesson 1 chrome: top task nav + left level sidebar with complete status.
 * Set body[data-task] to overview | datatype | table | sql
 * Set body[data-level] for table pages: 1 | 2 | 3
 */
(function () {
    const task = document.body.getAttribute('data-task') || 'overview';
    const level = document.body.getAttribute('data-level') || '';

    function topClass(on) {
        return on
            ? 'px-2.5 py-1.5 rounded-lg border border-indigo-200 bg-indigo-50 text-indigo-700'
            : 'px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50';
    }

    function sideClass(on) {
        return on
            ? 'flex items-center justify-between gap-2 px-3 py-2 rounded-xl text-sm font-semibold border border-indigo-200 bg-indigo-50 text-indigo-700'
            : 'flex items-center justify-between gap-2 px-3 py-2 rounded-xl text-sm font-semibold border border-transparent text-slate-600 hover:bg-slate-50';
    }

    function seriesStatus(key, id) {
        try {
            const store = JSON.parse(localStorage.getItem(key) || '{}');
            return ((store.levels || {})[String(id)] || {}).status || 'not_started';
        } catch (err) {
            return 'not_started';
        }
    }

    function datatypeStatus() {
        try {
            const parsed = JSON.parse(localStorage.getItem('column-datatype-progress-v2') || '{}');
            if (parsed.completed) return 'completed';
            const answers = parsed.answers && typeof parsed.answers === 'object' ? parsed.answers : {};
            return Object.values(answers).some(Boolean) ? 'in_progress' : 'not_started';
        } catch (err) {
            return 'not_started';
        }
    }

    function statusMark(status) {
        if (status === 'completed') {
            return '<i class="fa-solid fa-circle-check text-emerald-600" title="Completed"></i>';
        }
        if (status === 'in_progress') {
            return '<i class="fa-solid fa-circle-dot text-amber-500" title="In progress"></i>';
        }
        return '<i class="fa-regular fa-circle text-slate-300" title="Not started"></i>';
    }

    function sideLink(href, on, label, status) {
        return `<a href="${href}" class="${sideClass(on)}"><span>${label}</span>${statusMark(status)}</a>`;
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
                        <h1 class="font-semibold text-lg leading-tight text-slate-700">Lesson 1</h1>
                        <p class="text-sm text-slate-500 font-medium">Data types, primary keys, and SQL</p>
                    </div>
                </div>
                <nav class="ml-auto flex flex-wrap items-center gap-1.5 text-sm font-semibold">
                    <a href="index.html" class="${topClass(task === 'overview')}">Overview</a>
                    <a href="datatype.html" class="${topClass(task === 'datatype')}">Task 1: Data types</a>
                    <a href="table-easy.html" class="${topClass(task === 'table')}">Task 2: Primary key</a>
                    <a href="sql-select.html" class="${topClass(task === 'sql')}">Task 3: SQL</a>
                </nav>
            </div>`;
    }

    function renderSidebar() {
        const sidebar = document.getElementById('lesson-sidebar');
        if (!sidebar) return;

        sidebar.className = 'w-64 shrink-0 border-r border-slate-200 bg-white overflow-y-auto';

        if (task === 'datatype') {
            sidebar.innerHTML = `
                <nav class="p-3 space-y-1">
                    ${sideLink('datatype.html', true, 'Practice', datatypeStatus())}
                </nav>`;
            return;
        }

        if (task === 'table') {
            sidebar.innerHTML = `
                <nav class="p-3 space-y-1">
                    ${sideLink('table-easy.html', level === '1', 'Level 1 · Students', seriesStatus('pk-architect-progress-v1', 1))}
                    ${sideLink('table-medium.html', level === '2', 'Level 2 · Books', seriesStatus('pk-architect-progress-v1', 2))}
                    ${sideLink('table-hard.html', level === '3', 'Level 3 · Movies', seriesStatus('pk-architect-progress-v1', 3))}
                </nav>`;
        }
    }

    window.renderLessonSidebar = renderSidebar;
    renderSidebar();
})();
