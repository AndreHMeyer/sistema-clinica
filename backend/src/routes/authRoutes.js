const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authMiddleware, isPaciente } = require('../middlewares/auth');

// Rotas públicas
router.post('/register', authController.register);
router.post('/login', authController.login);
router.get('/convenios', authController.getConvenios);

// Rotas protegidas (necessita autenticação)
router.get('/profile', authMiddleware, isPaciente, authController.getProfile);
router.put('/profile', authMiddleware, isPaciente, authController.updateProfile);

module.exports = router;
