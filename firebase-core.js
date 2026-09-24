import { initializeApp, getApps } from 'https://www.gstatic.com/firebasejs/11.6.0/firebase-app.js';
import { getFirestore } from 'https://www.gstatic.com/firebasejs/11.6.0/firebase-firestore.js';
import { getAuth } from 'https://www.gstatic.com/firebasejs/11.6.0/firebase-auth.js';
import { firebaseConfig } from './firebase-config.js';

export function getFirebaseApp() {
    if (!getApps().length) {
        return initializeApp(firebaseConfig);
    }
    return getApps()[0];
}

export function getDb() {
    return getFirestore(getFirebaseApp());
}

export function getFirebaseAuth() {
    return getAuth(getFirebaseApp());
}
