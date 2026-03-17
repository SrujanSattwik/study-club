// Dashboard Data Loader
const DashboardLoader = {
    async init() {
        await this.loadUserData();
        await this.loadDashboardStats();
        await this.loadRecentActivity();
    },

    async loadUserData() {
        const user = AuthManager.getUser();
        if (user) {
            const nameElement = document.querySelector('.page-title');
            if (nameElement) {
                const fullName = user.fullName || user.full_name || 'Student';
                nameElement.textContent = `Welcome back, ${fullName}! 👋`;
            }
        }
    },

    async loadDashboardStats() {
        if (!AuthManager.isLoggedIn()) {
            console.log('User not logged in, skipping dashboard stats');
            return;
        }

        const token = AuthManager.getToken();
        const apiUrl = window.API_CONFIG ? buildApiUrl(API_CONFIG.ENDPOINTS.DASHBOARD) : 'http://localhost:3001/api/dashboard';

        try {
            const response = await fetch(apiUrl, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            const data = await response.json();
            console.log('Dashboard data loaded:', data);
            
            if (data.success && data.stats) {
                this.updateStats(data.stats);
            }
        } catch (error) {
            console.error('Failed to load dashboard stats:', error);
            // Keep default values on error
        }
    },

    updateStats(stats) {
        // Update materials accessed
        const materialsEl = document.querySelector('.stat-card:nth-child(1) .stat-card-value');
        if (materialsEl && stats.materialsAccessed !== undefined) {
            materialsEl.textContent = stats.materialsAccessed;
        }

        // Update study time
        const studyTimeEl = document.querySelector('.stat-card:nth-child(2) .stat-card-value');
        if (studyTimeEl && stats.studyTime !== undefined) {
            studyTimeEl.textContent = `${stats.studyTime}h`;
        }

        // Update completion rate
        const completionEl = document.querySelector('.stat-card:nth-child(3) .stat-card-value');
        if (completionEl && stats.completionRate !== undefined) {
            completionEl.textContent = `${stats.completionRate}%`;
        }

        // Update streak
        const streakEl = document.querySelector('.stat-card:nth-child(4) .stat-card-value');
        if (streakEl && stats.streak !== undefined) {
            streakEl.textContent = stats.streak;
        }
    },

    async loadRecentActivity() {
        if (!AuthManager.isLoggedIn()) {
            console.log('User not logged in, skipping recent activity');
            return;
        }

        const token = AuthManager.getToken();
        const apiUrl = window.API_CONFIG ? `${API_CONFIG.BASE_URL}/api/activity/recent` : 'http://localhost:3001/api/activity/recent';

        try {
            const response = await fetch(apiUrl, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            const data = await response.json();
            console.log('Recent activity loaded:', data);
            
            if (data.success && data.activities) {
                this.updateRecentActivity(data.activities);
            }
        } catch (error) {
            console.error('Failed to load recent activity:', error);
            // Keep default values on error
        }
    },

    updateRecentActivity(activities) {
        const tbody = document.querySelector('.table tbody');
        if (!tbody || activities.length === 0) return;

        tbody.innerHTML = activities.map(activity => `
            <tr>
                <td>
                    <div class="flex items-center gap-sm">
                        <i class="fas fa-${this.getIconForType(activity.type)} text-primary"></i>
                        <span class="font-medium">${this.escapeHtml(activity.title)}</span>
                    </div>
                </td>
                <td><span class="badge ${activity.type}">${this.capitalize(activity.type)}</span></td>
                <td>
                    <div class="flex items-center gap-sm">
                        <div style="width: 60px; height: 6px; background: var(--gray-200); border-radius: 999px; overflow: hidden;">
                            <div style="width: ${activity.progress}%; height: 100%; background: var(--primary);"></div>
                        </div>
                        <span class="text-sm text-gray-600">${activity.progress}%</span>
                    </div>
                </td>
                <td class="text-gray-600">${this.formatTime(activity.lastAccessed)}</td>
            </tr>
        `).join('');
    },

    getIconForType(type) {
        const icons = {
            'textbook': 'book',
            'video': 'video',
            'notes': 'file-alt',
            'audio': 'headphones'
        };
        return icons[type] || 'file';
    },

    capitalize(str) {
        return str.charAt(0).toUpperCase() + str.slice(1);
    },

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    },

    formatTime(timestamp) {
        const date = new Date(timestamp);
        const now = new Date();
        const diff = now - date;
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));

        if (hours < 1) return 'Just now';
        if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
        if (days < 7) return `${days} day${days > 1 ? 's' : ''} ago`;
        return date.toLocaleDateString();
    }
};

// Initialize on page load
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => DashboardLoader.init());
} else {
    DashboardLoader.init();
}
