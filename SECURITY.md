# 🔐 Documentação de Segurança - OWASP Top 10:2021

## Sistema Clínica Saúde+

Este documento descreve as medidas de segurança implementadas no sistema seguindo as diretrizes da OWASP Top 10:2021.

---

## ✅ Controles de Segurança Implementados

### A01:2021 – Broken Access Control (Controle de Acesso Quebrado)

**Implementações:**
- ✅ Middleware de autenticação JWT com verificação de tipo de usuário
- ✅ Validação de `req.userId` em todas as rotas protegidas
- ✅ Verificação de propriedade de recursos (paciente só acessa suas consultas, médico só acessa seus horários)
- ✅ Middleware `requireAdmin`, `requireMedico`, `requirePaciente` para controle de acesso baseado em roles
- ✅ Log de tentativas de acesso não autorizado

**Arquivos:**
- `middlewares/auth.js` - Middleware de autenticação com verificação de tipos permitidos
- Todos os controllers verificam propriedade dos recursos

---

### A02:2021 – Cryptographic Failures (Falhas Criptográficas)

**Implementações:**
- ✅ Senhas hash com bcrypt usando **12 salt rounds** (configurável)
- ✅ JWT com algoritmo **HS256** explicitamente definido
- ✅ JWT_SECRET com validação de tamanho mínimo (32 caracteres em produção)
- ✅ Conexão MySQL com charset UTF8MB4

**Arquivos:**
- `config/config.js` - Configuração de bcrypt.saltRounds = 12
- Todos os controllers de auth usam `algorithm: 'HS256'` no jwt.sign()

---

### A03:2021 – Injection (Injeção)

**Implementações:**
- ✅ Todas as queries SQL usam **prepared statements** com parâmetros `?`
- ✅ Middleware de sanitização de entrada (`sanitizeInput`)
- ✅ Validadores para todos os tipos de dados:
  - `isValidEmail()` - Formato de e-mail
  - `isValidCPF()` - CPF brasileiro
  - `isValidCRM()` - Registro médico
  - `isValidId()` - IDs numéricos positivos
  - `isValidDate()` - Datas no formato YYYY-MM-DD
  - `isValidTime()` - Horários no formato HH:MM ou HH:MM:SS
  - `isValidPhone()` - Telefones brasileiros
  - `isValidName()` - Nomes (2-100 caracteres)
- ✅ Sanitização de HTML usando `sanitize-html`
- ✅ Limitação de tamanho de campos (observações: 2000 chars, motivos: 500 chars)

**Arquivos:**
- `middlewares/security.js` - Todos os validadores
- Todos os controllers validam entrada antes de processar

---

### A04:2021 – Insecure Design (Design Inseguro)

**Implementações:**
- ✅ Arquitetura em camadas (routes → controllers → database)
- ✅ Separação de responsabilidades por módulo (paciente, médico, admin)
- ✅ Regras de negócio implementadas no backend (não confiar no frontend)
- ✅ Bloqueio automático de pacientes após 3 faltas

---

### A05:2021 – Security Misconfiguration (Má Configuração de Segurança)

**Implementações:**
- ✅ **Helmet.js** configurado com headers de segurança:
  - `X-XSS-Protection`
  - `X-Content-Type-Options: nosniff`
  - `X-Frame-Options: DENY`
  - `Strict-Transport-Security` (HSTS)
  - `Content-Security-Policy`
  - `Referrer-Policy: strict-origin-when-cross-origin`
- ✅ `X-Powered-By` desabilitado
- ✅ CORS configurado com origens específicas
- ✅ Limite de tamanho do body JSON (10KB)
- ✅ Proteção contra HTTP Parameter Pollution (hpp)
- ✅ Variáveis sensíveis validadas em produção

**Arquivos:**
- `server.js` - Configuração de middlewares de segurança
- `middlewares/security.js` - Headers e CORS

---

### A06:2021 – Vulnerable and Outdated Components

**Recomendações:**
- ⚠️ Manter dependências atualizadas (`npm audit`, `npm update`)
- ⚠️ Usar ferramentas como Snyk ou Dependabot para monitoramento

---

### A07:2021 – Identification and Authentication Failures

