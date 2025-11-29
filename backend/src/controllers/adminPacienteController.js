const db = require('../config/database');
const { validators } = require('../middlewares/security');

// ==========================================
// LISTAR TODOS OS PACIENTES
// ==========================================
exports.listarPacientes = async (req, res) => {
  try {
    const { bloqueados, busca } = req.query;

    let query = `
      SELECT p.id, p.nome, p.cpf, p.email, p.telefone,
             p.bloqueado, p.faltas_consecutivas, p.ativo, p.created_at,
             c.nome as convenio_nome
      FROM pacientes p
      LEFT JOIN convenios c ON p.convenio_id = c.id
      WHERE 1=1
    `;
    const params = [];

    if (bloqueados === 'true') {
      query += ' AND p.bloqueado = TRUE';
    }

    // Sanitizar busca (limitar tamanho e caracteres especiais)
    if (busca) {
      const buscaSanitizada = String(busca).substring(0, 100).trim();
      query += ' AND (p.nome LIKE ? OR p.cpf LIKE ? OR p.email LIKE ?)';
      params.push(`%${buscaSanitizada}%`, `%${buscaSanitizada}%`, `%${buscaSanitizada}%`);
    }

    query += ' ORDER BY p.bloqueado DESC, p.nome ASC';

    const [pacientes] = await db.query(query, params);

    return res.json(pacientes);
  } catch (error) {
    console.error('Erro ao listar pacientes:', error);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// ==========================================
// BUSCAR PACIENTE POR ID
// ==========================================
exports.buscarPaciente = async (req, res) => {
  try {
    const { id } = req.params;

    // Validar ID
    if (!validators.isValidId(id)) {
      return res.status(400).json({ error: 'ID inválido' });
    }

    const [pacientes] = await db.query(`
      SELECT p.*, c.nome as convenio_nome
      FROM pacientes p
      LEFT JOIN convenios c ON p.convenio_id = c.id
      WHERE p.id = ?
    `, [id]);

    if (pacientes.length === 0) {
      return res.status(404).json({ error: 'Paciente não encontrado' });
    }

    const paciente = pacientes[0];
    delete paciente.senha;

    // Buscar histórico de consultas
    const [consultas] = await db.query(`
      SELECT c.*, m.nome as medico_nome, e.nome as especialidade
      FROM consultas c
      JOIN medicos m ON c.medico_id = m.id
      JOIN especialidades e ON m.especialidade_id = e.id
      WHERE c.paciente_id = ?
      ORDER BY c.data_consulta DESC, c.hora_consulta DESC
      LIMIT 10
    `, [id]);

    // Estatísticas do paciente
    const [stats] = await db.query(`
      SELECT 
        COUNT(*) as total_consultas,
        SUM(CASE WHEN status = 'concluida' THEN 1 ELSE 0 END) as compareceu,
        SUM(CASE WHEN status = 'falta' THEN 1 ELSE 0 END) as faltou,
        SUM(CASE WHEN status = 'cancelada' THEN 1 ELSE 0 END) as cancelou
      FROM consultas
      WHERE paciente_id = ?
    `, [id]);

    return res.json({
      ...paciente,
      consultas,
      estatisticas: stats[0]
    });
  } catch (error) {
    console.error('Erro ao buscar paciente:', error);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// ==========================================
// DESBLOQUEAR PACIENTE
// ==========================================
exports.desbloquearPaciente = async (req, res) => {
  try {
    const { id } = req.params;

    // Validar ID
    if (!validators.isValidId(id)) {
      return res.status(400).json({ error: 'ID inválido' });
    }

    // Verificar se paciente existe e está bloqueado
    const [pacientes] = await db.query(
      'SELECT id, nome, bloqueado FROM pacientes WHERE id = ?',
      [id]
    );

    if (pacientes.length === 0) {
      return res.status(404).json({ error: 'Paciente não encontrado' });
    }

    if (!pacientes[0].bloqueado) {
      return res.status(400).json({ error: 'Este paciente não está bloqueado' });
    }

    // Desbloquear e zerar faltas consecutivas
    await db.query(
      'UPDATE pacientes SET bloqueado = FALSE, faltas_consecutivas = 0 WHERE id = ?',
      [id]
    );

    // Log de desbloqueio
    console.log(`[SECURITY] Paciente desbloqueado: ${id}`);

    return res.json({ 
      message: `Paciente ${pacientes[0].nome} desbloqueado com sucesso` 
    });
  } catch (error) {
    console.error('Erro ao desbloquear paciente:', error);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// ==========================================
// BLOQUEAR PACIENTE MANUALMENTE
// ==========================================
exports.bloquearPaciente = async (req, res) => {
  try {
    const { id } = req.params;
    const { motivo } = req.body;

    // Validar ID
    if (!validators.isValidId(id)) {
      return res.status(400).json({ error: 'ID inválido' });
    }

    // Verificar se paciente existe
    const [pacientes] = await db.query(
      'SELECT id, nome, bloqueado FROM pacientes WHERE id = ?',
      [id]
    );

    if (pacientes.length === 0) {
      return res.status(404).json({ error: 'Paciente não encontrado' });
    }

    if (pacientes[0].bloqueado) {
      return res.status(400).json({ error: 'Este paciente já está bloqueado' });
    }

    // Bloquear paciente
    await db.query(
      'UPDATE pacientes SET bloqueado = TRUE WHERE id = ?',
      [id]
    );

    // Log de bloqueio
    console.log(`[SECURITY] Paciente bloqueado manualmente: ${id} - Admin: ${req.userId}`);

    return res.json({ 
      message: `Paciente ${pacientes[0].nome} bloqueado com sucesso` 
    });
  } catch (error) {
    console.error('Erro ao bloquear paciente:', error);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// ==========================================
// LISTAR PACIENTES BLOQUEADOS
// ==========================================
exports.listarPacientesBloqueados = async (req, res) => {
  try {
    const [pacientes] = await db.query(`
      SELECT p.id, p.nome, p.cpf, p.email, p.telefone, 
             p.faltas_consecutivas, p.created_at,
             c.nome as convenio_nome,
             (SELECT COUNT(*) FROM consultas WHERE paciente_id = p.id AND status = 'falta') as total_faltas
      FROM pacientes p
      LEFT JOIN convenios c ON p.convenio_id = c.id
      WHERE p.bloqueado = TRUE
      ORDER BY p.nome
    `);

    return res.json(pacientes);
  } catch (error) {
    console.error('Erro ao listar pacientes bloqueados:', error);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// ==========================================
// ATIVAR/DESATIVAR PACIENTE
// ==========================================
exports.toggleAtivoPaciente = async (req, res) => {
  try {
    const { id } = req.params;

    // Validar ID
    if (!validators.isValidId(id)) {
      return res.status(400).json({ error: 'ID inválido' });
    }

    const [pacientes] = await db.query(
      'SELECT id, nome, ativo FROM pacientes WHERE id = ?',
      [id]
    );

    if (pacientes.length === 0) {
      return res.status(404).json({ error: 'Paciente não encontrado' });
    }

    const novoStatus = !pacientes[0].ativo;
    
    await db.query(
      'UPDATE pacientes SET ativo = ? WHERE id = ?',
      [novoStatus, id]
    );

    // Log de alteração
    console.log(`[SECURITY] Paciente ${novoStatus ? 'ativado' : 'desativado'}: ${id}`);

    return res.json({ 
      message: `Paciente ${novoStatus ? 'ativado' : 'desativado'} com sucesso`,
      ativo: novoStatus
    });
  } catch (error) {
    console.error('Erro ao alterar status do paciente:', error);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
};
