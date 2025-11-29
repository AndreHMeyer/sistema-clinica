/**
 * Middlewares de Segurança
 */

const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const hpp = require('hpp');
const sanitizeHtml = require('sanitize-html');
const validator = require('validator');

// ==========================================
// SECURITY HEADERS (Helmet)
// ==========================================
const securityHeaders = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
  crossOriginEmbedderPolicy: false, // Necessário para algumas funcionalidades
  hsts: {
    maxAge: 31536000, // 1 ano
    includeSubDomains: true,
    preload: true
  },
  noSniff: true,
  xssFilter: true,
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' }
});

// ==========================================
// RATE LIMITING - Proteção contra Brute Force
// ==========================================

// Rate limit geral para API
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // máximo 100 requisições por IP
  message: { error: 'Muitas requisições. Tente novamente em 15 minutos.' },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Skip para rotas públicas de health check
    return req.path === '/' || req.path === '/health';
  }
});

// Rate limit específico para login (mais restritivo)
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 5, // máximo 5 tentativas de login
  message: { error: 'Muitas tentativas de login. Tente novamente em 15 minutos.' },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true // Não conta tentativas bem-sucedidas
});

// Rate limit para criação de conta
const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hora
  max: 5, // máximo 5 registros por hora por IP
  message: { error: 'Muitos cadastros. Tente novamente mais tarde.' },
  standardHeaders: true,
  legacyHeaders: false
});

// ==========================================
// INPUT SANITIZATION - Proteção contra XSS/Injection
// ==========================================
const sanitizeInput = (req, res, next) => {
  // Sanitizar body
  if (req.body) {
    req.body = sanitizeObject(req.body);
  }
  
  // Sanitizar query params
  if (req.query) {
    req.query = sanitizeObject(req.query);
  }
  
  // Sanitizar params
  if (req.params) {
    req.params = sanitizeObject(req.params);
  }
  
  next();
};

// Função recursiva para sanitizar objetos
const sanitizeObject = (obj) => {
  if (typeof obj === 'string') {
    // Remove HTML tags e escapa caracteres perigosos
    let sanitized = sanitizeHtml(obj, {
      allowedTags: [],
      allowedAttributes: {}
    });
    // Trim whitespace
    sanitized = sanitized.trim();
    return sanitized;
  }
  
  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeObject(item));
  }
  
  if (obj !== null && typeof obj === 'object') {
    const sanitized = {};
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        // Sanitiza também as chaves (previne prototype pollution)
        const safeKey = sanitizeHtml(key, { allowedTags: [], allowedAttributes: {} });
        if (safeKey !== '__proto__' && safeKey !== 'constructor' && safeKey !== 'prototype') {
          sanitized[safeKey] = sanitizeObject(obj[key]);
        }
      }
    }
    return sanitized;
  }
  
  return obj;
};

