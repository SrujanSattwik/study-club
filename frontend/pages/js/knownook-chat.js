// ─────────────────────────────────────────────────────────────────
// knownook-chat.js  –  KnowNook AI Chat (Multi-Session)
// ─────────────────────────────────────────────────────────────────

const BACKEND_URL = window.API_CONFIG ? API_CONFIG.BASE_URL : 'http://localhost:3001';
const MAX_CONTEXT_MSGS = 5;

let activeSessionId   = null;
let activeTitleSet    = false;   // whether first-message title has been set
let conversationHistory = [];

// ─── Auth helpers ─────────────────────────────────────────────────
function getToken() { return localStorage.getItem('studyhub_token') || null; }
function authHeaders(extra = {}) {
    const h = { 'Content-Type': 'application/json', ...extra };
    const t = getToken();
    if (t) h['Authorization'] = `Bearer ${t}`;
    return h;
}

// ─── Init ─────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', async () => {
    const chatForm      = document.getElementById('chat-form');
    const chatInput     = document.getElementById('chat-input');
    const newChatBtn    = document.getElementById('new-chat-btn');
    const deleteBtn     = document.getElementById('delete-session-btn');

    chatForm.addEventListener('submit', handleSendMessage);
    newChatBtn.addEventListener('click', handleNewChat);
    deleteBtn.addEventListener('click', handleDeleteSession);

    chatInput.addEventListener('input', () => {
        chatInput.style.height = 'auto';
        chatInput.style.height = chatInput.scrollHeight + 'px';
    });
    chatInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            chatForm.dispatchEvent(new Event('submit'));
        }
    });

    setInputEnabled(false);

    if (!getToken()) {
        showGuestNotice();
        return;
    }
    await loadSessions();
});

// ─── Load Sessions ────────────────────────────────────────────────
async function loadSessions() {
    try {
        const res  = await fetch(`${BACKEND_URL}/api/chat/sessions`, { headers: authHeaders() });
        const data = await res.json();
        if (!data.success) return;
        renderSessionList(data.sessions);
    } catch (err) {
        console.error('loadSessions error:', err);
    }
}

function renderSessionList(sessions) {
    const list  = document.getElementById('session-list');
    const empty = document.getElementById('session-empty');

    // Remove old session items (keep empty placeholder)
    list.querySelectorAll('.session-item').forEach(el => el.remove());

    if (!sessions.length) {
        empty.style.display = 'flex';
        return;
    }
    empty.style.display = 'none';

    sessions.forEach(s => {
        const item = document.createElement('div');
        item.className = 'session-item' + (s.id === activeSessionId ? ' active' : '');
        item.dataset.id = s.id;
        item.innerHTML = `
            <div class="session-item-info">
                <div class="session-item-title">${escapeHtml(s.title)}</div>
                <div class="session-item-time">${formatDate(s.createdAt)}</div>
            </div>
            <button class="session-item-delete" title="Delete" data-id="${s.id}">
                <i class="fas fa-trash"></i>
            </button>
        `;
        item.addEventListener('click', (e) => {
            if (e.target.closest('.session-item-delete')) return;
            selectSession(s.id, s.title);
        });
        item.querySelector('.session-item-delete').addEventListener('click', (e) => {
            e.stopPropagation();
            deleteSession(s.id);
        });
        list.appendChild(item);
    });
}

// ─── Select Session ───────────────────────────────────────────────
async function selectSession(sessionId, title) {
    activeSessionId  = sessionId;
    activeTitleSet   = true;
    conversationHistory = [];

    // Update active highlight
    document.querySelectorAll('.session-item').forEach(el => {
        el.classList.toggle('active', el.dataset.id === sessionId);
    });

    document.getElementById('chat-title').textContent = title;
    document.getElementById('delete-session-btn').style.display = 'block';
    setInputEnabled(true);
    document.getElementById('input-hint').style.display = 'none';

    clearChatBox();
    showTypingIndicator();

    try {
        const res  = await fetch(`${BACKEND_URL}/api/chat/history/${sessionId}`, { headers: authHeaders() });
        const data = await res.json();
        hideTypingIndicator();

        if (data.success && data.messages.length) {
            data.messages.forEach(m => appendMessage(m.role === 'user' ? 'user' : 'bot', m.text, m.timestamp));
            conversationHistory = data.messages.slice(-MAX_CONTEXT_MSGS).map(m => ({
                role:    m.role === 'assistant' ? 'assistant' : m.role,
                content: m.text
            }));
        } else {
            showEmptySessionHint();
        }
    } catch (err) {
        hideTypingIndicator();
        console.error('selectSession error:', err);
    }
    scrollToBottom();
}

