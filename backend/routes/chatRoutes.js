const express = require('express');
const router  = express.Router();
const { v4: uuidv4 } = require('uuid');
const oracledb = require('oracledb');
const { authenticateUser } = require('../middleware/auth');
const getConnection = require('../db/oracle');

const MAX_MSG_LEN = 4000;

// ─── Helper: insert a single message row (session-aware) ─────────────────────
async function insertMessage(conn, userId, role, text, sessionId) {
    const safeText = String(text).slice(0, MAX_MSG_LEN);
    await conn.execute(
        `INSERT INTO chat_messages (message_id, user_id, session_id, message_role, message_text, created_at)
         VALUES (:messageId, :userId, :sessionId, :role, :text, CURRENT_TIMESTAMP)`,
        { messageId: uuidv4(), userId, sessionId: sessionId || null, role, text: safeText },
        { autoCommit: true }
    );
}

// ─── GET /api/chat/sessions ───────────────────────────────────────────────────
// Returns all sessions for the authenticated user, newest first.
router.get('/sessions', authenticateUser, async (req, res) => {
    const userId = req.userId;
    let conn;
    try {
        conn = await getConnection();
        const result = await conn.execute(
            `SELECT session_id, title, created_at
             FROM chat_sessions
             WHERE user_id = :userId
             ORDER BY created_at DESC`,
            { userId },
            { outFormat: oracledb.OUT_FORMAT_OBJECT }
        );
        const sessions = result.rows.map(r => ({
            id:        r.SESSION_ID,
            title:     r.TITLE,
            createdAt: r.CREATED_AT
        }));
        res.json({ success: true, sessions });
    } catch (err) {
        console.error('GET /sessions error:', err);
        res.status(500).json({ success: false, message: 'Failed to load sessions.' });
    } finally {
        if (conn) await conn.close().catch(() => {});
    }
});

// ─── POST /api/chat/sessions ──────────────────────────────────────────────────
// Creates a new chat session and returns it.
router.post('/sessions', authenticateUser, async (req, res) => {
    const userId    = req.userId;
    const sessionId = uuidv4();
    const title     = (req.body.title || 'New Chat').slice(0, 200);
    let conn;
    try {
        conn = await getConnection();
        await conn.execute(
            `INSERT INTO chat_sessions (session_id, user_id, title, created_at)
             VALUES (:sessionId, :userId, :title, CURRENT_TIMESTAMP)`,
            { sessionId, userId, title },
            { autoCommit: true }
        );
        res.json({ success: true, session: { id: sessionId, title, createdAt: new Date() } });
    } catch (err) {
        console.error('POST /sessions error:', err);
        res.status(500).json({ success: false, message: 'Failed to create session.' });
    } finally {
        if (conn) await conn.close().catch(() => {});
    }
});

// ─── PATCH /api/chat/sessions/:sessionId/title ────────────────────────────────
// Updates the title of a session (called after first message).
router.patch('/sessions/:sessionId/title', authenticateUser, async (req, res) => {
    const userId    = req.userId;
    const { sessionId } = req.params;
    const title     = (req.body.title || 'Chat').slice(0, 200);
    let conn;
    try {
        conn = await getConnection();
        await conn.execute(
            `UPDATE chat_sessions SET title = :title
             WHERE session_id = :sessionId AND user_id = :userId`,
            { title, sessionId, userId },
            { autoCommit: true }
        );
        res.json({ success: true });
    } catch (err) {
        console.error('PATCH /sessions title error:', err);
        res.status(500).json({ success: false, message: 'Failed to update title.' });
    } finally {
        if (conn) await conn.close().catch(() => {});
    }
});

// ─── GET /api/chat/history/:sessionId ────────────────────────────────────────
// Returns last 20 messages for a session, oldest-first.
router.get('/history/:sessionId', authenticateUser, async (req, res) => {
    const userId    = req.userId;
    const { sessionId } = req.params;
    let conn;
    try {
        conn = await getConnection();
        // Verify session belongs to user
        const check = await conn.execute(
            `SELECT session_id FROM chat_sessions WHERE session_id = :sessionId AND user_id = :userId`,
            { sessionId, userId },
            { outFormat: oracledb.OUT_FORMAT_OBJECT }
        );
        if (!check.rows.length) {
            return res.status(403).json({ success: false, message: 'Session not found.' });
        }

        const result = await conn.execute(
            `SELECT message_id, message_role, message_text, created_at
             FROM (
                 SELECT message_id, message_role, message_text, created_at
                 FROM chat_messages
                 WHERE session_id = :sessionId
                 ORDER BY created_at DESC
             ) WHERE ROWNUM <= 20
             ORDER BY created_at ASC`,
            { sessionId },
            { outFormat: oracledb.OUT_FORMAT_OBJECT }
        );

        const messages = result.rows.map(r => ({
            id:        r.MESSAGE_ID,
            role:      r.MESSAGE_ROLE,
            text:      r.MESSAGE_TEXT,
            timestamp: r.CREATED_AT
        }));
        res.json({ success: true, messages });
    } catch (err) {
        console.error('GET /history/:sessionId error:', err);
        res.status(500).json({ success: false, message: 'Failed to load messages.' });
    } finally {
        if (conn) await conn.close().catch(() => {});
    }
});

// ─── DELETE /api/chat/session/:sessionId ─────────────────────────────────────
// Deletes a session and all its messages.
router.delete('/session/:sessionId', authenticateUser, async (req, res) => {
    const userId    = req.userId;
    const { sessionId } = req.params;
    let conn;
    try {
        conn = await getConnection();
        await conn.execute(
            `DELETE FROM chat_messages WHERE session_id = :sessionId`,
            { sessionId },
            { autoCommit: true }
        );
        await conn.execute(
            `DELETE FROM chat_sessions WHERE session_id = :sessionId AND user_id = :userId`,
            { sessionId, userId },
            { autoCommit: true }
        );
        res.json({ success: true });
    } catch (err) {
        console.error('DELETE /session/:sessionId error:', err);
        res.status(500).json({ success: false, message: 'Failed to delete session.' });
    } finally {
        if (conn) await conn.close().catch(() => {});
    }
});

// Keep old /history route for backward compat (no session)
router.get('/history', authenticateUser, async (req, res) => {
    res.json({ success: true, messages: [] });
});

module.exports = { router, insertMessage };
