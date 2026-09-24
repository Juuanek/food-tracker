function entryTimestamp(entry) {
    const raw = entry.updatedAt || entry.createdAt || entry.time || 0;
    const t = new Date(raw).getTime();
    return Number.isNaN(t) ? 0 : t;
}

export function mergeEntries(localEntries = [], remoteEntries = []) {
    const byId = new Map();
    for (const entry of [...remoteEntries, ...localEntries]) {
        if (entry == null || entry.id == null) continue;
        const prev = byId.get(entry.id);
        if (!prev || entryTimestamp(entry) >= entryTimestamp(prev)) {
            byId.set(entry.id, entry);
        }
    }
    return [...byId.values()].sort((a, b) => entryTimestamp(b) - entryTimestamp(a));
}

export function mergeProfile(localProfile, remoteProfile) {
    if (!localProfile) return remoteProfile ?? null;
    if (!remoteProfile) return localProfile;
    const tl = new Date(localProfile.lastUpdated || 0).getTime() || 0;
    const tr = new Date(remoteProfile.lastUpdated || 0).getTime() || 0;
    return tl >= tr ? localProfile : remoteProfile;
}

export function mergeDateKeyedObjects(localObj = {}, remoteObj = {}) {
    return { ...remoteObj, ...localObj };
}

export function mergeAppData(local, remote) {
    const remoteSafe = remote || {
        entries: [],
        profile: null,
        calorieOverrides: {},
        dailyActivity: {}
    };
    return {
        entries: mergeEntries(local.entries || [], remoteSafe.entries || []),
        profile: mergeProfile(local.profile, remoteSafe.profile),
        calorieOverrides: mergeDateKeyedObjects(
            local.calorieOverrides || {},
            remoteSafe.calorieOverrides || {}
        ),
        dailyActivity: mergeDateKeyedObjects(local.dailyActivity || {}, remoteSafe.dailyActivity || {})
    };
}

export function summarizeAppData(data) {
    const entries = data?.entries || [];
    return {
        entries: entries.length,
        profile: data?.profile ? 'yes' : 'no',
        calorieOverrides: Object.keys(data?.calorieOverrides || {}).length,
        dailyActivity: Object.keys(data?.dailyActivity || {}).length
    };
}
