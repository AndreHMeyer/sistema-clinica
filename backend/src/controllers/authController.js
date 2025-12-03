const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/database');
const config = require('../config/config');
const { validators } = require('../middlewares/security');

const generateToken = (id, type) => {
  return jwt.sign(
    { id, type }, 
    config.jwt.secret, 
    {
      expiresIn: config.jwt.expiresIn,
      algorithm: 'HS256'
    }
  );
};

const formatarCPF = (cpf) => {
  cpf = cpf.replace(/[^\d]/g, '');
  return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
};

// ==========================================
// CADASTRO DE PACIENTE
// ==========================================
exports.register = async (req, res) => {
  try {
    const { cpf, nome, email, senha, telefone, convenio_id } = req.body;

    if (!cpf || !nome || !email || !senha || !telefone) {
      return res.status(400).json({ error: 'Todos os campos obrigatórios devem ser preenchidos' });
    }

    if (!validators.isValidCPF(cpf)) {
      return res.status(400).json({ error: 'CPF inválido' });
    }

    if (!validators.isValidName(nome)) {
      return res.status(400).json({ error: 'Nome inválido. Use apenas letras e espaços (2-150 caracteres)' });
    }

    if (!validators.isValidEmail(email)) {
      return res.status(400).json({ error: 'E-mail inválido' });
    }

    if (!validators.isStrongPassword(senha)) {
      return res.status(400).json({
        error: 'A senha deve conter entre 8 e 20 caracteres, incluindo letra maiúscula, minúscula, número e símbolo'
      });
    }

    if (!validators.isValidPhone(telefone)) {
      return res.status(400).json({ error: 'Telefone inválido' });
    }

    const cpfFormatado = formatarCPF(cpf);

    // Verificar se CPF já existe
    const [cpfExiste] = await db.query('SELECT id FROM pacientes WHERE cpf = ?', [cpfFormatado]);
    if (cpfExiste.length > 0) {
      return res.status(400).json({ error: 'CPF já cadastrado' });
    }

    // Verificar se email já existe
    const [emailExiste] = await db.query('SELECT id FROM pacientes WHERE email = ?', [email.toLowerCase()]);
    if (emailExiste.length > 0) {
      return res.status(400).json({ error: 'E-mail já cadastrado' });
    }

    // Verificar se convênio existe (se informado)
    if (convenio_id) {
      if (!validators.isValidId(convenio_id)) {
        return res.status(400).json({ error: 'ID de convênio inválido' });
      }
      const [convenio] = await db.query('SELECT id FROM convenios WHERE id = ? AND ativo = TRUE', [convenio_id]);
      if (convenio.length === 0) {
        return res.status(400).json({ error: 'Convênio não encontrado' });
      }
    }

    const senhaHash = await bcrypt.hash(senha, config.bcrypt.saltRounds);

    const [result] = await db.query(
      `INSERT INTO pacientes (cpf, nome, email, senha, telefone, convenio_id) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [cpfFormatado, nome.trim(), email.toLowerCase(), senhaHash, telefone, convenio_id || null]
    );

    const [paciente] = await db.query(
      `SELECT p.id, p.cpf, p.nome, p.email, p.telefone, p.convenio_id, c.nome as convenio_nome
       FROM pacientes p
       LEFT JOIN convenios c ON p.convenio_id = c.id
       WHERE p.id = ?`,
      [result.insertId]
    );

    const token = generateToken(result.insertId, 'paciente');

    // Log de registro bem-sucedido
    console.log(`[AUTH] Novo paciente registrado - ID: ${result.insertId} - IP: ${req.ip}`);

    return res.status(201).json({
      message: 'Paciente cadastrado com sucesso',
      paciente: paciente[0],
      token
    });

  } catch (error) {
    console.error('Erro no cadastro:', error);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// ==========================================
// LOGIN DE PACIENTE
// ==========================================
exports.login = async (req, res) => {
  try {
    const { email, senha } = req.body;

    if (!email || !senha) {
      return res.status(400).json({ error: 'E-mail e senha são obrigatórios' });
    }

    if (!validators.isValidEmail(email)) {
      return res.status(400).json({ error: 'E-mail inválido' });
    }

    const [pacientes] = await db.query(
      `SELECT p.*, c.nome as convenio_nome 
       FROM pacientes p
       LEFT JOIN convenios c ON p.convenio_id = c.id
       WHERE LOWER(p.email) = LOWER(?) AND p.ativo = TRUE`,
      [email]
    );

    if (pacientes.length === 0) {
      // Simular tempo de verificação para prevenir timing attacks
      await bcrypt.compare('dummy', '$2a$12$dummy.hash.for.timing.attack.prevention');
      return res.status(401).json({ error: 'E-mail ou senha incorretos' });
    }

    const paciente = pacientes[0];

    // Verificar senha
    const senhaValida = await bcrypt.compare(senha, paciente.senha);
    if (!senhaValida) {
      console.warn(`[AUTH] Tentativa de login falhou - Email: ${email.substring(0, 3)}*** - IP: ${req.ip}`);
      return res.status(401).json({ error: 'E-mail ou senha incorretos' });
    }

    if (paciente.bloqueado) {
      console.warn(`[AUTH] Login bloqueado - Paciente ID: ${paciente.id} - IP: ${req.ip}`);
      return res.status(403).json({ 
        error: 'Sua conta está bloqueada devido a faltas consecutivas. Entre em contato com a administração.' 
      });
    }

    const token = generateToken(paciente.id, 'paciente');
    delete paciente.senha;

    console.log(`[AUTH] Login bem-sucedido - Paciente ID: ${paciente.id} - IP: ${req.ip}`);

    return res.json({
      message: 'Login realizado com sucesso',
      paciente,
      token
    });

  } catch (error) {
    console.error('Erro no login:', error);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// ==========================================
// OBTER PERFIL DO PACIENTE LOGADO
// ==========================================
exports.getProfile = async (req, res) => {
  try {
    // Validar ID do usuário
    if (!validators.isValidId(req.userId)) {
      return res.status(400).json({ error: 'ID inválido' });
    }

    const [pacientes] = await db.query(
      `SELECT p.id, p.cpf, p.nome, p.email, p.telefone, p.convenio_id, 
              p.bloqueado, p.faltas_consecutivas, c.nome as convenio_nome
       FROM pacientes p
       LEFT JOIN convenios c ON p.convenio_id = c.id
       WHERE p.id = ? AND p.ativo = TRUE`,
      [req.userId]
    );

    if (pacientes.length === 0) {
      return res.status(404).json({ error: 'Paciente não encontrado' });
    }

    return res.json(pacientes[0]);

  } catch (error) {
    console.error('Erro ao buscar perfil:', error);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// ==========================================
// ATUALIZAR PERFIL DO PACIENTE
// ==========================================
exports.updateProfile = async (req, res) => {
  try {
    const { nome, telefone, convenio_id } = req.body;

    // Validar ID do usuário
    if (!validators.isValidId(req.userId)) {
      return res.status(400).json({ error: 'ID inválido' });
    }

    // Validar nome se fornecido
    if (nome && !validators.isValidName(nome)) {
      return res.status(400).json({ error: 'Nome inválido' });
    }

    // Validar telefone se fornecido
    if (telefone && !validators.isValidPhone(telefone)) {
      return res.status(400).json({ error: 'Telefone inválido' });
    }

    // Verificar se convênio existe (se informado)
    if (convenio_id) {
      if (!validators.isValidId(convenio_id)) {
        return res.status(400).json({ error: 'ID de convênio inválido' });
      }
      const [convenio] = await db.query('SELECT id FROM convenios WHERE id = ? AND ativo = TRUE', [convenio_id]);
      if (convenio.length === 0) {
        return res.status(400).json({ error: 'Convênio não encontrado' });
      }
    }

    await db.query(
      `UPDATE pacientes SET nome = ?, telefone = ?, convenio_id = ? WHERE id = ?`,
      [nome?.trim(), telefone, convenio_id || null, req.userId]
    );

    const [paciente] = await db.query(
      `SELECT p.id, p.cpf, p.nome, p.email, p.telefone, p.convenio_id, c.nome as convenio_nome
       FROM pacientes p
       LEFT JOIN convenios c ON p.convenio_id = c.id
       WHERE p.id = ?`,
      [req.userId]
    );

    return res.json({
      message: 'Perfil atualizado com sucesso',
      paciente: paciente[0]
    });

  } catch (error) {
    console.error('Erro ao atualizar perfil:', error);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// ==========================================
// LISTAR CONVÊNIOS
// ==========================================
exports.getConvenios = async (req, res) => {
  try {
    const [convenios] = await db.query(
      'SELECT id, nome, codigo FROM convenios WHERE ativo = TRUE ORDER BY nome'
    );
    return res.json(convenios);
  } catch (error) {
    console.error('Erro ao buscar convênios:', error);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
};
