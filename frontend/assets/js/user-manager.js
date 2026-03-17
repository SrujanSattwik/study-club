// User Manager - Handles per-user data and state
const UserManager = {
    STORAGE_KEY: 'studyhub_users',
    CURRENT_USER_KEY: 'studyhub_current_user',
    
    // Check if user is logged in
    isUserLoggedIn() {
        // Check both UserManager and AuthManager
        const userId = localStorage.getItem(this.CURRENT_USER_KEY);
        const authToken = localStorage.getItem('studyhub_token');
        return (userId !== null && userId !== '') || (authToken !== null && authToken !== '');
    },
    
    // Get current user ID (mock authentication)
    getCurrentUserId() {
        // Check UserManager storage first
        let userId = localStorage.getItem(this.CURRENT_USER_KEY);
        
        // If not found, check AuthManager and sync
        if (!userId) {
            const authUser = localStorage.getItem('studyhub_user');
            if (authUser) {
                const user = JSON.parse(authUser);
                userId = user.userId || user.user_id;
                if (userId) {
                    localStorage.setItem(this.CURRENT_USER_KEY, userId);
                }
            }
        }
        
        return userId;
    },
    
    // Login user (mock)
    loginUser(userId) {
        if (!userId) {
            userId = 'user_' + Date.now();
        }
        localStorage.setItem(this.CURRENT_USER_KEY, userId);
        return userId;
    },
    
    // Logout user
    logoutUser() {
        localStorage.removeItem(this.CURRENT_USER_KEY);
    },
    
    // Get all users data
    getAllUsers() {
        const data = localStorage.getItem(this.STORAGE_KEY);
        return data ? JSON.parse(data) : {};
    },
    
    // Get current user data
    getCurrentUser() {
        const userId = this.getCurrentUserId();
        if (!userId) {
            // Try to get from AuthManager
            const authUser = localStorage.getItem('studyhub_user');
            if (authUser) {
                const user = JSON.parse(authUser);
                if (user.userId || user.user_id) {
                    const id = user.userId || user.user_id;
                    this.loginUser(id);
                    return this.getCurrentUser();
                }
            }
            return null;
        }
        
        const users = this.getAllUsers();
        
        if (!users[userId]) {
            // Check if we have auth user data to populate
            const authUser = localStorage.getItem('studyhub_user');
            if (authUser) {
                const user = JSON.parse(authUser);
                users[userId] = this.createNewUser(userId);
                users[userId].profile.name = user.fullName || user.full_name || 'Student';
                users[userId].profile.email = user.email || '';
                users[userId].profile.avatar = (user.fullName || user.full_name || 'SS').substring(0, 2).toUpperCase();
            } else {
                users[userId] = this.createNewUser(userId);
            }
            this.saveAllUsers(users);
        }
        
        return users[userId];
    },
    
    // Create new user with default structure
    createNewUser(userId) {
        return {
            userId,
            profile: {
                name: 'Student',
                email: '',
                avatar: 'SS',
                createdAt: new Date().toISOString()
            },
            onboarding: {
                completed: false,
                syllabusSetupCompleted: false,
                stepsCompleted: [],
                lastVisitedStep: 0,
                completedAt: null
            },
            syllabus: {
                subjects: [],
                schedule: null
            },
            tasks: [],
            analytics: {
                studyTime: 0,
                materialsViewed: 0,
                lastActive: new Date().toISOString()
            }
        };
    },
    
    // Save all users data
    saveAllUsers(users) {
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(users));
    },
    
    // Update current user data
    updateCurrentUser(updates) {
        const userId = this.getCurrentUserId();
        const users = this.getAllUsers();
        users[userId] = { ...users[userId], ...updates };
        this.saveAllUsers(users);
        return users[userId];
    },
    
    // Update onboarding state
    updateOnboarding(updates) {
        const user = this.getCurrentUser();
        user.onboarding = { ...user.onboarding, ...updates };
        return this.updateCurrentUser(user);
    },
    
    // Mark step as completed
    completeStep(stepIndex) {
        const user = this.getCurrentUser();
        if (!user.onboarding.stepsCompleted.includes(stepIndex)) {
            user.onboarding.stepsCompleted.push(stepIndex);
            user.onboarding.lastVisitedStep = stepIndex;
        }
        return this.updateCurrentUser(user);
    },
    
    // Check if step is completed
    isStepCompleted(stepIndex) {
        const user = this.getCurrentUser();
        return user.onboarding.stepsCompleted.includes(stepIndex);
    },
    
    // Check if onboarding is complete
    isOnboardingComplete() {
        const user = this.getCurrentUser();
        return user.onboarding.completed;
    },
    
    // Complete onboarding
    completeOnboarding() {
        const user = this.getCurrentUser();
        user.onboarding.completed = true;
        user.onboarding.completedAt = new Date().toISOString();
        return this.updateCurrentUser(user);
    },
    
    // Update profile
    updateProfile(profileData) {
        const user = this.getCurrentUser();
        user.profile = { ...user.profile, ...profileData };
        return this.updateCurrentUser(user);
    },
    
    // Switch user (for testing)
    switchUser(userId) {
        localStorage.setItem(this.CURRENT_USER_KEY, userId);
        window.location.reload();
    },
    
    // Reset current user (for testing)
    resetCurrentUser() {
        const userId = this.getCurrentUserId();
        const users = this.getAllUsers();
        users[userId] = this.createNewUser(userId);
        this.saveAllUsers(users);
        window.location.reload();
    },
    
    // Reset user onboarding completely
    resetUserOnboarding(userId) {
        if (!userId) userId = this.getCurrentUserId();
        if (!userId) return false;
        
        const users = this.getAllUsers();
        if (!users[userId]) return false;
        
        // Reset all onboarding and scheduler data
        users[userId].onboarding = {
            completed: false,
            syllabusSetupCompleted: false,
            stepsCompleted: [],
            lastVisitedStep: 0,
            completedAt: null
        };
        users[userId].syllabus = { subjects: [], schedule: null };
        users[userId].studyPlan = {};
        users[userId].tasks = [];
        users[userId].analytics = {
            ...users[userId].analytics,
            studyTime: 0,
            materialsViewed: 0
        };
        
        this.saveAllUsers(users);
        return true;
    }
};

// Export for use in other files
window.UserManager = UserManager;
