import { initializeApp } from 'https://www.gstatic.com/firebasejs/11.6.0/firebase-app.js';
import { getFirestore, doc, getDoc, setDoc, serverTimestamp } from 'https://www.gstatic.com/firebasejs/11.6.0/firebase-firestore.js';
import { firebaseConfig, isFirebaseConfigured } from './firebase-config.js';
import { getClientId, readLegacyLocalStorage } from './firebase-store.js';
import { mergeAppData, summarizeAppData } from './data-merge.js';

const CLIENT_ID_KEY = 'foodTrackerClientId';
const LEGACY_MERGED_KEY = 'foodTrackerLegacyMerged';

const logEl = document.getElementById('log');
const clientIdEl = document.getElementById('clientId');

function log(text) {
    logEl.textContent = text;
}

function normalizeRemote(data) {
    if (!data) {
        return { entries: [], profile: null, calorieOverrides: {}, dailyActivity: {} };
    }
    return {
        entries: data.entries || [],
        profile: data.profile ?? null,
        calorieOverrides: data.calorieOverrides || {},
        dailyActivity: data.dailyActivity || {}
    };
}

function localFromBackup(backup) {
    return {
        entries: backup.entries || [],
        profile: backup.profile ?? null,
        calorieOverrides: backup.calorieOverrides || {},
        dailyActivity: backup.dailyActivity || {}
    };
}

let pendingLocal = null;

async function readLocalSource() {
    if (pendingLocal) return pendingLocal;
    const legacy = readLegacyLocalStorage();
    if (legacy) return legacy;
    return { entries: [], profile: null, calorieOverrides: {}, dailyActivity: {} };
}

async function readRemote(db, clientId) {
    const ref = doc(db, 'clients', clientId);
    const snap = await getDoc(ref);
    return normalizeRemote(snap.exists() ? snap.data() : null);
}

async function getDb() {
    if (!isFirebaseConfigured()) {
        throw new Error('Uzupełnij firebase-config.js');
    }
    const app = initializeApp(firebaseConfig);
    return getFirestore(app);
}

document.getElementById('backupFile').addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) {
        pendingLocal = null;
        return;
    }
    const text = await file.text();
    const backup = JSON.parse(text);
    pendingLocal = localFromBackup(backup);
    log(`Załadowano backup: ${summarizeAppData(pendingLocal).entries} wpisów. Kliknij podgląd.`);
});

document.getElementById('btnPreview').addEventListener('click', async () => {
    try {
        const clientId = getClientId();
        clientIdEl.textContent = clientId;
        const db = await getDb();
        const local = await readLocalSource();
        const remote = await readRemote(db, clientId);
        const merged = mergeAppData(local, remote);
        log(
            `LOCAL:  ${JSON.stringify(summarizeAppData(local))}\n` +
                `REMOTE: ${JSON.stringify(summarizeAppData(remote))}\n` +
                `MERGED: ${JSON.stringify(summarizeAppData(merged))}\n\n` +
                `Po scaleniu będzie ${merged.entries.length} wpisów.`
        );
    } catch (err) {
        log(`Błąd: ${err.message}`);
    }
});

document.getElementById('btnMerge').addEventListener('click', async () => {
    try {
        const clientId = getClientId();
        clientIdEl.textContent = clientId;
        const db = await getDb();
        const local = await readLocalSource();
        const remote = await readRemote(db, clientId);
        const merged = mergeAppData(local, remote);

        await setDoc(
            doc(db, 'clients', clientId),
            {
                entries: merged.entries,
                profile: merged.profile,
                calorieOverrides: merged.calorieOverrides,
                dailyActivity: merged.dailyActivity,
                updatedAt: serverTimestamp()
            },
            { merge: true }
        );

        localStorage.setItem(LEGACY_MERGED_KEY, '1');
        localStorage.setItem('foodTrackerMigratedToFirebase', '1');

        log(
            `✅ Zapisano w Firestore (clients/${clientId}).\n` +
                `Wynik: ${JSON.stringify(summarizeAppData(merged))}\n\n` +
                `Odśwież główną aplikację (index.html).`
        );
    } catch (err) {
        log(`Błąd: ${err.message}`);
    }
});

clientIdEl.textContent = localStorage.getItem(CLIENT_ID_KEY) || '(brak — otwórz najpierw główną aplikację)';
