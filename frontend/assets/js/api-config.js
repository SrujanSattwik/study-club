// Centralized API Configuration
const API_CONFIG = {
    BASE_URL: 'http://localhost:3001',
    ENDPOINTS: {
        // Auth endpoints
        AUTH: {
            LOGIN: '/api/auth/login',
            SEND_OTP: '/auth/send-otp',
            VERIFY_OTP: '/auth/verify-otp-signup'
        },
        // Dashboard endpoints
        DASHBOARD: '/api/dashboard',
        // Materials endpoints
        MATERIALS: '/api/materials',
        // Activity endpoints
        ACTIVITY: '/api/activity',
        // Chat endpoints
        CHAT: {
            SESSIONS: '/api/chat/sessions',
            HISTORY: '/api/chat/history',
            ASK: '/api/ask'
        }
    }
};

// Helper function to build full URL
function buildApiUrl(endpoint) {
    return `${API_CONFIG.BASE_URL}${endpoint}`;
}

// Export for use in other scripts
if (typeof window !== 'undefined') {
    window.API_CONFIG = API_CONFIG;
    window.buildApiUrl = buildApiUrl;
}