// ─── New Chat ─────────────────────────────────────────────────────
async function handleNewChat() {
    if (!getToken()) { alert('Please log in to create a chat.'); return; }
    try {
        const res  = await fetch(`${BACKEND_URL}/api/chat/sessions`, {
            method:  'POST',
            headers: authHeaders(),
            body:    JSON.stringify({ title: 'New Chat' })
        });
        const data = await res.json();
        if (!data.success) return;

        activeSessionId  = data.session.id;
        activeTitleSet   = false;
        conversationHistory = [];

        document.getElementById('chat-title').textContent = 'New Chat';
        document.getElementById('delete-session-btn').style.display = 'block';
        setInputEnabled(true);
        document.getElementById('input-hint').style.display = 'none';
        clearChatBox();
        showEmptySessionHint();

        await loadSessions();
        // Re-highlight the new session
        document.querySelectorAll('.session-item').forEach(el => {
            el.classList.toggle('active', el.dataset.id === activeSessionId);
        });
        document.getElementById('chat-input').focus();
    } catch (err) {
        console.error('handleNewChat error:', err);
    }
}

// ─── Delete Session ───────────────────────────────────────────────
async function handleDeleteSession() {
    if (!activeSessionId) return;
    if (!confirm('Delete this chat? This cannot be undone.')) return;
    await deleteSession(activeSessionId);
}

async function deleteSession(sessionId) {
    try {
        await fetch(`${BACKEND_URL}/api/chat/session/${sessionId}`, {
            method:  'DELETE',
            headers: authHeaders()
        });
        if (sessionId === activeSessionId) {
            activeSessionId = null;
            activeTitleSet  = false;
            conversationHistory = [];
            document.getElementById('chat-title').textContent = 'KnowNook AI';
            document.getElementById('delete-session-btn').style.display = 'none';
            setInputEnabled(false);
            document.getElementById('input-hint').style.display = 'block';
            clearChatBox();
            showWelcomeScreen();
        }
        await loadSessions();
    } catch (err) {
        console.error('deleteSession error:', err);
    }
}

// ─── Send Message ─────────────────────────────────────────────────
async function handleSendMessage(e) {
    e.preventDefault();
    if (!activeSessionId) return;

    const chatInput = document.getElementById('chat-input');
    const message   = chatInput.value.trim();
    if (!message) return;

    chatInput.value = '';
    chatInput.style.height = 'auto';
    setInputEnabled(false);

    // Remove empty-session hint if present
    const hint = document.querySelector('.kn-empty-hint');
    if (hint) hint.remove();

    appendMessage('user', message, new Date().toISOString());
    conversationHistory.push({ role: 'user', content: message });
    if (conversationHistory.length > MAX_CONTEXT_MSGS)
        conversationHistory = conversationHistory.slice(-MAX_CONTEXT_MSGS);

    // Set title from first message
    if (!activeTitleSet) {
        activeTitleSet = true;
        const title = message.slice(0, 50) + (message.length > 50 ? '…' : '');
        document.getElementById('chat-title').textContent = title;
        fetch(`${BACKEND_URL}/api/chat/sessions/${activeSessionId}/title`, {
            method:  'PATCH',
            headers: authHeaders(),
            body:    JSON.stringify({ title })
        }).then(() => loadSessions()).catch(() => {});
    }

    showTypingIndicator();
    const botText = await streamFromNvidia(conversationHistory, activeSessionId);
    hideTypingIndicator();

    appendMessage('bot', botText, new Date().toISOString());
    conversationHistory.push({ role: 'assistant', content: botText });
    if (conversationHistory.length > MAX_CONTEXT_MSGS)
        conversationHistory = conversationHistory.slice(-MAX_CONTEXT_MSGS);

    setInputEnabled(true);
    document.getElementById('chat-input').focus();
}

// ─── NVIDIA Stream (core logic unchanged) ─────────────────────────
async function streamFromNvidia(messages, sessionId) {
    try {
        const response = await fetch(`${BACKEND_URL}/api/ask`, {
            method:  'POST',
            headers: authHeaders(),
            body:    JSON.stringify({ messages, sessionId })
        });
        if (!response.ok) {
            const err = await response.json().catch(() => ({}));
            return `Error ${response.status}: ${err?.error || response.statusText}`;
        }

        const reader  = response.body.getReader();
        const decoder = new TextDecoder('utf-8');
        let fullText  = '';
        let buffer    = '';

        while (true) {
            const { value, done } = await reader.read();
            if (done) break;
            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop();
            for (const line of lines) {
                const trimmed = line.trim();
                if (!trimmed || trimmed === 'data: [DONE]') continue;
                if (!trimmed.startsWith('data: ')) continue;
                try {
                    const json  = JSON.parse(trimmed.slice(6));
                    const delta = json?.choices?.[0]?.delta;
                    if (delta?.content) fullText += delta.content;
                } catch (_) {}
            }
        }
        return fullText.trim() || "I didn't generate a response. Please try again.";
    } catch (error) {
        console.error('streamFromNvidia error:', error);
        return `Network error: ${error.message}`;
    }
}

