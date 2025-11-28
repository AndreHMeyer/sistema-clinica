const db = require('../config/database');

// ==========================================
// LISTAR HORÁRIOS DO MÉDICO
// ==========================================
exports.getHorarios = async (req, res) => {
  try {
    const medicoId = req.userId;

    const [horarios] = await db.query(
      `SELECT id, dia_semana, hora_inicio, hora_fim, duracao_consulta, ativo
       FROM horarios_disponiveis
       WHERE medico_id = ?
       ORDER BY dia_semana, hora_inicio`,
      [medicoId]
    );

    // Organizar por dia da semana
    const diasSemana = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
    const horariosPorDia = diasSemana.map((dia, index) => ({
      dia_semana: index,
      dia_nome: dia,
      horarios: horarios.filter(h => h.dia_semana === index)
    }));

    return res.json(horariosPorDia);

  } catch (error) {
    console.error('Erro ao buscar horários:', error);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// ==========================================
// ADICIONAR HORÁRIO DE ATENDIMENTO
// ==========================================
exports.addHorario = async (req, res) => {
  try {
    const medicoId = req.userId;
    const { dia_semana, hora_inicio, hora_fim, duracao_consulta } = req.body;

    // Validações
    if (dia_semana === undefined || !hora_inicio || !hora_fim) {
      return res.status(400).json({ error: 'Dia da semana, hora início e hora fim são obrigatórios' });
    }

    if (dia_semana < 0 || dia_semana > 6) {
      return res.status(400).json({ error: 'Dia da semana inválido' });
    }

    // Verificar se hora fim é maior que hora início
    if (hora_fim <= hora_inicio) {
      return res.status(400).json({ error: 'Hora fim deve ser maior que hora início' });
    }

    // Verificar conflito de horários no mesmo dia
    const [conflitos] = await db.query(
      `SELECT id FROM horarios_disponiveis 
       WHERE medico_id = ? AND dia_semana = ? AND ativo = TRUE
       AND ((hora_inicio <= ? AND hora_fim > ?) OR (hora_inicio < ? AND hora_fim >= ?) 
            OR (hora_inicio >= ? AND hora_fim <= ?))`,
      [medicoId, dia_semana, hora_inicio, hora_inicio, hora_fim, hora_fim, hora_inicio, hora_fim]
    );

    if (conflitos.length > 0) {
      return res.status(400).json({ error: 'Já existe um horário cadastrado que conflita com este período' });
    }

    // Inserir horário
    const [result] = await db.query(
      `INSERT INTO horarios_disponiveis (medico_id, dia_semana, hora_inicio, hora_fim, duracao_consulta)
       VALUES (?, ?, ?, ?, ?)`,
      [medicoId, dia_semana, hora_inicio, hora_fim, duracao_consulta || 30]
    );

    const [novoHorario] = await db.query(
      'SELECT * FROM horarios_disponiveis WHERE id = ?',
      [result.insertId]
    );

    return res.status(201).json({
      message: 'Horário adicionado com sucesso',
      horario: novoHorario[0]
    });

  } catch (error) {
    console.error('Erro ao adicionar horário:', error);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// ==========================================
// ATUALIZAR HORÁRIO DE ATENDIMENTO
// ==========================================
exports.updateHorario = async (req, res) => {
  try {
    const medicoId = req.userId;
    const { id } = req.params;
    const { hora_inicio, hora_fim, duracao_consulta, ativo } = req.body;

    // Verificar se o horário pertence ao médico
    const [horarioExiste] = await db.query(
      'SELECT * FROM horarios_disponiveis WHERE id = ? AND medico_id = ?',
      [id, medicoId]
    );

    if (horarioExiste.length === 0) {
      return res.status(404).json({ error: 'Horário não encontrado' });
    }

    // Atualizar horário
    await db.query(
      `UPDATE horarios_disponiveis 
       SET hora_inicio = ?, hora_fim = ?, duracao_consulta = ?, ativo = ?
       WHERE id = ? AND medico_id = ?`,
      [hora_inicio, hora_fim, duracao_consulta || 30, ativo !== undefined ? ativo : true, id, medicoId]
    );

    const [horarioAtualizado] = await db.query(
      'SELECT * FROM horarios_disponiveis WHERE id = ?',
      [id]
    );

    return res.json({
      message: 'Horário atualizado com sucesso',
      horario: horarioAtualizado[0]
    });

  } catch (error) {
    console.error('Erro ao atualizar horário:', error);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// ==========================================
// REMOVER HORÁRIO DE ATENDIMENTO
// ==========================================
exports.deleteHorario = async (req, res) => {
  try {
    const medicoId = req.userId;
    const { id } = req.params;

    // Verificar se o horário pertence ao médico
    const [horarioExiste] = await db.query(
      'SELECT * FROM horarios_disponiveis WHERE id = ? AND medico_id = ?',
      [id, medicoId]
    );

    if (horarioExiste.length === 0) {
      return res.status(404).json({ error: 'Horário não encontrado' });
    }

    // Remover horário
    await db.query(
      'DELETE FROM horarios_disponiveis WHERE id = ? AND medico_id = ?',
      [id, medicoId]
    );

    return res.json({ message: 'Horário removido com sucesso' });

  } catch (error) {
    console.error('Erro ao remover horário:', error);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// ==========================================
// LISTAR BLOQUEIOS DE HORÁRIO
// ==========================================
exports.getBloqueios = async (req, res) => {
  try {
    const medicoId = req.userId;
    const { data_inicio, data_fim } = req.query;

    let query = `
      SELECT id, data, hora_inicio, hora_fim, motivo, created_at
      FROM bloqueios_horario
      WHERE medico_id = ?
    `;
    const params = [medicoId];

    if (data_inicio && data_fim) {
      query += ' AND data BETWEEN ? AND ?';
      params.push(data_inicio, data_fim);
    } else {
      // Por padrão, mostrar bloqueios futuros
      query += ' AND data >= CURDATE()';
    }

    query += ' ORDER BY data, hora_inicio';

    const [bloqueios] = await db.query(query, params);

    return res.json(bloqueios);

  } catch (error) {
    console.error('Erro ao buscar bloqueios:', error);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// ==========================================
// ADICIONAR BLOQUEIO DE HORÁRIO
// ==========================================
exports.addBloqueio = async (req, res) => {
  try {
    const medicoId = req.userId;
    const { data, hora_inicio, hora_fim, motivo } = req.body;

    // Validações
    if (!data || !hora_inicio || !hora_fim) {
      return res.status(400).json({ error: 'Data, hora início e hora fim são obrigatórios' });
    }

    // Verificar se a data é futura
    const dataBloqueio = new Date(data);
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);

    if (dataBloqueio < hoje) {
      return res.status(400).json({ error: 'Não é possível bloquear datas passadas' });
    }

    // Verificar se há consultas agendadas neste período
    const [consultasConflitantes] = await db.query(
      `SELECT c.id, c.hora_consulta, p.nome as paciente_nome
       FROM consultas c
       INNER JOIN pacientes p ON c.paciente_id = p.id
       WHERE c.medico_id = ? AND c.data_consulta = ? 
       AND c.status IN ('agendada', 'remarcada')
       AND c.hora_consulta >= ? AND c.hora_consulta < ?`,
      [medicoId, data, hora_inicio, hora_fim]
    );

    if (consultasConflitantes.length > 0) {
      return res.status(400).json({ 
        error: 'Existem consultas agendadas neste período. Cancele-as antes de bloquear.',
        consultas: consultasConflitantes
      });
    }

    // Inserir bloqueio
    const [result] = await db.query(
      `INSERT INTO bloqueios_horario (medico_id, data, hora_inicio, hora_fim, motivo)
       VALUES (?, ?, ?, ?, ?)`,
      [medicoId, data, hora_inicio, hora_fim, motivo || null]
    );

    const [novoBloqueio] = await db.query(
      'SELECT * FROM bloqueios_horario WHERE id = ?',
      [result.insertId]
    );

    return res.status(201).json({
      message: 'Bloqueio adicionado com sucesso',
      bloqueio: novoBloqueio[0]
    });

  } catch (error) {
    console.error('Erro ao adicionar bloqueio:', error);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// ==========================================
// REMOVER BLOQUEIO DE HORÁRIO
// ==========================================
exports.deleteBloqueio = async (req, res) => {
  try {
    const medicoId = req.userId;
    const { id } = req.params;

    // Verificar se o bloqueio pertence ao médico
    const [bloqueioExiste] = await db.query(
      'SELECT * FROM bloqueios_horario WHERE id = ? AND medico_id = ?',
      [id, medicoId]
    );

    if (bloqueioExiste.length === 0) {
      return res.status(404).json({ error: 'Bloqueio não encontrado' });
    }

    // Remover bloqueio
    await db.query(
      'DELETE FROM bloqueios_horario WHERE id = ? AND medico_id = ?',
      [id, medicoId]
    );

    return res.json({ message: 'Bloqueio removido com sucesso' });

  } catch (error) {
    console.error('Erro ao remover bloqueio:', error);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
};
