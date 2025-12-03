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

  if (token.length > 500) {
    return res.status(401).json({ error: 'Token inválido' });
  }

  try {
    const decoded = jwt.verify(token, config.jwt.secret, {
      algorithms: ['HS256'],
      maxAge: config.jwt.expiresIn
    });
    
    if (!decoded.id || !decoded.type) {
      return res.status(401).json({ error: 'Token inválido' });
    }

    const allowedTypes = ['paciente', 'medico', 'admin'];
    if (!allowedTypes.includes(decoded.type)) {
      return res.status(401).json({ error: 'Token inválido' });
    }

    req.userId = decoded.id;
    req.userType = decoded.type;
    return next();
  } catch (err) {
    console.warn(`[AUTH] Token inválido - IP: ${req.ip} - Error: ${err.message}`);
    
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expirado' });
    }
    return res.status(401).json({ error: 'Token inválido' });
  }
};

const isPaciente = (req, res, next) => {
  if (req.userType !== 'paciente') {
    console.warn(`[ACCESS] Tentativa de acesso negado - UserType: ${req.userType} - Route: ${req.path} - IP: ${req.ip}`);
    return res.status(403).json({ error: 'Acesso negado. Apenas pacientes podem acessar.' });
  }
  return next();
};

const isMedico = (req, res, next) => {
  if (req.userType !== 'medico') {
    console.warn(`[ACCESS] Tentativa de acesso negado - UserType: ${req.userType} - Route: ${req.path} - IP: ${req.ip}`);
    return res.status(403).json({ error: 'Acesso negado. Apenas médicos podem acessar.' });
  }
  return next();
};

const isAdmin = (req, res, next) => {
  if (req.userType !== 'admin') {
    console.warn(`[ACCESS] Tentativa de acesso negado - UserType: ${req.userType} - Route: ${req.path} - IP: ${req.ip}`);
    return res.status(403).json({ error: 'Acesso negado. Apenas administradores podem acessar.' });
  }
  return next();
};

module.exports = { authMiddleware, isPaciente, isMedico, isAdmin };
