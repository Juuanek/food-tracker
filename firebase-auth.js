import {
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signOut,
    sendPasswordResetEmail
} from 'https://www.gstatic.com/firebasejs/11.6.0/firebase-auth.js';
import { getFirebaseAuth } from './firebase-core.js';

export function authErrorMessage(code) {
    const map = {
        'auth/invalid-email': 'Nieprawidłowy adres e-mail.',
        'auth/user-disabled': 'Konto zostało wyłączone.',
        'auth/user-not-found': 'Brak konta z tym e-mailem.',
        'auth/wrong-password': 'Nieprawidłowe hasło.',
        'auth/invalid-credential': 'Nieprawidłowy e-mail lub hasło.',
        'auth/email-already-in-use': 'Ten e-mail jest już zarejestrowany — zaloguj się.',
        'auth/weak-password': 'Hasło musi mieć co najmniej 6 znaków.',
        'auth/too-many-requests': 'Za dużo prób. Spróbuj później.',
        'auth/network-request-failed': 'Brak połączenia z internetem.'
    };
    return map[code] || 'Błąd logowania. Spróbuj ponownie.';
}

export async function loginWithEmail(email, password) {
    return signInWithEmailAndPassword(getFirebaseAuth(), email.trim(), password);
}

export async function registerWithEmail(email, password) {
    return createUserWithEmailAndPassword(getFirebaseAuth(), email.trim(), password);
}

export async function logoutUser() {
    return signOut(getFirebaseAuth());
}

export async function sendPasswordReset(email) {
    return sendPasswordResetEmail(getFirebaseAuth(), email.trim());
}
