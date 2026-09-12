/**
 * Shared localStorage progress for the table-relationship series.
 */
window.LinkProgress = (function () {
    const KEY = 'link-architect-progress-v3';

    const LEVELS = [
        { id: 1, title: 'Level 1', topic: 'Form class', href: 'link-1.html', detail: '2 tables · 1 connection · one to many', icon: 'fa-chalkboard' },
        { id: 2, title: 'Level 2', topic: 'Student cards', href: 'link-2.html', detail: '3 tables · 2 connections · cards, students, and subjects', icon: 'fa-id-card' },
        { id: 3, title: 'Level 3', topic: 'School clubs', href: 'link-3.html', detail: '3 tables · 2 connections · clubs can have many advisors', icon: 'fa-people-group' },
        { id: 4, title: 'Level 4', topic: 'Cinema', href: 'link-4.html', detail: '4 tables · 3 connections · tickets and movies', icon: 'fa-film' }
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

    function linkCount(state) {
        return state && Array.isArray(state.connections) ? state.connections.length : 0;
    }

    function getLevel(id) {
        return load().levels[String(id)] || { status: 'not_started' };
    }

    function persist(id, state, extra) {
        extra = extra || {};
        const store = load();
        const key = String(id);
        const prev = store.levels[key] || { status: 'not_started' };
        let status = prev.status || 'not_started';

        if (extra.completed) {
            status = 'completed';
        } else if (extra.reset && status !== 'completed') {
            status = 'not_started';
        } else if (status !== 'completed' && linkCount(state) > 0) {
            status = 'in_progress';
        }

        store.levels[key] = {
            status: status,
            state: state,
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
                placed: linkCount(rec.state)
            };
        });
    }

    function hydrate(savedState, tableIds) {
        if (!savedState || !Array.isArray(savedState.connections)) return null;
        const allowed = new Set(tableIds);
        const connections = savedState.connections.filter((c) => (
            c && allowed.has(c.a) && allowed.has(c.b) && c.a !== c.b
        )).map((c) => ({
            a: c.a,
            b: c.b,
            aSide: c.aSide === 'one' || c.aSide === 'many' ? c.aSide : '',
            bSide: c.bSide === 'one' || c.bSide === 'many' ? c.bSide : ''
        }));
        return { connections: connections };
    }

    return {
        LEVELS: LEVELS,
        load: load,
        getLevel: getLevel,
        persist: persist,
        resetAll: resetAll,
        summary: summary,
        hydrate: hydrate,
        linkCount: linkCount
    };
})();
