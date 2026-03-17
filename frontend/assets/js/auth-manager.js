// Global Auth State Manager
const AuthManager = {
    isProfileMenuOpen: false,

    getUser() {
        const userStr = localStorage.getItem('studyhub_user');
        return userStr ? JSON.parse(userStr) : null;
    },

    getToken() {
        return localStorage.getItem('studyhub_token');
    },

    setAuth(token, user) {
        localStorage.setItem('studyhub_token', token);
        localStorage.setItem('studyhub_user', JSON.stringify(user));
        // Sync with UserManager
        if (window.UserManager) {
            const userId = user.userId || user.user_id;
            if (userId) {
                window.UserManager.loginUser(userId);
            }
        }
    },

    clearAuth() {
        localStorage.removeItem('studyhub_token');
        localStorage.removeItem('studyhub_user');
        // Sync with UserManager
        if (window.UserManager) {
            window.UserManager.logoutUser();
        }
    },

    isLoggedIn() {
        return !!this.getToken() && !!this.getUser();
    },

    getInitials(fullName) {
        if (!fullName) return 'U';
        const names = fullName.trim().split(' ');
        if (names.length === 1) return names[0].charAt(0).toUpperCase();
        return (names[0].charAt(0) + names[names.length - 1].charAt(0)).toUpperCase();
    },

    updateLoginButtons() {
        const user = this.getUser();
        const loginButtons = document.querySelectorAll('.login-btn, [href*="login.html"]');
        
        loginButtons.forEach(btn => {
            if (this.isLoggedIn() && user) {
                const fullName = user.fullName || user.full_name || 'User';
                const initials = this.getInitials(fullName);
                const profileBadge = document.createElement('div');
                profileBadge.className = 'profile-badge';
                profileBadge.innerHTML = `
                    <div class="profile-avatar">${initials}</div>
                    <span class="profile-name">${fullName}</span>
                    <div class="profile-dropdown">
                        <a href="${this.getBasePath()}index-dashboard.html"><i class="fas fa-th-large"></i> Dashboard</a>
                        <a href="${this.getBasePath()}settings.html"><i class="fas fa-cog"></i> Settings</a>
                        <a href="#" onclick="AuthManager.logout(); return false;"><i class="fas fa-sign-out-alt"></i> Logout</a>
                    </div>
                `;
                
                const dropdown = profileBadge.querySelector('.profile-dropdown');
                
                profileBadge.addEventListener('click', (e) => {
                    e.stopPropagation();
                    this.isProfileMenuOpen = !this.isProfileMenuOpen;
                    dropdown.style.display = this.isProfileMenuOpen ? 'block' : 'none';
                });
                
                dropdown.addEventListener('click', (e) => e.stopPropagation());
                
                btn.replaceWith(profileBadge);
            }
        });
        
        document.addEventListener('click', () => {
            this.isProfileMenuOpen = false;
            document.querySelectorAll('.profile-dropdown').forEach(d => d.style.display = 'none');
        });
    },

    getBasePath() {
        const path = window.location.pathname;
        if (path.includes('/get-started/') || path.includes('/materials/')) return '../';
        if (path.includes('/pages/')) return '';
        return 'pages/';
    },

    logout() {
        this.clearAuth();
        const base = this.getBasePath();
        window.location.href = base + 'login.html';
    }
};

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => AuthManager.updateLoginButtons());
} else {
    AuthManager.updateLoginButtons();
}