// ==========================================
// VALIDAÇÃO DE INPUTS
// ==========================================
const validators = {
  // Validar email
  isValidEmail: (email) => {
    if (!email || typeof email !== 'string') return false;
    return validator.isEmail(email) && email.length <= 150;
  },

  // Validar CPF (apenas números, 11 dígitos)
  isValidCPF: (cpf) => {
    if (!cpf || typeof cpf !== 'string') return false;
    const cpfLimpo = cpf.replace(/[^\d]/g, '');
    if (cpfLimpo.length !== 11) return false;
    if (/^(\d)\1{10}$/.test(cpfLimpo)) return false;
    
    // Validação dos dígitos verificadores
    let soma = 0;
    for (let i = 0; i < 9; i++) {
      soma += parseInt(cpfLimpo.charAt(i)) * (10 - i);
    }
    let resto = (soma * 10) % 11;
    if (resto === 10 || resto === 11) resto = 0;
    if (resto !== parseInt(cpfLimpo.charAt(9))) return false;
    
    soma = 0;
    for (let i = 0; i < 10; i++) {
      soma += parseInt(cpfLimpo.charAt(i)) * (11 - i);
    }
    resto = (soma * 10) % 11;
    if (resto === 10 || resto === 11) resto = 0;
    if (resto !== parseInt(cpfLimpo.charAt(10))) return false;
    
    return true;
  },

  // Validar senha forte
  isStrongPassword: (senha) => {
    if (!senha || typeof senha !== 'string') return false;
    // 8-20 caracteres, maiúscula, minúscula, número e símbolo
    return validator.isStrongPassword(senha, {
      minLength: 8,
      minLowercase: 1,
      minUppercase: 1,
      minNumbers: 1,
      minSymbols: 1
    }) && senha.length <= 20;
  },

  // Validar ID numérico (previne SQL injection)
  isValidId: (id) => {
    if (id === undefined || id === null) return false;
    const numId = Number(id);
    return Number.isInteger(numId) && numId > 0 && numId < 2147483647;
  },

  // Validar data (formato YYYY-MM-DD)
  isValidDate: (date) => {
    if (!date || typeof date !== 'string') return false;
    return validator.isDate(date, { format: 'YYYY-MM-DD', strictMode: true });
  },

  // Validar hora (formato HH:MM ou HH:MM:SS)
  isValidTime: (time) => {
    if (!time || typeof time !== 'string') return false;
    return /^([01]\d|2[0-3]):([0-5]\d)(:[0-5]\d)?$/.test(time);
  },

  // Validar telefone brasileiro
  isValidPhone: (phone) => {
    if (!phone || typeof phone !== 'string') return false;
    const phoneLimpo = phone.replace(/[^\d]/g, '');
    return phoneLimpo.length >= 10 && phoneLimpo.length <= 11;
  },

  // Validar CRM
  isValidCRM: (crm) => {
    if (!crm || typeof crm !== 'string') return false;
    // CRM: letras e números, 4-20 caracteres
    return /^[A-Za-z0-9]{4,20}$/.test(crm.trim());
  },

  // Validar nome (sem caracteres especiais perigosos)
  isValidName: (name) => {
    if (!name || typeof name !== 'string') return false;
    const trimmed = name.trim();
    // Permite letras, espaços, acentos, apóstrofos e hífens
    return trimmed.length >= 2 && 
           trimmed.length <= 150 && 
           /^[a-zA-ZÀ-ÿ\s'-]+$/.test(trimmed);
  },

  // Sanitizar e limitar tamanho de texto
  sanitizeText: (text, maxLength = 500) => {
    if (!text || typeof text !== 'string') return '';
    return sanitizeHtml(text, { allowedTags: [], allowedAttributes: {} })
      .trim()
      .substring(0, maxLength);
  }
};

// ==========================================
// SECURITY LOGGING
// ==========================================
const securityLogger = (req, res, next) => {
  // Log de requisições suspeitas
  const suspiciousPatterns = [
    /(\%27)|(\')|(\-\-)|(\%23)|(#)/i, // SQL injection
    /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, // XSS
    /\.\.\//g, // Path traversal
    /\0/g // Null byte injection
  ];

  const fullUrl = req.originalUrl || req.url;
  const body = JSON.stringify(req.body || {});
  
  for (const pattern of suspiciousPatterns) {
    if (pattern.test(fullUrl) || pattern.test(body)) {
      console.warn(`[SECURITY WARNING] Possível tentativa de ataque detectada:
        IP: ${req.ip || req.connection.remoteAddress}
        URL: ${fullUrl}
        Method: ${req.method}
        User-Agent: ${req.get('User-Agent')}
        Timestamp: ${new Date().toISOString()}
      `);
      break;
    }
  }

  // Log de tentativas de autenticação
  if (req.path.includes('/login')) {
    const logData = {
      type: 'AUTH_ATTEMPT',
      ip: req.ip || req.connection.remoteAddress,
      email: req.body?.email ? req.body.email.substring(0, 3) + '***' : 'N/A',
      timestamp: new Date().toISOString(),
      userAgent: req.get('User-Agent')
    };
    console.log(`[AUTH LOG] ${JSON.stringify(logData)}`);
  }

  next();
};

// ==========================================
// HPP - HTTP Parameter Pollution Protection
// ==========================================
const hppProtection = hpp({
  whitelist: ['convenio_ids'] // Permitir arrays específicos
});

// ==========================================
// CORS Seguro
// ==========================================
const corsOptions = {
  origin: function (origin, callback) {
    // Lista de origens permitidas
    const allowedOrigins = [
      'http://localhost:5173',
      'http://localhost:3000',
      'http://127.0.0.1:5173',
      'http://127.0.0.1:3000'
    ];
    
    // Permitir requisições sem origin (mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.warn(`[CORS] Origem bloqueada: ${origin}`);
      callback(new Error('Não permitido pelo CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  exposedHeaders: ['X-Total-Count'],
  maxAge: 86400 // 24 horas
};

module.exports = {
  securityHeaders,
  generalLimiter,
  loginLimiter,
  registerLimiter,
  sanitizeInput,
  validators,
  securityLogger,
  hppProtection,
  corsOptions
};
