const express = require('express');
const router = express.Router();
const adminAuthController = require('../controllers/adminAuthController');
const adminMedicoController = require('../controllers/adminMedicoController');
const adminConvenioController = require('../controllers/adminConvenioController');
const adminRelatorioController = require('../controllers/adminRelatorioController');
const adminPacienteController = require('../controllers/adminPacienteController');
const { authMiddleware, isAdmin } = require('../middlewares/auth');

// ==========================================
// ROTAS PÚBLICAS (LOGIN)
// ==========================================
router.post('/login', adminAuthController.login);

// ==========================================
// MIDDLEWARE DE AUTENTICAÇÃO ADMIN
// ==========================================
router.use(authMiddleware);
router.use(isAdmin);

// ==========================================
// ROTAS DE PERFIL E DASHBOARD
// ==========================================
router.get('/perfil', adminAuthController.getProfile);
router.get('/dashboard', adminAuthController.getDashboard);

// ==========================================
// ROTAS DE GESTÃO DE MÉDICOS
// ==========================================
router.get('/medicos', adminMedicoController.listarMedicos);
router.get('/medicos/:id', adminMedicoController.buscarMedico);
router.post('/medicos', adminMedicoController.criarMedico);
router.put('/medicos/:id', adminMedicoController.atualizarMedico);
router.delete('/medicos/:id', adminMedicoController.deletarMedico);

// Listas auxiliares para cadastro de médicos
router.get('/especialidades', adminMedicoController.listarEspecialidades);
router.get('/convenios-lista', adminMedicoController.listarConvenios);

// ==========================================
// ROTAS DE GESTÃO DE CONVÊNIOS
// ==========================================
router.get('/convenios', adminConvenioController.listarConvenios);
router.get('/convenios/estatisticas', adminConvenioController.estatisticasConvenios);
router.get('/convenios/:id', adminConvenioController.buscarConvenio);
router.post('/convenios', adminConvenioController.criarConvenio);
router.put('/convenios/:id', adminConvenioController.atualizarConvenio);
router.delete('/convenios/:id', adminConvenioController.deletarConvenio);

// ==========================================
// ROTAS DE RELATÓRIOS
// ==========================================
router.get('/relatorios/consultas', adminRelatorioController.relatorioConsultasPeriodo);
router.get('/relatorios/medicos', adminRelatorioController.relatorioMedicos);
router.get('/relatorios/especialidades', adminRelatorioController.relatorioEspecialidades);
router.get('/relatorios/pacientes-frequentes', adminRelatorioController.relatorioPacientesFrequentes);
router.get('/relatorios/cancelamentos', adminRelatorioController.relatorioCancelamentos);

// Rotas de PDF
router.get('/relatorios/pdf/consultas', adminRelatorioController.gerarPDFConsultas);
router.get('/relatorios/pdf/medicos', adminRelatorioController.gerarPDFMedicos);

// ==========================================
// ROTAS DE GESTÃO DE PACIENTES
// ==========================================
router.get('/pacientes', adminPacienteController.listarPacientes);
router.get('/pacientes/bloqueados', adminPacienteController.listarPacientesBloqueados);
router.get('/pacientes/:id', adminPacienteController.buscarPaciente);
router.post('/pacientes/:id/desbloquear', adminPacienteController.desbloquearPaciente);
router.post('/pacientes/:id/bloquear', adminPacienteController.bloquearPaciente);
router.patch('/pacientes/:id/toggle-ativo', adminPacienteController.toggleAtivoPaciente);

module.exports = router;
