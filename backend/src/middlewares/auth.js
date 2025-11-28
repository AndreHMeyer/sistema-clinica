const jwt = require('jsonwebtoken');
const config = require('../config/config');

const authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({ error: 'Token não fornecido' });
  }

  const parts = authHeader.split(' ');

  if (parts.length !== 2) {
    return res.status(401).json({ error: 'Token mal formatado' });
  }

  const [scheme, token] = parts;

  if (!/^Bearer$/i.test(scheme)) {
    return res.status(401).json({ error: 'Token mal formatado' });
  }

  try {
    const decoded = jwt.verify(token, config.jwt.secret);
    req.userId = decoded.id;
    req.userType = decoded.type;
    return next();
  } catch (err) {
    return res.status(401).json({ error: 'Token inválido' });
  }
};

// Middleware para verificar se é paciente
const isPaciente = (req, res, next) => {
  if (req.userType !== 'paciente') {
    return res.status(403).json({ error: 'Acesso negado. Apenas pacientes podem acessar.' });
  }
  return next();
};

// Middleware para verificar se é médico
const isMedico = (req, res, next) => {
  if (req.userType !== 'medico') {
    return res.status(403).json({ error: 'Acesso negado. Apenas médicos podem acessar.' });
  }
  return next();
};

// Middleware para verificar se é administrador
const isAdmin = (req, res, next) => {
  if (req.userType !== 'admin') {
    return res.status(403).json({ error: 'Acesso negado. Apenas administradores podem acessar.' });
  }
  return next();
};

module.exports = { authMiddleware, isPaciente, isMedico, isAdmin };
