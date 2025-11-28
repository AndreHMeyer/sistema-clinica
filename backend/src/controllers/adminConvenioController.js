const db = require('../config/database');

// ==========================================
// LISTAR TODOS OS CONVÊNIOS
// ==========================================
exports.listarConvenios = async (req, res) => {
  try {
    const [convenios] = await db.query(`
      SELECT c.*, 
             (SELECT COUNT(*) FROM medico_convenios WHERE convenio_id = c.id) as total_medicos
      FROM convenios c
      ORDER BY c.nome
    `);

    return res.json(convenios);
  } catch (error) {
    console.error('Erro ao listar convênios:', error);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// ==========================================
// BUSCAR CONVÊNIO POR ID
// ==========================================
exports.buscarConvenio = async (req, res) => {
  try {
    const { id } = req.params;

    const [convenios] = await db.query(
      'SELECT * FROM convenios WHERE id = ?',
      [id]
    );

    if (convenios.length === 0) {
      return res.status(404).json({ error: 'Convênio não encontrado' });
    }

    // Buscar médicos que aceitam este convênio
    const [medicos] = await db.query(`
      SELECT m.id, m.nome, e.nome as especialidade
      FROM medicos m
      JOIN especialidades e ON m.especialidade_id = e.id
      JOIN medico_convenios mc ON m.id = mc.medico_id
      WHERE mc.convenio_id = ? AND m.ativo = TRUE
      ORDER BY m.nome
    `, [id]);

    return res.json({
      ...convenios[0],
      medicos
    });

  } catch (error) {
    console.error('Erro ao buscar convênio:', error);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// ==========================================
// CRIAR CONVÊNIO
// ==========================================
exports.criarConvenio = async (req, res) => {
  try {
    const { nome, codigo } = req.body;

    if (!nome) {
      return res.status(400).json({ error: 'Nome do convênio é obrigatório' });
    }

    // Verificar se nome já existe
    const [nomeExiste] = await db.query(
      'SELECT id FROM convenios WHERE nome = ?',
      [nome]
    );
    if (nomeExiste.length > 0) {
      return res.status(400).json({ error: 'Já existe um convênio com este nome' });
    }

    // Verificar se código já existe
    if (codigo) {
      const [codigoExiste] = await db.query(
        'SELECT id FROM convenios WHERE codigo = ?',
        [codigo]
      );
      if (codigoExiste.length > 0) {
        return res.status(400).json({ error: 'Já existe um convênio com este código' });
      }
    }

    const [result] = await db.query(
      'INSERT INTO convenios (nome, codigo, ativo) VALUES (?, ?, TRUE)',
      [nome, codigo || null]
    );

    return res.status(201).json({
      message: 'Convênio cadastrado com sucesso',
      id: result.insertId
    });

  } catch (error) {
    console.error('Erro ao criar convênio:', error);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// ==========================================
// ATUALIZAR CONVÊNIO
// ==========================================
exports.atualizarConvenio = async (req, res) => {
  try {
    const { id } = req.params;
    const { nome, codigo, ativo } = req.body;

    // Verificar se convênio existe
    const [convenio] = await db.query(
      'SELECT id FROM convenios WHERE id = ?',
      [id]
    );
    if (convenio.length === 0) {
      return res.status(404).json({ error: 'Convênio não encontrado' });
    }

    // Verificar se nome já existe em outro convênio
    if (nome) {
      const [nomeExiste] = await db.query(
        'SELECT id FROM convenios WHERE nome = ? AND id != ?',
        [nome, id]
      );
      if (nomeExiste.length > 0) {
        return res.status(400).json({ error: 'Já existe outro convênio com este nome' });
      }
    }

    // Verificar se código já existe em outro convênio
    if (codigo) {
      const [codigoExiste] = await db.query(
        'SELECT id FROM convenios WHERE codigo = ? AND id != ?',
        [codigo, id]
      );
      if (codigoExiste.length > 0) {
        return res.status(400).json({ error: 'Já existe outro convênio com este código' });
      }
    }

    // Preparar campos para atualização
    let updateFields = [];
    let updateValues = [];

    if (nome) {
      updateFields.push('nome = ?');
      updateValues.push(nome);
    }
    if (codigo !== undefined) {
      updateFields.push('codigo = ?');
      updateValues.push(codigo || null);
    }
    if (ativo !== undefined) {
      updateFields.push('ativo = ?');
      updateValues.push(ativo);
    }

    if (updateFields.length > 0) {
      updateValues.push(id);
      await db.query(
        `UPDATE convenios SET ${updateFields.join(', ')} WHERE id = ?`,
        updateValues
      );
    }

    return res.json({ message: 'Convênio atualizado com sucesso' });

  } catch (error) {
    console.error('Erro ao atualizar convênio:', error);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// ==========================================
// DELETAR/DESATIVAR CONVÊNIO
// ==========================================
exports.deletarConvenio = async (req, res) => {
  try {
    const { id } = req.params;

    // Verificar se convênio existe
    const [convenio] = await db.query(
      'SELECT id FROM convenios WHERE id = ?',
      [id]
    );
    if (convenio.length === 0) {
      return res.status(404).json({ error: 'Convênio não encontrado' });
    }

    // Verificar se há médicos usando este convênio
    const [medicosComConvenio] = await db.query(
      'SELECT COUNT(*) as total FROM medico_convenios WHERE convenio_id = ?',
      [id]
    );

    if (medicosComConvenio[0].total > 0) {
      // Apenas desativa
      await db.query('UPDATE convenios SET ativo = FALSE WHERE id = ?', [id]);
      return res.json({ 
        message: 'Convênio desativado. Existem médicos associados a este convênio.' 
      });
    }

    // Desativa o convênio (soft delete)
    await db.query('UPDATE convenios SET ativo = FALSE WHERE id = ?', [id]);

    return res.json({ message: 'Convênio desativado com sucesso' });

  } catch (error) {
    console.error('Erro ao deletar convênio:', error);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// ==========================================
// ESTATÍSTICAS DE CONVÊNIOS
// ==========================================
exports.estatisticasConvenios = async (req, res) => {
  try {
    // Consultas por convênio no mês atual
    const [consultasPorConvenio] = await db.query(`
      SELECT c.nome as convenio, COUNT(co.id) as total_consultas
      FROM convenios c
      LEFT JOIN pacientes p ON p.convenio_id = c.id
      LEFT JOIN consultas co ON co.paciente_id = p.id 
        AND MONTH(co.data_consulta) = MONTH(CURDATE())
        AND YEAR(co.data_consulta) = YEAR(CURDATE())
      WHERE c.ativo = TRUE
      GROUP BY c.id, c.nome
      ORDER BY total_consultas DESC
    `);

    // Total de pacientes por convênio
    const [pacientesPorConvenio] = await db.query(`
      SELECT c.nome as convenio, COUNT(p.id) as total_pacientes
      FROM convenios c
      LEFT JOIN pacientes p ON p.convenio_id = c.id AND p.ativo = TRUE
      WHERE c.ativo = TRUE
      GROUP BY c.id, c.nome
      ORDER BY total_pacientes DESC
    `);

    return res.json({
      consultasPorConvenio,
      pacientesPorConvenio
    });

  } catch (error) {
    console.error('Erro ao buscar estatísticas:', error);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
};
