const express = require('express');
const router = express.Router();
const { authenticateUser } = require('../middleware/auth');
const { recordView, recordDownload, updateProgress } = require('../controllers/activityController');
const getConnection = require('../db/oracle');

// All routes are protected with auth middleware
router.post('/:materialId/view', authenticateUser, (req, res) => {
  req.body.materialId = req.params.materialId;
  recordView(req, res, getConnection);
});

router.post('/:materialId/download', authenticateUser, (req, res) => {
  req.body.materialId = req.params.materialId;
  recordDownload(req, res, getConnection);
});

router.post('/:materialId/progress', authenticateUser, (req, res) => {
  req.body.materialId = req.params.materialId;
  updateProgress(req, res, getConnection);
});

module.exports = router;
