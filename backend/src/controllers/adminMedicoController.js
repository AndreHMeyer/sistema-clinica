const bcrypt = require('bcryptjs');
const db = require('../config/database');
const config = require('../config/config');
const { validators } = require('../middlewares/security');

// ==========================================
// LISTAR TODOS OS MÉDICOS
// ==========================================
exports.listarMedicos = async (req, res) => {
  try {
    const [medicos] = await db.query(`
      SELECT m.id, m.nome, m.crm, m.email, m.telefone, m.ativo,
             e.id as especialidade_id, e.nome as especialidade_nome,
             m.created_at, m.updated_at
      FROM medicos m
      JOIN especialidades e ON m.especialidade_id = e.id
      ORDER BY m.nome
    `);

    // Buscar convênios de cada médico
    for (let medico of medicos) {
      const [convenios] = await db.query(`
        SELECT c.id, c.nome 
        FROM convenios c
        JOIN medico_convenios mc ON c.id = mc.convenio_id
        WHERE mc.medico_id = ?
      `, [medico.id]);
      medico.convenios = convenios;
    }

    return res.json(medicos);
  } catch (error) {
    console.error('Erro ao listar médicos:', error);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// ==========================================
// BUSCAR MÉDICO POR ID
// ==========================================
exports.buscarMedico = async (req, res) => {
  try {
    const { id } = req.params;

    // Validar ID
    if (!validators.isValidId(id)) {
      return res.status(400).json({ error: 'ID inválido' });
    }

    const [medicos] = await db.query(`
      SELECT m.id, m.nome, m.crm, m.email, m.telefone, m.ativo,
             e.id as especialidade_id, e.nome as especialidade_nome,
             m.created_at, m.updated_at
      FROM medicos m
      JOIN especialidades e ON m.especialidade_id = e.id
      WHERE m.id = ?
    `, [id]);

    if (medicos.length === 0) {
      return res.status(404).json({ error: 'Médico não encontrado' });
    }

    const medico = medicos[0];

    // Buscar convênios
    const [convenios] = await db.query(`
      SELECT c.id, c.nome 
      FROM convenios c
      JOIN medico_convenios mc ON c.id = mc.convenio_id
      WHERE mc.medico_id = ?
    `, [id]);

    medico.convenios = convenios;
    medico.convenio_ids = convenios.map(c => c.id);

    return res.json(medico);
  } catch (error) {
    console.error('Erro ao buscar médico:', error);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// ==========================================
// CRIAR MÉDICO
// ==========================================
exports.criarMedico = async (req, res) => {
  const connection = await db.getConnection();
  
  try {
    const { nome, crm, email, telefone, senha, especialidade_id, convenio_ids } = req.body;

    // Validações de entrada
    if (!nome || !crm || !email || !senha || !especialidade_id) {
      return res.status(400).json({ 
        error: 'Nome, CRM, email, senha e especialidade são obrigatórios' 
      });
    }

    // Validar formato do email
    if (!validators.isValidEmail(email)) {
      return res.status(400).json({ error: 'Formato de e-mail inválido' });
    }

    // Validar formato do CRM
    if (!validators.isValidCRM(crm)) {
      return res.status(400).json({ error: 'Formato de CRM inválido' });
    }

    // Validar nome
    if (!validators.isValidName(nome)) {
      return res.status(400).json({ error: 'Nome deve ter entre 2 e 100 caracteres' });
    }

    // Validar força da senha
    if (!validators.isStrongPassword(senha)) {
      return res.status(400).json({ 
        error: 'Senha deve ter mínimo 8 caracteres, incluindo maiúscula, minúscula e número' 
      });
    }

    // Validar telefone se fornecido
    if (telefone && !validators.isValidPhone(telefone)) {
      return res.status(400).json({ error: 'Formato de telefone inválido' });
    }

    // Validar especialidade_id
    if (!validators.isValidId(especialidade_id)) {
      return res.status(400).json({ error: 'ID de especialidade inválido' });
    }

    // Normalizar email
    const normalizedEmail = email.toLowerCase().trim();

    // Verificar se email já existe
    const [emailExiste] = await connection.query(
      'SELECT id FROM medicos WHERE LOWER(email) = ?',
      [normalizedEmail]
    );
    if (emailExiste.length > 0) {
      return res.status(400).json({ error: 'E-mail já cadastrado' });
    }

    // Verificar se CRM já existe
    const [crmExiste] = await connection.query(
      'SELECT id FROM medicos WHERE crm = ?',
      [crm.toUpperCase().trim()]
    );
    if (crmExiste.length > 0) {
      return res.status(400).json({ error: 'CRM já cadastrado' });
    }

    await connection.beginTransaction();

    // Hash da senha com salt rounds da configuração
    const senhaHash = await bcrypt.hash(senha, config.bcrypt.saltRounds);

    // Inserir médico
    const [result] = await connection.query(`
      INSERT INTO medicos (nome, crm, email, telefone, senha, especialidade_id, ativo)
      VALUES (?, ?, ?, ?, ?, ?, TRUE)
    `, [nome.trim(), crm.toUpperCase().trim(), normalizedEmail, telefone || null, senhaHash, especialidade_id]);

    const medicoId = result.insertId;

    // Inserir convênios (com validação)
    if (convenio_ids && Array.isArray(convenio_ids) && convenio_ids.length > 0) {
      for (const convenioId of convenio_ids) {
        if (validators.isValidId(convenioId)) {
          await connection.query(
            'INSERT INTO medico_convenios (medico_id, convenio_id) VALUES (?, ?)',
            [medicoId, convenioId]
          );
        }
      }
    }

    await connection.commit();

    // Log de criação
    console.log(`[SECURITY] Médico criado: ${medicoId}`);

    return res.status(201).json({
      message: 'Médico cadastrado com sucesso',
      id: medicoId
    });

  } catch (error) {
    await connection.rollback();
    console.error('Erro ao criar médico:', error);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  } finally {
    connection.release();
  }
};

// ==========================================
// ATUALIZAR MÉDICO
// ==========================================
exports.atualizarMedico = async (req, res) => {
  const connection = await db.getConnection();
  
  try {
    const { id } = req.params;
    const { nome, crm, email, telefone, senha, especialidade_id, convenio_ids, ativo } = req.body;

    // Validar ID
    if (!validators.isValidId(id)) {
      return res.status(400).json({ error: 'ID inválido' });
    }

    // Verificar se médico existe
    const [medico] = await connection.query(
      'SELECT id FROM medicos WHERE id = ?',
      [id]
    );
    if (medico.length === 0) {
      return res.status(404).json({ error: 'Médico não encontrado' });
    }

    // Validações de entrada
    if (email && !validators.isValidEmail(email)) {
      return res.status(400).json({ error: 'Formato de e-mail inválido' });
    }

    if (crm && !validators.isValidCRM(crm)) {
      return res.status(400).json({ error: 'Formato de CRM inválido' });
    }

    if (nome && !validators.isValidName(nome)) {
      return res.status(400).json({ error: 'Nome deve ter entre 2 e 100 caracteres' });
    }

    if (telefone && !validators.isValidPhone(telefone)) {
      return res.status(400).json({ error: 'Formato de telefone inválido' });
    }

    if (especialidade_id && !validators.isValidId(especialidade_id)) {
      return res.status(400).json({ error: 'ID de especialidade inválido' });
    }

    // Validar força da senha se fornecida
    if (senha && !validators.isStrongPassword(senha)) {
      return res.status(400).json({ 
        error: 'Senha deve ter mínimo 8 caracteres, incluindo maiúscula, minúscula e número' 
      });
    }

    // Verificar se email já existe em outro médico
    if (email) {
      const normalizedEmail = email.toLowerCase().trim();
      const [emailExiste] = await connection.query(
        'SELECT id FROM medicos WHERE LOWER(email) = ? AND id != ?',
        [normalizedEmail, id]
      );
      if (emailExiste.length > 0) {
        return res.status(400).json({ error: 'E-mail já cadastrado para outro médico' });
      }
    }

    // Verificar se CRM já existe em outro médico
    if (crm) {
      const [crmExiste] = await connection.query(
        'SELECT id FROM medicos WHERE crm = ? AND id != ?',
        [crm.toUpperCase().trim(), id]
      );
      if (crmExiste.length > 0) {
        return res.status(400).json({ error: 'CRM já cadastrado para outro médico' });
      }
    }

    await connection.beginTransaction();

    // Preparar campos para atualização
    let updateFields = [];
    let updateValues = [];

    if (nome) {
      updateFields.push('nome = ?');
      updateValues.push(nome.trim());
    }
    if (crm) {
      updateFields.push('crm = ?');
      updateValues.push(crm.toUpperCase().trim());
    }
    if (email) {
      updateFields.push('email = ?');
      updateValues.push(email.toLowerCase().trim());
    }
    if (telefone !== undefined) {
      updateFields.push('telefone = ?');
      updateValues.push(telefone || null);
    }
    if (especialidade_id) {
      updateFields.push('especialidade_id = ?');
      updateValues.push(especialidade_id);
    }
    if (ativo !== undefined) {
      updateFields.push('ativo = ?');
      updateValues.push(ativo);
    }
    if (senha) {
      // Hash com salt rounds da configuração
      const senhaHash = await bcrypt.hash(senha, config.bcrypt.saltRounds);
      updateFields.push('senha = ?');
      updateValues.push(senhaHash);
    }

    if (updateFields.length > 0) {
      updateValues.push(id);
      await connection.query(
        `UPDATE medicos SET ${updateFields.join(', ')} WHERE id = ?`,
        updateValues
      );
    }

    // Atualizar convênios se fornecidos
    if (convenio_ids !== undefined) {
      // Remover convênios antigos
      await connection.query(
        'DELETE FROM medico_convenios WHERE medico_id = ?',
        [id]
      );

      // Inserir novos convênios (com validação)
      if (convenio_ids && Array.isArray(convenio_ids) && convenio_ids.length > 0) {
        for (const convenioId of convenio_ids) {
          if (validators.isValidId(convenioId)) {
            await connection.query(
              'INSERT INTO medico_convenios (medico_id, convenio_id) VALUES (?, ?)',
              [id, convenioId]
            );
          }
        }
      }
    }

    await connection.commit();

    // Log de atualização
    console.log(`[SECURITY] Médico atualizado: ${id}`);

    return res.json({ message: 'Médico atualizado com sucesso' });

  } catch (error) {
    await connection.rollback();
    console.error('Erro ao atualizar médico:', error);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  } finally {
    connection.release();
  }
};

// ==========================================
// DELETAR/DESATIVAR MÉDICO
// ==========================================
exports.deletarMedico = async (req, res) => {
  try {
    const { id } = req.params;

    // Validar ID
    if (!validators.isValidId(id)) {
      return res.status(400).json({ error: 'ID inválido' });
    }

    // Verificar se médico existe
    const [medico] = await db.query(
      'SELECT id FROM medicos WHERE id = ?',
      [id]
    );
    if (medico.length === 0) {
      return res.status(404).json({ error: 'Médico não encontrado' });
    }

    // Verificar se há consultas futuras agendadas
    const [consultasFuturas] = await db.query(`
      SELECT COUNT(*) as total FROM consultas 
      WHERE medico_id = ? 
      AND data_consulta >= CURDATE()
      AND status IN ('agendada', 'remarcada')
    `, [id]);

    if (consultasFuturas[0].total > 0) {
      // Apenas desativa o médico
      await db.query('UPDATE medicos SET ativo = FALSE WHERE id = ?', [id]);
      
      // Log de desativação
      console.log(`[SECURITY] Médico desativado (consultas pendentes): ${id}`);
      
      return res.json({ 
        message: 'Médico desativado. Há consultas futuras pendentes que devem ser reagendadas.' 
      });
    }

    // Desativa o médico (soft delete)
    await db.query('UPDATE medicos SET ativo = FALSE WHERE id = ?', [id]);

    // Log de desativação
    console.log(`[SECURITY] Médico desativado: ${id}`);

    return res.json({ message: 'Médico desativado com sucesso' });

  } catch (error) {
    console.error('Erro ao deletar médico:', error);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// ==========================================
// LISTAR ESPECIALIDADES
// ==========================================
exports.listarEspecialidades = async (req, res) => {
  try {
    const [especialidades] = await db.query(
      'SELECT id, nome FROM especialidades WHERE ativo = TRUE ORDER BY nome'
    );
    return res.json(especialidades);
  } catch (error) {
    console.error('Erro ao listar especialidades:', error);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// ==========================================
// LISTAR CONVÊNIOS
// ==========================================
exports.listarConvenios = async (req, res) => {
  try {
    const [convenios] = await db.query(
      'SELECT id, nome FROM convenios WHERE ativo = TRUE ORDER BY nome'
    );
    return res.json(convenios);
  } catch (error) {
    console.error('Erro ao listar convênios:', error);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
};
