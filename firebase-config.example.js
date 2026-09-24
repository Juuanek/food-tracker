export const firebaseConfig = {
    apiKey: 'YOUR_API_KEY',
    authDomain: 'YOUR_PROJECT_ID.firebaseapp.com',
    projectId: 'YOUR_PROJECT_ID',
    storageBucket: 'YOUR_PROJECT_ID.appspot.com',
    messagingSenderId: 'YOUR_MESSAGING_SENDER_ID',
    appId: 'YOUR_APP_ID'
};

export function isFirebaseConfigured() {
    const { apiKey, projectId, appId } = firebaseConfig;
    if (!apiKey || !projectId || !appId) return false;
    return !String(apiKey).includes('YOUR_') && !String(projectId).includes('YOUR_');
}
