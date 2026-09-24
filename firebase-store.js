import { doc, getDoc, setDoc, serverTimestamp } from 'https://www.gstatic.com/firebasejs/11.6.0/firebase-firestore.js';
import { isFirebaseConfigured } from './firebase-config.js';
import { getDb } from './firebase-core.js';
import { mergeAppData } from './data-merge.js';

const CLIENT_ID_KEY = 'foodTrackerClientId';
const MIGRATED_KEY = 'foodTrackerMigratedToFirebase';
const LEGACY_MERGED_KEY = 'foodTrackerLegacyMerged';

const LOCAL_KEYS = {
    entries: 'foodEntries',
    profile: 'userProfile',
    calorieOverrides: 'dailyCalorieOverrides',
    dailyActivity: 'dailyActivity'
};

function emptyAppData() {
    return {
        entries: [],
        profile: null,
        calorieOverrides: {},
        dailyActivity: {}
    };
}

function normalizeClientData(data) {
    if (!data) return emptyAppData();
    return {
        entries: data.entries || [],
        profile: data.profile ?? null,
        calorieOverrides: data.calorieOverrides || {},
        dailyActivity: data.dailyActivity || {}
    };
}

function createClientId() {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
        return crypto.randomUUID();
    }
    if (typeof crypto !== 'undefined' && typeof crypto.getRandomValues === 'function') {
        const bytes = new Uint8Array(16);
        crypto.getRandomValues(bytes);
        bytes[6] = (bytes[6] & 0x0f) | 0x40;
        bytes[8] = (bytes[8] & 0x3f) | 0x80;
        const hex = [...bytes].map((b) => b.toString(16).padStart(2, '0')).join('');
        return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
    }
    return `ft-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}

export function getClientId() {
    let id = localStorage.getItem(CLIENT_ID_KEY);
    if (!id) {
        id = createClientId();
        localStorage.setItem(CLIENT_ID_KEY, id);
    }
    return id;
}

export function readLegacyLocalStorage() {
    const entriesRaw = localStorage.getItem(LOCAL_KEYS.entries);
    const profileRaw = localStorage.getItem(LOCAL_KEYS.profile);
    const overridesRaw = localStorage.getItem(LOCAL_KEYS.calorieOverrides);
    const activityRaw = localStorage.getItem(LOCAL_KEYS.dailyActivity);

    const entries = entriesRaw ? JSON.parse(entriesRaw) : [];
    const profile = profileRaw ? JSON.parse(profileRaw) : null;
    const calorieOverrides = overridesRaw ? JSON.parse(overridesRaw) : {};
    const dailyActivity = activityRaw ? JSON.parse(activityRaw) : {};

    const hasData =
        entries.length > 0 ||
        profile !== null ||
        Object.keys(calorieOverrides).length > 0 ||
        Object.keys(dailyActivity).length > 0;

    if (!hasData) return null;

    return { entries, profile, calorieOverrides, dailyActivity };
}

function isRemoteEmpty(data) {
    if (!data) return true;
    const entries = data.entries || [];
    const profile = data.profile;
    const overrides = data.calorieOverrides || {};
    const activity = data.dailyActivity || {};
    return (
        entries.length === 0 &&
        !profile &&
        Object.keys(overrides).length === 0 &&
        Object.keys(activity).length === 0
    );
}

export function markMigratedFromLocalStorage() {
    localStorage.setItem(MIGRATED_KEY, '1');
}

export async function createDataStore(uid, email = '') {
    if (!isFirebaseConfigured()) {
        throw new Error('Backend not configured.');
    }
    if (!uid) {
        throw new Error('Brak zalogowanego użytkownika.');
    }

    const db = getDb();
    const docRef = doc(db, 'clients', uid);
    const deviceId = getClientId();

    return {
        uid,
        email,
        deviceId,
        dbKind: 'firestore',

        async load() {
            const snap = await getDoc(docRef);
            return snap.exists() ? snap.data() : null;
        },

        async save(payload) {
            await setDoc(
                docRef,
                {
                    entries: payload.entries ?? [],
                    profile: payload.profile ?? null,
                    calorieOverrides: payload.calorieOverrides ?? {},
                    dailyActivity: payload.dailyActivity ?? {},
                    updatedAt: serverTimestamp()
                },
                { merge: true }
            );
        },

        async claimLegacyDeviceBucket() {
            if (deviceId === uid) return;

            try {
                const deviceRef = doc(db, 'clients', deviceId);
                const deviceSnap = await getDoc(deviceRef);
                if (!deviceSnap.exists()) return;

                const deviceRaw = deviceSnap.data();
                const claimedBy = deviceRaw.claimedBy;
                if (claimedBy && claimedBy !== uid) return;

                const userSnap = await getDoc(docRef);
                const userNorm = normalizeClientData(userSnap.exists() ? userSnap.data() : null);
                const deviceNorm = normalizeClientData(deviceRaw);
                const local = readLegacyLocalStorage();
                let merged = mergeAppData(local || emptyAppData(), userNorm);
                merged = mergeAppData(deviceNorm, merged);

                await this.save(merged);

                if (!claimedBy) {
                    await setDoc(deviceRef, { claimedBy: uid }, { merge: true });
                }

                markMigratedFromLocalStorage();
                localStorage.setItem(LEGACY_MERGED_KEY, '1');
            } catch (err) {
                console.warn('Legacy device merge skipped:', err);
            }
        },

        async loadWithMigration() {
            await this.claimLegacyDeviceBucket();

            let remote = await this.load();
            const legacy = readLegacyLocalStorage();
            const legacyMerged = localStorage.getItem(LEGACY_MERGED_KEY) === '1';

            if (legacy && !legacyMerged) {
                const remoteNorm = normalizeClientData(remote);
                const merged = isRemoteEmpty(remote)
                    ? {
                          entries: legacy.entries,
                          profile: legacy.profile,
                          calorieOverrides: legacy.calorieOverrides,
                          dailyActivity: legacy.dailyActivity
                      }
                    : mergeAppData(legacy, remoteNorm);

                await this.save(merged);
                markMigratedFromLocalStorage();
                localStorage.setItem(LEGACY_MERGED_KEY, '1');
                return merged;
            }

            if (!remote) {
                return emptyAppData();
            }

            return normalizeClientData(remote);
        }
    };
}
