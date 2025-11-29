const express = require('express');
const cors = require('cors');
const config = require('./config/config');

// Importar middlewares de segurança
const {
  securityHeaders,
  generalLimiter,
  sanitizeInput,
  securityLogger,
  hppProtection,
  corsOptions
} = require('./middlewares/security');

// Importar rotas
const authRoutes = require('./routes/authRoutes');
const consultaRoutes = require('./routes/consultaRoutes');
const medicoAuthRoutes = require('./routes/medicoAuthRoutes');
const medicoRoutes = require('./routes/medicoRoutes');
const adminRoutes = require('./routes/adminRoutes');

const app = express();

// ==========================================
// MIDDLEWARES DE SEGURANÇA
// ==========================================

// Security Headers (Helmet)
app.use(securityHeaders);

// CORS Seguro
app.use(cors(corsOptions));

// Rate Limiting geral
app.use(generalLimiter);

// HPP Protection
app.use(hppProtection);

// Parse JSON com limite de tamanho
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// Sanitização de inputs
app.use(sanitizeInput);

// Security Logging
app.use(securityLogger);

// Desabilitar header X-Powered-By
app.disable('x-powered-by');

// ==========================================
// ROTAS
// ==========================================

// Rota de health check
app.get('/', (req, res) => {
  res.json({ 
    message: 'API Clínica Saúde+ está funcionando!',
    version: '1.0.0',
    status: 'healthy'
  });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Rotas da API
app.use('/api/auth', authRoutes);
app.use('/api/consultas', consultaRoutes);
app.use('/api/medico/auth', medicoAuthRoutes);
app.use('/api/medico', medicoRoutes);
app.use('/api/admin', adminRoutes);

// ==========================================
// TRATAMENTO DE ERROS
// ==========================================

// Middleware de erro global
app.use((err, req, res, next) => {
  // Log do erro
  console.error(`[ERROR] ${new Date().toISOString()} - ${err.message}`, {
    stack: err.stack,
    path: req.path,
    method: req.method,
    ip: req.ip
  });

  // Não expor detalhes do erro em produção
  const isProduction = process.env.NODE_ENV === 'production';
  
  res.status(err.status || 500).json({ 
    error: isProduction ? 'Erro interno do servidor' : err.message 
  });
});

// Rota 404
app.use((req, res) => {
  res.status(404).json({ error: 'Rota não encontrada' });
});

// ==========================================
// INICIAR SERVIDOR
// ==========================================
app.listen(config.port, () => {
  console.log(`
  ╔════════════════════════════════════════════════╗
  ║     🏥 CLÍNICA SAÚDE+ - API Backend            ║
  ║────────────────────────────────────────────────║
  ║  Servidor rodando na porta ${config.port}              ║
  ║  http://localhost:${config.port}                       ║
  ╚════════════════════════════════════════════════╝
  `);
});
