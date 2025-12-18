# 🍽️ Food Tracker App

A simple, mobile-first web application for tracking your daily food intake with easy export to AI models like ChatGPT for nutrition analysis.

## Features

✅ **Add Food Entries**
- Track what you eat with detailed information
- Record meal type, calories, portion size, time, and notes
- Simple form interface optimized for mobile

✅ **Daily Summary**
- View today's entries at a glance
- See total calories, weight, and number of entries
- Quick overview of your daily nutrition

✅ **30-Day History**
- Browse your food history (7, 30, 60, or 90 days)
- Grouped by date for easy navigation
- Daily summaries for each day

✅ **AI-Ready Export**
- Export data in a format optimized for ChatGPT analysis
- Choose predefined periods (today, week, month) or custom date range
- One-click copy to clipboard

✅ **Persistent Storage**
- All data stored locally in your browser (localStorage)
- Data persists after phone restarts and app refreshes
- No backend required, completely private

## Usage

### Installation

1. No installation needed! Just open `index.html` in your mobile browser
2. For the best experience, add it to your home screen:
   - **iOS**: Safari → Share → Add to Home Screen
   - **Android**: Chrome → Menu → Add to Home Screen

### Adding Food

1. Open the app and you'll see the "Add Food" tab
2. Fill in the form:
   - **What did you eat?** (required) - e.g., "Grilled chicken breast"
   - **Meal Type** (required) - Breakfast, Lunch, Dinner, or Snack
   - **Calories** (optional) - if you know them
   - **Size/grams** (optional) - portion size
   - **When?** (required) - date and time (defaults to now)
   - **Comments** (optional) - any additional notes
3. Tap "Add Entry"

### Viewing Your Data

- **Today Tab**: See all entries for today with summary statistics
- **History Tab**: Browse past entries, select how many days to show
- Each entry shows all details and can be deleted if needed

### Exporting for AI Analysis

1. Go to the "Export" tab
2. Choose a time period:
   - Export Today
   - Export This Week (last 7 days)
   - Export This Month (last 30 days)
   - Export Custom Range (choose your own dates)
3. Copy the generated text
4. Paste into ChatGPT with a prompt like:
   ```
   Please analyze my nutrition for this period. Calculate total calories, 
   macros if possible, and provide suggestions for improvement.
   ```

## Technical Details

- **Pure Frontend**: HTML, CSS, JavaScript (no framework needed)
- **Storage**: localStorage (survives restarts, ~5-10MB limit)
- **Mobile-First**: Responsive design optimized for phones
- **No Backend**: Everything runs in your browser
- **Privacy**: All data stays on your device

## Data Storage

Your data is stored in your browser's localStorage:
- Storage key: `foodEntries`
- Format: JSON array
- Capacity: Thousands of entries (localStorage typically allows 5-10MB)
- Persistence: Survives device restarts, app closes, etc.
- Note: Clearing browser data will delete all entries

## Browser Compatibility

Works on all modern browsers:
- Safari (iOS)
- Chrome (Android/iOS)
- Firefox
- Edge

## Sample Export Format

The export is formatted to be easily understood by AI models:

```
FOOD TRACKING DATA - This Week
Generated: 12/18/2024, 10:30:00 AM
Total Entries: 15

============================================================

DATE: Monday, December 16, 2024
------------------------------------------------------------

1. Scrambled eggs with toast
   Meal Type: Breakfast
   Time: 08:00 AM
   Calories: 350 kcal
   Size: 200 grams
   Comments: Added some cheese

2. Chicken salad
   Meal Type: Lunch
   Time: 01:00 PM
   Calories: 450 kcal
   Size: 350 grams

   Daily Total: 2 entries, 800 calories, 550 grams

============================================================
```

## Future Enhancements (Optional)

- Photo upload support
- Favorite foods for quick entry
- Meal templates
- Nutrition goals tracking
- Weekly/monthly charts
- Export to CSV
- Dark mode

## Support

This app runs entirely in your browser with no server or account needed. Your data is private and never leaves your device.

Enjoy tracking your nutrition! 🥗

