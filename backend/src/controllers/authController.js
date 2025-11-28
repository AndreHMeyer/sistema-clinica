const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/database');
const config = require('../config/config');

// Gerar token JWT
const generateToken = (id, type) => {
  return jwt.sign({ id, type }, config.jwt.secret, {
    expiresIn: config.jwt.expiresIn
  });
};

// Validar CPF
const validarCPF = (cpf) => {
  cpf = cpf.replace(/[^\d]/g, '');
  
  if (cpf.length !== 11) return false;
  
  if (/^(\d)\1{10}$/.test(cpf)) return false;
  
  let soma = 0;
  for (let i = 0; i < 9; i++) {
    soma += parseInt(cpf.charAt(i)) * (10 - i);
  }
  let resto = (soma * 10) % 11;
  if (resto === 10 || resto === 11) resto = 0;
  if (resto !== parseInt(cpf.charAt(9))) return false;
  
  soma = 0;
  for (let i = 0; i < 10; i++) {
    soma += parseInt(cpf.charAt(i)) * (11 - i);
  }
  resto = (soma * 10) % 11;
  if (resto === 10 || resto === 11) resto = 0;
  if (resto !== parseInt(cpf.charAt(10))) return false;
  
  return true;
};

// Formatar CPF
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

    // Validações
    if (!cpf || !nome || !email || !senha || !telefone) {
      return res.status(400).json({ error: 'Todos os campos obrigatórios devem ser preenchidos' });
    }

    // Validar CPF
    if (!validarCPF(cpf)) {
      return res.status(400).json({ error: 'CPF inválido' });
    }

    // Validar senha (8 a 20 caracteres alfanuméricos)
    if (senha.length < 8 || senha.length > 20) {
      return res.status(400).json({ error: 'A senha deve ter entre 8 e 20 caracteres' });
    }

    if (!/^[a-zA-Z0-9]+$/.test(senha)) {
      return res.status(400).json({ error: 'A senha deve conter apenas letras e números' });
    }

    // Validar email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'E-mail inválido' });
    }

    const cpfFormatado = formatarCPF(cpf);

    // Verificar se CPF já existe
    const [cpfExiste] = await db.query('SELECT id FROM pacientes WHERE cpf = ?', [cpfFormatado]);
    if (cpfExiste.length > 0) {
      return res.status(400).json({ error: 'CPF já cadastrado' });
    }

    // Verificar se email já existe
    const [emailExiste] = await db.query('SELECT id FROM pacientes WHERE email = ?', [email]);
    if (emailExiste.length > 0) {
      return res.status(400).json({ error: 'E-mail já cadastrado' });
    }

    // Verificar se convênio existe (se informado)
    if (convenio_id) {
      const [convenio] = await db.query('SELECT id FROM convenios WHERE id = ? AND ativo = TRUE', [convenio_id]);
      if (convenio.length === 0) {
        return res.status(400).json({ error: 'Convênio não encontrado' });
      }
    }

    // Hash da senha
    const senhaHash = await bcrypt.hash(senha, 10);

    // Inserir paciente
    const [result] = await db.query(
      `INSERT INTO pacientes (cpf, nome, email, senha, telefone, convenio_id) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [cpfFormatado, nome, email, senhaHash, telefone, convenio_id || null]
    );

    // Buscar paciente criado
    const [paciente] = await db.query(
      `SELECT p.id, p.cpf, p.nome, p.email, p.telefone, p.convenio_id, c.nome as convenio_nome
       FROM pacientes p
       LEFT JOIN convenios c ON p.convenio_id = c.id
       WHERE p.id = ?`,
      [result.insertId]
    );

    const token = generateToken(result.insertId, 'paciente');

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

    // Buscar paciente
    const [pacientes] = await db.query(
      `SELECT p.*, c.nome as convenio_nome 
       FROM pacientes p
       LEFT JOIN convenios c ON p.convenio_id = c.id
       WHERE p.email = ? AND p.ativo = TRUE`,
      [email]
    );

    if (pacientes.length === 0) {
      return res.status(401).json({ error: 'E-mail ou senha incorretos' });
    }

    const paciente = pacientes[0];

    // Verificar senha
    const senhaValida = await bcrypt.compare(senha, paciente.senha);
    if (!senhaValida) {
      return res.status(401).json({ error: 'E-mail ou senha incorretos' });
    }

    // Verificar se paciente está bloqueado
    if (paciente.bloqueado) {
      return res.status(403).json({ 
        error: 'Sua conta está bloqueada devido a faltas consecutivas. Entre em contato com a administração.' 
      });
    }

    const token = generateToken(paciente.id, 'paciente');

    // Remover senha do retorno
    delete paciente.senha;

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

    // Verificar se convênio existe (se informado)
    if (convenio_id) {
      const [convenio] = await db.query('SELECT id FROM convenios WHERE id = ? AND ativo = TRUE', [convenio_id]);
      if (convenio.length === 0) {
        return res.status(400).json({ error: 'Convênio não encontrado' });
      }
    }

    await db.query(
      `UPDATE pacientes SET nome = ?, telefone = ?, convenio_id = ? WHERE id = ?`,
      [nome, telefone, convenio_id || null, req.userId]
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
