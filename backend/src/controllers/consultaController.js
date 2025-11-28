const db = require('../config/database');

// ==========================================
// LISTAR ESPECIALIDADES
// ==========================================
exports.getEspecialidades = async (req, res) => {
  try {
    const [especialidades] = await db.query(
      'SELECT id, nome, descricao FROM especialidades WHERE ativo = TRUE ORDER BY nome'
    );
    return res.json(especialidades);
  } catch (error) {
    console.error('Erro ao buscar especialidades:', error);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// ==========================================
// LISTAR MÉDICOS POR ESPECIALIDADE
// ==========================================
exports.getMedicosByEspecialidade = async (req, res) => {
  try {
    const { especialidadeId } = req.params;
    const { convenioId } = req.query;

    let query = `
      SELECT DISTINCT m.id, m.nome, m.crm, e.nome as especialidade
      FROM medicos m
      INNER JOIN especialidades e ON m.especialidade_id = e.id
      LEFT JOIN medico_convenios mc ON m.id = mc.medico_id
      WHERE m.especialidade_id = ? AND m.ativo = TRUE
    `;
    
    const params = [especialidadeId];

    // Se convenio informado, filtrar por médicos que aceitam o convênio
    if (convenioId && convenioId !== '1') { // 1 = Particular (todos aceitam)
      query += ` AND (mc.convenio_id = ? OR mc.convenio_id = 1)`;
      params.push(convenioId);
    }

    query += ' ORDER BY m.nome';

    const [medicos] = await db.query(query, params);
    return res.json(medicos);

  } catch (error) {
    console.error('Erro ao buscar médicos:', error);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// ==========================================
// LISTAR HORÁRIOS DISPONÍVEIS DO MÉDICO
// ==========================================
exports.getHorariosDisponiveis = async (req, res) => {
  try {
    const { medicoId } = req.params;
    const { data } = req.query;

    if (!data) {
      return res.status(400).json({ error: 'Data é obrigatória' });
    }

    // Verificar se a data é futura
    const dataConsulta = new Date(data);
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);

    if (dataConsulta < hoje) {
      return res.status(400).json({ error: 'Não é possível agendar para datas passadas' });
    }

    // Obter dia da semana (0 = Domingo, 1 = Segunda, etc.)
    const diaSemana = dataConsulta.getDay();

    // Buscar horários do médico para este dia da semana
    const [horarios] = await db.query(
      `SELECT hora_inicio, hora_fim, duracao_consulta 
       FROM horarios_disponiveis 
       WHERE medico_id = ? AND dia_semana = ? AND ativo = TRUE`,
      [medicoId, diaSemana]
    );

    if (horarios.length === 0) {
      return res.json({ 
        message: 'Médico não atende neste dia da semana',
        horarios: [] 
      });
    }

    // Buscar consultas já agendadas para esta data
    const [consultasAgendadas] = await db.query(
      `SELECT hora_consulta FROM consultas 
       WHERE medico_id = ? AND data_consulta = ? AND status IN ('agendada', 'remarcada')`,
      [medicoId, data]
    );

    const horariosOcupados = consultasAgendadas.map(c => c.hora_consulta);

    // Buscar bloqueios para esta data
    const [bloqueios] = await db.query(
      `SELECT hora_inicio, hora_fim FROM bloqueios_horario 
       WHERE medico_id = ? AND data = ?`,
      [medicoId, data]
    );

    // Gerar lista de horários disponíveis
    const horariosDisponiveis = [];

    for (const periodo of horarios) {
      // Converter hora_inicio e hora_fim para strings se necessário
      const horaInicioStr = typeof periodo.hora_inicio === 'string' 
        ? periodo.hora_inicio 
        : periodo.hora_inicio.toString().substring(0, 8);
      const horaFimStr = typeof periodo.hora_fim === 'string' 
        ? periodo.hora_fim 
        : periodo.hora_fim.toString().substring(0, 8);
      
      const inicio = horaInicioStr.split(':');
      const fim = horaFimStr.split(':');
      const duracao = periodo.duracao_consulta;

      let horaAtual = parseInt(inicio[0]) * 60 + parseInt(inicio[1]);
      const horaFim = parseInt(fim[0]) * 60 + parseInt(fim[1]);

      while (horaAtual + duracao <= horaFim) {
        const hora = String(Math.floor(horaAtual / 60)).padStart(2, '0');
        const minuto = String(horaAtual % 60).padStart(2, '0');
        const horarioStr = `${hora}:${minuto}:00`;

        // Verificar se não está ocupado
        const ocupado = horariosOcupados.some(h => {
          const hStr = typeof h === 'string' ? h : h.toString().substring(0, 8);
          return hStr === horarioStr;
        });

        // Verificar se não está bloqueado
        const bloqueado = bloqueios.some(b => {
          const bloqInicioStr = typeof b.hora_inicio === 'string' 
            ? b.hora_inicio 
            : b.hora_inicio.toString().substring(0, 8);
          const bloqFimStr = typeof b.hora_fim === 'string' 
            ? b.hora_fim 
            : b.hora_fim.toString().substring(0, 8);
          const bloqInicio = bloqInicioStr.split(':');
          const bloqFim = bloqFimStr.split(':');
          const bloqInicioMin = parseInt(bloqInicio[0]) * 60 + parseInt(bloqInicio[1]);
          const bloqFimMin = parseInt(bloqFim[0]) * 60 + parseInt(bloqFim[1]);
          return horaAtual >= bloqInicioMin && horaAtual < bloqFimMin;
        });

        // Se é hoje, verificar se o horário já passou
        let passado = false;
        if (dataConsulta.toDateString() === new Date().toDateString()) {
          const agora = new Date();
          const horaAtualReal = agora.getHours() * 60 + agora.getMinutes();
          passado = horaAtual <= horaAtualReal;
        }

        // Verificar se o horário já não foi adicionado (evitar duplicados)
        const jaAdicionado = horariosDisponiveis.some(h => h.horario === `${hora}:${minuto}`);

        if (!ocupado && !bloqueado && !passado && !jaAdicionado) {
          horariosDisponiveis.push({
            horario: `${hora}:${minuto}`,
            disponivel: true
          });
        }

        horaAtual += duracao;
      }
    }

    // Ordenar horários
    horariosDisponiveis.sort((a, b) => a.horario.localeCompare(b.horario));

    return res.json({
      data,
      medico_id: parseInt(medicoId),
      horarios: horariosDisponiveis
    });

  } catch (error) {
    console.error('Erro ao buscar horários:', error);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// ==========================================
// AGENDAR CONSULTA
// ==========================================
exports.agendarConsulta = async (req, res) => {
  try {
    const { medico_id, data_consulta, hora_consulta, tipo_atendimento } = req.body;
    const paciente_id = req.userId;

    // Validações básicas
    if (!medico_id || !data_consulta || !hora_consulta) {
      return res.status(400).json({ error: 'Médico, data e hora são obrigatórios' });
    }

    // Buscar dados do paciente
    const [pacientes] = await db.query(
      'SELECT * FROM pacientes WHERE id = ? AND ativo = TRUE',
      [paciente_id]
    );

    if (pacientes.length === 0) {
      return res.status(404).json({ error: 'Paciente não encontrado' });
    }

    const paciente = pacientes[0];

    // Verificar se paciente está bloqueado
    if (paciente.bloqueado) {
      return res.status(403).json({ 
        error: 'Sua conta está bloqueada devido a faltas consecutivas. Entre em contato com a administração.' 
      });
    }

    // REGRA: Verificar limite de 2 consultas futuras
    const [consultasFuturas] = await db.query(
      `SELECT COUNT(*) as total FROM consultas 
       WHERE paciente_id = ? AND status IN ('agendada', 'remarcada') 
       AND CONCAT(data_consulta, ' ', hora_consulta) > NOW()`,
      [paciente_id]
    );

    if (consultasFuturas[0].total >= 2) {
      return res.status(400).json({ 
        error: 'Você já possui 2 consultas futuras agendadas. Cancele uma para agendar outra.' 
      });
    }

    // Verificar se a data é futura
    const dataHoraConsulta = new Date(`${data_consulta}T${hora_consulta}`);
    if (dataHoraConsulta <= new Date()) {
      return res.status(400).json({ error: 'Não é possível agendar para datas/horários passados' });
    }

    // Verificar se o horário está disponível
    const horarioFormatado = hora_consulta.length === 5 ? `${hora_consulta}:00` : hora_consulta;
    
    const [consultaExistente] = await db.query(
      `SELECT id FROM consultas 
       WHERE medico_id = ? AND data_consulta = ? AND hora_consulta = ? 
       AND status IN ('agendada', 'remarcada')`,
      [medico_id, data_consulta, horarioFormatado]
    );

    if (consultaExistente.length > 0) {
      return res.status(400).json({ error: 'Este horário não está mais disponível' });
    }

    // Definir tipo de atendimento e convênio
    let tipoAtend = tipo_atendimento || 'particular';
    let convenioId = null;

    if (paciente.convenio_id && tipoAtend === 'convenio') {
      convenioId = paciente.convenio_id;
    }

    // Inserir consulta
    const [result] = await db.query(
      `INSERT INTO consultas (paciente_id, medico_id, data_consulta, hora_consulta, tipo_atendimento, convenio_id)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [paciente_id, medico_id, data_consulta, horarioFormatado, tipoAtend, convenioId]
    );

    // Buscar dados da consulta criada
    const [consulta] = await db.query(
      `SELECT c.*, m.nome as medico_nome, e.nome as especialidade, p.nome as paciente_nome
       FROM consultas c
       INNER JOIN medicos m ON c.medico_id = m.id
       INNER JOIN especialidades e ON m.especialidade_id = e.id
       INNER JOIN pacientes p ON c.paciente_id = p.id
       WHERE c.id = ?`,
      [result.insertId]
    );

    return res.status(201).json({
      message: 'Consulta agendada com sucesso!',
      consulta: consulta[0]
    });

  } catch (error) {
    console.error('Erro ao agendar consulta:', error);
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ error: 'Este horário não está mais disponível' });
    }
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// ==========================================
// LISTAR CONSULTAS DO PACIENTE
// ==========================================
exports.getMinhasConsultas = async (req, res) => {
  try {
    const paciente_id = req.userId;
    const { tipo } = req.query; // 'futuras', 'passadas' ou 'todas'

    let query = `
      SELECT c.*, m.nome as medico_nome, m.crm, e.nome as especialidade,
             conv.nome as convenio_nome
      FROM consultas c
      INNER JOIN medicos m ON c.medico_id = m.id
      INNER JOIN especialidades e ON m.especialidade_id = e.id
      LEFT JOIN convenios conv ON c.convenio_id = conv.id
      WHERE c.paciente_id = ?
    `;

    if (tipo === 'futuras') {
      query += ` AND CONCAT(c.data_consulta, ' ', c.hora_consulta) >= NOW() AND c.status IN ('agendada', 'remarcada')`;
    } else if (tipo === 'passadas') {
      query += ` AND (CONCAT(c.data_consulta, ' ', c.hora_consulta) < NOW() OR c.status IN ('realizada', 'cancelada', 'falta'))`;
    }

    query += ' ORDER BY c.data_consulta DESC, c.hora_consulta DESC';

    const [consultas] = await db.query(query, [paciente_id]);

    return res.json(consultas);

  } catch (error) {
    console.error('Erro ao buscar consultas:', error);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// ==========================================
// CANCELAR CONSULTA
// ==========================================
exports.cancelarConsulta = async (req, res) => {
  try {
    const { id } = req.params;
    const { motivo } = req.body;
    const paciente_id = req.userId;

    // Buscar consulta
    const [consultas] = await db.query(
      'SELECT * FROM consultas WHERE id = ? AND paciente_id = ?',
      [id, paciente_id]
    );

    if (consultas.length === 0) {
      return res.status(404).json({ error: 'Consulta não encontrada' });
    }

    const consulta = consultas[0];

    // Verificar se já foi cancelada ou realizada
    if (consulta.status === 'cancelada') {
      return res.status(400).json({ error: 'Esta consulta já foi cancelada' });
    }

    if (consulta.status === 'realizada') {
      return res.status(400).json({ error: 'Não é possível cancelar uma consulta já realizada' });
    }

    // REGRA: Verificar se está dentro das 24h
    const dataHoraConsulta = new Date(`${consulta.data_consulta.toISOString().split('T')[0]}T${consulta.hora_consulta}`);
    const agora = new Date();
    const diferencaHoras = (dataHoraConsulta - agora) / (1000 * 60 * 60);

    if (diferencaHoras < 24) {
      return res.status(400).json({ 
        error: 'Consultas só podem ser canceladas com pelo menos 24 horas de antecedência' 
      });
    }

    // Cancelar consulta
    await db.query(
      `UPDATE consultas SET status = 'cancelada', motivo_cancelamento = ? WHERE id = ?`,
      [motivo || 'Cancelado pelo paciente', id]
    );

    return res.json({ message: 'Consulta cancelada com sucesso' });

  } catch (error) {
    console.error('Erro ao cancelar consulta:', error);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// ==========================================
// REMARCAR CONSULTA
// ==========================================
exports.remarcarConsulta = async (req, res) => {
  try {
    const { id } = req.params;
    const { nova_data, novo_horario } = req.body;
    const paciente_id = req.userId;

    if (!nova_data || !novo_horario) {
      return res.status(400).json({ error: 'Nova data e horário são obrigatórios' });
    }

    // Buscar consulta original
    const [consultas] = await db.query(
      'SELECT * FROM consultas WHERE id = ? AND paciente_id = ?',
      [id, paciente_id]
    );

    if (consultas.length === 0) {
      return res.status(404).json({ error: 'Consulta não encontrada' });
    }

    const consulta = consultas[0];

    // Verificar status
    if (!['agendada', 'remarcada'].includes(consulta.status)) {
      return res.status(400).json({ error: 'Esta consulta não pode ser remarcada' });
    }

    // REGRA: Verificar se está dentro das 24h
    const dataHoraConsulta = new Date(`${consulta.data_consulta.toISOString().split('T')[0]}T${consulta.hora_consulta}`);
    const agora = new Date();
    const diferencaHoras = (dataHoraConsulta - agora) / (1000 * 60 * 60);

    if (diferencaHoras < 24) {
      return res.status(400).json({ 
        error: 'Consultas só podem ser remarcadas com pelo menos 24 horas de antecedência' 
      });
    }

    // Verificar se nova data/hora é futura
    const novaDataHora = new Date(`${nova_data}T${novo_horario}`);
    if (novaDataHora <= new Date()) {
      return res.status(400).json({ error: 'Nova data/horário deve ser futura' });
    }

    // Verificar se novo horário está disponível
    const horarioFormatado = novo_horario.length === 5 ? `${novo_horario}:00` : novo_horario;
    
    const [consultaExistente] = await db.query(
      `SELECT id FROM consultas 
       WHERE medico_id = ? AND data_consulta = ? AND hora_consulta = ? 
       AND status IN ('agendada', 'remarcada') AND id != ?`,
      [consulta.medico_id, nova_data, horarioFormatado, id]
    );

    if (consultaExistente.length > 0) {
      return res.status(400).json({ error: 'Este horário não está disponível' });
    }

    // Atualizar consulta
    await db.query(
      `UPDATE consultas SET data_consulta = ?, hora_consulta = ?, status = 'remarcada' WHERE id = ?`,
      [nova_data, horarioFormatado, id]
    );

    // Buscar consulta atualizada
    const [consultaAtualizada] = await db.query(
      `SELECT c.*, m.nome as medico_nome, e.nome as especialidade
       FROM consultas c
       INNER JOIN medicos m ON c.medico_id = m.id
       INNER JOIN especialidades e ON m.especialidade_id = e.id
       WHERE c.id = ?`,
      [id]
    );

    return res.json({
      message: 'Consulta remarcada com sucesso',
      consulta: consultaAtualizada[0]
    });

  } catch (error) {
    console.error('Erro ao remarcar consulta:', error);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
};
