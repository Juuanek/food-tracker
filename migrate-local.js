import { onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/11.6.0/firebase-auth.js';
import { doc, getDoc, setDoc, serverTimestamp } from 'https://www.gstatic.com/firebasejs/11.6.0/firebase-firestore.js';
import { isFirebaseConfigured } from './firebase-config.js';
import { getDb, getFirebaseAuth } from './firebase-core.js';
import { readLegacyLocalStorage } from './firebase-store.js';
import { mergeAppData, summarizeAppData } from './data-merge.js';

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
let currentUid = null;

async function readLocalSource() {
    if (pendingLocal) return pendingLocal;
    const legacy = readLegacyLocalStorage();
    if (legacy) return legacy;
    return { entries: [], profile: null, calorieOverrides: {}, dailyActivity: {} };
}

async function readRemote(uid) {
    const ref = doc(getDb(), 'clients', uid);
    const snap = await getDoc(ref);
    return normalizeRemote(snap.exists() ? snap.data() : null);
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
        if (!currentUid) throw new Error('Zaloguj się w głównej aplikacji, potem wróć tutaj.');
        clientIdEl.textContent = currentUid;
        const local = await readLocalSource();
        const remote = await readRemote(currentUid);
        const merged = mergeAppData(local, remote);
        log(
            `LOCAL/BACKUP: ${JSON.stringify(summarizeAppData(local))}\n` +
                `REMOTE (konto): ${JSON.stringify(summarizeAppData(remote))}\n` +
                `MERGED: ${JSON.stringify(summarizeAppData(merged))}\n\n` +
                `Po scaleniu będzie ${merged.entries.length} wpisów.`
        );
    } catch (err) {
        log(`Błąd: ${err.message}`);
    }
});

document.getElementById('btnMerge').addEventListener('click', async () => {
    try {
        if (!currentUid) throw new Error('Zaloguj się w głównej aplikacji, potem wróć tutaj.');
        clientIdEl.textContent = currentUid;
        const local = await readLocalSource();
        const remote = await readRemote(currentUid);
        const merged = mergeAppData(local, remote);

        await setDoc(
            doc(getDb(), 'clients', currentUid),
            {
                entries: merged.entries,
                profile: merged.profile,
                calorieOverrides: merged.calorieOverrides,
                dailyActivity: merged.dailyActivity,
                updatedAt: serverTimestamp()
            },
            { merge: true }
        );

        localStorage.setItem('foodTrackerLegacyMerged', '1');
        localStorage.setItem('foodTrackerMigratedToFirebase', '1');

        log(
            `✅ Zapisano w Firestore (clients/${currentUid}).\n` +
                `Wynik: ${JSON.stringify(summarizeAppData(merged))}\n\n` +
                `Odśwież główną aplikację (index.html).`
        );
    } catch (err) {
        log(`Błąd: ${err.message}`);
    }
});

if (!isFirebaseConfigured()) {
    log('Uzupełnij firebase-config.js');
} else {
    onAuthStateChanged(getFirebaseAuth(), (user) => {
        if (!user) {
            currentUid = null;
            clientIdEl.textContent = '(zaloguj się na index.html)';
            log('Nie jesteś zalogowany. Otwórz główną aplikację, zaloguj się, wróć tutaj.');
            return;
        }
        currentUid = user.uid;
        clientIdEl.textContent = `${user.email || user.uid}`;
        log('Zalogowano. Możesz użyć podglądu / scalenia.');
    });
}
