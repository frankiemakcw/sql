/**
 * One-table primary-key practice engine.
 * Each page defines window.PK_TASK then loads this file.
 * Dummy attributes (unused: true) should stay in the pool.
 */
(function () {
    const TASK = window.PK_TASK;
    if (!TASK) {
        console.error('PK_TASK is not defined');
        return;
    }

    const tableIds = TASK.tables.map((t) => t.id);
    const levelId = TASK.levelId;
    const neededCount = TASK.attributes.filter((a) => !a.unused).length;

    function freshState() {
        return {
            pool: TASK.attributes.map((a) => ({ ...a, selectedKey: '' })),
            tables: Object.fromEntries(tableIds.map((id) => [id, []]))
        };
    }

    let schemaState = freshState();
    const saved = window.PkProgress && levelId
        ? window.PkProgress.hydrate(window.PkProgress.getLevel(levelId).schema, TASK.attributes, tableIds)
        : null;
    if (saved) schemaState = saved;

    let selectedAttrId = null;

    function persistProgress(extra) {
        if (!window.PkProgress || !levelId) return;
        window.PkProgress.persist(levelId, schemaState, extra);
    }

    document.addEventListener('DOMContentLoaded', () => {
        renderPool();
        renderTables();
    });

    function slotsFor(tableId) {
        return TASK.tables.find((t) => t.id === tableId).slots;
    }

    function findAttrLocation(attrId) {
        const poolIdx = schemaState.pool.findIndex((a) => a.id === attrId);
        if (poolIdx !== -1) return { source: 'pool', idx: poolIdx };
        for (const t of tableIds) {
            const idx = schemaState.tables[t].findIndex((a) => a.id === attrId);
            if (idx !== -1) return { source: t, idx };
        }
        return null;
    }

    function markDropZones(on) {
        document.querySelectorAll('#attributes-pool, .table-card, [id^="table-drop-"]').forEach((el) => {
            el.classList.toggle('drop-ready', on);
            if (!on) el.classList.remove('drag-over');
        });
    }

    window.handleDragStart = function (e, attrId) {
        e.stopPropagation();
        e.dataTransfer.setData('text/plain', attrId);
        e.dataTransfer.effectAllowed = 'move';
        selectedAttrId = attrId;
        e.currentTarget.classList.add('dragging');
        markDropZones(true);
        const src = e.currentTarget;
        const ghost = src.cloneNode(true);
        ghost.style.cssText = `position:absolute;top:-9999px;left:0;opacity:1;width:${src.offsetWidth}px;pointer-events:none;`;
        document.body.appendChild(ghost);
        e.dataTransfer.setDragImage(ghost, e.offsetX, e.offsetY);
        setTimeout(() => ghost.remove(), 0);
    };

    window.handleDragEnd = function () {
        document.querySelectorAll('.dragging').forEach((el) => el.classList.remove('dragging'));
        markDropZones(false);
    };

    window.handleDropToPool = function (e) {
        e.preventDefault();
        e.currentTarget.classList.remove('drag-over');
        const attrId = e.dataTransfer.getData('text/plain') || selectedAttrId;
        if (!attrId) return;
        const loc = findAttrLocation(attrId);
        if (loc && loc.source !== 'pool') {
            returnToPool(attrId, loc.source);
        }
        selectedAttrId = null;
    };

    window.handleDragOver = function (e) {
        e.preventDefault();
        e.currentTarget.classList.add('drag-over');
    };

    window.handleDragLeave = function (e) {
        if (e.currentTarget.contains(e.relatedTarget)) return;
        e.currentTarget.classList.remove('drag-over');
    };

    window.handleDrop = function (e, targetTable) {
        e.preventDefault();
        e.currentTarget.classList.remove('drag-over');
        const attrId = e.dataTransfer.getData('text/plain') || selectedAttrId;
        if (attrId) {
            moveAttrToTable(attrId, targetTable);
            selectedAttrId = null;
            renderPool();
        }
    };

    window.selectPoolAttr = function (attrId) {
        selectedAttrId = selectedAttrId === attrId ? null : attrId;
        renderPool();
    };

    window.handleTableClick = function (targetTable) {
        if (!selectedAttrId) return;
        moveAttrToTable(selectedAttrId, targetTable);
        selectedAttrId = null;
        renderPool();
        renderTables();
    };

    function moveAttrToTable(attrId, targetTable) {
        if (schemaState.tables[targetTable].length >= slotsFor(targetTable)) return;

        const loc = findAttrLocation(attrId);
        if (!loc) return;

        if (loc.source === 'pool') {
            const item = schemaState.pool.splice(loc.idx, 1)[0];
            item.selectedKey = item.selectedKey || '';
            schemaState.tables[targetTable].push(item);
        } else if (loc.source !== targetTable) {
            const item = schemaState.tables[loc.source].splice(loc.idx, 1)[0];
            schemaState.tables[targetTable].push(item);
        }

        renderPool();
        renderTables();
        persistProgress();
    }

    window.returnToPool = function (attrId, sourceTable) {
        const idx = schemaState.tables[sourceTable].findIndex((a) => a.id === attrId);
        if (idx !== -1) {
            const item = schemaState.tables[sourceTable].splice(idx, 1)[0];
            schemaState.pool.push(item);
        }
        renderPool();
        renderTables();
        persistProgress();
    };

    window.setKeyRole = function (attrId, tableName, role) {
        const item = schemaState.tables[tableName].find((a) => a.id === attrId);
        if (item) {
            item.selectedKey = item.selectedKey === role ? '' : role;
            renderTables();
            persistProgress();
        }
    };

    window.resetSchemaBuilder = function () {
        schemaState = freshState();
        selectedAttrId = null;
        document.getElementById('validation-report').classList.add('hidden');
        persistProgress({ reset: true });
        renderPool();
        renderTables();
    };

    function keyLabel(code) {
        if (code === 'PK') return 'Primary Key';
        return 'no key';
    }

    function keyChipClass(active) {
        if (!active) return 'bg-indigo-50/50 text-slate-600 border-indigo-100 hover:bg-indigo-50';
        return 'bg-indigo-700 text-white border-indigo-800';
    }

    function renderPool() {
        const poolEl = document.getElementById('attributes-pool');
        const countEl = document.getElementById('pool-count');
        countEl.innerText = `${schemaState.pool.length} attribute(s) unassigned`;

        if (schemaState.pool.length === 0) {
            poolEl.innerHTML = `<span class="text-sm text-slate-500 italic py-1 font-sans font-medium">The pool is empty. Some extras should stay unused — drag those back here.</span>`;
            return;
        }

        poolEl.innerHTML = schemaState.pool.map((attr) => {
            const selected = selectedAttrId === attr.id;
            return `
                <div id="${attr.id}" draggable="true"
                     ondragstart="handleDragStart(event, '${attr.id}')"
                     ondragend="handleDragEnd()"
                     onclick="selectPoolAttr('${attr.id}')"
                     class="bg-white hover:bg-slate-50 border rounded-xl px-3.5 py-2 cursor-grab active:cursor-grabbing flex items-center justify-center shadow-sm transition text-sm font-mono font-bold text-slate-800 ${selected ? 'border-indigo-500 ring-2 ring-indigo-200 bg-indigo-50' : 'border-slate-300 hover:border-indigo-400'}">
                    ${attr.name}
                </div>`;
        }).join('');
    }

    function renderTables() {
        TASK.tables.forEach((table) => {
            const dropEl = document.getElementById(`table-drop-${table.id}`);
            const items = schemaState.tables[table.id];
            let slotsHTML = '';

            for (let i = 0; i < table.slots; i++) {
                const item = items[i];
                if (item) {
                    slotsHTML += `
                    <div draggable="true" ondragstart="handleDragStart(event, '${item.id}')" ondragend="handleDragEnd()" class="flex-1 min-w-0 bg-white border border-slate-200 rounded-xl p-3.5 flex flex-col gap-3 shadow-sm cursor-grab active:cursor-grabbing">
                        <span class="text-xs bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md border border-slate-200 font-sans font-semibold w-fit">Column ${i + 1}</span>
                        <span class="font-mono font-bold text-sm sm:text-base text-slate-800 break-all">${item.name}</span>
                        <div class="mt-auto">
                            <label class="text-sm font-semibold text-slate-700 block mb-1 font-sans">Key role:</label>
                            <button type="button" draggable="false" onmousedown="event.stopPropagation()" onclick="event.stopPropagation(); setKeyRole('${item.id}', '${table.id}', 'PK')"
                                    class="w-full px-3 py-1.5 rounded-lg text-sm font-semibold font-sans transition border cursor-pointer ${keyChipClass(item.selectedKey === 'PK')}">Primary Key</button>
                        </div>
                    </div>`;
                } else {
                    slotsHTML += `
                    <div class="flex-1 min-w-0 border-2 border-dashed border-slate-200 hover:border-slate-300 bg-slate-50/70 rounded-xl p-3.5 flex flex-col items-center justify-center gap-2 text-slate-400 transition min-h-[140px] text-center">
                        <span class="text-xs bg-slate-200/80 text-slate-600 px-2 py-0.5 rounded font-mono font-medium">Column Slot ${i + 1}</span>
                        <span class="text-xs sm:text-sm italic font-sans text-slate-500">Empty slot</span>
                        <i class="fa-regular fa-square-plus text-slate-400 text-base"></i>
                    </div>`;
                }
            }

            dropEl.innerHTML = slotsHTML;
        });
    }

    window.validateSchema = function () {
        const reportEl = document.getElementById('validation-report');
        reportEl.classList.remove('hidden');

        const errors = [];
        const table = TASK.tables[0];
        const items = schemaState.tables[table.id];

        if (items.length < table.slots) {
            errors.push(`The <b>${table.name}</b> table only has ${items.length}/${table.slots} slots filled.`);
        }

        items.forEach((attr) => {
            if (attr.unused) {
                errors.push(`Attribute <span class="font-mono font-bold text-slate-800">${attr.name}</span> does not belong in this table. Leave unused extras in the pool.`);
                return;
            }
            if (attr.targetTable !== table.id) {
                errors.push(`Attribute <span class="font-mono font-bold text-slate-800">${attr.name}</span> does not belong in the <b>${table.name}</b> table.`);
            }
            const actualKey = attr.selectedKey || 'DATA';
            if (actualKey !== attr.correctKey) {
                errors.push(`Attribute <span class="font-mono font-bold text-slate-800">${attr.name}</span> should be set to <b>${keyLabel(attr.correctKey)}</b> (you selected <i>${keyLabel(actualKey)}</i>).`);
            }
        });

        TASK.attributes.filter((a) => !a.unused).forEach((attr) => {
            const inTable = items.some((item) => item.id === attr.id);
            if (!inTable) {
                errors.push(`Attribute <span class="font-mono font-bold text-slate-800">${attr.name}</span> still needs to be placed in the <b>${table.name}</b> table.`);
            }
        });

        const unusedStillInPool = TASK.attributes.filter((a) => a.unused).every((attr) => schemaState.pool.some((item) => item.id === attr.id));
        const neededPlaced = items.filter((a) => !a.unused).length === neededCount;

        if (errors.length === 0 && unusedStillInPool && neededPlaced) {
            persistProgress({ completed: true });
            const isLast = !window.PkProgress || levelId >= window.PkProgress.LEVELS.length;
            const nextHref = isLast ? 'index.html' : window.PkProgress.LEVELS[levelId].href;
            const nextLabel = isLast ? 'Back to lesson' : `Go to level ${levelId + 1}`;
            if (window.renderLessonSidebar) window.renderLessonSidebar();
            reportEl.className = 'rounded-2xl p-6 bg-emerald-50/90 border border-emerald-300/80 text-emerald-950 shadow-sm space-y-3';
            reportEl.innerHTML = `
                <div class="flex items-center gap-3.5">
                    <div class="w-11 h-11 rounded-xl bg-emerald-100 border border-emerald-200 text-emerald-800 flex items-center justify-center text-2xl shadow-sm">
                        <i class="fa-solid fa-trophy"></i>
                    </div>
                    <div>
                        <h3 class="font-bold text-lg text-emerald-950">Nice table design</h3>
                        <p class="text-sm text-emerald-800">${TASK.successMessage}</p>
                    </div>
                </div>
                <div class="p-3.5 bg-white/90 rounded-xl text-xs space-y-1 font-mono border border-emerald-200 text-emerald-900">
                    <p class="font-bold text-sm">Primary key</p>
                    ${TASK.successRelations.map((r) => `<p>• ${r}</p>`).join('')}
                </div>
                <a href="${nextHref}" class="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-100 hover:bg-emerald-200 text-emerald-800 text-xs font-bold transition">
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
                        <h3 class="font-bold text-lg text-rose-950">Schema validation issues found (${errors.length})</h3>
                        <p class="text-sm text-rose-800">Place the right columns, leave extras unused, and mark only the primary key.</p>
                    </div>
                </div>
                <ul class="list-disc list-inside text-sm space-y-1.5 pl-2 text-rose-900 font-sans">
                    ${errors.slice(0, 5).map((err) => `<li>${err}</li>`).join('')}
                    ${errors.length > 5 ? `<li class="font-bold text-rose-950">…and ${errors.length - 5} more issues to resolve.</li>` : ''}
                </ul>`;
        }
        reportEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    };
})();
