const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

router.post('/login', authController.login);
router.get('/logout', authController.logout);
router.get('/api/me', authController.getCurrentUser);

module.exports = router;
