import { createDataStore } from './firebase-store.js';
import { isFirebaseConfigured } from './firebase-config.js';

function showBootError(message) {
    const overlay = document.getElementById('appLoading');
    if (!overlay) return;
    overlay.classList.add('error');
    overlay.innerHTML = `
        <div class="loading-card">
            <h2>Nie można połączyć z Firebase</h2>
            <p>${message}</p>
            <p class="loading-hint">Zobacz plik <strong>FIREBASE_SETUP.md</strong> w repozytorium — krok po kroku.</p>
        </div>
    `;
}

function hideBootLoading() {
    const overlay = document.getElementById('appLoading');
    if (overlay) overlay.classList.add('hidden');
}

async function start() {
    const overlay = document.getElementById('appLoading');
    if (overlay) {
        overlay.classList.remove('hidden', 'error');
    }

    if (!isFirebaseConfigured()) {
        showBootError(
            'Uzupełnij plik firebase-config.js (skopiuj z firebase-config.example.js i wklej dane z Firebase Console).'
        );
        return;
    }

    try {
        const store = await createDataStore();
        const app = new FoodTracker(store);
        await app.loadFromStore();
        app.init();
        window.app = app;
        hideBootLoading();
    } catch (err) {
        console.error(err);
        const msg = err.message || 'Nieznany błąd połączenia.';
        if (/permission/i.test(msg)) {
            showBootError(
                `${msg}<br><br><strong>Reguły Firestore:</strong> Firebase Console → Firestore Database → <em>Rules</em> → wklej reguły z <strong>Kroku 4</strong> w FIREBASE_SETUP.md (kolekcja <code>clients</code>) → <strong>Publish</strong>. Upewnij się, że <code>projectId</code> w firebase-config.js to ten sam projekt.`
            );
            return;
        }
        showBootError(msg);
    }
}

start();
