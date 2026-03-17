// Update user profile display
(function() {
    function updateUserProfile() {
        const userStr = localStorage.getItem('studyhub_user');
        if (!userStr) return;
        
        try {
            const user = JSON.parse(userStr);
            const userName = user.fullName || user.full_name || 'Student';
            const userRole = user.role || 'Learner';
            
            // Update user name
            const nameElements = document.querySelectorAll('.topbar-user-name');
            nameElements.forEach(el => {
                el.textContent = userName;
            });
            
            // Update user role
            const roleElements = document.querySelectorAll('.topbar-user-role');
            roleElements.forEach(el => {
                el.textContent = userRole.charAt(0).toUpperCase() + userRole.slice(1);
            });
            
            // Update avatar
            const avatarElements = document.querySelectorAll('.topbar-user-avatar');
            avatarElements.forEach(el => {
                const initials = userName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
                el.textContent = initials;
            });
        } catch (e) {
            console.error('Error updating user profile:', e);
        }
    }
    
    // Update on page load
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', updateUserProfile);
    } else {
        updateUserProfile();
    }
})();
