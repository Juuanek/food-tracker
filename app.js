// Food Tracker App
class FoodTracker {
    constructor() {
        this.entries = this.loadEntries();
        this.profile = this.loadProfile();
        this.editingId = null; // Track which entry is being edited
        this.currentCalendarDate = new Date(); // Track current calendar month
        this.init();
    }

    init() {
        this.initTheme();
        this.setupEventListeners();
        this.updateCurrentDate();
        this.setDefaultDateTime();
        this.loadProfileForm();
        this.updateTodayView();
        
        // Prevent scroll restoration on mobile
        if ('scrollRestoration' in history) {
            history.scrollRestoration = 'manual';
        }
    }

    // Local Storage
    loadEntries() {
        const data = localStorage.getItem('foodEntries');
        return data ? JSON.parse(data) : [];
    }

    saveEntries() {
        localStorage.setItem('foodEntries', JSON.stringify(this.entries));
    }

    loadProfile() {
        const data = localStorage.getItem('userProfile');
        return data ? JSON.parse(data) : null;
    }

    saveProfile() {
        localStorage.setItem('userProfile', JSON.stringify(this.profile));
    }

    // Theme Management
    initTheme() {
        const savedTheme = localStorage.getItem('theme');
        const themeToggle = document.getElementById('themeToggle');
        
        // Default to dark mode if no preference saved
        if (savedTheme === null) {
            document.body.classList.add('dark-mode');
            themeToggle.checked = true;
            this.updateThemeLabel(true);
        } else if (savedTheme === 'dark') {
            document.body.classList.add('dark-mode');
            themeToggle.checked = true;
            this.updateThemeLabel(true);
        } else {
            this.updateThemeLabel(false);
        }
    }

    toggleTheme() {
        const isDark = document.body.classList.toggle('dark-mode');
        localStorage.setItem('theme', isDark ? 'dark' : 'light');
        this.updateThemeLabel(isDark);
    }

    updateThemeLabel(isDark) {
        const label = document.getElementById('themeLabel');
        label.textContent = isDark ? '🌙 Dark' : '☀️ Light';
    }

