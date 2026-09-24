# 🍽️ Food Tracker App

A simple, mobile-first web application for tracking your daily food intake with AI-powered nutrition analysis support.

## Features

### 👤 **Profile**
- Set up your personal information (age, gender, height, weight, activity level, goals)
- Automatic Daily Caloric Requirement (DCR) calculation
- Or enter your own DCR if known

### 🍴 **Add Food Entries**
- Track meals and beverages with detailed information
- Record meal type (Breakfast, Lunch, Dinner, Snack, Beverage)
- Log calories, portion size, time, and notes
- Edit or delete entries anytime

### 📊 **Today View**
- Daily summary with total calories and stats
- Compare calories vs your DCR
- View all today's meals

### 📅 **Calendar History**
- Visual monthly calendar view (Mon-Sun)
- Color-coded days based on nutrition goals:
  - 🟢 Green: Within DCR target
  - 🟡 Yellow: Slightly off target
  - 🔴 Red: Significantly off target
- Click any day to see detailed meal entries
- Navigate between months

### 🤖 **Message for AI**
- Export formatted nutrition data for AI analysis (ChatGPT, Claude, etc.)
- Includes your profile for personalized recommendations
- Choose today, this week, this month, or custom date range
- AI instructions included for optimal analysis
- One-click copy to clipboard

### ⚙️ **Backup & Restore**
- Export all data to JSON file
- Import previous backups to restore data
- View current data statistics
- Keep your data safe from browser clearing

## Quick Start

1. Configure Firebase (`FIREBASE_SETUP.md`), then run a local server: `npx serve .`
2. Open the URL shown in the terminal (not `file://`)
3. Set up your profile (recommended for better AI analysis)
4. Start adding food entries
5. View your progress in Today or Calendar view
6. Export data to get AI nutrition insights

**For mobile:** Add to home screen for app-like experience
- **iOS**: Safari → Share → Add to Home Screen
- **Android**: Chrome → Menu → Add to Home Screen

## Data Storage

- **Storage**: Google Cloud Firestore (Firebase free tier)
- **Device ID**: Each browser gets a random Cloud ID (shown in Backup tab) until login is added
- **Theme**: Still stored locally in the browser
- **Backup**: Export/import JSON still works and syncs to the cloud after import

**Setup**: See [FIREBASE_SETUP.md](./FIREBASE_SETUP.md) (Polish, step-by-step).

**Important**: Create regular backups (weekly recommended) via the Backup & Restore tab.

## AI Analysis Tips

1. Export your data for a meaningful period (at least a week)
2. Copy the generated message
3. Paste into ChatGPT/Claude with a prompt like:
   ```
   Analyze my nutrition based on this data. What's good, what needs improvement?
   ```
4. The AI will use your profile and DCR to provide personalized advice

## Technical

- Pure HTML/CSS/JavaScript (no framework)
- Mobile-first responsive design
- Requires internet for saving/loading (Firestore)
- All modern browsers supported

## Tips

- ✅ Fill in your profile for accurate DCR calculation
- ✅ Log meals in your native language (AI handles it)
- ✅ Export backups weekly to prevent data loss
- ✅ Use the calendar to spot eating patterns
- ✅ Edit entries if you make mistakes

Enjoy tracking your nutrition! 🥗
