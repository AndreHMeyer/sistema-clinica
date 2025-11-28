const express = require('express');
const cors = require('cors');
const config = require('./config/config');

// Importar rotas
const authRoutes = require('./routes/authRoutes');
const consultaRoutes = require('./routes/consultaRoutes');
const medicoAuthRoutes = require('./routes/medicoAuthRoutes');
const medicoRoutes = require('./routes/medicoRoutes');
const adminRoutes = require('./routes/adminRoutes');

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// Rota de teste
app.get('/', (req, res) => {
  res.json({ 
    message: 'API Clínica Saúde+ está funcionando!',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      consultas: '/api/consultas'
    }
  });
});

// Rotas da API
app.use('/api/auth', authRoutes);
app.use('/api/consultas', consultaRoutes);
app.use('/api/medico/auth', medicoAuthRoutes);
app.use('/api/medico', medicoRoutes);
app.use('/api/admin', adminRoutes);

// Middleware de erro
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Erro interno do servidor' });
});

// Rota 404
app.use((req, res) => {
  res.status(404).json({ error: 'Rota não encontrada' });
});

// Iniciar servidor
app.listen(config.port, () => {
  console.log(`
  ╔════════════════════════════════════════════╗
  ║     🏥 CLÍNICA SAÚDE+ - API Backend        ║
  ║────────────────────────────────────────────║
  ║  Servidor rodando na porta ${config.port}            ║
  ║  http://localhost:${config.port}                     ║
  ╚════════════════════════════════════════════╝
  `);
});
