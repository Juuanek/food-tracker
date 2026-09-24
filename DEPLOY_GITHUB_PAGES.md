# GitHub Pages + Firebase (bez configu w repozytorium)

Aplikacja jest statyczna. **Klucze Firebase i tak są widoczne w przeglądarce** na każdej stronie (to normalne dla apps webowych) — chodzi o to, że **nie trafiają do Gita** i nie wylądują w historii commitów. Ochronę danych dają reguły Firestore (a później logowanie).

Adres po wdrożeniu: `https://juuanek.github.io/food-tracker/` (dostosuj, jeśli repo ma inną nazwę).

---

## Część A — jednorazowa migracja starych wpisów (localStorage)

Jeśli w Firestore masz już np. jeden testowy posiłek, a stare wpisy nadal siedzą w `localStorage`, zrób **przed** lub **po** deployu:

### Sposób 1: automat przy starcie (najprostszy)

1. Upewnij się, że w tej samej przeglądarce nadal są stare dane (`localStorage`).
2. Jeśli wcześniej uruchomiłeś migrację tylko częściowo, w konsoli (F12) wykonaj:
   ```js
   localStorage.removeItem('foodTrackerLegacyMerged');
   ```
3. Odśwież główną aplikację (`index.html`) — przy starcie **scali** localStorage z Firestore (po ID, bez duplikatów).

### Sposób 2: strona migracji (podgląd + backup JSON)

1. `npx serve .` → otwórz `http://localhost:3000/migrate-local.html` (**ten sam host** co aplikacja).
2. **Podgląd scalenia** — zobaczysz liczby LOCAL / REMOTE / MERGED.
3. **Scal i zapisz w Firestore**.
4. Odśwież `index.html`.

Opcjonalnie wybierz plik **backup JSON** zamiast localStorage.

---

## Część B — GitHub Pages (krok po kroku)

### 1. Sekret w GitHubie (config Firebase)

1. Firebase Console → ikona Web → skopiuj obiekt `firebaseConfig`.
2. Wklej jako **jedną linię** — albo poprawny **JSON** (klucze w cudzysłowach), albo obiekt z Firebase (`apiKey: "..."`):
   ```json
   {"apiKey":"AIza...","authDomain":"food-tracker-xx.firebaseapp.com","projectId":"food-tracker-xx","storageBucket":"food-tracker-xx.firebasestorage.app","messagingSenderId":"123","appId":"1:123:web:abc"}
   ```
   **Nie działa:** `{apiKey: "..."}` w GitHubie bez poprawki skryptu — po aktualizacji `write-firebase-config.js` oba formaty są OK. Najpewniejszy nadal jest JSON jak wyżej.
3. GitHub → repozytorium **food-tracker** → **Settings** → **Secrets and variables** → **Actions** → **New repository secret**.
4. Nazwa: `FIREBASE_CONFIG_JSON`  
   Wartość: wklej cały JSON (jedna linia).

### 2. Włącz GitHub Pages

1. **Settings** → **Pages**.
2. **Build and deployment** → Source: **GitHub Actions** (nie „Deploy from branch”).

### 3. Wypchnij kod na `main`

Workflow `.github/workflows/deploy-pages.yml` przy pushu:

- buduje folder `_site/` (bez Twojego lokalnego `firebase-config.js`),
- generuje `firebase-config.js` tylko w artefakcie z sekretu,
- publikuje na Pages.

```bash
git add .
git commit -m "Add GitHub Pages deploy and data migration tools"
git push origin main
```

### 4. Sprawdź deploy

1. **Actions** → workflow **Deploy GitHub Pages** → zielony check.
2. Otwórz `https://juuanek.github.io/food-tracker/`.
3. Dodaj posiłek → w Firestore powinien być ten sam projekt.

### 5. Firebase — domena GitHub Pages

1. Firebase Console → **Build** → **Authentication** → **Settings** → **Authorized domains** (jeśli Auth nie włączone, i tak warto dodać dla przyszłości).
2. Dodaj: `juuanek.github.io`.

### 6. (Zalecane) Ograniczenie klucza API

1. [Google Cloud Console](https://console.cloud.google.com/) → ten sam projekt co Firebase.
2. **APIs & Services** → **Credentials** → klucz API używany przez Firebase.
3. **Application restrictions** → **HTTP referrers**:
   - `http://localhost:*/*`
   - `https://juuanek.github.io/*`
4. **API restrictions** → tylko **Cloud Firestore API** (i ewentualnie inne, których używasz).

---

## Lokalny test buildu (jak na CI)

```bash
export FIREBASE_CONFIG_JSON='{"apiKey":"...","authDomain":"...","projectId":"...","storageBucket":"...","messagingSenderId":"...","appId":"..."}'
bash scripts/prepare-site.sh
npx serve _site
```

---

## Rozwiązywanie problemów

| Problem | Co zrobić |
|--------|-----------|
| Actions: brak `FIREBASE_CONFIG_JSON` | Dodaj sekret w GitHub |
| Pusta strona / 404 | URL musi zawierać nazwę repo: `/food-tracker/` |
| `permissions` na Pages | Reguły Firestore jak w `FIREBASE_SETUP.md` |
| Nowe urządzenie, stare dane tylko w backupie | `migrate-local.html` + plik JSON |
| Inny Cloud ID na telefonie | Na razie osobny dokument w `clients/`; po logowaniu — jeden `uid` |

---

## Co jest w Gicie, a czego nie

| W repozytorium | Nie w repozytorium |
|----------------|-------------------|
| `firebase-config.example.js` | `firebase-config.js` (lokalnie u Ciebie) |
| workflow + `scripts/` | prawdziwy JSON config (tylko sekret GH) |
| kod aplikacji | `_site/` (generowany w CI) |

Po deployu plik `firebase-config.js` **jest** na żywej stronie (DevTools → Network) — to nieuniknione; bezpieczeństwo = reguły Firestore + ewentualnie restrykcje referrera klucza.