// ─── DOM Helpers ──────────────────────────────────────────────────
function appendMessage(sender, text, timestamp = null) {
    const chatBox = document.getElementById('chat-box');
    const row     = document.createElement('div');
    row.className = `message ${sender}`;

    const avatar  = document.createElement('div');
    avatar.className = 'message-avatar';
    avatar.innerHTML = `<i class="fas fa-${sender === 'user' ? 'user' : 'robot'}"></i>`;

    const wrapper = document.createElement('div');
    wrapper.className = 'message-wrapper';

    const content = document.createElement('div');
    content.className = 'message-content';
    const p = document.createElement('p');
    p.innerHTML = formatMessage(text);
    content.appendChild(p);
    wrapper.appendChild(content);

    if (timestamp) {
        const ts = document.createElement('div');
        ts.className = 'message-timestamp';
        ts.textContent = formatTimestamp(timestamp);
        wrapper.appendChild(ts);
    }

    row.appendChild(avatar);
    row.appendChild(wrapper);
    chatBox.appendChild(row);
    scrollToBottom();
}

function clearChatBox() {
    document.getElementById('chat-box').innerHTML = '';
}

function showWelcomeScreen() {
    const chatBox = document.getElementById('chat-box');
    chatBox.innerHTML = `
        <div class="kn-welcome">
            <div class="kn-welcome-icon"><i class="fas fa-robot"></i></div>
            <h2>Welcome to KnowNook AI</h2>
            <p>Your AI-powered study assistant. Click <strong>New Chat</strong> to begin or select a previous conversation.</p>
        </div>`;
}

function showEmptySessionHint() {
    const chatBox = document.getElementById('chat-box');
    const div = document.createElement('div');
    div.className = 'kn-welcome kn-empty-hint';
    div.innerHTML = `
        <div class="kn-welcome-icon"><i class="fas fa-comment-dots"></i></div>
        <h2>New Conversation</h2>
        <p>Type your first message below to get started!</p>`;
    chatBox.appendChild(div);
}

function showGuestNotice() {
    const chatBox = document.getElementById('chat-box');
    chatBox.innerHTML = `
        <div class="kn-welcome">
            <div class="kn-welcome-icon"><i class="fas fa-user-lock"></i></div>
            <h2>Login Required</h2>
            <p>Please <a href="login.html" style="color:#4f46e5;font-weight:600;">log in</a> to use KnowNook AI and save your chat history.</p>
        </div>`;
}

function showTypingIndicator() {
    const chatBox = document.getElementById('chat-box');
    const div     = document.createElement('div');
    div.className = 'message bot typing-indicator';
    div.innerHTML = `
        <div class="message-avatar"><i class="fas fa-robot"></i></div>
        <div class="message-wrapper">
            <div class="message-content">
                <div class="typing-dots"><span></span><span></span><span></span></div>
            </div>
        </div>`;
    chatBox.appendChild(div);
    scrollToBottom();
}

function hideTypingIndicator() {
    document.querySelector('.typing-indicator')?.remove();
}

function setInputEnabled(enabled) {
    const input = document.getElementById('chat-input');
    const btn   = document.getElementById('send-btn');
    input.disabled = !enabled;
    btn.disabled   = !enabled;
}

function scrollToBottom() {
    const cb = document.getElementById('chat-box');
    if (cb) cb.scrollTop = cb.scrollHeight;
}

function formatMessage(text) {
    return text
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g,     '<em>$1</em>')
        .replace(/`(.*?)`/g,       '<code>$1</code>')
        .replace(/\n/g,            '<br>');
}

function formatTimestamp(ts) {
    try { return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }); }
    catch (_) { return ''; }
}

function formatDate(ts) {
    try {
        const d = new Date(ts);
        const today = new Date();
        if (d.toDateString() === today.toDateString()) return 'Today';
        const yesterday = new Date(today); yesterday.setDate(today.getDate() - 1);
        if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
        return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
    } catch (_) { return ''; }
}

function escapeHtml(str) {
    return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
