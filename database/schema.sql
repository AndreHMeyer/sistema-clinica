-- =============================================
-- BANCO DE DADOS - CLÍNICA SAÚDE+
-- Sistema de Agendamento de Consultas Médicas
-- =============================================

-- Criar banco de dados
CREATE DATABASE IF NOT EXISTS clinica_saude;
USE clinica_saude;

-- =============================================
-- TABELA: convenios
-- =============================================
CREATE TABLE IF NOT EXISTS convenios (
    id INT PRIMARY KEY AUTO_INCREMENT,
    nome VARCHAR(100) NOT NULL,
    codigo VARCHAR(20) UNIQUE,
    ativo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- =============================================
-- TABELA: especialidades
-- =============================================
CREATE TABLE IF NOT EXISTS especialidades (
    id INT PRIMARY KEY AUTO_INCREMENT,
    nome VARCHAR(100) NOT NULL UNIQUE,
    descricao TEXT,
    ativo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- =============================================
-- TABELA: pacientes
-- =============================================
CREATE TABLE IF NOT EXISTS pacientes (
    id INT PRIMARY KEY AUTO_INCREMENT,
    cpf VARCHAR(14) NOT NULL UNIQUE,
    nome VARCHAR(150) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    senha VARCHAR(255) NOT NULL,
    telefone VARCHAR(20) NOT NULL,
    convenio_id INT NULL,
    bloqueado BOOLEAN DEFAULT FALSE,
    faltas_consecutivas INT DEFAULT 0,
    ativo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (convenio_id) REFERENCES convenios(id) ON DELETE SET NULL
);

-- =============================================
-- TABELA: medicos
-- =============================================
CREATE TABLE IF NOT EXISTS medicos (
    id INT PRIMARY KEY AUTO_INCREMENT,
    nome VARCHAR(150) NOT NULL,
    crm VARCHAR(20) NOT NULL UNIQUE,
    email VARCHAR(150) NOT NULL UNIQUE,
    senha VARCHAR(255) NOT NULL,
    telefone VARCHAR(20),
    especialidade_id INT NOT NULL,
    ativo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (especialidade_id) REFERENCES especialidades(id)
);

-- =============================================
-- TABELA: medico_convenios (N:N)
-- =============================================
CREATE TABLE IF NOT EXISTS medico_convenios (
    medico_id INT NOT NULL,
    convenio_id INT NOT NULL,
    PRIMARY KEY (medico_id, convenio_id),
    FOREIGN KEY (medico_id) REFERENCES medicos(id) ON DELETE CASCADE,
    FOREIGN KEY (convenio_id) REFERENCES convenios(id) ON DELETE CASCADE
);

-- =============================================
-- TABELA: horarios_disponiveis
-- Horários semanais definidos pelo médico
-- =============================================
CREATE TABLE IF NOT EXISTS horarios_disponiveis (
    id INT PRIMARY KEY AUTO_INCREMENT,
    medico_id INT NOT NULL,
    dia_semana TINYINT NOT NULL COMMENT '0=Domingo, 1=Segunda, ..., 6=Sábado',
    hora_inicio TIME NOT NULL,
    hora_fim TIME NOT NULL,
    duracao_consulta INT DEFAULT 30 COMMENT 'Duração em minutos',
    ativo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (medico_id) REFERENCES medicos(id) ON DELETE CASCADE
);

-- =============================================
-- TABELA: bloqueios_horario
-- Bloqueios pontuais de horários (imprevistos)
-- =============================================
CREATE TABLE IF NOT EXISTS bloqueios_horario (
    id INT PRIMARY KEY AUTO_INCREMENT,
    medico_id INT NOT NULL,
    data DATE NOT NULL,
    hora_inicio TIME NOT NULL,
    hora_fim TIME NOT NULL,
    motivo VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (medico_id) REFERENCES medicos(id) ON DELETE CASCADE
);

-- =============================================
-- TABELA: consultas
-- =============================================
CREATE TABLE IF NOT EXISTS consultas (
    id INT PRIMARY KEY AUTO_INCREMENT,
    paciente_id INT NOT NULL,
    medico_id INT NOT NULL,
    data_consulta DATE NOT NULL,
    hora_consulta TIME NOT NULL,
    status ENUM('agendada', 'realizada', 'cancelada', 'remarcada', 'falta') DEFAULT 'agendada',
    tipo_atendimento ENUM('particular', 'convenio') DEFAULT 'particular',
    convenio_id INT NULL,
    observacoes_medico TEXT NULL,
    motivo_cancelamento VARCHAR(255) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (paciente_id) REFERENCES pacientes(id),
    FOREIGN KEY (medico_id) REFERENCES medicos(id),
    FOREIGN KEY (convenio_id) REFERENCES convenios(id) ON DELETE SET NULL,
    UNIQUE KEY unique_consulta (medico_id, data_consulta, hora_consulta)
);

-- =============================================
-- TABELA: administradores
-- =============================================
CREATE TABLE IF NOT EXISTS administradores (
    id INT PRIMARY KEY AUTO_INCREMENT,
    nome VARCHAR(150) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    senha VARCHAR(255) NOT NULL,
    ativo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- =============================================
-- DADOS INICIAIS
-- =============================================

-- Inserir convênios
INSERT INTO convenios (nome, codigo) VALUES 
('Particular', 'PARTICULAR'),
('Unimed', 'UNIMED'),
('Bradesco Saúde', 'BRADESCO'),
('SulAmérica', 'SULAMERICA'),
('Amil', 'AMIL'),
('Hapvida', 'HAPVIDA');

-- Inserir especialidades
INSERT INTO especialidades (nome, descricao) VALUES 
('Clínica Geral', 'Atendimento médico geral e preventivo'),
('Cardiologia', 'Especialidade médica do coração'),
('Dermatologia', 'Especialidade médica da pele'),
('Ortopedia', 'Especialidade médica dos ossos e articulações'),
('Pediatria', 'Especialidade médica infantil'),
('Ginecologia', 'Especialidade médica da saúde da mulher'),
('Neurologia', 'Especialidade médica do sistema nervoso'),
('Oftalmologia', 'Especialidade médica dos olhos');

-- Inserir um administrador padrão (senha: admin123)
INSERT INTO administradores (nome, email, senha) VALUES 
('Administrador', 'admin@clinicasaude.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi');

-- Inserir médicos de exemplo (senha: medico123)
INSERT INTO medicos (nome, crm, email, senha, telefone, especialidade_id) VALUES 
('Dr. Carlos Silva', 'CRM12345', 'carlos.silva@clinicasaude.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '(11) 99999-0001', 1),
('Dra. Ana Santos', 'CRM12346', 'ana.santos@clinicasaude.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '(11) 99999-0002', 2),
('Dr. Pedro Oliveira', 'CRM12347', 'pedro.oliveira@clinicasaude.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '(11) 99999-0003', 3),
('Dra. Maria Costa', 'CRM12348', 'maria.costa@clinicasaude.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '(11) 99999-0004', 4),
('Dr. João Pereira', 'CRM12349', 'joao.pereira@clinicasaude.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '(11) 99999-0005', 5);

-- Associar médicos a convênios
INSERT INTO medico_convenios (medico_id, convenio_id) VALUES 
(1, 1), (1, 2), (1, 3),
(2, 1), (2, 2), (2, 4),
(3, 1), (3, 2), (3, 5),
(4, 1), (4, 3), (4, 6),
(5, 1), (5, 2), (5, 3), (5, 4);

-- Inserir horários disponíveis para os médicos (Segunda a Sexta)
-- Dr. Carlos Silva - Segunda a Sexta, 08:00 às 12:00 e 14:00 às 18:00
INSERT INTO horarios_disponiveis (medico_id, dia_semana, hora_inicio, hora_fim, duracao_consulta) VALUES 
(1, 1, '08:00:00', '12:00:00', 30),
(1, 1, '14:00:00', '18:00:00', 30),
(1, 2, '08:00:00', '12:00:00', 30),
(1, 2, '14:00:00', '18:00:00', 30),
(1, 3, '08:00:00', '12:00:00', 30),
(1, 3, '14:00:00', '18:00:00', 30),
(1, 4, '08:00:00', '12:00:00', 30),
(1, 4, '14:00:00', '18:00:00', 30),
(1, 5, '08:00:00', '12:00:00', 30),
(1, 5, '14:00:00', '18:00:00', 30);

-- Dra. Ana Santos - Segunda, Quarta e Sexta
INSERT INTO horarios_disponiveis (medico_id, dia_semana, hora_inicio, hora_fim, duracao_consulta) VALUES 
(2, 1, '09:00:00', '13:00:00', 30),
(2, 3, '09:00:00', '13:00:00', 30),
(2, 5, '09:00:00', '13:00:00', 30);

-- Dr. Pedro Oliveira - Terça e Quinta
INSERT INTO horarios_disponiveis (medico_id, dia_semana, hora_inicio, hora_fim, duracao_consulta) VALUES 
(3, 2, '10:00:00', '12:00:00', 30),
(3, 2, '14:00:00', '18:00:00', 30),
(3, 4, '10:00:00', '12:00:00', 30),
(3, 4, '14:00:00', '18:00:00', 30);

-- Dra. Maria Costa - Segunda a Sexta manhã
INSERT INTO horarios_disponiveis (medico_id, dia_semana, hora_inicio, hora_fim, duracao_consulta) VALUES 
(4, 1, '07:00:00', '12:00:00', 30),
(4, 2, '07:00:00', '12:00:00', 30),
(4, 3, '07:00:00', '12:00:00', 30),
(4, 4, '07:00:00', '12:00:00', 30),
(4, 5, '07:00:00', '12:00:00', 30);

-- Dr. João Pereira - Segunda a Sexta tarde
INSERT INTO horarios_disponiveis (medico_id, dia_semana, hora_inicio, hora_fim, duracao_consulta) VALUES 
(5, 1, '13:00:00', '19:00:00', 30),
(5, 2, '13:00:00', '19:00:00', 30),
(5, 3, '13:00:00', '19:00:00', 30),
(5, 4, '13:00:00', '19:00:00', 30),
(5, 5, '13:00:00', '19:00:00', 30);
