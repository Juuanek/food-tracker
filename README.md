# Food Tracker

Mobile-first web app for logging meals, viewing history, and exporting nutrition summaries for AI analysis.

## Features

- Profile with estimated daily calories (DCR)
- Add, edit, and delete food entries
- Today view and monthly calendar
- Export formatted text for ChatGPT / Claude
- JSON backup and restore
- Sign in to sync data across devices

## Use the app

Open the published site from GitHub Pages (see the **Deployments** / **Pages** section of this repository), or run locally:

```bash
npx serve .
```

Use the served `http://` URL, not `file://`.

## For developers

Copy `firebase-config.example.js` to `firebase-config.js` and add your Firebase web app config. That file is gitignored.

Deployment uses GitHub Actions; Firebase credentials are supplied as repository secrets, not committed to git.

## Tech

HTML, CSS, and vanilla JavaScript. Firestore for cloud storage. Firebase Authentication (email/password).
