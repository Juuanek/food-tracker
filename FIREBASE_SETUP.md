# Firebase — konfiguracja krok po kroku (Food Tracker)

Aplikacja zapisuje dane w **Cloud Firestore** (darmowy plan Spark). Motyw (jasny/ciemny) nadal jest w `localStorage` na urządzeniu.

## Co musisz mieć

- Konto Google
- Przeglądarka + lokalny serwer HTTP (moduły ES nie działają poprawnie z `file://`)

---

## Krok 1: Projekt w Firebase

1. Wejdź na [Firebase Console](https://console.firebase.google.com/).
2. **Add project** / **Utwórz projekt** → nazwa np. `food-tracker`.
3. Wyłącz Google Analytics (opcjonalnie, na start nie jest potrzebne) → **Create project**.

---

## Krok 2: Aplikacja webowa i klucze

1. Na stronie projektu kliknij ikonę **Web** (`</>`).
2. Nick aplikacji np. `food-tracker-web` → **Register app**.
3. Skopiuj obiekt `firebaseConfig` (apiKey, authDomain, projectId, …).
4. W folderze projektu:
   - skopiuj `firebase-config.example.js` → `firebase-config.js` (jeśli jeszcze nie masz),
   - wklej swoje wartości z konsoli.

Plik `firebase-config.js` jest w `.gitignore` — nie trafi do gita.

---

## Krok 3: Firestore Database

1. W menu: **Build** → **Firestore Database**.
2. **Create database**.
3. Lokalizacja: wybierz najbliższą (np. `europe-west3` dla Polski).
4. Na start: **Start in test mode** (reguły na 30 dni otwarte — za chwilę je zmienimy).

---

## Krok 4: Reguły bezpieczeństwa (ważne)

Bez logowania każde urządzenie ma losowy **Cloud ID** w `localStorage`. To **nie jest** pełne bezpieczeństwo — kto zna ID, może teoretycznie odczytać dokument. Na produkcję z wieloma klientami dodamy **Firebase Authentication** w kolejnej iteracji.

Na teraz ustaw reguły tak, aby aplikacja mogła zapisywać dane (w **Firestore** → **Rules**):

```text
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /clients/{clientId} {
      allow read, write: if true;
    }
  }
}
```

Kliknij **Publish** (bez tego reguły się nie zapisują).

Sprawdź w edytorze reguł, że **nie** masz domyślnego:

```text
allow read, write: if false;
```

dla całej bazy — wtedy zobaczysz w aplikacji: `Missing or insufficient permissions`.

> **Uwaga:** `if true` jest tylko na czas developmentu / jednego użytkownika. Po dodaniu logowania reguły zmienimy na `request.auth != null && request.auth.uid == clientId`.

### Błąd: „Missing or insufficient permissions”

1. Wejdź w [Firebase Console](https://console.firebase.google.com/) → **ten sam projekt** co `projectId` w `firebase-config.js`.
2. **Build → Firestore Database** (nie „Realtime Database”).
3. Zakładka **Rules** → wklej reguły z Kroku 4 → **Publish**.
4. Odczekaj kilka sekund i odśwież aplikację (Cmd+Shift+R).
5. Jeśli przy tworzeniu bazy wybrałeś **production mode** zamiast test mode — reguły z Kroku 4 są **konieczne** (test mode też w końcu wygasa).

---

## Krok 5: Struktura danych w Firestore

Jeden dokument na „klienta” (na razie = jedno urządzenie):

```text
clients / {uuid-z-localStorage}
  ├── entries: [ ... wpisy jedzenia ... ]
  ├── profile: { age, gender, ... }
  ├── calorieOverrides: { "2025-09-24": 2100 }
  ├── dailyActivity: { "2025-09-24": { type, difficulty } }
  └── updatedAt: timestamp
```

Cloud ID zobaczysz w zakładce **⚙️ Backup**.

---

## Krok 6: Uruchomienie lokalnie

Z katalogu projektu:

```bash
npx --yes serve .
```

Otwórz adres z terminala (zwykle `http://localhost:3000`).

**Pierwsze uruchomienie:** jeśli w przeglądarce były już dane w `localStorage`, aplikacja **jednorazowo** skopiuje je do Firestore.

---

## Krok 7: Sprawdzenie

1. Dodaj wpis jedzenia w aplikacji.
2. W Firebase Console → **Firestore** → kolekcja `clients` → powinien pojawić się dokument z Twoim ID.
3. Odśwież stronę — dane powinny wrócić z chmury.

---

## Hosting (opcjonalnie, dalej darmowo)

1. Zainstaluj CLI: `npm install -g firebase-tools`
2. `firebase login`
3. W katalogu projektu: `firebase init hosting` → wybierz projekt, katalog publiczny: `.` (lub skopiuj pliki do `public/`)
4. `firebase deploy`

Dodaj domenę w **Authentication** → **Settings** → **Authorized domains** jeśli używasz Auth później.

---

## Limity darmowego planu (orientacyjnie)

Firestore Spark: dziesiątki tysięcy odczytów/zapisów dziennie — dla osobistego trackera jedzenia to zwykle wystarcza. Monitoruj **Usage** w konsoli.

---

## Następna iteracja: logowanie

Plan:

1. Włączyć **Email/Password** lub **Google Sign-In** w Authentication.
2. Zamiast losowego UUID używać `user.uid` jako `clients/{uid}`.
3. Zaktualizować reguły Firestore pod `request.auth.uid`.

Kod jest przygotowany pod zamianę ID urządzenia na UID użytkownika w jednym miejscu (`firebase-store.js` → `getClientId()`).
