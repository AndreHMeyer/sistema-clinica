const express = require('express');
const router = express.Router();
const medicoAuthController = require('../controllers/medicoAuthController');
const { authMiddleware, isMedico } = require('../middlewares/auth');
const { loginLimiter } = require('../middlewares/security');

// Rotas públicas (com rate limiting)
router.post('/login', loginLimiter, medicoAuthController.login);

// Rotas protegidas (necessita autenticação de médico)
router.get('/profile', authMiddleware, isMedico, medicoAuthController.getProfile);
router.put('/profile', authMiddleware, isMedico, medicoAuthController.updateProfile);

module.exports = router;
