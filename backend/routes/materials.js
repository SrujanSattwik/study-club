const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const getConnection = require('../db/oracle');

const UPLOADS_DIR = path.join(__dirname, '../uploads');

// Multer storage configuration
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const type = req.body.type || 'notes';
        const typeMap = { textbook: 'textbooks', video: 'videos', audio: 'audio', notes: 'notes' };
        const folder = typeMap[type] || 'notes';
        cb(null, path.join(UPLOADS_DIR, folder));
    },
    filename: (req, file, cb) => {
        const uniqueName = `${uuidv4()}${path.extname(file.originalname)}`;
        cb(null, uniqueName);
    }
});

const upload = multer({ 
    storage,
    limits: { fileSize: 500 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        const allowedExts = ['.pdf', '.mp4', '.mp3', '.avi', '.mov', '.wav', '.m4a', '.jpg', '.png'];
        const ext = path.extname(file.originalname).toLowerCase();
        if (allowedExts.includes(ext)) cb(null, true);
        else cb(new Error('Invalid file type'));
    }
});

// Auto-detect type and format
const detectTypeAndFormat = (file, link) => {
    if (file) {
        const ext = path.extname(file.originalname).toLowerCase();
        if (ext === '.pdf') return { type: 'textbook', format: 'pdf' };
        if (['.mp4', '.avi', '.mov'].includes(ext)) return { type: 'video', format: ext.slice(1) };
        if (['.mp3', '.wav', '.m4a'].includes(ext)) return { type: 'audio', format: ext.slice(1) };
        return { type: 'notes', format: ext.slice(1) };
    }
    if (link) {
        if (link.includes('youtube.com') || link.includes('youtu.be')) return { type: 'video', format: 'link' };
        if (link.includes('soundcloud') || link.includes('spotify')) return { type: 'audio', format: 'link' };
        return { type: 'notes', format: 'link' };
    }
    return { type: 'notes', format: 'link' };
};

// GET /api/materials - Paginated fetch from Oracle DB
router.get('/', async (req, res) => {
    let connection;
    try {
        connection = await getConnection();
        const { type, page = 1, limit = 50 } = req.query;
        
        let query = 'SELECT * FROM materials';
        const binds = {};
        
        if (type) {
            query += ' WHERE type = :type';
            binds.type = type;
        }
        
        query += ' ORDER BY created_at DESC';
        
        const result = await connection.execute(query, binds);
        const materials = result.rows.map(row => ({
            id: row.ID || row[0],
            title: row.TITLE || row[1],
            description: row.DESCRIPTION || row[2],
            type: row.TYPE || row[3],
            format: row.FORMAT || row[4],
            filePath: row.FILE_PATH || row[5],
            link: row.LINK || row[6],
            thumbnail: row.THUMBNAIL || row[7],
            downloadCount: row.DOWNLOAD_COUNT || row[8] || 0,
            author: row.AUTHOR || row[10] || 'Anonymous',
            createdAt: row.CREATED_AT || row[9]
        }));
        
        // Pagination
        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);
        const startIndex = (pageNum - 1) * limitNum;
        const endIndex = startIndex + limitNum;
        const paginatedMaterials = materials.slice(startIndex, endIndex);
        
        res.json({
            success: true,
            page: pageNum,
            totalPages: Math.ceil(materials.length / limitNum),
            totalItems: materials.length,
            materials: paginatedMaterials
        });
    } catch (error) {
        console.error('Database error:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch materials', message: error.message });
    } finally {
        if (connection) {
            try {
                await connection.close();
            } catch (err) {
                console.error('Error closing connection:', err);
            }
        }
    }
});

// POST /api/materials - Upload material to Oracle DB
router.post('/', upload.single('file'), async (req, res) => {
    let connection;
    try {
        const { title, description, link, type: manualType, author, category } = req.body;
        const file = req.file;
        
        console.log('📝 Upload request:', { title, author, manualType, hasFile: !!file, link });
        
        if (!title || title.trim() === '') {
            return res.status(400).json({ success: false, error: 'Title is required' });
        }
        
        if (!file && !link) {
            return res.status(400).json({ success: false, error: 'Either file or link is required' });
        }
        
        const { type, format } = manualType ? 
            { type: manualType, format: file ? path.extname(file.originalname).slice(1) : 'link' } :
            detectTypeAndFormat(file, link);
        
        const id = uuidv4();
        const filePath = file ? `/uploads/${type === 'textbook' ? 'textbooks' : type === 'video' ? 'videos' : type === 'audio' ? 'audio' : 'notes'}/${file.filename}` : null;
        
        connection = await getConnection();
        await connection.execute(
            `INSERT INTO materials (id, title, description, type, format, file_path, link, thumbnail, download_count, created_at, author)
             VALUES (:id, :title, :description, :type, :format, :filePath, :link, :thumbnail, :downloadCount, CURRENT_TIMESTAMP, :author)`,
            {
                id,
                title: title.trim(),
                description: (description || '').trim(),
                type,
                format,
                filePath,
                link: link || null,
                thumbnail: null,
                downloadCount: 0,
                author: (author || 'Anonymous').trim()
            },
            { autoCommit: true }
        );
        
        console.log('✅ Material uploaded successfully:', id);
        
        res.status(201).json({
            success: true,
            material: {
                id,
                title: title.trim(),
                description: (description || '').trim(),
                type,
                format,
                filePath,
                link: link || null,
                thumbnail: null,
                downloadCount: 0,
                author: (author || 'Anonymous').trim(),
                createdAt: new Date().toISOString()
            }
        });
    } catch (error) {
        console.error('❌ Database error:', error);
        res.status(500).json({ success: false, error: error.message || 'Failed to upload material' });
    } finally {
        if (connection) {
            try {
                await connection.close();
            } catch (err) {
                console.error('Error closing connection:', err);
            }
        }
    }
});

// POST /api/materials/:id/download - Increment download count in Oracle DB (PUBLIC)
router.post('/:id/download', async (req, res) => {
    let connection;
    try {
        const { id } = req.params;
        
        if (!id) {
            return res.status(400).json({ success: false, error: 'Material ID is required' });
        }
        
        connection = await getConnection();
        
        // Check if material exists first
        const checkResult = await connection.execute(
            'SELECT download_count FROM materials WHERE id = :id',
            { id }
        );
        
        if (checkResult.rows.length === 0) {
            return res.status(404).json({ success: false, error: 'Material not found' });
        }
        
        // Update download count
        await connection.execute(
            'UPDATE materials SET download_count = download_count + 1 WHERE id = :id',
            { id },
            { autoCommit: true }
        );
        
        // Get updated count
        const result = await connection.execute(
            'SELECT download_count FROM materials WHERE id = :id',
            { id }
        );
        
        const downloadCount = result.rows[0].DOWNLOAD_COUNT || result.rows[0][0] || 0;
        
        res.json({ success: true, downloadCount });
    } catch (error) {
        console.error('❌ Database error:', error);
        res.status(500).json({ success: false, error: 'Failed to update download count' });
    } finally {
        if (connection) {
            try {
                await connection.close();
            } catch (err) {
                console.error('Error closing connection:', err);
            }
        }
    }
});

module.exports = router;
