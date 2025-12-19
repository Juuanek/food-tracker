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

1. Open `index.html` in your browser
2. Set up your profile (recommended for better AI analysis)
3. Start adding food entries
4. View your progress in Today or Calendar view
5. Export data to get AI nutrition insights

**For mobile:** Add to home screen for app-like experience
- **iOS**: Safari → Share → Add to Home Screen
- **Android**: Chrome → Menu → Add to Home Screen

## Data Storage

- **Storage**: Browser localStorage (private, stays on your device)
- **Persistence**: Data survives restarts and app closes
- **Backup**: Export/import feature protects against data loss
- **Privacy**: No server, no tracking, completely offline

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
- Works offline
- All modern browsers supported

## Tips

- ✅ Fill in your profile for accurate DCR calculation
- ✅ Log meals in your native language (AI handles it)
- ✅ Export backups weekly to prevent data loss
- ✅ Use the calendar to spot eating patterns
- ✅ Edit entries if you make mistakes

Enjoy tracking your nutrition! 🥗
