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

// ==========================================
// LOGIN DE MÉDICO
// ==========================================
exports.login = async (req, res) => {
  try {
    const { email, senha } = req.body;

    if (!email || !senha) {
      return res.status(400).json({ error: 'E-mail e senha são obrigatórios' });
    }

    // Buscar médico
    const [medicos] = await db.query(
      `SELECT m.*, e.nome as especialidade_nome 
       FROM medicos m
       INNER JOIN especialidades e ON m.especialidade_id = e.id
       WHERE m.email = ? AND m.ativo = TRUE`,
      [email]
    );

    if (medicos.length === 0) {
      return res.status(401).json({ error: 'E-mail ou senha incorretos' });
    }

    const medico = medicos[0];

    // Verificar senha
    const senhaValida = await bcrypt.compare(senha, medico.senha);
    if (!senhaValida) {
      return res.status(401).json({ error: 'E-mail ou senha incorretos' });
    }

    const token = generateToken(medico.id, 'medico');

    // Remover senha do retorno
    delete medico.senha;

    return res.json({
      message: 'Login realizado com sucesso',
      medico,
      token
    });

  } catch (error) {
    console.error('Erro no login:', error);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// ==========================================
// OBTER PERFIL DO MÉDICO LOGADO
// ==========================================
exports.getProfile = async (req, res) => {
  try {
    const [medicos] = await db.query(
      `SELECT m.id, m.nome, m.crm, m.email, m.telefone, m.especialidade_id,
              e.nome as especialidade_nome
       FROM medicos m
       INNER JOIN especialidades e ON m.especialidade_id = e.id
       WHERE m.id = ? AND m.ativo = TRUE`,
      [req.userId]
    );

    if (medicos.length === 0) {
      return res.status(404).json({ error: 'Médico não encontrado' });
    }

    // Buscar convênios aceitos
    const [convenios] = await db.query(
      `SELECT c.id, c.nome, c.codigo
       FROM convenios c
       INNER JOIN medico_convenios mc ON c.id = mc.convenio_id
       WHERE mc.medico_id = ?`,
      [req.userId]
    );

    const medico = medicos[0];
    medico.convenios = convenios;

    return res.json(medico);

  } catch (error) {
    console.error('Erro ao buscar perfil:', error);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// ==========================================
// ATUALIZAR PERFIL DO MÉDICO
// ==========================================
exports.updateProfile = async (req, res) => {
  try {
    const { nome, telefone } = req.body;

    await db.query(
      `UPDATE medicos SET nome = ?, telefone = ? WHERE id = ?`,
      [nome, telefone, req.userId]
    );

    const [medico] = await db.query(
      `SELECT m.id, m.nome, m.crm, m.email, m.telefone, m.especialidade_id,
              e.nome as especialidade_nome
       FROM medicos m
       INNER JOIN especialidades e ON m.especialidade_id = e.id
       WHERE m.id = ?`,
      [req.userId]
    );

    return res.json({
      message: 'Perfil atualizado com sucesso',
      medico: medico[0]
    });

  } catch (error) {
    console.error('Erro ao atualizar perfil:', error);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
};
