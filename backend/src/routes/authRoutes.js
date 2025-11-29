const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authMiddleware, isPaciente } = require('../middlewares/auth');
const { loginLimiter, registerLimiter } = require('../middlewares/security');

// Rotas públicas (com rate limiting específico)
router.post('/register', registerLimiter, authController.register);
router.post('/login', loginLimiter, authController.login);
router.get('/convenios', authController.getConvenios);

// Rotas protegidas (necessita autenticação)
router.get('/profile', authMiddleware, isPaciente, authController.getProfile);
router.put('/profile', authMiddleware, isPaciente, authController.updateProfile);

module.exports = router;
