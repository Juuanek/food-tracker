#!/usr/bin/env node
/**
 * Generuje firebase-config.js z env (używane w GitHub Actions).
 * FIREBASE_CONFIG_JSON = pełny obiekt z Firebase Console (jedna linia JSON).
 */
const fs = require('fs');
const path = require('path');

const outPath = process.argv[2] || path.join(process.cwd(), 'firebase-config.js');
const raw = process.env.FIREBASE_CONFIG_JSON;

if (!raw) {
    console.error('Brak zmiennej FIREBASE_CONFIG_JSON');
    process.exit(1);
}

let config;
try {
    config = JSON.parse(raw);
} catch (e) {
    console.error('FIREBASE_CONFIG_JSON nie jest poprawnym JSON');
    process.exit(1);
}

const required = ['apiKey', 'authDomain', 'projectId', 'appId'];
for (const key of required) {
    if (!config[key]) {
        console.error(`Brak pola w JSON: ${key}`);
        process.exit(1);
    }
}

const file = `export const firebaseConfig = ${JSON.stringify(
    {
        apiKey: config.apiKey,
        authDomain: config.authDomain,
        projectId: config.projectId,
        storageBucket: config.storageBucket || `${config.projectId}.appspot.com`,
        messagingSenderId: config.messagingSenderId || '',
        appId: config.appId
    },
    null,
    4
)};

export function isFirebaseConfigured() {
    const { apiKey, projectId, appId } = firebaseConfig;
    if (!apiKey || !projectId || !appId) return false;
    return !String(apiKey).includes('YOUR_') && !String(projectId).includes('YOUR_');
}
`;

fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(outPath, file, 'utf8');
console.log('Wrote', outPath);
