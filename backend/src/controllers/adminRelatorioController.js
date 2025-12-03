const db = require('../config/database');
const PDFDocument = require('pdfkit');
const { validators } = require('../middlewares/security');

// ==========================================
// RELATÓRIO DE CONSULTAS POR PERÍODO
// ==========================================
exports.relatorioConsultasPeriodo = async (req, res) => {
  try {
    const { dataInicio, dataFim, medicoId, especialidadeId, status } = req.query;

    if (!dataInicio || !dataFim) {
      return res.status(400).json({ error: 'Data início e data fim são obrigatórias' });
    }

    if (!validators.isValidDate(dataInicio) || !validators.isValidDate(dataFim)) {
      return res.status(400).json({ error: 'Formato de data inválido' });
    }

    if (medicoId && !validators.isValidId(medicoId)) {
      return res.status(400).json({ error: 'ID de médico inválido' });
    }

    if (especialidadeId && !validators.isValidId(especialidadeId)) {
      return res.status(400).json({ error: 'ID de especialidade inválido' });
    }

    // Validar status se fornecido
    const statusValidos = ['agendada', 'remarcada', 'realizada', 'cancelada', 'falta', 'concluida', 'nao_compareceu'];
    if (status && !statusValidos.includes(status)) {
      return res.status(400).json({ error: 'Status inválido' });
    }

    let query = `
      SELECT 
        c.id, c.data_consulta, c.hora_consulta, c.status, c.observacoes,
        p.nome as paciente_nome, p.cpf as paciente_cpf,
        m.nome as medico_nome, m.crm,
        e.nome as especialidade,
        conv.nome as convenio
      FROM consultas c
      JOIN pacientes p ON c.paciente_id = p.id
      JOIN medicos m ON c.medico_id = m.id
      JOIN especialidades e ON m.especialidade_id = e.id
      LEFT JOIN convenios conv ON p.convenio_id = conv.id
      WHERE c.data_consulta BETWEEN ? AND ?
    `;
    
    const params = [dataInicio, dataFim];

    if (medicoId) {
      query += ' AND c.medico_id = ?';
      params.push(medicoId);
    }

    if (especialidadeId) {
      query += ' AND m.especialidade_id = ?';
      params.push(especialidadeId);
    }

    if (status) {
      query += ' AND c.status = ?';
      params.push(status);
    }

    query += ' ORDER BY c.data_consulta, c.hora_consulta';

    const [consultas] = await db.query(query, params);

    // Estatísticas do período
    const [stats] = await db.query(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status = 'concluida' THEN 1 ELSE 0 END) as concluidas,
        SUM(CASE WHEN status = 'cancelada' THEN 1 ELSE 0 END) as canceladas,
        SUM(CASE WHEN status = 'remarcada' THEN 1 ELSE 0 END) as remarcadas,
        SUM(CASE WHEN status = 'nao_compareceu' THEN 1 ELSE 0 END) as nao_compareceram,
        SUM(CASE WHEN status = 'agendada' THEN 1 ELSE 0 END) as agendadas
      FROM consultas c
      JOIN medicos m ON c.medico_id = m.id
      WHERE c.data_consulta BETWEEN ? AND ?
      ${medicoId ? 'AND c.medico_id = ?' : ''}
      ${especialidadeId ? 'AND m.especialidade_id = ?' : ''}
    `, params.slice(0, medicoId && especialidadeId ? 4 : (medicoId || especialidadeId ? 3 : 2)));

    return res.json({
      consultas,
      estatisticas: stats[0],
      periodo: { dataInicio, dataFim }
    });

  } catch (error) {
    console.error('Erro ao gerar relatório:', error);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// ==========================================
// RELATÓRIO POR MÉDICO
// ==========================================
exports.relatorioMedicos = async (req, res) => {
  try {
    const { dataInicio, dataFim } = req.query;

    // Validações de entrada
    if (!dataInicio || !dataFim) {
      return res.status(400).json({ error: 'Data início e data fim são obrigatórias' });
    }

    // Validar formatos de data
    if (!validators.isValidDate(dataInicio) || !validators.isValidDate(dataFim)) {
      return res.status(400).json({ error: 'Formato de data inválido' });
    }

    const [relatorio] = await db.query(`
      SELECT 
        m.id, m.nome, m.crm,
        e.nome as especialidade,
        COUNT(c.id) as total_consultas,
        SUM(CASE WHEN c.status = 'concluida' THEN 1 ELSE 0 END) as concluidas,
        SUM(CASE WHEN c.status = 'cancelada' THEN 1 ELSE 0 END) as canceladas,
        SUM(CASE WHEN c.status = 'nao_compareceu' THEN 1 ELSE 0 END) as nao_compareceram,
        ROUND(SUM(CASE WHEN c.status = 'cancelada' THEN 1 ELSE 0 END) * 100.0 / COUNT(c.id), 1) as taxa_cancelamento,
        COUNT(DISTINCT c.paciente_id) as pacientes_atendidos
      FROM medicos m
      JOIN especialidades e ON m.especialidade_id = e.id
      LEFT JOIN consultas c ON m.id = c.medico_id 
        AND c.data_consulta BETWEEN ? AND ?
      WHERE m.ativo = TRUE
      GROUP BY m.id, m.nome, m.crm, e.nome
      ORDER BY total_consultas DESC
    `, [dataInicio, dataFim]);

    return res.json({
      relatorio,
      periodo: { dataInicio, dataFim }
    });

  } catch (error) {
    console.error('Erro ao gerar relatório de médicos:', error);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// ==========================================
// RELATÓRIO POR ESPECIALIDADE
// ==========================================
exports.relatorioEspecialidades = async (req, res) => {
  try {
    const { dataInicio, dataFim } = req.query;

    // Validações de entrada
    if (!dataInicio || !dataFim) {
      return res.status(400).json({ error: 'Data início e data fim são obrigatórias' });
    }

    // Validar formatos de data
    if (!validators.isValidDate(dataInicio) || !validators.isValidDate(dataFim)) {
      return res.status(400).json({ error: 'Formato de data inválido' });
    }

    const [relatorio] = await db.query(`
      SELECT 
        e.id, e.nome as especialidade,
        COUNT(DISTINCT m.id) as total_medicos,
        COUNT(c.id) as total_consultas,
        SUM(CASE WHEN c.status = 'concluida' THEN 1 ELSE 0 END) as concluidas,
        SUM(CASE WHEN c.status = 'cancelada' THEN 1 ELSE 0 END) as canceladas,
        ROUND(SUM(CASE WHEN c.status = 'cancelada' THEN 1 ELSE 0 END) * 100.0 / NULLIF(COUNT(c.id), 0), 1) as taxa_cancelamento
      FROM especialidades e
      LEFT JOIN medicos m ON e.id = m.especialidade_id AND m.ativo = TRUE
      LEFT JOIN consultas c ON m.id = c.medico_id 
        AND c.data_consulta BETWEEN ? AND ?
      WHERE e.ativo = TRUE
      GROUP BY e.id, e.nome
      ORDER BY total_consultas DESC
    `, [dataInicio, dataFim]);

    return res.json({
      relatorio,
      periodo: { dataInicio, dataFim }
    });

  } catch (error) {
    console.error('Erro ao gerar relatório de especialidades:', error);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// ==========================================
// RELATÓRIO DE PACIENTES FREQUENTES
// ==========================================
exports.relatorioPacientesFrequentes = async (req, res) => {
  try {
    const { dataInicio, dataFim, limite } = req.query;

    // Validações de entrada
    if (!dataInicio || !dataFim) {
      return res.status(400).json({ error: 'Data início e data fim são obrigatórias' });
    }

    // Validar formatos de data
    if (!validators.isValidDate(dataInicio) || !validators.isValidDate(dataFim)) {
      return res.status(400).json({ error: 'Formato de data inválido' });
    }

    // Validar e limitar o parâmetro limite (máximo 100)
    const limiteNum = Math.min(Math.max(parseInt(limite) || 20, 1), 100);

    const [relatorio] = await db.query(`
      SELECT 
        p.id, p.nome, p.cpf, p.email, p.telefone,
        conv.nome as convenio,
        COUNT(c.id) as total_consultas,
        SUM(CASE WHEN c.status = 'concluida' THEN 1 ELSE 0 END) as compareceu,
        SUM(CASE WHEN c.status = 'nao_compareceu' THEN 1 ELSE 0 END) as faltou,
        SUM(CASE WHEN c.status = 'cancelada' THEN 1 ELSE 0 END) as cancelou,
        MIN(c.data_consulta) as primeira_consulta,
        MAX(c.data_consulta) as ultima_consulta
      FROM pacientes p
      LEFT JOIN convenios conv ON p.convenio_id = conv.id
      JOIN consultas c ON p.id = c.paciente_id 
        AND c.data_consulta BETWEEN ? AND ?
      GROUP BY p.id, p.nome, p.cpf, p.email, p.telefone, conv.nome
      HAVING COUNT(c.id) > 0
      ORDER BY total_consultas DESC
      LIMIT ?
    `, [dataInicio, dataFim, limiteNum]);

    return res.json({
      relatorio,
      periodo: { dataInicio, dataFim }
    });

  } catch (error) {
    console.error('Erro ao gerar relatório de pacientes:', error);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// ==========================================
// RELATÓRIO DE TAXA DE CANCELAMENTO
// ==========================================
exports.relatorioCancelamentos = async (req, res) => {
  try {
    const { dataInicio, dataFim } = req.query;

    // Validações de entrada
    if (!dataInicio || !dataFim) {
      return res.status(400).json({ error: 'Data início e data fim são obrigatórias' });
    }

    // Validar formatos de data
    if (!validators.isValidDate(dataInicio) || !validators.isValidDate(dataFim)) {
      return res.status(400).json({ error: 'Formato de data inválido' });
    }

    // Taxa geral
    const [taxaGeral] = await db.query(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status = 'cancelada' THEN 1 ELSE 0 END) as canceladas,
        SUM(CASE WHEN status = 'remarcada' THEN 1 ELSE 0 END) as remarcadas,
        ROUND(SUM(CASE WHEN status = 'cancelada' THEN 1 ELSE 0 END) * 100.0 / COUNT(*), 1) as taxa_cancelamento,
        ROUND(SUM(CASE WHEN status = 'remarcada' THEN 1 ELSE 0 END) * 100.0 / COUNT(*), 1) as taxa_remarcacao
      FROM consultas
      WHERE data_consulta BETWEEN ? AND ?
    `, [dataInicio, dataFim]);

    // Por dia da semana
    const [porDiaSemana] = await db.query(`
      SELECT 
        DAYOFWEEK(data_consulta) as dia_semana,
        COUNT(*) as total,
        SUM(CASE WHEN status = 'cancelada' THEN 1 ELSE 0 END) as canceladas,
        ROUND(SUM(CASE WHEN status = 'cancelada' THEN 1 ELSE 0 END) * 100.0 / COUNT(*), 1) as taxa
      FROM consultas
      WHERE data_consulta BETWEEN ? AND ?
      GROUP BY DAYOFWEEK(data_consulta)
      ORDER BY dia_semana
    `, [dataInicio, dataFim]);

    // Por mês (últimos 12 meses)
    const [porMes] = await db.query(`
      SELECT 
        DATE_FORMAT(data_consulta, '%Y-%m') as mes,
        COUNT(*) as total,
        SUM(CASE WHEN status = 'cancelada' THEN 1 ELSE 0 END) as canceladas,
        ROUND(SUM(CASE WHEN status = 'cancelada' THEN 1 ELSE 0 END) * 100.0 / COUNT(*), 1) as taxa
      FROM consultas
      WHERE data_consulta BETWEEN ? AND ?
      GROUP BY DATE_FORMAT(data_consulta, '%Y-%m')
      ORDER BY mes
    `, [dataInicio, dataFim]);

    // Motivos mais comuns (se tiver campo)
    const diasSemana = ['', 'Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
    
    return res.json({
      taxaGeral: taxaGeral[0],
      porDiaSemana: porDiaSemana.map(d => ({
        ...d,
        dia_nome: diasSemana[d.dia_semana]
      })),
      porMes,
      periodo: { dataInicio, dataFim }
    });

  } catch (error) {
    console.error('Erro ao gerar relatório de cancelamentos:', error);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// ==========================================
// GERAR PDF - CONSULTAS POR PERÍODO
// ==========================================
exports.gerarPDFConsultas = async (req, res) => {
  try {
    const { dataInicio, dataFim, medicoId, especialidadeId, status } = req.query;

    // Validações de entrada
    if (!dataInicio || !dataFim) {
      return res.status(400).json({ error: 'Data início e data fim são obrigatórias' });
    }

    // Validar formatos de data
    if (!validators.isValidDate(dataInicio) || !validators.isValidDate(dataFim)) {
      return res.status(400).json({ error: 'Formato de data inválido' });
    }

    // Validar IDs se fornecidos
    if (medicoId && !validators.isValidId(medicoId)) {
      return res.status(400).json({ error: 'ID de médico inválido' });
    }

    if (especialidadeId && !validators.isValidId(especialidadeId)) {
      return res.status(400).json({ error: 'ID de especialidade inválido' });
    }

    // Validar status se fornecido
    const statusValidos = ['agendada', 'remarcada', 'realizada', 'cancelada', 'falta', 'concluida', 'nao_compareceu'];
    if (status && !statusValidos.includes(status)) {
      return res.status(400).json({ error: 'Status inválido' });
    }

    let query = `
      SELECT 
        c.data_consulta, c.hora_consulta, c.status,
        p.nome as paciente_nome,
        m.nome as medico_nome,
        e.nome as especialidade
      FROM consultas c
      JOIN pacientes p ON c.paciente_id = p.id
      JOIN medicos m ON c.medico_id = m.id
      JOIN especialidades e ON m.especialidade_id = e.id
      WHERE c.data_consulta BETWEEN ? AND ?
    `;
    
    const params = [dataInicio, dataFim];

    if (medicoId) {
      query += ' AND c.medico_id = ?';
      params.push(medicoId);
    }
    if (especialidadeId) {
      query += ' AND m.especialidade_id = ?';
      params.push(especialidadeId);
    }
    if (status) {
      query += ' AND c.status = ?';
      params.push(status);
    }

    query += ' ORDER BY c.data_consulta, c.hora_consulta';

    const [consultas] = await db.query(query, params);

    // Criar PDF
    const doc = new PDFDocument({ margin: 50 });
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=relatorio-consultas-${dataInicio}-${dataFim}.pdf`);
    
    doc.pipe(res);

    // Cabeçalho
    doc.fontSize(20).text('Clínica Saúde+', { align: 'center' });
    doc.fontSize(14).text('Relatório de Consultas', { align: 'center' });
    doc.moveDown();
    doc.fontSize(10).text(`Período: ${formatDate(dataInicio)} a ${formatDate(dataFim)}`, { align: 'center' });
    doc.moveDown(2);

    // Estatísticas resumidas
    const stats = {
      total: consultas.length,
      concluidas: consultas.filter(c => c.status === 'concluida').length,
      canceladas: consultas.filter(c => c.status === 'cancelada').length,
      agendadas: consultas.filter(c => c.status === 'agendada').length
    };

    doc.fontSize(12).text('Resumo:', { underline: true });
    doc.fontSize(10)
       .text(`Total de consultas: ${stats.total}`)
       .text(`Concluídas: ${stats.concluidas}`)
       .text(`Canceladas: ${stats.canceladas}`)
       .text(`Agendadas: ${stats.agendadas}`);
    doc.moveDown(2);

    // Tabela de consultas
    doc.fontSize(12).text('Detalhamento:', { underline: true });
    doc.moveDown();

    // Cabeçalho da tabela
    const tableTop = doc.y;
    const colWidths = [70, 50, 120, 120, 90];
    
    doc.fontSize(9).font('Helvetica-Bold');
    doc.text('Data', 50, tableTop);
    doc.text('Hora', 120, tableTop);
    doc.text('Paciente', 170, tableTop);
    doc.text('Médico', 290, tableTop);
    doc.text('Status', 410, tableTop);
    
    doc.moveTo(50, tableTop + 15).lineTo(550, tableTop + 15).stroke();

    let y = tableTop + 25;
    doc.font('Helvetica').fontSize(8);

    for (const consulta of consultas) {
      if (y > 700) {
        doc.addPage();
        y = 50;
      }

      doc.text(formatDate(consulta.data_consulta), 50, y);
      doc.text(consulta.hora_consulta.substring(0, 5), 120, y);
      doc.text(consulta.paciente_nome.substring(0, 25), 170, y);
      doc.text(consulta.medico_nome.substring(0, 25), 290, y);
      doc.text(formatStatus(consulta.status), 410, y);
      
      y += 15;
    }

    // Rodapé
    doc.fontSize(8).text(
      `Gerado em: ${new Date().toLocaleString('pt-BR')}`,
      50,
      750,
      { align: 'center' }
    );

    doc.end();

  } catch (error) {
    console.error('Erro ao gerar PDF:', error);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// ==========================================
// GERAR PDF - RELATÓRIO DE MÉDICOS
// ==========================================
exports.gerarPDFMedicos = async (req, res) => {
  try {
    const { dataInicio, dataFim } = req.query;

    // Validações de entrada
    if (!dataInicio || !dataFim) {
      return res.status(400).json({ error: 'Data início e data fim são obrigatórias' });
    }

    // Validar formatos de data
    if (!validators.isValidDate(dataInicio) || !validators.isValidDate(dataFim)) {
      return res.status(400).json({ error: 'Formato de data inválido' });
    }

    const [relatorio] = await db.query(`
      SELECT 
        m.nome, m.crm,
        e.nome as especialidade,
        COUNT(c.id) as total_consultas,
        SUM(CASE WHEN c.status = 'concluida' THEN 1 ELSE 0 END) as concluidas,
        SUM(CASE WHEN c.status = 'cancelada' THEN 1 ELSE 0 END) as canceladas,
        SUM(CASE WHEN c.status = 'nao_compareceu' THEN 1 ELSE 0 END) as nao_compareceram
      FROM medicos m
      JOIN especialidades e ON m.especialidade_id = e.id
      LEFT JOIN consultas c ON m.id = c.medico_id 
        AND c.data_consulta BETWEEN ? AND ?
      WHERE m.ativo = TRUE
      GROUP BY m.id, m.nome, m.crm, e.nome
      ORDER BY total_consultas DESC
    `, [dataInicio, dataFim]);

    const doc = new PDFDocument({ margin: 50 });
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=relatorio-medicos-${dataInicio}-${dataFim}.pdf`);
    
    doc.pipe(res);

    // Cabeçalho
    doc.fontSize(20).text('Clínica Saúde+', { align: 'center' });
    doc.fontSize(14).text('Relatório por Médico', { align: 'center' });
    doc.moveDown();
    doc.fontSize(10).text(`Período: ${formatDate(dataInicio)} a ${formatDate(dataFim)}`, { align: 'center' });
    doc.moveDown(2);

    // Tabela
    const tableTop = doc.y;
    
    doc.fontSize(9).font('Helvetica-Bold');
    doc.text('Médico', 50, tableTop);
    doc.text('CRM', 180, tableTop);
    doc.text('Especialidade', 240, tableTop);
    doc.text('Total', 350, tableTop);
    doc.text('Concl.', 390, tableTop);
    doc.text('Canc.', 430, tableTop);
    doc.text('Faltas', 470, tableTop);
    
    doc.moveTo(50, tableTop + 15).lineTo(550, tableTop + 15).stroke();

    let y = tableTop + 25;
    doc.font('Helvetica').fontSize(8);

    for (const med of relatorio) {
      if (y > 700) {
        doc.addPage();
        y = 50;
      }

      doc.text(med.nome.substring(0, 25), 50, y);
      doc.text(med.crm, 180, y);
      doc.text(med.especialidade.substring(0, 20), 240, y);
      doc.text(String(med.total_consultas || 0), 350, y);
      doc.text(String(med.concluidas || 0), 390, y);
      doc.text(String(med.canceladas || 0), 430, y);
      doc.text(String(med.nao_compareceram || 0), 470, y);
      
      y += 15;
    }

    doc.fontSize(8).text(
      `Gerado em: ${new Date().toLocaleString('pt-BR')}`,
      50,
      750,
      { align: 'center' }
    );

    doc.end();

  } catch (error) {
    console.error('Erro ao gerar PDF de médicos:', error);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// ==========================================
// GERAR PDF - RELATÓRIO DE ESPECIALIDADES
// ==========================================
exports.gerarPDFEspecialidades = async (req, res) => {
  try {
    const { dataInicio, dataFim } = req.query;

    if (!dataInicio || !dataFim) {
      return res.status(400).json({ error: 'Data início e data fim são obrigatórias' });
    }

    if (!validators.isValidDate(dataInicio) || !validators.isValidDate(dataFim)) {
      return res.status(400).json({ error: 'Formato de data inválido' });
    }

    const [relatorio] = await db.query(`
      SELECT 
        e.nome as especialidade,
        COUNT(DISTINCT m.id) as total_medicos,
        COUNT(c.id) as total_consultas,
        SUM(CASE WHEN c.status = 'concluida' THEN 1 ELSE 0 END) as concluidas,
        SUM(CASE WHEN c.status = 'cancelada' THEN 1 ELSE 0 END) as canceladas,
        ROUND(SUM(CASE WHEN c.status = 'cancelada' THEN 1 ELSE 0 END) * 100.0 / NULLIF(COUNT(c.id), 0), 1) as taxa_cancelamento
      FROM especialidades e
      LEFT JOIN medicos m ON e.id = m.especialidade_id AND m.ativo = TRUE
      LEFT JOIN consultas c ON m.id = c.medico_id 
        AND c.data_consulta BETWEEN ? AND ?
      WHERE e.ativo = TRUE
      GROUP BY e.id, e.nome
      ORDER BY total_consultas DESC
    `, [dataInicio, dataFim]);

    const doc = new PDFDocument({ margin: 50 });
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=relatorio-especialidades-${dataInicio}-${dataFim}.pdf`);
    
    doc.pipe(res);

    doc.fontSize(20).text('Clínica Saúde+', { align: 'center' });
    doc.fontSize(14).text('Relatório por Especialidade', { align: 'center' });
    doc.moveDown();
    doc.fontSize(10).text(`Período: ${formatDate(dataInicio)} a ${formatDate(dataFim)}`, { align: 'center' });
    doc.moveDown(2);

    const tableTop = doc.y;
    
    doc.fontSize(9).font('Helvetica-Bold');
    doc.text('Especialidade', 50, tableTop);
    doc.text('Médicos', 200, tableTop);
    doc.text('Total', 260, tableTop);
    doc.text('Concluídas', 320, tableTop);
    doc.text('Canceladas', 400, tableTop);
    doc.text('Taxa Canc.', 480, tableTop);
    
    doc.moveTo(50, tableTop + 15).lineTo(550, tableTop + 15).stroke();

    let y = tableTop + 25;
    doc.font('Helvetica').fontSize(8);

    for (const esp of relatorio) {
      if (y > 700) {
        doc.addPage();
        y = 50;
      }

      doc.text(esp.especialidade.substring(0, 25), 50, y);
      doc.text(String(esp.total_medicos || 0), 200, y);
      doc.text(String(esp.total_consultas || 0), 260, y);
      doc.text(String(esp.concluidas || 0), 320, y);
      doc.text(String(esp.canceladas || 0), 400, y);
      doc.text(`${esp.taxa_cancelamento || 0}%`, 480, y);
      
      y += 15;
    }

    doc.fontSize(8).text(
      `Gerado em: ${new Date().toLocaleString('pt-BR')}`,
      50, 750, { align: 'center' }
    );

    doc.end();

  } catch (error) {
    console.error('Erro ao gerar PDF de especialidades:', error);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// ==========================================
// GERAR PDF - PACIENTES FREQUENTES
// ==========================================
exports.gerarPDFPacientes = async (req, res) => {
  try {
    const { dataInicio, dataFim, limite } = req.query;

    if (!dataInicio || !dataFim) {
      return res.status(400).json({ error: 'Data início e data fim são obrigatórias' });
    }

    if (!validators.isValidDate(dataInicio) || !validators.isValidDate(dataFim)) {
      return res.status(400).json({ error: 'Formato de data inválido' });
    }

    const limiteNum = Math.min(Math.max(parseInt(limite) || 20, 1), 100);

    const [relatorio] = await db.query(`
      SELECT 
        p.nome, p.cpf, p.email,
        conv.nome as convenio,
        COUNT(c.id) as total_consultas,
        SUM(CASE WHEN c.status = 'concluida' THEN 1 ELSE 0 END) as compareceu,
        SUM(CASE WHEN c.status = 'nao_compareceu' THEN 1 ELSE 0 END) as faltou,
        SUM(CASE WHEN c.status = 'cancelada' THEN 1 ELSE 0 END) as cancelou
      FROM pacientes p
      LEFT JOIN convenios conv ON p.convenio_id = conv.id
      JOIN consultas c ON p.id = c.paciente_id 
        AND c.data_consulta BETWEEN ? AND ?
      GROUP BY p.id, p.nome, p.cpf, p.email, conv.nome
      HAVING COUNT(c.id) > 0
      ORDER BY total_consultas DESC
      LIMIT ?
    `, [dataInicio, dataFim, limiteNum]);

    const doc = new PDFDocument({ margin: 50 });
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=relatorio-pacientes-${dataInicio}-${dataFim}.pdf`);
    
    doc.pipe(res);

    doc.fontSize(20).text('Clínica Saúde+', { align: 'center' });
    doc.fontSize(14).text('Pacientes Mais Frequentes', { align: 'center' });
    doc.moveDown();
    doc.fontSize(10).text(`Período: ${formatDate(dataInicio)} a ${formatDate(dataFim)}`, { align: 'center' });
    doc.moveDown(2);

    const tableTop = doc.y;
    
    doc.fontSize(9).font('Helvetica-Bold');
    doc.text('#', 50, tableTop);
    doc.text('Paciente', 70, tableTop);
    doc.text('Convênio', 220, tableTop);
    doc.text('Total', 320, tableTop);
    doc.text('Comp.', 370, tableTop);
    doc.text('Faltou', 420, tableTop);
    doc.text('Canc.', 470, tableTop);
    
    doc.moveTo(50, tableTop + 15).lineTo(550, tableTop + 15).stroke();

    let y = tableTop + 25;
    doc.font('Helvetica').fontSize(8);

    relatorio.forEach((pac, index) => {
      if (y > 700) {
        doc.addPage();
        y = 50;
      }

      doc.text(`${index + 1}º`, 50, y);
      doc.text(pac.nome.substring(0, 25), 70, y);
      doc.text((pac.convenio || 'Particular').substring(0, 15), 220, y);
      doc.text(String(pac.total_consultas || 0), 320, y);
      doc.text(String(pac.compareceu || 0), 370, y);
      doc.text(String(pac.faltou || 0), 420, y);
      doc.text(String(pac.cancelou || 0), 470, y);
      
      y += 15;
    });

    doc.fontSize(8).text(
      `Gerado em: ${new Date().toLocaleString('pt-BR')}`,
      50, 750, { align: 'center' }
    );

    doc.end();

  } catch (error) {
    console.error('Erro ao gerar PDF de pacientes:', error);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// ==========================================
// GERAR PDF - CANCELAMENTOS
// ==========================================
exports.gerarPDFCancelamentos = async (req, res) => {
  try {
    const { dataInicio, dataFim } = req.query;

    if (!dataInicio || !dataFim) {
      return res.status(400).json({ error: 'Data início e data fim são obrigatórias' });
    }

    if (!validators.isValidDate(dataInicio) || !validators.isValidDate(dataFim)) {
      return res.status(400).json({ error: 'Formato de data inválido' });
    }

    // Taxa geral
    const [taxaGeral] = await db.query(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status = 'cancelada' THEN 1 ELSE 0 END) as canceladas,
        SUM(CASE WHEN status = 'remarcada' THEN 1 ELSE 0 END) as remarcadas,
        ROUND(SUM(CASE WHEN status = 'cancelada' THEN 1 ELSE 0 END) * 100.0 / COUNT(*), 1) as taxa_cancelamento
      FROM consultas
      WHERE data_consulta BETWEEN ? AND ?
    `, [dataInicio, dataFim]);

    // Por dia da semana
    const [porDiaSemana] = await db.query(`
      SELECT 
        DAYOFWEEK(data_consulta) as dia_semana,
        COUNT(*) as total,
        SUM(CASE WHEN status = 'cancelada' THEN 1 ELSE 0 END) as canceladas,
        ROUND(SUM(CASE WHEN status = 'cancelada' THEN 1 ELSE 0 END) * 100.0 / COUNT(*), 1) as taxa
      FROM consultas
      WHERE data_consulta BETWEEN ? AND ?
      GROUP BY DAYOFWEEK(data_consulta)
      ORDER BY dia_semana
    `, [dataInicio, dataFim]);

    const diasSemana = ['', 'Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];

    const doc = new PDFDocument({ margin: 50 });
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=relatorio-cancelamentos-${dataInicio}-${dataFim}.pdf`);
    
    doc.pipe(res);

    doc.fontSize(20).text('Clínica Saúde+', { align: 'center' });
    doc.fontSize(14).text('Análise de Cancelamentos', { align: 'center' });
    doc.moveDown();
    doc.fontSize(10).text(`Período: ${formatDate(dataInicio)} a ${formatDate(dataFim)}`, { align: 'center' });
    doc.moveDown(2);

    // Resumo Geral
    doc.fontSize(12).font('Helvetica-Bold').text('Resumo Geral', 50);
    doc.moveDown();
    doc.font('Helvetica').fontSize(10);
    doc.text(`Total de Consultas: ${taxaGeral[0].total || 0}`);
    doc.text(`Canceladas: ${taxaGeral[0].canceladas || 0}`);
    doc.text(`Remarcadas: ${taxaGeral[0].remarcadas || 0}`);
    doc.text(`Taxa de Cancelamento: ${taxaGeral[0].taxa_cancelamento || 0}%`);
    doc.moveDown(2);

    // Por dia da semana
    doc.fontSize(12).font('Helvetica-Bold').text('Por Dia da Semana', 50);
    doc.moveDown();
    
    const tableTop = doc.y;
    doc.fontSize(9).font('Helvetica-Bold');
    doc.text('Dia', 50, tableTop);
    doc.text('Total', 200, tableTop);
    doc.text('Canceladas', 300, tableTop);
    doc.text('Taxa', 420, tableTop);
    
    doc.moveTo(50, tableTop + 15).lineTo(500, tableTop + 15).stroke();

    let y = tableTop + 25;
    doc.font('Helvetica').fontSize(9);

    for (const dia of porDiaSemana) {
      doc.text(diasSemana[dia.dia_semana], 50, y);
      doc.text(String(dia.total), 200, y);
      doc.text(String(dia.canceladas), 300, y);
      doc.text(`${dia.taxa || 0}%`, 420, y);
      y += 15;
    }

    doc.fontSize(8).text(
      `Gerado em: ${new Date().toLocaleString('pt-BR')}`,
      50, 750, { align: 'center' }
    );

    doc.end();

  } catch (error) {
    console.error('Erro ao gerar PDF de cancelamentos:', error);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// Funções auxiliares
function formatDate(dateStr) {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return date.toLocaleDateString('pt-BR');
}

function formatStatus(status) {
  const statusMap = {
    'agendada': 'Agendada',
    'concluida': 'Concluída',
    'cancelada': 'Cancelada',
    'remarcada': 'Remarcada',
    'nao_compareceu': 'Não compareceu'
  };
  return statusMap[status] || status;
}
