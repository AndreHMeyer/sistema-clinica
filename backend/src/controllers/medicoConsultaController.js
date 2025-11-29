const db = require('../config/database');
const { validators } = require('../middlewares/security');

// ==========================================
// LISTAR CONSULTAS DO MÉDICO
// ==========================================
exports.getConsultas = async (req, res) => {
  try {
    const medicoId = req.userId;
    const { data, status, data_inicio, data_fim } = req.query;

    // Validar parâmetros de data
    if (data && !validators.isValidDate(data)) {
      return res.status(400).json({ error: 'Formato de data inválido' });
    }

    if (data_inicio && !validators.isValidDate(data_inicio)) {
      return res.status(400).json({ error: 'Formato de data inicial inválido' });
    }

    if (data_fim && !validators.isValidDate(data_fim)) {
      return res.status(400).json({ error: 'Formato de data final inválido' });
    }

    // Validar status se fornecido
    const statusValidos = ['agendada', 'remarcada', 'realizada', 'cancelada', 'falta'];
    if (status && !statusValidos.includes(status)) {
      return res.status(400).json({ error: 'Status inválido' });
    }

    let query = `
      SELECT c.*, p.nome as paciente_nome, p.cpf as paciente_cpf, p.telefone as paciente_telefone,
             p.email as paciente_email, conv.nome as convenio_nome
      FROM consultas c
      INNER JOIN pacientes p ON c.paciente_id = p.id
      LEFT JOIN convenios conv ON c.convenio_id = conv.id
      WHERE c.medico_id = ?
    `;
    const params = [medicoId];

    // Filtro por data específica
    if (data) {
      query += ' AND c.data_consulta = ?';
      params.push(data);
    }

    // Filtro por período
    if (data_inicio && data_fim) {
      query += ' AND c.data_consulta BETWEEN ? AND ?';
      params.push(data_inicio, data_fim);
    }

    // Filtro por status
    if (status) {
      query += ' AND c.status = ?';
      params.push(status);
    }

    query += ' ORDER BY c.data_consulta ASC, c.hora_consulta ASC';

    const [consultas] = await db.query(query, params);

    return res.json(consultas);

  } catch (error) {
    console.error('Erro ao buscar consultas:', error);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// ==========================================
// OBTER DETALHES DE UMA CONSULTA
// ==========================================
exports.getConsultaById = async (req, res) => {
  try {
    const medicoId = req.userId;
    const { id } = req.params;

    // Validar ID
    if (!validators.isValidId(id)) {
      return res.status(400).json({ error: 'ID inválido' });
    }

    const [consultas] = await db.query(
      `SELECT c.*, p.nome as paciente_nome, p.cpf as paciente_cpf, 
              p.telefone as paciente_telefone, p.email as paciente_email,
              conv.nome as convenio_nome
       FROM consultas c
       INNER JOIN pacientes p ON c.paciente_id = p.id
       LEFT JOIN convenios conv ON c.convenio_id = conv.id
       WHERE c.id = ? AND c.medico_id = ?`,
      [id, medicoId]
    );

    if (consultas.length === 0) {
      return res.status(404).json({ error: 'Consulta não encontrada' });
    }

    return res.json(consultas[0]);

  } catch (error) {
    console.error('Erro ao buscar consulta:', error);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// ==========================================
// REGISTRAR OBSERVAÇÕES DA CONSULTA
// ==========================================
exports.registrarObservacoes = async (req, res) => {
  try {
    const medicoId = req.userId;
    const { id } = req.params;
    const { observacoes } = req.body;

    // Validar ID
    if (!validators.isValidId(id)) {
      return res.status(400).json({ error: 'ID inválido' });
    }

    // Verificar se a consulta pertence ao médico
    const [consultas] = await db.query(
      'SELECT * FROM consultas WHERE id = ? AND medico_id = ?',
      [id, medicoId]
    );

    if (consultas.length === 0) {
      return res.status(404).json({ error: 'Consulta não encontrada' });
    }

    const consulta = consultas[0];

    // Verificar se a consulta já aconteceu ou é do dia
    const dataConsulta = new Date(consulta.data_consulta);
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    dataConsulta.setHours(0, 0, 0, 0);

    if (dataConsulta > hoje) {
      return res.status(400).json({ error: 'Só é possível registrar observações para consultas de hoje ou passadas' });
    }

    // Sanitizar observações (máximo 2000 caracteres)
    const observacoesSanitizadas = observacoes 
      ? String(observacoes).substring(0, 2000).trim() 
      : null;

    // Atualizar observações e status para realizada
    await db.query(
      `UPDATE consultas SET observacoes_medico = ?, status = 'realizada' WHERE id = ?`,
      [observacoesSanitizadas, id]
    );

    // Resetar faltas consecutivas do paciente
    await db.query(
      'UPDATE pacientes SET faltas_consecutivas = 0 WHERE id = ?',
      [consulta.paciente_id]
    );

    const [consultaAtualizada] = await db.query(
      `SELECT c.*, p.nome as paciente_nome
       FROM consultas c
       INNER JOIN pacientes p ON c.paciente_id = p.id
       WHERE c.id = ?`,
      [id]
    );

    return res.json({
      message: 'Observações registradas com sucesso',
      consulta: consultaAtualizada[0]
    });

  } catch (error) {
    console.error('Erro ao registrar observações:', error);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// ==========================================
// MARCAR CONSULTA COMO REALIZADA
// ==========================================
exports.marcarRealizada = async (req, res) => {
  try {
    const medicoId = req.userId;
    const { id } = req.params;

    // Validar ID
    if (!validators.isValidId(id)) {
      return res.status(400).json({ error: 'ID inválido' });
    }

    // Verificar se a consulta pertence ao médico
    const [consultas] = await db.query(
      'SELECT * FROM consultas WHERE id = ? AND medico_id = ?',
      [id, medicoId]
    );

    if (consultas.length === 0) {
      return res.status(404).json({ error: 'Consulta não encontrada' });
    }

    const consulta = consultas[0];

    if (!['agendada', 'remarcada'].includes(consulta.status)) {
      return res.status(400).json({ error: 'Esta consulta não pode ser marcada como realizada' });
    }

    // Atualizar status
    await db.query(
      `UPDATE consultas SET status = 'realizada' WHERE id = ?`,
      [id]
    );

    // Resetar faltas consecutivas do paciente
    await db.query(
      'UPDATE pacientes SET faltas_consecutivas = 0 WHERE id = ?',
      [consulta.paciente_id]
    );

    return res.json({ message: 'Consulta marcada como realizada' });

  } catch (error) {
    console.error('Erro ao marcar consulta como realizada:', error);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// ==========================================
// MARCAR PACIENTE COMO FALTA
// ==========================================
exports.marcarFalta = async (req, res) => {
  try {
    const medicoId = req.userId;
    const { id } = req.params;

    // Validar ID
    if (!validators.isValidId(id)) {
      return res.status(400).json({ error: 'ID inválido' });
    }

    // Verificar se a consulta pertence ao médico
    const [consultas] = await db.query(
      'SELECT * FROM consultas WHERE id = ? AND medico_id = ?',
      [id, medicoId]
    );

    if (consultas.length === 0) {
      return res.status(404).json({ error: 'Consulta não encontrada' });
    }

    const consulta = consultas[0];

    if (!['agendada', 'remarcada'].includes(consulta.status)) {
      return res.status(400).json({ error: 'Esta consulta não pode ser marcada como falta' });
    }

    // Atualizar status da consulta
    await db.query(
      `UPDATE consultas SET status = 'falta' WHERE id = ?`,
      [id]
    );

    // Incrementar faltas consecutivas do paciente
    await db.query(
      'UPDATE pacientes SET faltas_consecutivas = faltas_consecutivas + 1 WHERE id = ?',
      [consulta.paciente_id]
    );

    // Verificar se atingiu 3 faltas consecutivas
    const [paciente] = await db.query(
      'SELECT faltas_consecutivas FROM pacientes WHERE id = ?',
      [consulta.paciente_id]
    );

    let pacienteBloqueado = false;
    if (paciente[0].faltas_consecutivas >= 3) {
      await db.query(
        'UPDATE pacientes SET bloqueado = TRUE WHERE id = ?',
        [consulta.paciente_id]
      );
      pacienteBloqueado = true;

      // Log de bloqueio automático
      console.log(`[SECURITY] Paciente bloqueado automaticamente por 3 faltas: ${consulta.paciente_id}`);
    }

    return res.json({ 
      message: 'Falta registrada com sucesso',
      pacienteBloqueado,
      faltasConsecutivas: paciente[0].faltas_consecutivas
    });

  } catch (error) {
    console.error('Erro ao marcar falta:', error);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// ==========================================
// CANCELAR CONSULTA (PELO MÉDICO)
// ==========================================
exports.cancelarConsulta = async (req, res) => {
  try {
    const medicoId = req.userId;
    const { id } = req.params;
    const { motivo } = req.body;

    // Validar ID
    if (!validators.isValidId(id)) {
      return res.status(400).json({ error: 'ID inválido' });
    }

    // Verificar se a consulta pertence ao médico
    const [consultas] = await db.query(
      'SELECT * FROM consultas WHERE id = ? AND medico_id = ?',
      [id, medicoId]
    );

    if (consultas.length === 0) {
      return res.status(404).json({ error: 'Consulta não encontrada' });
    }

    const consulta = consultas[0];

    if (!['agendada', 'remarcada'].includes(consulta.status)) {
      return res.status(400).json({ error: 'Esta consulta não pode ser cancelada' });
    }

    // Sanitizar motivo (máximo 500 caracteres)
    const motivoSanitizado = motivo 
      ? String(motivo).substring(0, 500).trim() 
      : 'Cancelado pelo médico';

    // Cancelar consulta
    await db.query(
      `UPDATE consultas SET status = 'cancelada', motivo_cancelamento = ? WHERE id = ?`,
      [motivoSanitizado, id]
    );

    // Log de cancelamento
    console.log(`[SECURITY] Consulta cancelada pelo médico: ${id}`);

    return res.json({ message: 'Consulta cancelada com sucesso' });

  } catch (error) {
    console.error('Erro ao cancelar consulta:', error);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// ==========================================
// DASHBOARD DO MÉDICO - ESTATÍSTICAS
// ==========================================
exports.getDashboard = async (req, res) => {
  try {
    const medicoId = req.userId;
    const hoje = new Date().toISOString().split('T')[0];

    // Consultas de hoje
    const [consultasHoje] = await db.query(
      `SELECT COUNT(*) as total FROM consultas 
       WHERE medico_id = ? AND data_consulta = ? AND status IN ('agendada', 'remarcada')`,
      [medicoId, hoje]
    );

    // Próxima consulta
    const [proximaConsulta] = await db.query(
      `SELECT c.*, p.nome as paciente_nome
       FROM consultas c
       INNER JOIN pacientes p ON c.paciente_id = p.id
       WHERE c.medico_id = ? AND CONCAT(c.data_consulta, ' ', c.hora_consulta) >= NOW()
       AND c.status IN ('agendada', 'remarcada')
       ORDER BY c.data_consulta, c.hora_consulta
       LIMIT 1`,
      [medicoId]
    );

    // Consultas da semana
    const [consultasSemana] = await db.query(
      `SELECT COUNT(*) as total FROM consultas 
       WHERE medico_id = ? AND data_consulta BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 7 DAY)
       AND status IN ('agendada', 'remarcada')`,
      [medicoId]
    );

    // Total de consultas realizadas (mês atual)
    const [consultasRealizadasMes] = await db.query(
      `SELECT COUNT(*) as total FROM consultas 
       WHERE medico_id = ? AND status = 'realizada'
       AND MONTH(data_consulta) = MONTH(CURDATE()) AND YEAR(data_consulta) = YEAR(CURDATE())`,
      [medicoId]
    );

    return res.json({
      consultasHoje: consultasHoje[0].total,
      consultasSemana: consultasSemana[0].total,
      consultasRealizadasMes: consultasRealizadasMes[0].total,
      proximaConsulta: proximaConsulta[0] || null
    });

  } catch (error) {
    console.error('Erro ao buscar dashboard:', error);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
};
