// Food Tracker App
class FoodTracker {
    constructor() {
        this.entries = this.loadEntries();
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.updateCurrentDate();
        this.setDefaultDateTime();
        this.updateTodayView();
    }

    // Local Storage
    loadEntries() {
        const data = localStorage.getItem('foodEntries');
        return data ? JSON.parse(data) : [];
    }

    saveEntries() {
        localStorage.setItem('foodEntries', JSON.stringify(this.entries));
    }

    // Event Listeners
    setupEventListeners() {
        // Tab navigation
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', () => this.switchTab(btn.dataset.tab));
        });

        // Form submission
        document.getElementById('foodForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.addEntry();
        });

        // History days range
        document.getElementById('daysRange').addEventListener('change', () => {
            this.updateHistoryView();
        });

        // Export buttons
        document.getElementById('exportTodayBtn').addEventListener('click', () => this.exportToday());
        document.getElementById('exportWeekBtn').addEventListener('click', () => this.exportWeek());
        document.getElementById('exportMonthBtn').addEventListener('click', () => this.exportMonth());
        document.getElementById('exportCustomBtn').addEventListener('click', () => this.exportCustom());

        // Set default export dates
        const today = new Date().toISOString().split('T')[0];
        const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        document.getElementById('exportFrom').value = weekAgo;
        document.getElementById('exportTo').value = today;
    }

    switchTab(tabName) {
        // Update tab buttons
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.tab === tabName);
        });

        // Update tab content
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.remove('active');
        });
        document.getElementById(`${tabName}-tab`).classList.add('active');

        // Update content when switching to certain tabs
        if (tabName === 'today') {
            this.updateTodayView();
        } else if (tabName === 'history') {
            this.updateHistoryView();
        }
    }

    updateCurrentDate() {
        const now = new Date();
        const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        document.getElementById('currentDate').textContent = now.toLocaleDateString('en-US', options);
    }

    setDefaultDateTime() {
        const now = new Date();
        const offset = now.getTimezoneOffset();
        const localTime = new Date(now.getTime() - offset * 60 * 1000);
        document.getElementById('time').value = localTime.toISOString().slice(0, 16);
    }

    // Add Entry
    addEntry() {
        const entry = {
            id: Date.now(),
            foodName: document.getElementById('foodName').value,
            mealType: document.getElementById('mealType').value,
            calories: document.getElementById('calories').value || null,
            size: document.getElementById('size').value || null,
            time: document.getElementById('time').value,
            comments: document.getElementById('comments').value || null,
            createdAt: new Date().toISOString()
        };

        this.entries.push(entry);
        this.saveEntries();
        this.showToast('✅ Entry added successfully!');
        this.resetForm();
        this.updateTodayView();
    }

    resetForm() {
        document.getElementById('foodForm').reset();
        this.setDefaultDateTime();
    }

    deleteEntry(id) {
        if (confirm('Are you sure you want to delete this entry?')) {
            this.entries = this.entries.filter(entry => entry.id !== id);
            this.saveEntries();
            this.showToast('🗑️ Entry deleted');
            this.updateTodayView();
            this.updateHistoryView();
        }
    }

    // Today View
    updateTodayView() {
        const today = new Date().toISOString().split('T')[0];
        const todayEntries = this.entries.filter(entry => 
            entry.time.startsWith(today)
        );

        this.displayStats(todayEntries, 'todayStats');
        this.displayEntries(todayEntries, 'todayEntries');
    }

    displayStats(entries, containerId) {
        const container = document.getElementById(containerId);
        const totalCalories = entries.reduce((sum, e) => sum + (parseInt(e.calories) || 0), 0);
        const totalSize = entries.reduce((sum, e) => sum + (parseInt(e.size) || 0), 0);

        const mealCounts = entries.reduce((acc, e) => {
            acc[e.mealType] = (acc[e.mealType] || 0) + 1;
            return acc;
        }, {});

        container.innerHTML = `
            <h2>Today's Summary</h2>
            <div class="stats-grid">
                <div class="stat-item">
                    <div class="stat-value">${entries.length}</div>
                    <div class="stat-label">Total Entries</div>
                </div>
                <div class="stat-item">
                    <div class="stat-value">${totalCalories || '—'}</div>
                    <div class="stat-label">Total Calories</div>
                </div>
                <div class="stat-item">
                    <div class="stat-value">${totalSize || '—'} g</div>
                    <div class="stat-label">Total Weight</div>
                </div>
                <div class="stat-item">
                    <div class="stat-value">${Object.keys(mealCounts).length}</div>
                    <div class="stat-label">Meal Types</div>
                </div>
            </div>
        `;
    }

    displayEntries(entries, containerId) {
        const container = document.getElementById(containerId);

        if (entries.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">🍽️</div>
                    <div class="empty-state-text">No entries for today yet. Start tracking your meals!</div>
                </div>
            `;
            return;
        }

        // Sort by time (newest first)
        const sortedEntries = [...entries].sort((a, b) => 
            new Date(b.time) - new Date(a.time)
        );

        container.innerHTML = sortedEntries.map(entry => this.createEntryCard(entry)).join('');
    }

    createEntryCard(entry) {
        const time = new Date(entry.time);
        const timeStr = time.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

        return `
            <div class="entry-card">
                <div class="entry-header">
                    <div class="entry-title">${entry.foodName}</div>
                    <div class="meal-badge">${entry.mealType}</div>
                </div>
                <div class="entry-time">⏰ ${timeStr}</div>
                <div class="entry-details">
                    <div class="detail-item">
                        <div class="detail-label">Calories</div>
                        <div class="detail-value">${entry.calories || '—'}</div>
                    </div>
                    <div class="detail-item">
                        <div class="detail-label">Size</div>
                        <div class="detail-value">${entry.size ? entry.size + ' g' : '—'}</div>
                    </div>
                </div>
                ${entry.comments ? `<div class="entry-comments">💬 ${entry.comments}</div>` : ''}
                <div class="entry-actions">
                    <button class="btn-danger" onclick="app.deleteEntry(${entry.id})">Delete</button>
                </div>
            </div>
        `;
    }

    // History View
    updateHistoryView() {
        const days = parseInt(document.getElementById('daysRange').value);
        const cutoffDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
        
        const recentEntries = this.entries.filter(entry => 
            new Date(entry.time) >= cutoffDate
        );

        this.displayHistory(recentEntries);
    }

    displayHistory(entries) {
        const container = document.getElementById('historyContent');

        if (entries.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">📊</div>
                    <div class="empty-state-text">No entries found for this period.</div>
                </div>
            `;
            return;
        }

        // Group by date
        const groupedByDate = entries.reduce((acc, entry) => {
            const date = entry.time.split('T')[0];
            if (!acc[date]) acc[date] = [];
            acc[date].push(entry);
            return acc;
        }, {});

        // Sort dates (newest first)
        const sortedDates = Object.keys(groupedByDate).sort((a, b) => b.localeCompare(a));

        container.innerHTML = sortedDates.map(date => {
            const dayEntries = groupedByDate[date];
            const totalCalories = dayEntries.reduce((sum, e) => sum + (parseInt(e.calories) || 0), 0);
            const dateObj = new Date(date + 'T00:00:00');
            const dateStr = dateObj.toLocaleDateString('en-US', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
            });

            return `
                <div class="day-group">
                    <div class="day-header">
                        ${dateStr} 
                        <span style="font-weight: normal; font-size: 14px; color: #666;">
                            (${dayEntries.length} entries, ${totalCalories} cal)
                        </span>
                    </div>
                    ${dayEntries.map(entry => this.createEntryCard(entry)).join('')}
                </div>
            `;
        }).join('');
    }

    // Export Functions
    exportToday() {
        const today = new Date().toISOString().split('T')[0];
        const entries = this.entries.filter(e => e.time.startsWith(today));
        this.generateExport(entries, 'Today');
    }

    exportWeek() {
        const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        const entries = this.entries.filter(e => new Date(e.time) >= weekAgo);
        this.generateExport(entries, 'This Week');
    }

    exportMonth() {
        const monthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        const entries = this.entries.filter(e => new Date(e.time) >= monthAgo);
        this.generateExport(entries, 'This Month (30 days)');
    }

    exportCustom() {
        const fromDate = document.getElementById('exportFrom').value;
        const toDate = document.getElementById('exportTo').value;

        if (!fromDate || !toDate) {
            this.showToast('❌ Please select both dates');
            return;
        }

        const entries = this.entries.filter(e => {
            const entryDate = e.time.split('T')[0];
            return entryDate >= fromDate && entryDate <= toDate;
        });

        this.generateExport(entries, `${fromDate} to ${toDate}`);
    }

    generateExport(entries, period) {
        if (entries.length === 0) {
            this.showToast('❌ No entries found for this period');
            return;
        }

        // Sort by date and time
        const sortedEntries = [...entries].sort((a, b) => 
            new Date(a.time) - new Date(b.time)
        );

        // Generate AI-friendly text format
        let exportText = `FOOD TRACKING DATA - ${period}\n`;
        exportText += `Generated: ${new Date().toLocaleString()}\n`;
        exportText += `Total Entries: ${entries.length}\n`;
        exportText += `\n${'='.repeat(60)}\n\n`;

        // Group by date
        const groupedByDate = sortedEntries.reduce((acc, entry) => {
            const date = entry.time.split('T')[0];
            if (!acc[date]) acc[date] = [];
            acc[date].push(entry);
            return acc;
        }, {});

        Object.keys(groupedByDate).sort().forEach(date => {
            const dateObj = new Date(date + 'T00:00:00');
            const dateStr = dateObj.toLocaleDateString('en-US', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
            });

            exportText += `DATE: ${dateStr}\n`;
            exportText += `${'-'.repeat(60)}\n\n`;

            groupedByDate[date].forEach((entry, index) => {
                const time = new Date(entry.time).toLocaleTimeString('en-US', { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                });

                exportText += `${index + 1}. ${entry.foodName}\n`;
                exportText += `   Meal Type: ${entry.mealType}\n`;
                exportText += `   Time: ${time}\n`;
                if (entry.calories) exportText += `   Calories: ${entry.calories} kcal\n`;
                if (entry.size) exportText += `   Size: ${entry.size} grams\n`;
                if (entry.comments) exportText += `   Comments: ${entry.comments}\n`;
                exportText += `\n`;
            });

            // Daily summary
            const dayCalories = groupedByDate[date].reduce((sum, e) => sum + (parseInt(e.calories) || 0), 0);
            const daySize = groupedByDate[date].reduce((sum, e) => sum + (parseInt(e.size) || 0), 0);
            exportText += `   Daily Total: ${groupedByDate[date].length} entries`;
            if (dayCalories > 0) exportText += `, ${dayCalories} calories`;
            if (daySize > 0) exportText += `, ${daySize} grams`;
            exportText += `\n\n${'='.repeat(60)}\n\n`;
        });

        // Overall summary
        const totalCalories = sortedEntries.reduce((sum, e) => sum + (parseInt(e.calories) || 0), 0);
        const totalSize = sortedEntries.reduce((sum, e) => sum + (parseInt(e.size) || 0), 0);
        exportText += `OVERALL SUMMARY:\n`;
        exportText += `- Total entries: ${entries.length}\n`;
        exportText += `- Total calories: ${totalCalories} kcal\n`;
        exportText += `- Total weight: ${totalSize} grams\n`;
        exportText += `- Period: ${period}\n`;

        this.displayExport(exportText);
    }

    displayExport(text) {
        const output = document.getElementById('exportOutput');
        output.innerHTML = `
            <h3>Export Ready</h3>
            <p>Copy the text below and paste it into ChatGPT for nutrition analysis:</p>
            <div class="export-text">${text}</div>
            <button class="copy-btn" onclick="app.copyToClipboard()">📋 Copy to Clipboard</button>
        `;
        output.classList.add('show');
        this.exportData = text;
    }

    copyToClipboard() {
        navigator.clipboard.writeText(this.exportData).then(() => {
            this.showToast('✅ Copied to clipboard!');
        }).catch(() => {
            this.showToast('❌ Failed to copy');
        });
    }

    // Toast Notification
    showToast(message) {
        const toast = document.getElementById('toast');
        toast.textContent = message;
        toast.classList.add('show');

        setTimeout(() => {
            toast.classList.remove('show');
        }, 3000);
    }
}

// Initialize app
const app = new FoodTracker();

