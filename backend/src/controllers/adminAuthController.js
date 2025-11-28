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
// LOGIN DE ADMINISTRADOR
// ==========================================
exports.login = async (req, res) => {
  try {
    const { email, senha } = req.body;

    if (!email || !senha) {
      return res.status(400).json({ error: 'E-mail e senha são obrigatórios' });
    }

    const [admins] = await db.query(
      'SELECT * FROM administradores WHERE email = ? AND ativo = TRUE',
      [email]
    );

    if (admins.length === 0) {
      return res.status(401).json({ error: 'E-mail ou senha incorretos' });
    }

    const admin = admins[0];

    const senhaValida = await bcrypt.compare(senha, admin.senha);
    if (!senhaValida) {
      return res.status(401).json({ error: 'E-mail ou senha incorretos' });
    }

    const token = generateToken(admin.id, 'admin');
    delete admin.senha;

    return res.json({
      message: 'Login realizado com sucesso',
      admin,
      token
    });

  } catch (error) {
    console.error('Erro no login:', error);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// ==========================================
// OBTER PERFIL DO ADMIN
// ==========================================
exports.getProfile = async (req, res) => {
  try {
    const [admins] = await db.query(
      'SELECT id, nome, email FROM administradores WHERE id = ? AND ativo = TRUE',
      [req.userId]
    );

    if (admins.length === 0) {
      return res.status(404).json({ error: 'Administrador não encontrado' });
    }

    return res.json(admins[0]);
  } catch (error) {
    console.error('Erro ao buscar perfil:', error);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// ==========================================
// DASHBOARD ADMINISTRATIVO
// ==========================================
exports.getDashboard = async (req, res) => {
  try {
    // Total de pacientes
    const [totalPacientes] = await db.query(
      'SELECT COUNT(*) as total FROM pacientes WHERE ativo = TRUE'
    );

    // Total de médicos
    const [totalMedicos] = await db.query(
      'SELECT COUNT(*) as total FROM medicos WHERE ativo = TRUE'
    );

    // Consultas do mês
    const [consultasMes] = await db.query(
      `SELECT COUNT(*) as total FROM consultas 
       WHERE MONTH(data_consulta) = MONTH(CURDATE()) 
       AND YEAR(data_consulta) = YEAR(CURDATE())`
    );

    // Consultas de hoje
    const [consultasHoje] = await db.query(
      `SELECT COUNT(*) as total FROM consultas 
       WHERE data_consulta = CURDATE() AND status IN ('agendada', 'remarcada')`
    );

    // Taxa de cancelamento do mês
    const [cancelamentos] = await db.query(
      `SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status = 'cancelada' THEN 1 ELSE 0 END) as canceladas
       FROM consultas 
       WHERE MONTH(data_consulta) = MONTH(CURDATE()) 
       AND YEAR(data_consulta) = YEAR(CURDATE())`
    );

    const taxaCancelamento = cancelamentos[0].total > 0 
      ? ((cancelamentos[0].canceladas / cancelamentos[0].total) * 100).toFixed(1)
      : 0;

    // Pacientes bloqueados
    const [pacientesBloqueados] = await db.query(
      'SELECT COUNT(*) as total FROM pacientes WHERE bloqueado = TRUE'
    );

    // Consultas por status do mês
    const [consultasPorStatus] = await db.query(
      `SELECT status, COUNT(*) as total FROM consultas 
       WHERE MONTH(data_consulta) = MONTH(CURDATE()) 
       AND YEAR(data_consulta) = YEAR(CURDATE())
       GROUP BY status`
    );

    return res.json({
      totalPacientes: totalPacientes[0].total,
      totalMedicos: totalMedicos[0].total,
      consultasMes: consultasMes[0].total,
      consultasHoje: consultasHoje[0].total,
      taxaCancelamento,
      pacientesBloqueados: pacientesBloqueados[0].total,
      consultasPorStatus
    });

  } catch (error) {
    console.error('Erro ao buscar dashboard:', error);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
};
