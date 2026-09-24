// Food Tracker App
class FoodTracker {
    constructor(dataStore) {
        this.dataStore = dataStore;
        this.entries = [];
        this.profile = null;
        this.calorieOverrides = {};
        this.dailyActivity = {};
        this.editingId = null; // Track which entry is being edited
        this.currentCalendarDate = new Date(); // Track current calendar month
        this.currentModalDate = null;
        this._persistPromise = null;
    }

    async loadFromStore() {
        const data = await this.dataStore.loadWithMigration();
        this.entries = data.entries || [];
        this.profile = data.profile ?? null;
        this.calorieOverrides = data.calorieOverrides || {};
        this.dailyActivity = data.dailyActivity || {};
    }

    async persist() {
        if (!this.dataStore) return;
        const payload = {
            entries: this.entries,
            profile: this.profile,
            calorieOverrides: this.calorieOverrides,
            dailyActivity: this.dailyActivity
        };
        this._persistPromise = this.dataStore.save(payload);
        try {
            await this._persistPromise;
        } catch (err) {
            console.error('Cloud save failed:', err);
            this.showToast('❌ Nie zapisano w chmurze — sprawdź internet');
            throw err;
        }
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

    saveEntries() {
        void this.persist();
    }

    saveProfile() {
        void this.persist();
    }

    saveCalorieOverrides() {
        void this.persist();
    }

    getCalorieOverride(dateStr) {
        const value = this.calorieOverrides[dateStr];
        return value === undefined || value === null ? null : value;
    }

    getDayCalories(dateStr, entries) {
        const override = this.getCalorieOverride(dateStr);
        if (override !== null) return override;
        const dayEntries = entries || this.entries.filter(e => e.time.startsWith(dateStr));
        return dayEntries.reduce((sum, e) => sum + (parseInt(e.calories) || 0), 0);
    }

    setCalorieOverride(dateStr, rawValue) {
        const trimmed = String(rawValue ?? '').trim();
        if (trimmed === '') {
            delete this.calorieOverrides[dateStr];
            this.saveCalorieOverrides();
            return true;
        }

        const parsed = parseInt(trimmed, 10);
        if (Number.isNaN(parsed) || parsed < 0) return false;

        this.calorieOverrides[dateStr] = parsed;
        this.saveCalorieOverrides();
        return true;
    }

    clearCalorieOverride(dateStr) {
        delete this.calorieOverrides[dateStr];
        this.saveCalorieOverrides();
    }

    saveDailyActivity() {
        void this.persist();
    }

    getDayActivity(dateStr) {
        return this.dailyActivity[dateStr] || { type: 'none', difficulty: 'easy' };
    }

    setDayActivity(dateStr, field, value) {
        const current = this.getDayActivity(dateStr);
        this.dailyActivity[dateStr] = { ...current, [field]: value };
        this.saveDailyActivity();
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
        const clientId = this.dataStore?.clientId;
        const storageLine = clientId
            ? `<div class="backup-stat">☁️ Cloud ID (to urządzenie): <code class="client-id">${clientId}</code></div>`
            : '';

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
                    ${storageLine}
                    <div class="backup-stat">📊 Total Entries: <strong>${entriesCount}</strong></div>
                    <div class="backup-stat">👤 Profile Saved: <strong>${hasProfile}</strong></div>
                    ${entriesCount > 0 ? `
                        <div class="backup-stat">📅 Date Range: <strong>${oldestEntry} - ${newestEntry}</strong></div>
                    ` : ''}
                </div>
            `;
        } else {
            infoDiv.innerHTML = `<div class="backup-stats">${storageLine}<p>No data to backup yet.</p></div>`;
        }
    }

    // Backup & Restore Functions
    exportBackup() {
        const backupData = {
            version: '1.0',
            exportDate: new Date().toISOString(),
            profile: this.profile,
            entries: this.entries,
            calorieOverrides: this.calorieOverrides,
            dailyActivity: this.dailyActivity,
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
        reader.onload = async (e) => {
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
                this.calorieOverrides = backupData.calorieOverrides || {};
                this.dailyActivity = backupData.dailyActivity || {};

                await this.persist();

                // Update UI
                this.loadProfileForm();
                this.updateTodayView();
                this.renderCalendar();
                this.updateBackupInfo();

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

        this.displayStats(todayEntries, 'todayStats', { dateStr: today });
        this.displayEntries(todayEntries, 'todayEntries');
    }

    displayStats(entries, containerId, options = {}) {
        const container = document.getElementById(containerId);
        const { dateStr = null, editableCalories = false, title = "Today's Summary", showActivity = false } = options;
        const calculatedCalories = entries.reduce((sum, e) => sum + (parseInt(e.calories) || 0), 0);
        const hasOverride = dateStr ? this.getCalorieOverride(dateStr) !== null : false;
        const totalCalories = dateStr ? this.getDayCalories(dateStr, entries) : calculatedCalories;
        const totalSize = entries.reduce((sum, e) => sum + (parseInt(e.size) || 0), 0);

        const mealCounts = entries.reduce((acc, e) => {
            acc[e.mealType] = (acc[e.mealType] || 0) + 1;
            return acc;
        }, {});

        const caloriesDisplay = editableCalories && dateStr
            ? `<input type="number" min="0" step="1" class="stat-calories-input" id="dayCaloriesInput" value="${totalCalories || ''}" placeholder="0" inputmode="numeric">
               <div class="stat-calories-hint">
                   ${hasOverride ? 'Manual total (meal sum ignored)' : 'From meals — tap to override'}
                   ${hasOverride ? '<button type="button" class="stat-reset-btn" id="resetDayCalories">Use meal total</button>' : ''}
               </div>`
            : `<div class="stat-value">${totalCalories || '—'}</div>`;

        const activity = showActivity && dateStr ? this.getDayActivity(dateStr) : null;
        const activityTile = activity ? `
                <div class="stat-item activity-tile">
                    <div class="stat-label">Activity</div>
                    <select class="activity-select" id="dayActivityType">
                        <option value="none"${activity.type === 'none' ? ' selected' : ''}>no activity</option>
                        <option value="short"${activity.type === 'short' ? ' selected' : ''}>short activity</option>
                        <option value="long"${activity.type === 'long' ? ' selected' : ''}>long activity</option>
                    </select>
                    <select class="activity-select" id="dayActivityDifficulty"${activity.type === 'none' ? ' disabled' : ''}>
                        <option value="easy"${activity.difficulty === 'easy' ? ' selected' : ''}>easy</option>
                        <option value="medium"${activity.difficulty === 'medium' ? ' selected' : ''}>medium</option>
                        <option value="hard"${activity.difficulty === 'hard' ? ' selected' : ''}>hard</option>
                    </select>
                </div>` : '';

        container.innerHTML = `
            <h2>${title}</h2>
            <div class="stats-grid">
                <div class="stat-item">
                    <div class="stat-value">${entries.length}</div>
                    <div class="stat-label">Total Entries</div>
                </div>
                <div class="stat-item">
                    ${caloriesDisplay}
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
                ${activityTile}
            </div>
        `;

        if (editableCalories && dateStr) {
            this.bindDayCaloriesEditor(dateStr, calculatedCalories);
        }
        if (activity) {
            this.bindDayActivityEditor(dateStr);
        }
    }

    bindDayCaloriesEditor(dateStr, calculatedCalories) {
        const input = document.getElementById('dayCaloriesInput');
        const resetBtn = document.getElementById('resetDayCalories');
        if (!input) return;

        const commit = () => {
            const previousOverride = this.getCalorieOverride(dateStr);
            const trimmed = input.value.trim();

            if (trimmed === '') {
                if (previousOverride === null) return;
                this.clearCalorieOverride(dateStr);
                this.showToast('🔄 Using meal total again');
                this.refreshAfterCalorieEdit(dateStr);
                return;
            }

            const parsed = parseInt(trimmed, 10);
            if (Number.isNaN(parsed) || parsed < 0) {
                input.value = previousOverride !== null ? previousOverride : (calculatedCalories || '');
                this.showToast('❌ Enter a valid calorie amount');
                return;
            }

            if (previousOverride === parsed) return;
            if (previousOverride === null && parsed === calculatedCalories) return;

            this.setCalorieOverride(dateStr, parsed);
            this.showToast('🔥 Daily calories saved');
            this.refreshAfterCalorieEdit(dateStr);
        };

        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                input.blur();
            }
        });
        input.addEventListener('blur', commit);

        if (resetBtn) {
            resetBtn.addEventListener('mousedown', (e) => {
                e.preventDefault();
                this.clearCalorieOverride(dateStr);
                this.showToast('🔄 Using meal total again');
                this.refreshAfterCalorieEdit(dateStr);
            });
        }
    }

    bindDayActivityEditor(dateStr) {
        const typeSelect = document.getElementById('dayActivityType');
        const difficultySelect = document.getElementById('dayActivityDifficulty');
        if (!typeSelect || !difficultySelect) return;

        typeSelect.addEventListener('change', () => {
            this.setDayActivity(dateStr, 'type', typeSelect.value);
            difficultySelect.disabled = typeSelect.value === 'none';
        });
        difficultySelect.addEventListener('change', () => {
            this.setDayActivity(dateStr, 'difficulty', difficultySelect.value);
        });
    }

    refreshAfterCalorieEdit(dateStr) {
        const scrollPos = window.pageYOffset || document.documentElement.scrollTop;
        this.updateTodayView();
        this.renderCalendar();
        if (this.currentModalDate === dateStr) {
            this.openDayModal(dateStr);
        }
        setTimeout(() => {
            window.scrollTo(0, scrollPos);
        }, 0);
    }

    displayEntries(entries, containerId, options = {}) {
        const container = document.getElementById(containerId);
        const emptyMessage = options.emptyMessage || 'No entries for today yet. Start tracking your meals!';

        if (entries.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">🍽️</div>
                    <div class="empty-state-text">${emptyMessage}</div>
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
        const dcr = this.profile?.dcr ? parseInt(this.profile.dcr, 10) : null;

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
            const totalCalories = this.getDayCalories(dateStr, dayEntries);
            const hasOverride = this.getCalorieOverride(dateStr) !== null;
            const hasData = dayEntries.length > 0 || hasOverride;
            
            const dayCell = document.createElement('div');
            dayCell.className = 'calendar-day clickable';
            
            // Check if it's today
            const today = new Date();
            if (year === today.getFullYear() && month === today.getMonth() && day === today.getDate()) {
                dayCell.classList.add('today');
            }

            if (hasData) {
                dayCell.classList.add('has-entries');

                if (totalCalories < 1000) {
                    dayCell.classList.add('no-calories');
                } else if (dcr) {
                    if (totalCalories > dcr) dayCell.classList.add('bad');
                    else if (totalCalories < dcr) dayCell.classList.add('good');
                }

                const mealLabel = dayEntries.length === 0
                    ? 'no meals'
                    : `${dayEntries.length} meal${dayEntries.length > 1 ? 's' : ''}`;

                dayCell.innerHTML = `
                    <div class="calendar-day-number">${day}</div>
                    <div class="calendar-day-info">
                        <div class="calendar-meal-count">${mealLabel}</div>
                        ${totalCalories > 0 || hasOverride ? `<div class="calendar-calories">${totalCalories} kcal</div>` : ''}
                    </div>
                `;
            } else {
                dayCell.innerHTML = `<div class="calendar-day-number">${day}</div>`;
            }

            dayCell.onclick = () => this.openDayModal(dateStr);
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
        const totalCalories = Object.keys(daysByDate).reduce(
            (sum, date) => sum + this.getDayCalories(date, daysByDate[date]),
            0
        );
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
        this.currentModalDate = dateStr;

        // Format date for modal title
        const date = new Date(dateStr + 'T00:00:00');
        const dateFormatted = date.toLocaleDateString('en-US', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        });

        document.getElementById('modalTitle').textContent = dateFormatted;

        this.displayStats(dayEntries, 'modalStats', {
            dateStr,
            editableCalories: true,
            showActivity: true,
            title: 'Day Summary'
        });

        this.displayEntries(dayEntries, 'modalEntries', {
            emptyMessage: 'No meals logged. You can still set a total calorie amount above.'
        });

        document.getElementById('dayModal').classList.add('show');
    }

    closeModal() {
        this.currentModalDate = null;
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
            const dayCalories = this.getDayCalories(date, groupedByDate[date]);
            const daySize = groupedByDate[date].reduce((sum, e) => sum + (parseInt(e.size) || 0), 0);
            exportText += `   Daily Total: ${groupedByDate[date].length} entries`;
            if (dayCalories > 0 || this.getCalorieOverride(date) !== null) {
                exportText += `, ${dayCalories} calories`;
                if (this.getCalorieOverride(date) !== null) {
                    exportText += ' (manual daily total)';
                }
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
        const totalCalories = Object.keys(groupedByDate).reduce(
            (sum, date) => sum + this.getDayCalories(date, groupedByDate[date]),
            0
        );
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

