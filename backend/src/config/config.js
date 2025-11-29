require('dotenv').config();

/**
 * Configurações da aplicação
 */

// Validar variáveis de ambiente obrigatórias em produção
const isProduction = process.env.NODE_ENV === 'production';

if (isProduction) {
  const requiredEnvVars = ['DB_HOST', 'DB_USER', 'DB_PASSWORD', 'DB_NAME', 'JWT_SECRET'];
  const missing = requiredEnvVars.filter(v => !process.env[v]);
  if (missing.length > 0) {
    console.error(`[FATAL] Variáveis de ambiente obrigatórias não definidas: ${missing.join(', ')}`);
    process.exit(1);
  }

  // Validar JWT_SECRET forte em produção
  if (process.env.JWT_SECRET && process.env.JWT_SECRET.length < 32) {
    console.error('[FATAL] JWT_SECRET deve ter pelo menos 32 caracteres em produção');
    process.exit(1);
  }
}

module.exports = {
  db: {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'clinica_saude',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    connectTimeout: 10000,
    charset: 'utf8mb4'
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'clinica_saude_secret_key_2025_dev_only',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    algorithm: 'HS256'
  },
  port: process.env.PORT || 3001,
  nodeEnv: process.env.NODE_ENV || 'development',
  
  bcrypt: {
    saltRounds: 12
  }
};