    // Event Listeners
    setupEventListeners() {
        // Tab navigation
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', () => this.switchTab(btn.dataset.tab));
        });

        // Profile form submission
        document.getElementById('profileForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveProfileData();
        });

        // Auto-calculate DCR when relevant fields change
        ['userAge', 'userGender', 'userHeight', 'userWeight', 'activityLevel'].forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                element.addEventListener('change', () => this.updateCalculatedDCR());
            }
        });

        // Form submission
        document.getElementById('foodForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveEntry();
        });

        // Calendar navigation
        document.getElementById('prevMonth').addEventListener('click', () => this.previousMonth());
        document.getElementById('nextMonth').addEventListener('click', () => this.nextMonth());
        document.getElementById('todayBtn').addEventListener('click', () => this.goToToday());

        // Modal close
        document.getElementById('closeModal').addEventListener('click', () => this.closeModal());
        document.getElementById('dayModal').addEventListener('click', (e) => {
            if (e.target.id === 'dayModal') this.closeModal();
        });

        // Backup/Restore
        document.getElementById('exportBackupBtn').addEventListener('click', () => this.exportBackup());
        document.getElementById('importBackupFile').addEventListener('change', (e) => this.importBackup(e));

        // Theme toggle
        document.getElementById('themeToggle').addEventListener('change', () => this.toggleTheme());

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
            this.renderCalendar();
        } else if (tabName === 'profile') {
            this.loadProfileForm();
        } else if (tabName === 'backup') {
            this.updateBackupInfo();
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

    // Profile Management
    loadProfileForm() {
        if (!this.profile) return;

        document.getElementById('userAge').value = this.profile.age || '';
        document.getElementById('userGender').value = this.profile.gender || '';
        document.getElementById('userHeight').value = this.profile.height || '';
        document.getElementById('userWeight').value = this.profile.weight || '';
        document.getElementById('activityLevel').value = this.profile.activityLevel || '';
        document.getElementById('userGoal').value = this.profile.goal || '';
        document.getElementById('userDCR').value = this.profile.dcr || '';
        document.getElementById('healthConditions').value = this.profile.healthConditions || '';
        document.getElementById('additionalNotes').value = this.profile.additionalNotes || '';

        this.updateCalculatedDCR();
    }

    saveProfileData() {
        this.profile = {
            age: parseInt(document.getElementById('userAge').value),
            gender: document.getElementById('userGender').value,
            height: parseInt(document.getElementById('userHeight').value),
            weight: parseInt(document.getElementById('userWeight').value),
            activityLevel: document.getElementById('activityLevel').value,
            goal: document.getElementById('userGoal').value,
            dcr: document.getElementById('userDCR').value ? parseInt(document.getElementById('userDCR').value) : null,
            healthConditions: document.getElementById('healthConditions').value,
            additionalNotes: document.getElementById('additionalNotes').value,
            lastUpdated: new Date().toISOString()
        };

        this.saveProfile();
        this.showToast('✅ Profile saved successfully!');
        this.displayProfileSummary();
    }

    calculateBMR(age, gender, height, weight) {
        // Mifflin-St Jeor Equation
        if (gender === 'male') {
            return (10 * weight) + (6.25 * height) - (5 * age) + 5;
        } else if (gender === 'female') {
            return (10 * weight) + (6.25 * height) - (5 * age) - 161;
        } else {
            // Average for other
            return (10 * weight) + (6.25 * height) - (5 * age) - 78;
        }
    }

    calculateTDEE(bmr, activityLevel) {
        const multipliers = {
            sedentary: 1.2,
            light: 1.375,
            moderate: 1.55,
            active: 1.725,
            veryActive: 1.9
        };
        return Math.round(bmr * (multipliers[activityLevel] || 1.2));
    }

    updateCalculatedDCR() {
        const age = document.getElementById('userAge').value;
        const gender = document.getElementById('userGender').value;
        const height = document.getElementById('userHeight').value;
        const weight = document.getElementById('userWeight').value;
        const activityLevel = document.getElementById('activityLevel').value;

        if (age && gender && height && weight && activityLevel) {
            const bmr = this.calculateBMR(
                parseInt(age),
                gender,
                parseInt(height),
                parseInt(weight)
            );
            const tdee = this.calculateTDEE(bmr, activityLevel);
            
            document.getElementById('calculatedDCR').textContent = `(Calculated: ~${tdee} kcal/day)`;
            
            // Auto-fill DCR if empty
            const dcrInput = document.getElementById('userDCR');
            if (!dcrInput.value) {
                dcrInput.placeholder = `Auto-calculated: ${tdee} kcal/day`;
            }
        }
    }

    displayProfileSummary() {
        if (!this.profile) return;

        const summary = document.getElementById('profileSummary');
        const dcr = this.profile.dcr || this.calculateTDEE(
            this.calculateBMR(this.profile.age, this.profile.gender, this.profile.height, this.profile.weight),
            this.profile.activityLevel
        );

        summary.innerHTML = `
            <h3>Profile Summary</h3>
            <div class="summary-grid">
                <div><strong>Age:</strong> ${this.profile.age}</div>
                <div><strong>Gender:</strong> ${this.profile.gender}</div>
                <div><strong>Height:</strong> ${this.profile.height} cm</div>
                <div><strong>Weight:</strong> ${this.profile.weight} kg</div>
                <div><strong>Daily Caloric Requirement:</strong> ~${dcr} kcal</div>
                <div><strong>Goal:</strong> ${this.profile.goal}</div>
            </div>
        `;
        summary.style.display = 'block';
    }

    updateBackupInfo() {
        const infoDiv = document.getElementById('backupInfo');
        const entriesCount = this.entries.length;
        const hasProfile = this.profile ? 'Yes' : 'No';
        
        if (entriesCount > 0 || this.profile) {
            const oldestEntry = this.entries.length > 0 
                ? new Date(Math.min(...this.entries.map(e => new Date(e.time)))).toLocaleDateString()
                : 'N/A';
            const newestEntry = this.entries.length > 0
                ? new Date(Math.max(...this.entries.map(e => new Date(e.time)))).toLocaleDateString()
                : 'N/A';

            infoDiv.innerHTML = `
                <div class="backup-stats">
                    <h4>Current Data:</h4>
                    <div class="backup-stat">📊 Total Entries: <strong>${entriesCount}</strong></div>
                    <div class="backup-stat">👤 Profile Saved: <strong>${hasProfile}</strong></div>
                    ${entriesCount > 0 ? `
                        <div class="backup-stat">📅 Date Range: <strong>${oldestEntry} - ${newestEntry}</strong></div>
                    ` : ''}
                </div>
            `;
        } else {
            infoDiv.innerHTML = '<div class="backup-stats"><p>No data to backup yet.</p></div>';
        }
    }

    // Backup & Restore Functions
    exportBackup() {
        const backupData = {
            version: '1.0',
            exportDate: new Date().toISOString(),
            profile: this.profile,
            entries: this.entries,
            stats: {
                totalEntries: this.entries.length,
                hasProfile: !!this.profile
            }
        };

        const dataStr = JSON.stringify(backupData, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        
        const dateStr = new Date().toISOString().split('T')[0];
        link.download = `food-tracker-backup-${dateStr}.json`;
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        this.showToast('✅ Backup downloaded successfully!');
    }

    importBackup(event) {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const backupData = JSON.parse(e.target.result);

                // Validate backup data
                if (!backupData.version || !backupData.entries) {
                    throw new Error('Invalid backup file format');
                }

                // Ask for confirmation
                const confirmMsg = `This will restore:\n- ${backupData.entries.length} entries\n- Profile: ${backupData.profile ? 'Yes' : 'No'}\n\nCurrent data will be replaced. Continue?`;
                
                if (!confirm(confirmMsg)) {
                    event.target.value = ''; // Reset file input
                    return;
                }

                // Restore data
                this.entries = backupData.entries || [];
                this.profile = backupData.profile || null;

                // Save to localStorage
                this.saveEntries();
                this.saveProfile();

                // Update UI
                this.loadProfileForm();
                this.updateTodayView();
                this.renderCalendar();

                this.showToast('✅ Data restored successfully!');
                
                // Reset file input
                event.target.value = '';

            } catch (error) {
                console.error('Import error:', error);
                this.showToast('❌ Failed to import backup. Invalid file format.');
                event.target.value = '';
            }
        };

        reader.onerror = () => {
            this.showToast('❌ Failed to read backup file.');
            event.target.value = '';
        };

        reader.readAsText(file);
    }

    // Save Entry (Add or Update)
    saveEntry() {
        if (this.editingId !== null) {
            // Update existing entry
            const index = this.entries.findIndex(e => e.id === this.editingId);
            if (index !== -1) {
                this.entries[index] = {
                    ...this.entries[index],
                    foodName: document.getElementById('foodName').value,
                    mealType: document.getElementById('mealType').value,
                    calories: document.getElementById('calories').value || null,
                    size: document.getElementById('size').value || null,
                    time: document.getElementById('time').value,
                    comments: document.getElementById('comments').value || null,
                    updatedAt: new Date().toISOString()
                };
                this.saveEntries();
                this.showToast('✅ Entry updated successfully!');
            }
        } else {
            // Add new entry
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
        }
        
        this.cancelEdit();
        this.resetForm();
        this.updateTodayView();
        
        // Only re-render calendar if we're on the history tab
        const historyTab = document.getElementById('history-tab');
        if (historyTab && historyTab.classList.contains('active')) {
            const scrollPos = window.pageYOffset || document.documentElement.scrollTop;
            this.renderCalendar();
            setTimeout(() => {
                window.scrollTo(0, scrollPos);
            }, 0);
        }
    }

    editEntry(id) {
        const entry = this.entries.find(e => e.id === id);
        if (!entry) return;

        // Switch to Add Food tab
        this.switchTab('add');

        // Populate form with entry data
        document.getElementById('foodName').value = entry.foodName;
        document.getElementById('mealType').value = entry.mealType;
        document.getElementById('calories').value = entry.calories || '';
        document.getElementById('size').value = entry.size || '';
        document.getElementById('time').value = entry.time;
        document.getElementById('comments').value = entry.comments || '';

        // Set editing mode
        this.editingId = id;
        this.updateFormUI();

        // Scroll to top
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    cancelEdit() {
        this.editingId = null;
        this.updateFormUI();
    }

    updateFormUI() {
        const submitBtn = document.querySelector('#foodForm button[type="submit"]');
        const formTitle = document.querySelector('#add-tab h2');
        
        if (this.editingId !== null) {
            // Edit mode
            submitBtn.textContent = '✏️ Update Entry';
            submitBtn.className = 'btn btn-warning';
            
            // Add cancel button if it doesn't exist
            if (!document.getElementById('cancelEditBtn')) {
                const cancelBtn = document.createElement('button');
                cancelBtn.id = 'cancelEditBtn';
                cancelBtn.type = 'button';
                cancelBtn.className = 'btn btn-secondary';
                cancelBtn.textContent = 'Cancel';
                cancelBtn.style.marginLeft = '10px';
                cancelBtn.onclick = () => {
                    this.cancelEdit();
                    this.resetForm();
                };
                submitBtn.parentNode.appendChild(cancelBtn);
            }
            
            // Add editing indicator if it doesn't exist
            if (!document.getElementById('editingIndicator')) {
                const indicator = document.createElement('div');
                indicator.id = 'editingIndicator';
                indicator.className = 'editing-indicator';
                indicator.innerHTML = '✏️ Editing Entry';
                document.getElementById('foodForm').insertBefore(indicator, document.getElementById('foodForm').firstChild);
            }
        } else {
            // Add mode
            submitBtn.textContent = 'Add Entry';
            submitBtn.className = 'btn btn-primary';
            
            // Remove cancel button if it exists
            const cancelBtn = document.getElementById('cancelEditBtn');
            if (cancelBtn) cancelBtn.remove();
            
            // Remove editing indicator if it exists
            const indicator = document.getElementById('editingIndicator');
            if (indicator) indicator.remove();
        }
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
            
            // Only re-render calendar if we're on the history tab
            const historyTab = document.getElementById('history-tab');
            if (historyTab && historyTab.classList.contains('active')) {
                // Save scroll position before re-rendering
                const scrollPos = window.pageYOffset || document.documentElement.scrollTop;
                this.renderCalendar();
                // Restore scroll position after re-rendering
                setTimeout(() => {
                    window.scrollTo(0, scrollPos);
                }, 0);
            }
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
                    <button class="btn-edit" onclick="app.editEntry(${entry.id})">Edit</button>
                    <button class="btn-danger" onclick="app.deleteEntry(${entry.id})">Delete</button>
                </div>
            </div>
        `;
    }

    // Calendar View
    renderCalendar() {
        const year = this.currentCalendarDate.getFullYear();
        const month = this.currentCalendarDate.getMonth();

        // Update title
        const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
                           'July', 'August', 'September', 'October', 'November', 'December'];
        document.getElementById('calendarTitle').textContent = `${monthNames[month]} ${year}`;

        // Get first day of month and number of days
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const daysInMonth = lastDay.getDate();
        
        // Get day of week (0 = Sunday, need to convert to Monday = 0)
        let firstDayOfWeek = firstDay.getDay();
        firstDayOfWeek = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1; // Convert to Mon=0

        // Calculate month stats - Disabled to prevent scroll issues
        // this.renderMonthStats(year, month);

        // Create calendar grid
        const grid = document.getElementById('calendarGrid');
        grid.innerHTML = '';

        // Add empty cells for days before month starts
        for (let i = 0; i < firstDayOfWeek; i++) {
            const emptyCell = document.createElement('div');
            emptyCell.className = 'calendar-day empty';
            grid.appendChild(emptyCell);
        }

        // Add days of the month
        for (let day = 1; day <= daysInMonth; day++) {
            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const dayEntries = this.entries.filter(e => e.time.startsWith(dateStr));
            
            const dayCell = document.createElement('div');
            dayCell.className = 'calendar-day';
            
            // Check if it's today
            const today = new Date();
            if (year === today.getFullYear() && month === today.getMonth() && day === today.getDate()) {
                dayCell.classList.add('today');
            }

            // Color code based on entries and DCR
            if (dayEntries.length > 0) {
                dayCell.classList.add('has-entries');
                const totalCalories = dayEntries.reduce((sum, e) => sum + (parseInt(e.calories) || 0), 0);
                
                if (totalCalories > 0 && this.profile) {
                    const dcr = this.profile.dcr || this.calculateTDEE(
                        this.calculateBMR(this.profile.age, this.profile.gender, this.profile.height, this.profile.weight),
                        this.profile.activityLevel
                    );
                    const diff = Math.abs(totalCalories - dcr);
                    const percentDiff = (diff / dcr) * 100;

                    if (percentDiff <= 10) {
                        dayCell.classList.add('good'); // Within 10% of DCR
                    } else if (percentDiff > 20) {
                        dayCell.classList.add('bad'); // More than 20% off
                    } else {
                        dayCell.classList.add('warning'); // Between 10-20%
                    }
                } else if (totalCalories === 0 && dayEntries.length > 0) {
                    dayCell.classList.add('no-calories'); // Entries but no calorie data
                }

                // Create day content
                dayCell.innerHTML = `
                    <div class="calendar-day-number">${day}</div>
                    <div class="calendar-day-info">
                        <div class="calendar-meal-count">${dayEntries.length} meal${dayEntries.length > 1 ? 's' : ''}</div>
                        ${totalCalories > 0 ? `<div class="calendar-calories">${totalCalories} kcal</div>` : ''}
                    </div>
                `;

                dayCell.onclick = () => this.openDayModal(dateStr);
            } else {
                // No entries
                dayCell.innerHTML = `<div class="calendar-day-number">${day}</div>`;
            }

            grid.appendChild(dayCell);
        }
    }

    renderMonthStats(year, month) {
        const monthStart = new Date(year, month, 1);
        const monthEnd = new Date(year, month + 1, 0);
        
        const monthEntries = this.entries.filter(e => {
            const entryDate = new Date(e.time);
            return entryDate >= monthStart && entryDate <= monthEnd;
        });

        const statsDiv = document.getElementById('monthStats');
        
        if (monthEntries.length === 0) {
            statsDiv.innerHTML = '<div class="month-stats-empty">No entries this month</div>';
            return;
        }

        // Group by date
        const daysByDate = monthEntries.reduce((acc, entry) => {
            const date = entry.time.split('T')[0];
            if (!acc[date]) acc[date] = [];
            acc[date].push(entry);
            return acc;
        }, {});

        const daysWithEntries = Object.keys(daysByDate).length;
        const totalCalories = monthEntries.reduce((sum, e) => sum + (parseInt(e.calories) || 0), 0);
        const avgCalories = Math.round(totalCalories / daysWithEntries);

        let dcrInfo = '';
        if (this.profile && totalCalories > 0) {
            const dcr = this.profile.dcr || this.calculateTDEE(
                this.calculateBMR(this.profile.age, this.profile.gender, this.profile.height, this.profile.weight),
                this.profile.activityLevel
            );
            const avgDiff = avgCalories - dcr;
            dcrInfo = `<div class="month-stat-item">
                <span class="month-stat-label">Avg vs DCR:</span>
                <span class="month-stat-value ${avgDiff > 0 ? 'over' : 'under'}">${avgDiff > 0 ? '+' : ''}${avgDiff} kcal</span>
            </div>`;
        }

        statsDiv.innerHTML = `
            <div class="month-stats-grid">
                <div class="month-stat-item">
                    <span class="month-stat-label">Days tracked:</span>
                    <span class="month-stat-value">${daysWithEntries}</span>
                </div>
                <div class="month-stat-item">
                    <span class="month-stat-label">Total entries:</span>
                    <span class="month-stat-value">${monthEntries.length}</span>
                </div>
                <div class="month-stat-item">
                    <span class="month-stat-label">Avg calories/day:</span>
                    <span class="month-stat-value">${avgCalories > 0 ? avgCalories + ' kcal' : '—'}</span>
                </div>
                ${dcrInfo}
            </div>
        `;
    }

    previousMonth() {
        this.currentCalendarDate.setMonth(this.currentCalendarDate.getMonth() - 1);
        this.renderCalendar();
    }

    nextMonth() {
        this.currentCalendarDate.setMonth(this.currentCalendarDate.getMonth() + 1);
        this.renderCalendar();
    }

    goToToday() {
        this.currentCalendarDate = new Date();
        this.renderCalendar();
    }

    openDayModal(dateStr) {
        const dayEntries = this.entries.filter(e => e.time.startsWith(dateStr));
        
        if (dayEntries.length === 0) return;

        // Format date for modal title
        const date = new Date(dateStr + 'T00:00:00');
        const dateFormatted = date.toLocaleDateString('en-US', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        });

        document.getElementById('modalTitle').textContent = dateFormatted;

        // Display stats
        this.displayStats(dayEntries, 'modalStats');

        // Display entries
        this.displayEntries(dayEntries, 'modalEntries');

        // Show modal
        document.getElementById('dayModal').classList.add('show');
    }

    closeModal() {
        document.getElementById('dayModal').classList.remove('show');
    }

    // History View (kept for backwards compatibility, but replaced with calendar)
    // Removed - now using calendar view

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
        let exportText = `FOOD TRACKING DATA FOR AI NUTRITION ANALYSIS\n`;
        exportText += `${'='.repeat(60)}\n\n`;

        // Add user profile information
        if (this.profile) {
            exportText += `USER PROFILE:\n`;
            exportText += `${'-'.repeat(60)}\n`;
            exportText += `Age: ${this.profile.age} years\n`;
            exportText += `Gender: ${this.profile.gender}\n`;
            exportText += `Height: ${this.profile.height} cm\n`;
            exportText += `Weight: ${this.profile.weight} kg\n`;
            exportText += `Activity Level: ${this.profile.activityLevel}\n`;
            exportText += `Primary Goal: ${this.profile.goal}\n`;
            
            // Calculate or use provided DCR
            const dcr = this.profile.dcr || this.calculateTDEE(
                this.calculateBMR(this.profile.age, this.profile.gender, this.profile.height, this.profile.weight),
                this.profile.activityLevel
            );
            
            if (this.profile.dcr) {
                exportText += `Daily Caloric Requirement (DCR): ${dcr} kcal (user-provided)\n`;
            } else {
                exportText += `Daily Caloric Requirement (DCR): ~${dcr} kcal (estimated - please verify)\n`;
            }
            
            if (this.profile.healthConditions) {
                exportText += `Health Conditions/Allergies: ${this.profile.healthConditions}\n`;
            }
            if (this.profile.additionalNotes) {
                exportText += `Additional Notes: ${this.profile.additionalNotes}\n`;
            }
            exportText += `\n${'='.repeat(60)}\n\n`;
        } else {
            exportText += `USER PROFILE: Not provided\n`;
            exportText += `NOTE: AI should estimate caloric needs based on general guidelines.\n\n`;
            exportText += `${'='.repeat(60)}\n\n`;
        }

        // Add AI instructions
        const selectedLanguage = document.getElementById('aiLanguage').value;
        const languageInstruction = selectedLanguage === 'polish' 
            ? 'IMPORTANT: Please respond in POLISH language.'
            : 'Please respond in English.';

        exportText += `ANALYSIS INSTRUCTIONS FOR AI:\n`;
        exportText += `${'-'.repeat(60)}\n`;
        exportText += `${languageInstruction}\n\n`;
        exportText += `Please analyze this nutrition data and provide:\n`;
        exportText += `1. Compare total calories eaten vs DCR for each day and overall period\n`;
        exportText += `2. Assess nutritional balance and meal distribution\n`;
        exportText += `3. Identify what's good about the current diet\n`;
        exportText += `4. Highlight areas that need improvement\n`;
        exportText += `5. Provide specific, actionable recommendations\n`;
        exportText += `6. Consider the user's goal (${this.profile?.goal || 'not specified'}) in your analysis\n`;
        if (!this.profile?.dcr) {
            exportText += `7. Approximate the DCR if not provided, based on user profile\n`;
        }
        exportText += `\n${'='.repeat(60)}\n\n`;

        exportText += `TRACKING PERIOD: ${period}\n`;
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
            if (dayCalories > 0) {
                exportText += `, ${dayCalories} calories`;
                if (this.profile) {
                    const dcr = this.profile.dcr || this.calculateTDEE(
                        this.calculateBMR(this.profile.age, this.profile.gender, this.profile.height, this.profile.weight),
                        this.profile.activityLevel
                    );
                    const diff = dayCalories - dcr;
                    exportText += ` (${diff > 0 ? '+' : ''}${diff} vs DCR)`;
                }
            }
            if (daySize > 0) exportText += `, ${daySize} grams`;
            exportText += `\n\n${'='.repeat(60)}\n\n`;
        });

        // Overall summary
        const totalCalories = sortedEntries.reduce((sum, e) => sum + (parseInt(e.calories) || 0), 0);
        const totalSize = sortedEntries.reduce((sum, e) => sum + (parseInt(e.size) || 0), 0);
        const avgCaloriesPerDay = Math.round(totalCalories / Object.keys(groupedByDate).length);
        
        exportText += `OVERALL SUMMARY:\n`;
        exportText += `- Total entries: ${entries.length}\n`;
        exportText += `- Total calories: ${totalCalories} kcal\n`;
        exportText += `- Average calories per day: ${avgCaloriesPerDay} kcal\n`;
        if (this.profile) {
            const dcr = this.profile.dcr || this.calculateTDEE(
                this.calculateBMR(this.profile.age, this.profile.gender, this.profile.height, this.profile.weight),
                this.profile.activityLevel
            );
            const avgDiff = avgCaloriesPerDay - dcr;
            exportText += `- Average daily difference vs DCR: ${avgDiff > 0 ? '+' : ''}${avgDiff} kcal\n`;
        }
        exportText += `- Total weight: ${totalSize} grams\n`;
        exportText += `- Period: ${period}\n`;
        exportText += `- Days tracked: ${Object.keys(groupedByDate).length}\n`;

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

