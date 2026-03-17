/**
 * Study Room Logic - StudyClub
 * Handles dynamic content loading and UI navigation
 */

document.addEventListener('DOMContentLoaded', () => {
    // 1. Initialize Room Data from URL
    initRoom();

    // 2. Setup Workspace Navigation
    initNavigation();

    // 3. Setup Chat Functionality
    initChat();

    // 4. Setup UI Toggles (Mobile)
    initToggles();
});

/**
 * Parses URL parameters to adjust room metadata
 */
function initRoom() {
    const params = new URLSearchParams(window.location.search);
    const groupId = params.get('groupId') || 'general';
    const roomNameEl = document.getElementById('roomName');
    const chatInputEl = document.getElementById('chatInput');

    // Simple mapping for demonstration
    const groupData = {
        'mathematics': {
            name: 'Mathematics Masters',
            category: 'Advanced Mathematics',
            placeholder: 'Message #Mathematics-Masters'
        },
        'science': {
            name: 'Science Explorers',
            category: 'Natural Sciences',
            placeholder: 'Message #Science-Explorers'
        },
        'programming': {
            name: 'Code Warriors',
            category: 'Computer Science',
            placeholder: 'Message #Code-Warriors'
        }
    };

    if (groupData[groupId]) {
        const data = groupData[groupId];
        roomNameEl.textContent = data.name;
        chatInputEl.placeholder = data.placeholder;

        // Update category badge if needed
        const categoryBadge = document.querySelector('.room-meta-info span');
        if (categoryBadge) categoryBadge.textContent = data.category;
    }
}

/**
 * Handles switching between workspace views
 */
function initNavigation() {
    const toolItems = document.querySelectorAll('.tool-item');
    const viewTitle = document.getElementById('viewTitle');
    const viewIcon = document.getElementById('viewIcon');
    const workspaceContent = document.getElementById('workspaceContent');

    toolItems.forEach(item => {
        item.addEventListener('click', () => {
            // Remove active from all
            toolItems.forEach(i => i.classList.remove('active'));
            // Add to current
            item.classList.add('active');

            const view = item.dataset.view;
            const iconClass = item.querySelector('i').className;
            const title = item.querySelector('span').textContent;

            // Update Header
            viewTitle.textContent = title;
            viewIcon.className = iconClass;

            // Switch Content
            renderView(view, workspaceContent);
        });
    });
}



/**
 * Manages rendering of different workspace tools
 */
function renderView(view, container) {
    // For this UI task, we'll swap content templates
    switch (view) {
        case 'chat':
            // Re-render chat (we'll just use the default HTML for now or a template)
            location.reload(); // Simplest way to reset to chat for now
            break;
        case 'files':
            container.innerHTML = `
                <div class="files-view">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem;">
                        <h3>Shared Resources</h3>
                        <button class="btn btn-primary btn-sm"><i class="fas fa-upload"></i> Upload File</button>
                    </div>
                    <div class="file-grid">
                        <div class="file-card">
                            <div class="file-icon"><i class="fas fa-file-pdf"></i></div>
                            <div class="file-name">Calculus_Notes.pdf</div>
                            <div class="file-meta" style="font-size: 0.8rem; color: var(--gray-400);">1.2 MB • By Alex</div>
                        </div>
                        <div class="file-card">
                            <div class="file-icon"><i class="fas fa-file-pdf"></i></div>
                            <div class="file-name">Practice_Set_1.pdf</div>
                            <div class="file-meta" style="font-size: 0.8rem; color: var(--gray-400);">800 KB • By Sarah</div>
                        </div>
                        <div class="file-card">
                            <div class="file-icon" style="color: #f0b232;"><i class="fas fa-file-image"></i></div>
                            <div class="file-name">Concept_Map.png</div>
                            <div class="file-meta" style="font-size: 0.8rem; color: var(--gray-400);">2.5 MB • By You</div>
                        </div>
                    </div>
                </div>
            `;
            container.className = 'workspace-content';
            break;
        default:
            container.innerHTML = `
                <div style="flex:1; display:flex; flex-direction:column; align-items:center; justify-content:center; opacity:0.5;">
                    <i class="fas fa-tools" style="font-size: 4rem; margin-bottom: 1rem;"></i>
                    <h3>${view} module is coming soon</h3>
                </div>
            `;
            container.className = 'workspace-content';
    }
}

/**
 * Basic chat interaction
 */
function initChat() {
    const chatForm = document.getElementById('chatForm');
    const chatInput = document.getElementById('chatInput');
    const messageList = document.getElementById('messageList');

    if (!chatForm) return;

    chatForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const text = chatInput.value.trim();
        if (!text) return;

        appendMessage('You', text, 'https://ui-avatars.com/api/?name=You&background=10b981&color=fff', true);
        chatInput.value = '';
        messageList.scrollTop = messageList.scrollHeight;
    });
}

function appendMessage(user, text, avatar, isSelf) {
    const messageList = document.getElementById('messageList');
    const msgItem = document.createElement('div');
    msgItem.className = `message-item ${isSelf ? 'self' : ''}`;

    msgItem.innerHTML = `
        <img src="${avatar}" alt="Avatar" class="message-avatar">
        <div class="message-content">
            <div class="message-meta">
                <span class="user-name">${user}</span>
                <span class="timestamp">Just now</span>
            </div>
            <div class="message-bubble">${text}</div>
        </div>
    `;

    messageList.appendChild(msgItem);
}

/**
 * Mobile navigation toggles
 */
function initToggles() {
    const menuToggle = document.getElementById('menuToggle');
    const navPanel = document.getElementById('navPanel');

    if (menuToggle) {
        menuToggle.addEventListener('click', () => {
            navPanel.classList.toggle('active');
        });
    }

    // Close sidebar when clicking outside on mobile
    document.addEventListener('click', (e) => {
        if (window.innerWidth <= 768) {
            if (!navPanel.contains(e.target) && !menuToggle.contains(e.target)) {
                navPanel.classList.remove('active');
            }
        }
    });
}
