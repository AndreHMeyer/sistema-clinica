const express = require('express');
const router = express.Router();
const medicoHorarioController = require('../controllers/medicoHorarioController');
const medicoConsultaController = require('../controllers/medicoConsultaController');
const { authMiddleware, isMedico } = require('../middlewares/auth');

// Todas as rotas requerem autenticação de médico
router.use(authMiddleware, isMedico);

// ========== DASHBOARD ==========
router.get('/dashboard', medicoConsultaController.getDashboard);

// ========== HORÁRIOS DE ATENDIMENTO ==========
router.get('/horarios', medicoHorarioController.getHorarios);
router.post('/horarios', medicoHorarioController.addHorario);
router.put('/horarios/:id', medicoHorarioController.updateHorario);
router.delete('/horarios/:id', medicoHorarioController.deleteHorario);

// ========== BLOQUEIOS DE HORÁRIO ==========
router.get('/bloqueios', medicoHorarioController.getBloqueios);
router.post('/bloqueios', medicoHorarioController.addBloqueio);
router.delete('/bloqueios/:id', medicoHorarioController.deleteBloqueio);

// ========== CONSULTAS ==========
router.get('/consultas', medicoConsultaController.getConsultas);
router.get('/consultas/:id', medicoConsultaController.getConsultaById);
router.put('/consultas/:id/observacoes', medicoConsultaController.registrarObservacoes);
router.put('/consultas/:id/realizada', medicoConsultaController.marcarRealizada);
router.put('/consultas/:id/falta', medicoConsultaController.marcarFalta);
router.put('/consultas/:id/cancelar', medicoConsultaController.cancelarConsulta);

module.exports = router;
