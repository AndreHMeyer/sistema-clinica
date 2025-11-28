const express = require('express');
const router = express.Router();
const consultaController = require('../controllers/consultaController');
const { authMiddleware, isPaciente } = require('../middlewares/auth');

// Rotas públicas (para seleção no agendamento)
router.get('/especialidades', consultaController.getEspecialidades);
router.get('/medicos/especialidade/:especialidadeId', consultaController.getMedicosByEspecialidade);
router.get('/medicos/:medicoId/horarios', consultaController.getHorariosDisponiveis);

// Rotas protegidas (apenas pacientes logados)
router.post('/agendar', authMiddleware, isPaciente, consultaController.agendarConsulta);
router.get('/minhas', authMiddleware, isPaciente, consultaController.getMinhasConsultas);
router.put('/:id/cancelar', authMiddleware, isPaciente, consultaController.cancelarConsulta);
router.put('/:id/remarcar', authMiddleware, isPaciente, consultaController.remarcarConsulta);

module.exports = router;
