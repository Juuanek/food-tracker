import { onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/11.6.0/firebase-auth.js';
import { createDataStore } from './firebase-store.js';
import { isFirebaseConfigured } from './firebase-config.js';
import { getFirebaseAuth } from './firebase-core.js';
import {
    loginWithEmail,
    registerWithEmail,
    logoutUser,
    sendPasswordReset,
    authErrorMessage
} from './firebase-auth.js';

function showBootError(message) {
    const overlay = document.getElementById('appLoading');
    if (!overlay) return;
    overlay.classList.add('error');
    overlay.innerHTML = `
        <div class="loading-card">
            <h2>Nie można połączyć z Firebase</h2>
            <p>${message}</p>
            <p class="loading-hint">Zobacz <strong>FIREBASE_AUTH.md</strong> i <strong>FIREBASE_SETUP.md</strong>.</p>
        </div>
    `;
}

function hideBootLoading() {
    const overlay = document.getElementById('appLoading');
    if (overlay) overlay.classList.add('hidden');
}

function showBootLoading(message = 'Ładowanie danych z chmury…') {
    const overlay = document.getElementById('appLoading');
    if (!overlay) return;
    overlay.classList.remove('hidden', 'error');
    overlay.innerHTML = `<div class="loading-card"><p>${message}</p></div>`;
}

function showAuthGate() {
    document.getElementById('authGate')?.classList.remove('hidden');
    document.getElementById('appContainer')?.classList.add('hidden');
}

function hideAuthGate() {
    document.getElementById('authGate')?.classList.add('hidden');
    document.getElementById('appContainer')?.classList.remove('hidden');
}

function setAuthUserBar(user) {
    const bar = document.getElementById('authUserBar');
    const emailEl = document.getElementById('authUserEmail');
    if (!bar || !emailEl) return;
    if (user) {
        emailEl.textContent = user.email || user.uid;
        bar.classList.remove('hidden');
    } else {
        bar.classList.add('hidden');
    }
}

function setAuthError(message) {
    const el = document.getElementById('authError');
    if (el) el.textContent = message || '';
}

async function startAppForUser(user) {
    hideAuthGate();
    showBootLoading();
    try {
        const store = await createDataStore(user.uid, user.email || '');
        const app = new FoodTracker(store);
        await app.loadFromStore();
        app.init();
        window.app = app;
        setAuthUserBar(user);
        hideBootLoading();
    } catch (err) {
        console.error(err);
        const msg = err.message || 'Nieznany błąd połączenia.';
        if (/permission/i.test(msg)) {
            showBootError(
                `${msg}<br><br>Zaktualizuj reguły Firestore według <strong>FIREBASE_AUTH.md</strong> (dostęp tylko dla zalogowanego <code>uid</code>).`
            );
            return;
        }
        showBootError(msg);
    }
}

function setupAuthForm() {
    const form = document.getElementById('authForm');
    const emailInput = document.getElementById('authEmail');
    const passwordInput = document.getElementById('authPassword');
    const registerBtn = document.getElementById('authRegisterBtn');
    const resetBtn = document.getElementById('authResetBtn');
    const logoutBtn = document.getElementById('logoutBtn');

    form?.addEventListener('submit', async (e) => {
        e.preventDefault();
        setAuthError('');
        try {
            await loginWithEmail(emailInput.value, passwordInput.value);
        } catch (err) {
            setAuthError(authErrorMessage(err.code));
        }
    });

    registerBtn?.addEventListener('click', async () => {
        setAuthError('');
        try {
            await registerWithEmail(emailInput.value, passwordInput.value);
        } catch (err) {
            setAuthError(authErrorMessage(err.code));
        }
    });

    resetBtn?.addEventListener('click', async () => {
        setAuthError('');
        const email = emailInput.value.trim();
        if (!email) {
            setAuthError('Podaj e-mail, aby wysłać link do resetu hasła.');
            return;
        }
        try {
            await sendPasswordReset(email);
            setAuthError('Wysłaliśmy link resetujący hasło (sprawdź skrzynkę).');
        } catch (err) {
            setAuthError(authErrorMessage(err.code));
        }
    });

    logoutBtn?.addEventListener('click', async () => {
        try {
            await logoutUser();
        } catch (err) {
            console.error(err);
        }
    });
}

function start() {
    if (!isFirebaseConfigured()) {
        showBootError(
            'Uzupełnij plik firebase-config.js (skopiuj z firebase-config.example.js i wklej dane z Firebase Console).'
        );
        return;
    }

    setupAuthForm();
    const auth = getFirebaseAuth();

    onAuthStateChanged(auth, (user) => {
        if (!user) {
            window.app = null;
            setAuthUserBar(null);
            hideBootLoading();
            showAuthGate();
            return;
        }
        startAppForUser(user);
    });
}

start();
