/**
 * Shared localStorage progress for the one-table primary-key series.
 */
window.PkProgress = (function () {
    const KEY = 'pk-architect-progress-v1';

    const LEVELS = [
        { id: 1, title: 'Level 1', topic: 'Students', href: 'table-easy.html', detail: '1 table · 3 columns · 2 unused extras', icon: 'fa-user-graduate' },
        { id: 2, title: 'Level 2', topic: 'Books', href: 'table-medium.html', detail: '1 table · 4 columns · 3 unused extras', icon: 'fa-book' },
        { id: 3, title: 'Level 3', topic: 'Movies', href: 'table-hard.html', detail: '1 table · 5 columns · 4 unused extras', icon: 'fa-film' }
    ];

    function emptyStore() {
        return { levels: {} };
    }

    function load() {
        try {
            const raw = localStorage.getItem(KEY);
            if (!raw) return emptyStore();
            const parsed = JSON.parse(raw);
            if (!parsed || typeof parsed !== 'object' || !parsed.levels) return emptyStore();
            return parsed;
        } catch (err) {
            return emptyStore();
        }
    }

    function save(store) {
        try {
            localStorage.setItem(KEY, JSON.stringify(store));
        } catch (err) {}
    }

    function placedCount(schema) {
        if (!schema || !schema.tables) return 0;
        return Object.values(schema.tables).reduce((sum, rows) => sum + (Array.isArray(rows) ? rows.length : 0), 0);
    }

    function getLevel(id) {
        return load().levels[String(id)] || { status: 'not_started' };
    }

    function persist(id, schema, extra) {
        extra = extra || {};
        const store = load();
        const key = String(id);
        const prev = store.levels[key] || { status: 'not_started' };
        let status = prev.status || 'not_started';

        if (extra.completed) {
            status = 'completed';
        } else if (extra.reset && status !== 'completed') {
            status = 'not_started';
        } else if (status !== 'completed' && placedCount(schema) > 0) {
            status = 'in_progress';
        }

        store.levels[key] = {
            status: status,
            schema: schema,
            updatedAt: new Date().toISOString(),
            completedAt: extra.completed ? new Date().toISOString() : prev.completedAt || null
        };
        save(store);
        return store.levels[key];
    }

    function resetAll() {
        save(emptyStore());
    }

    function summary() {
        const store = load();
        return LEVELS.map((level) => {
            const rec = store.levels[String(level.id)] || {};
            return {
                ...level,
                status: rec.status || 'not_started',
                completedAt: rec.completedAt || null,
                placed: placedCount(rec.schema)
            };
        });
    }

    function completedCount() {
        return summary().filter((l) => l.status === 'completed').length;
    }

    function hydrate(savedSchema, catalog, tableIds) {
        if (!savedSchema || !savedSchema.pool || !savedSchema.tables) return null;
        const byId = {};
        catalog.forEach((attr) => { byId[attr.id] = attr; });

        function revive(item) {
            const base = byId[item.id];
            if (!base) return null;
            return { ...base, selectedKey: item.selectedKey || '' };
        }

        const pool = savedSchema.pool.map(revive).filter(Boolean);
        const tables = {};
        let tableItems = 0;
        for (const tableId of tableIds) {
            const rows = Array.isArray(savedSchema.tables[tableId]) ? savedSchema.tables[tableId] : [];
            tables[tableId] = rows.map(revive).filter(Boolean);
            tableItems += tables[tableId].length;
        }

        if (pool.length + tableItems !== catalog.length) return null;
        return { pool: pool, tables: tables };
    }

    return {
        LEVELS: LEVELS,
        load: load,
        getLevel: getLevel,
        persist: persist,
        resetAll: resetAll,
        summary: summary,
        completedCount: completedCount,
        hydrate: hydrate,
        placedCount: placedCount
    };
})();
