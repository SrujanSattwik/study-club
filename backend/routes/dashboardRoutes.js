const express = require('express');
const router = express.Router();
const { authenticateUser } = require('../middleware/auth');
const { getDashboard } = require('../controllers/dashboardController');
const getConnection = require('../db/oracle');

router.get('/', authenticateUser, (req, res) => getDashboard(req, res, getConnection));

module.exports = router;
