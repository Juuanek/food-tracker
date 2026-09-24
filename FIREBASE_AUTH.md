# Logowanie e-mail / hasło

## 1. Włącz logowanie w Firebase

1. [Firebase Console](https://console.firebase.google.com/) → Twój projekt.
2. **Build → Authentication → Sign-in method**.
3. **Email/Password** → **Enable** → Save.
4. (Opcjonalnie) wyłącz **Email link** — zostaw tylko hasło.

## 2. Reguły Firestore (wymagane po wdrożeniu auth)

**Firestore Database → Rules** — zastąp reguły i **Publish**:

```text
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /clients/{docId} {
      // Konto użytkownika: clients/{uid}
      allow read, write: if request.auth != null && request.auth.uid == docId;

      // Stary dokument urządzenia (inne docId niż uid)
      // resource == null → getDoc gdy dokumentu jeszcze nie ma (bez permission denied)
      allow get: if request.auth != null
        && request.auth.uid != docId
        && (
          resource == null
          || !('claimedBy' in resource.data)
          || resource.data.claimedBy == null
          || resource.data.claimedBy == request.auth.uid
        );
      allow update: if request.auth != null
        && request.auth.uid != docId
        && resource != null
        && (!('claimedBy' in resource.data) || resource.data.claimedBy == null)
        && request.resource.data.claimedBy == request.auth.uid
        && request.resource.data.diff(resource.data).affectedKeys().hasOnly(['claimedBy']);
    }
  }
}
```

### Nadal „Missing or insufficient permissions”?

1. **Publish** — po edycji Rules kliknij **Publish** (nie tylko zapisz w edytorze).
2. Upewnij się, że edytujesz **Firestore Database → Rules**, nie Realtime Database.
3. W **Authentication → Users** powinien być Twój użytkownik po rejestracji.
4. W konsoli przeglądarki (F12 → Network lub Console) sprawdź, czy błąd jest przy `clients/{uid}` czy przy innym ID.

Stare reguły `allow read, write: if true` **usuń** — inni mogliby czytać wszystkie dane.

## 3. Jak to działa w aplikacji

- Po zalogowaniu dane są w `clients/{twój-uid}` — ten sam `uid` na komputerze i telefonie.
- Przy **pierwszym logowaniu na urządzeniu** aplikacja scala dokument `clients/{stare-id-urządzenia}` z kontem (pole `claimedBy`).
- Zaloguj się **na komputerze i na telefonie tym samym e-mailem** — zobaczysz te same wpisy.

## 4. Scalanie dwóch starych „koszyków” (dwa client ID)

Masz już dane w dwóch dokumentach urządzeń:

1. **Załóż konto** na komputerze (np. główny e-mail) — scalenie z dokumentem komputera.
2. Na **telefonie** zaloguj się **tym samym** e-mailem — scalenie z dokumentem telefonu do tego samego `uid`.
3. Jeśli coś zostało w backupie JSON: `migrate-local.html` + plik z drugiego urządzenia.

## 5. Reset hasła

Na ekranie logowania: **Zapomniałem hasła** (Firebase wysyła mail).

## 6. Deploy

Po `git push` GitHub Pages buduje się jak wcześniej — auth działa na `juuanek.github.io` (domena już w Authorized domains).

## 7. Bezpieczeństwo

- Hasła trzyma Firebase, nie Twoja aplikacja.
- Każdy użytkownik widzi tylko `clients/{własny-uid}`.
- Stare dokumenty urządzeń można tylko **odebrać** (`claimedBy`), nie nadpisać cudzych danych po przejęciu.