**Implementações:**
- ✅ **Rate Limiting** em endpoints de autenticação:
  - Login: 5 tentativas por 15 minutos
  - Registro: 3 tentativas por hora
  - Geral: 100 requisições por 15 minutos
- ✅ **Timing Attack Prevention**: bcrypt.compare sempre executado
- ✅ Validação de força de senha (mínimo 8 chars, maiúscula, minúscula, número)
- ✅ Mensagens de erro genéricas ("E-mail ou senha incorretos")
- ✅ Normalização de e-mail (lowercase, trim)
- ✅ JWT com expiração (24h configurável)
- ✅ Validação de tamanho máximo do token (500 chars)

**Arquivos:**
- `middlewares/security.js` - Rate limiters
- `controllers/authController.js` - Timing attack prevention
- `controllers/medicoAuthController.js` - Timing attack prevention
- `controllers/adminAuthController.js` - Timing attack prevention

---

### A08:2021 – Software and Data Integrity Failures

**Implementações:**
- ✅ CORS restrito a origens autorizadas
- ✅ Validação de todos os dados de entrada
- ✅ Soft delete para registros importantes (médicos, convênios, pacientes)

---

### A09:2021 – Security Logging and Monitoring Failures

**Implementações:**
- ✅ **Security Logger** para eventos críticos:
  - Tentativas de login (sucesso/falha)
  - Tokens inválidos
  - Acessos negados
  - Criação/atualização de registros sensíveis
  - Bloqueio automático de pacientes
  - Cancelamento de consultas
- ✅ Log de IP e User-Agent em eventos de autenticação
- ✅ Logs não expõem informações sensíveis em produção

**Arquivos:**
- `middlewares/security.js` - securityLogger
- Todos os controllers logam eventos importantes

---

### A10:2021 – Server-Side Request Forgery (SSRF)

**Implementações:**
- ✅ Não há funcionalidades que fazem requisições a URLs externas fornecidas pelo usuário
- ✅ Validação de IDs antes de queries ao banco

---

## 📁 Arquivos de Segurança

| Arquivo | Descrição |
|---------|-----------|
| `middlewares/security.js` | Middleware central de segurança |
| `middlewares/auth.js` | Autenticação JWT |
| `config/config.js` | Configurações de segurança |

---

## 🔧 Configuração de Produção

### Variáveis de Ambiente Obrigatórias

```env
NODE_ENV=production
JWT_SECRET=<string com mínimo 32 caracteres>
DB_HOST=<host do banco>
DB_USER=<usuário do banco>
DB_PASSWORD=<senha do banco>
DB_NAME=clinica_saude
```

### Recomendações Adicionais

1. **HTTPS obrigatório** em produção
2. **Firewall** configurado para permitir apenas portas necessárias
3. **Backup** regular do banco de dados
4. **Monitoramento** de logs de segurança
5. **Atualizações** regulares de dependências

---

## 📊 Resumo de Implementações por Controller

| Controller | Validações | Rate Limit | Logging | Timing Safe |
|------------|------------|------------|---------|-------------|
| authController | ✅ | ✅ | ✅ | ✅ |
| medicoAuthController | ✅ | ✅ | ✅ | ✅ |
| adminAuthController | ✅ | ✅ | ✅ | ✅ |
| consultaController | ✅ | - | ✅ | - |
| medicoConsultaController | ✅ | - | ✅ | - |
| medicoHorarioController | ✅ | - | - | - |
| adminMedicoController | ✅ | - | ✅ | - |
| adminPacienteController | ✅ | - | ✅ | - |
| adminConvenioController | ✅ | - | ✅ | - |
| adminRelatorioController | ✅ | - | - | - |

---

## 🚀 Próximos Passos Recomendados

1. [ ] Implementar autenticação de dois fatores (2FA)
2. [ ] Adicionar CAPTCHA em formulários de registro
3. [ ] Implementar rotação de tokens JWT
4. [ ] Adicionar auditoria completa de alterações
5. [ ] Implementar backup automático encriptado
6. [ ] Configurar WAF (Web Application Firewall)
7. [ ] Realizar testes de penetração periódicos

---

*Documento gerado em: ${new Date().toLocaleDateString('pt-BR')}*
*Versão: 1.0*
