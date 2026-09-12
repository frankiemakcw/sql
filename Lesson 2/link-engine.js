/**
 * Table-relationship practice engine.
 * Each page defines window.LINK_TASK then loads this file.
 */
(function () {
    const TASK = window.LINK_TASK;
    if (!TASK) {
        console.error('LINK_TASK is not defined');
        return;
    }

    const tableIds = TASK.tables.map((t) => t.id);
    const levelId = TASK.levelId;
    const byId = Object.fromEntries(TASK.tables.map((t) => [t.id, t]));

    function freshState() {
        return { connections: [] };
    }

    let state = freshState();
    const saved = window.LinkProgress && levelId
        ? window.LinkProgress.hydrate(window.LinkProgress.getLevel(levelId).state, tableIds)
        : null;
    if (saved) state = saved;

    let selectedId = null;

    function persistProgress(extra) {
        if (!window.LinkProgress || !levelId) return;
        window.LinkProgress.persist(levelId, state, extra);
    }

    function pairKey(a, b) {
        return [a, b].slice().sort().join('|');
    }

    function tableName(id) {
        return byId[id] ? byId[id].name : id;
    }

    function expectedKey(link) {
        return pairKey(link.a, link.b);
    }

    function findConnection(a, b) {
        const key = pairKey(a, b);
        return state.connections.find((c) => pairKey(c.a, c.b) === key) || null;
    }

    function sidesMatch(conn, expected) {
        if (conn.a === expected.a && conn.b === expected.b) {
            return conn.aSide === expected.aSide && conn.bSide === expected.bSide;
        }
        if (conn.a === expected.b && conn.b === expected.a) {
            return conn.aSide === expected.bSide && conn.bSide === expected.aSide;
        }
        return false;
    }

    function typeLabel(sideA, sideB) {
        if (sideA === 'one' && sideB === 'one') return 'one to one';
        if (sideA === 'many' && sideB === 'many') return 'many to many';
        if ((sideA === 'one' && sideB === 'many') || (sideA === 'many' && sideB === 'one')) return 'one to many';
        return 'not set';
    }

    function sideClass(active, tone) {
        if (!active) return 'bg-indigo-50/50 text-slate-600 border-indigo-100 hover:bg-indigo-50';
        if (tone === 'one') return 'bg-amber-100 text-amber-800 border-amber-200';
        return 'bg-rose-100 text-rose-800 border-rose-200';
    }

    window.selectTable = function (id) {
        if (selectedId === id) {
            selectedId = null;
            render();
            return;
        }
        if (!selectedId) {
            selectedId = id;
            render();
            return;
        }
        if (!findConnection(selectedId, id)) {
            state.connections.push({
                a: selectedId,
                b: id,
                aSide: '',
                bSide: ''
            });
            persistProgress();
        }
        selectedId = null;
        render();
    };

    window.setSide = function (index, which, value) {
        const conn = state.connections[index];
        if (!conn) return;
        const key = which === 'a' ? 'aSide' : 'bSide';
        conn[key] = conn[key] === value ? '' : value;
        persistProgress();
        render();
    };

    window.removeConnection = function (index) {
        state.connections.splice(index, 1);
        persistProgress();
        render();
    };

    window.resetLinks = function () {
        state = freshState();
        selectedId = null;
        document.getElementById('validation-report').classList.add('hidden');
        persistProgress({ reset: true });
        render();
    };

    function renderTables() {
        const hint = document.getElementById('select-hint');
        hint.textContent = selectedId
            ? `Selected ${tableName(selectedId)}. Click another table to connect them.`
            : 'Click one table name, then another, to make a connection.';

        document.getElementById('tables-board').innerHTML = TASK.tables.map((table) => {
            const selected = selectedId === table.id;
            return `
                <button type="button" onclick="selectTable('${table.id}')"
                    class="min-w-[160px] px-6 py-4 rounded-2xl border shadow-sm text-xl font-bold font-mono transition ${selected ? 'border-indigo-400 bg-indigo-50 text-indigo-800 ring-2 ring-indigo-200' : 'border-slate-200 bg-white text-slate-800 hover:border-indigo-300 hover:bg-indigo-50/50'}">
                    ${table.name}
                </button>`;
        }).join('');
    }

    function renderConnections() {
        const list = document.getElementById('connections-list');
        const count = document.getElementById('link-count');
        count.textContent = `${state.connections.length} connection(s)`;

        if (state.connections.length === 0) {
            list.innerHTML = `<p class="text-base text-slate-500 italic font-medium">No connections yet. Click two table names to add one.</p>`;
            return;
        }

        list.innerHTML = state.connections.map((conn, index) => `
            <article class="border border-indigo-100 bg-white rounded-2xl p-4 shadow-sm">
                <div class="flex flex-wrap items-center justify-between gap-3 mb-3">
                    <p class="text-sm font-bold text-slate-500">${typeLabel(conn.aSide, conn.bSide)}</p>
                    <button type="button" onclick="removeConnection(${index})" class="px-2.5 py-1 rounded-lg text-sm font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 border border-slate-200">
                        Remove
                    </button>
                </div>
                <div class="grid sm:grid-cols-[1fr_auto_1fr] gap-3 items-center">
                    <div class="rounded-xl border border-slate-200 bg-slate-50/80 p-3 space-y-2">
                        <p class="font-mono font-bold text-lg text-indigo-800">${tableName(conn.a)}</p>
                        <div class="flex gap-1.5">
                            <button type="button" onclick="setSide(${index}, 'a', 'one')" class="flex-1 py-2 rounded-lg text-sm font-bold border transition ${sideClass(conn.aSide === 'one', 'one')}">One</button>
                            <button type="button" onclick="setSide(${index}, 'a', 'many')" class="flex-1 py-2 rounded-lg text-sm font-bold border transition ${sideClass(conn.aSide === 'many', 'many')}">Many</button>
                        </div>
                    </div>
                    <div class="hidden sm:flex items-center justify-center text-slate-300 text-lg">
                        <i class="fa-solid fa-grip-lines"></i>
                    </div>
                    <div class="rounded-xl border border-slate-200 bg-slate-50/80 p-3 space-y-2">
                        <p class="font-mono font-bold text-lg text-indigo-800">${tableName(conn.b)}</p>
                        <div class="flex gap-1.5">
                            <button type="button" onclick="setSide(${index}, 'b', 'one')" class="flex-1 py-2 rounded-lg text-sm font-bold border transition ${sideClass(conn.bSide === 'one', 'one')}">One</button>
                            <button type="button" onclick="setSide(${index}, 'b', 'many')" class="flex-1 py-2 rounded-lg text-sm font-bold border transition ${sideClass(conn.bSide === 'many', 'many')}">Many</button>
                        </div>
                    </div>
                </div>
            </article>`).join('');
    }

    function render() {
        renderTables();
        renderConnections();
    }

    window.validateLinks = function () {
        const reportEl = document.getElementById('validation-report');
        reportEl.classList.remove('hidden');
        const errors = [];
        const used = new Set();

        TASK.links.forEach((expected) => {
            const conn = findConnection(expected.a, expected.b);
            const label = `${tableName(expected.a)} and ${tableName(expected.b)}`;
            if (!conn) {
                errors.push(`Connect <b>${tableName(expected.a)}</b> with <b>${tableName(expected.b)}</b>.`);
                return;
            }
            used.add(expectedKey(expected));
            if (!conn.aSide || !conn.bSide) {
                errors.push(`Choose one or many on both sides of <b>${label}</b>.`);
                return;
            }
            if (!sidesMatch(conn, expected)) {
                errors.push(`<b>${label}</b> should be <b>${typeLabel(expected.aSide, expected.bSide)}</b> (${tableName(expected.a)}: ${expected.aSide}, ${tableName(expected.b)}: ${expected.bSide}).`);
            }
        });

        state.connections.forEach((conn) => {
            if (!used.has(pairKey(conn.a, conn.b)) && !TASK.links.some((link) => expectedKey(link) === pairKey(conn.a, conn.b))) {
                errors.push(`<b>${tableName(conn.a)}</b> and <b>${tableName(conn.b)}</b> should not be connected.`);
            }
        });

        if (errors.length === 0 && state.connections.length === TASK.links.length) {
            persistProgress({ completed: true });
            const isLast = !window.LinkProgress || levelId >= window.LinkProgress.LEVELS.length;
            const nextHref = isLast ? 'link-overview.html' : window.LinkProgress.LEVELS[levelId].href;
            const nextLabel = isLast ? 'View overview' : `Go to level ${levelId + 1}`;
            reportEl.className = 'rounded-2xl p-6 bg-emerald-50/90 border border-emerald-300/80 text-emerald-950 shadow-sm space-y-3';
            reportEl.innerHTML = `
                <div class="flex items-center gap-3.5">
                    <div class="w-11 h-11 rounded-xl bg-emerald-100 border border-emerald-200 text-emerald-800 flex items-center justify-center text-2xl shadow-sm">
                        <i class="fa-solid fa-trophy"></i>
                    </div>
                    <div>
                        <h3 class="font-bold text-xl text-emerald-950">Those relationships look right</h3>
                        <p class="text-base text-emerald-800">${TASK.successMessage}</p>
                    </div>
                </div>
                <div class="p-3.5 bg-white/90 rounded-xl text-sm space-y-1 font-mono border border-emerald-200 text-emerald-900">
                    <p class="font-bold text-base">Connections</p>
                    ${TASK.successRelations.map((r) => `<p>• ${r}</p>`).join('')}
                </div>
                <a href="${nextHref}" class="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-100 hover:bg-emerald-200 text-emerald-800 text-sm font-bold transition">
                    ${nextLabel} <i class="fa-solid fa-arrow-right text-xs"></i>
                </a>`;
        } else {
            reportEl.className = 'rounded-2xl p-6 bg-rose-50/90 border border-rose-200 text-rose-950 shadow-sm space-y-3';
            reportEl.innerHTML = `
                <div class="flex items-center gap-3.5">
                    <div class="w-11 h-11 rounded-xl bg-rose-100 border border-rose-200 text-rose-800 flex items-center justify-center text-xl">
                        <i class="fa-solid fa-triangle-exclamation"></i>
                    </div>
                    <div>
                        <h3 class="font-bold text-xl text-rose-950">Relationship issues found (${errors.length})</h3>
                        <p class="text-base text-rose-800">Check which tables belong together and whether each side is one or many.</p>
                    </div>
                </div>
                <ul class="list-disc list-inside text-base space-y-1.5 pl-2 text-rose-900 font-sans">
                    ${errors.slice(0, 5).map((err) => `<li>${err}</li>`).join('')}
                    ${errors.length > 5 ? `<li class="font-bold text-rose-950">…and ${errors.length - 5} more issues to resolve.</li>` : ''}
                </ul>`;
        }
        reportEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    };

    document.addEventListener('DOMContentLoaded', render);
})();
