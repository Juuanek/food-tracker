import { initializeApp } from 'https://www.gstatic.com/firebasejs/11.6.0/firebase-app.js';
import {
    getFirestore,
    doc,
    getDoc,
    setDoc,
    serverTimestamp
} from 'https://www.gstatic.com/firebasejs/11.6.0/firebase-firestore.js';
import { firebaseConfig, isFirebaseConfigured } from './firebase-config.js';
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

export async function createDataStore() {
    if (!isFirebaseConfigured()) {
        throw new Error('Firebase is not configured. Copy firebase-config.example.js to firebase-config.js and add your project keys.');
    }

    const app = initializeApp(firebaseConfig);
    const db = getFirestore(app);
    const clientId = getClientId();
    const docRef = doc(db, 'clients', clientId);

    return {
        clientId,
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

        async loadWithMigration() {
            let remote = await this.load();
            const legacy = readLegacyLocalStorage();
            const legacyMerged = localStorage.getItem(LEGACY_MERGED_KEY) === '1';

            if (legacy && !legacyMerged) {
                const remoteNorm = remote
                    ? {
                          entries: remote.entries || [],
                          profile: remote.profile ?? null,
                          calorieOverrides: remote.calorieOverrides || {},
                          dailyActivity: remote.dailyActivity || {}
                      }
                    : {
                          entries: [],
                          profile: null,
                          calorieOverrides: {},
                          dailyActivity: {}
                      };

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
                return {
                    entries: [],
                    profile: null,
                    calorieOverrides: {},
                    dailyActivity: {}
                };
            }

            return {
                entries: remote.entries || [],
                profile: remote.profile ?? null,
                calorieOverrides: remote.calorieOverrides || {},
                dailyActivity: remote.dailyActivity || {}
            };
        }
    };
}
