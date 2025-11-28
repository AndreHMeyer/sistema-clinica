# 🏥 Clínica Saúde+ - Sistema de Agendamento de Consultas

Sistema web completo para agendamento de consultas médicas com três módulos: **Paciente**, **Médico** e **Administrativo**.

---

## 📋 Índice

1. [Requisitos](#requisitos)
2. [Instalação](#instalação)
3. [Configuração do Banco de Dados](#configuração-do-banco-de-dados)
4. [Executando o Sistema](#executando-o-sistema)
5. [Acessos e Credenciais](#acessos-e-credenciais)
6. [Funcionalidades por Módulo](#funcionalidades-por-módulo)
7. [Regras de Negócio](#regras-de-negócio)
8. [Estrutura do Projeto](#estrutura-do-projeto)
9. [Tecnologias Utilizadas](#tecnologias-utilizadas)

---

## 📌 Requisitos

Antes de começar, certifique-se de ter instalado:

- **Node.js** (versão 18 ou superior) - [Download](https://nodejs.org/)
- **MySQL** (versão 8.0 ou superior) - [Download](https://dev.mysql.com/downloads/)
- **Git** (opcional) - [Download](https://git-scm.com/)

---

## 🚀 Instalação

### 1. Clone ou baixe o projeto

```bash
cd C:\Users\usuario\Desktop\SistemaClinica1
```

### 2. Instale as dependências do Backend

```bash
cd backend
npm install
```

### 3. Instale as dependências do Frontend

```bash
cd ../frontend
npm install
```

---

## 🗄️ Configuração do Banco de Dados

### 1. Crie o banco de dados no MySQL

Acesse o MySQL via terminal ou MySQL Workbench:

```sql
CREATE DATABASE clinica_saude;
```

### 2. Execute o script de criação das tabelas

O arquivo `database/schema.sql` contém toda a estrutura do banco de dados e dados iniciais.

**Via MySQL Workbench:**
- Abra o arquivo `database/schema.sql`
- Execute o script completo

**Via terminal:**
```bash
mysql -u root -p clinica_saude < database/schema.sql
```

### 3. Configure as variáveis de ambiente do Backend

Crie um arquivo `.env` na pasta `backend`:

```env
# Servidor
PORT=3001

# Banco de Dados
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=sua_senha_aqui
DB_NAME=clinica_saude

# JWT
JWT_SECRET=clinica_saude_secret_key_2024
JWT_EXPIRES_IN=24h
```

---

## ▶️ Executando o Sistema

### Método 1: Executar separadamente

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```
O servidor backend iniciará em `http://localhost:3001`

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```
O frontend iniciará em `http://localhost:5173`

### Método 2: Executar com um comando (requer concurrently)

Na pasta raiz do projeto:
```bash
npm install concurrently -g
concurrently "cd backend && npm run dev" "cd frontend && npm run dev"
```

---

## 🔐 Acessos e Credenciais

### Portal do Paciente
- **URL:** http://localhost:5173/login
- **Cadastro:** Novos pacientes podem se cadastrar em `/cadastro`

### Portal do Médico
- **URL:** http://localhost:5173/medico/login
- **Credenciais de teste:**
  | E-mail | Senha | Especialidade |
  |--------|-------|---------------|
  | carlos.silva@clinicasaude.com | medico123 | Cardiologia |
  | ana.santos@clinicasaude.com | medico123 | Dermatologia |
  | pedro.oliveira@clinicasaude.com | medico123 | Ortopedia |
  | mariana.costa@clinicasaude.com | medico123 | Pediatria |
  | roberto.lima@clinicasaude.com | medico123 | Neurologia |

### Portal Administrativo
- **URL:** http://localhost:5173/admin/login
- **Credenciais:**
  | E-mail | Senha |
  |--------|-------|
  | admin@clinicasaude.com | admin123 |

---

## 📱 Funcionalidades por Módulo

### 👤 Módulo Paciente

| Funcionalidade | Descrição |
|----------------|-----------|
| **Cadastro** | Registro com nome, CPF, e-mail, telefone, data de nascimento e convênio |
| **Login** | Autenticação com e-mail e senha |
| **Dashboard** | Visão geral com próximas consultas e histórico |
| **Agendar Consulta** | Fluxo: Especialidade → Médico → Data → Horário |
| **Minhas Consultas** | Lista de consultas futuras e histórico |
| **Cancelar Consulta** | Cancelamento com regra de 24h de antecedência |
| **Remarcar Consulta** | Alteração de data/hora com regra de 24h |
| **Perfil** | Visualização e edição dos dados cadastrais |

### 👨‍⚕️ Módulo Médico

| Funcionalidade | Descrição |
|----------------|-----------|
| **Login** | Autenticação com e-mail e senha |
| **Dashboard** | Estatísticas: consultas do dia, semana e mês |
| **Agenda do Dia** | Visualização das consultas do dia atual |
| **Consultas** | Lista completa com filtros por data e status |
| **Horários Disponíveis** | Configuração de horários de atendimento por dia da semana |
| **Bloqueios** | Bloqueio de horários específicos (férias, reuniões, etc.) |
| **Marcar Realizada** | Finalizar consulta com observações |
| **Registrar Falta** | Marcar não comparecimento do paciente |

### 🔧 Módulo Administrativo

| Funcionalidade | Descrição |
|----------------|-----------|
| **Login** | Autenticação exclusiva para administradores |
| **Dashboard** | Métricas gerais: pacientes, médicos, consultas, taxa de cancelamento |
| **Gerenciar Médicos** | CRUD completo (cadastrar, editar, desativar) |
| **Gerenciar Pacientes** | Visualização, bloqueio e desbloqueio de pacientes |
| **Gerenciar Convênios** | CRUD de planos de saúde aceitos |
| **Relatórios** | Diversos relatórios com exportação em PDF |

### 📊 Relatórios Disponíveis

- **Consultas por Período** - Com filtros por médico, especialidade e status
- **Desempenho por Médico** - Total de atendimentos, cancelamentos e taxa
- **Desempenho por Especialidade** - Comparativo entre áreas
- **Pacientes Frequentes** - Ranking dos que mais consultam
- **Análise de Cancelamentos** - Taxa por dia da semana e mês

---

## ⚖️ Regras de Negócio

### 1. Regra das 24 horas
> Consultas só podem ser canceladas ou remarcadas com **pelo menos 24 horas** de antecedência do horário agendado.

### 2. Limite de consultas futuras
> Cada paciente pode ter no máximo **2 consultas futuras** agendadas simultaneamente.

### 3. Horários e conflitos
> Médicos definem seus horários disponíveis semanalmente. O sistema **evita automaticamente** conflitos de agendamento.

### 4. Bloqueio por faltas
> Se o paciente faltar a **3 consultas consecutivas** sem aviso prévio:
> - O sistema bloqueia automaticamente novos agendamentos
> - Apenas a administração pode liberar o paciente

---

## 📁 Estrutura do Projeto

```
SistemaClinica1/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   ├── config.js          # Configurações gerais
│   │   │   └── database.js        # Conexão MySQL
│   │   ├── controllers/
│   │   │   ├── authController.js           # Auth paciente
│   │   │   ├── consultaController.js       # Agendamentos
│   │   │   ├── medicoAuthController.js     # Auth médico
│   │   │   ├── medicoConsultaController.js # Consultas médico
│   │   │   ├── medicoHorarioController.js  # Horários médico
│   │   │   ├── adminAuthController.js      # Auth admin
│   │   │   ├── adminMedicoController.js    # CRUD médicos
│   │   │   ├── adminPacienteController.js  # Gestão pacientes
│   │   │   ├── adminConvenioController.js  # CRUD convênios
│   │   │   └── adminRelatorioController.js # Relatórios PDF
│   │   ├── middlewares/
│   │   │   └── auth.js            # JWT e verificações
│   │   ├── routes/
│   │   │   ├── authRoutes.js      # Rotas paciente
│   │   │   ├── consultaRoutes.js  # Rotas agendamento
│   │   │   ├── medicoAuthRoutes.js
│   │   │   ├── medicoRoutes.js
│   │   │   └── adminRoutes.js
│   │   └── server.js              # Entrada do servidor
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Layout.jsx         # Layout paciente
│   │   │   ├── MedicoLayout.jsx   # Layout médico
│   │   │   └── AdminLayout.jsx    # Layout admin
│   │   ├── contexts/
│   │   │   ├── AuthContext.jsx    # Context paciente
│   │   │   ├── MedicoAuthContext.jsx
│   │   │   └── AdminAuthContext.jsx
│   │   ├── pages/
│   │   │   ├── Login.jsx
│   │   │   ├── Register.jsx
│   │   │   ├── Dashboard.jsx
│   │   │   ├── Agendamento.jsx
│   │   │   ├── MinhasConsultas.jsx
│   │   │   ├── Perfil.jsx
│   │   │   ├── medico/
│   │   │   │   ├── MedicoLogin.jsx
│   │   │   │   ├── MedicoDashboard.jsx
│   │   │   │   ├── MedicoAgenda.jsx
│   │   │   │   ├── MedicoConsultas.jsx
│   │   │   │   ├── MedicoHorarios.jsx
│   │   │   │   └── MedicoBloqueios.jsx
│   │   │   └── admin/
│   │   │       ├── AdminLogin.jsx
│   │   │       ├── AdminDashboard.jsx
│   │   │       ├── AdminMedicos.jsx
│   │   │       ├── AdminPacientes.jsx
│   │   │       ├── AdminConvenios.jsx
│   │   │       └── AdminRelatorios.jsx
│   │   ├── services/
│   │   │   ├── api.js             # API paciente
│   │   │   ├── medicoApi.js       # API médico
│   │   │   └── adminApi.js        # API admin
│   │   ├── App.jsx                # Rotas principais
│   │   ├── main.jsx               # Entrada React
│   │   └── index.css              # Estilos globais
│   └── package.json
│
├── database/
│   └── schema.sql                 # Script do banco
│
├── INSTRUCOES.md                  # Este arquivo
└── readme.md                      # Especificação original
```

---

## 🛠️ Tecnologias Utilizadas

### Backend
| Tecnologia | Versão | Função |
|------------|--------|--------|
| Node.js | 18+ | Runtime JavaScript |
| Express | 4.18 | Framework web |
| MySQL2 | 3.6 | Driver de banco de dados |
| JWT | 9.0 | Autenticação |
| bcryptjs | 2.4 | Hash de senhas |
| PDFKit | 0.14 | Geração de PDFs |
| CORS | 2.8 | Cross-Origin Resource Sharing |
| dotenv | 16.3 | Variáveis de ambiente |

### Frontend
| Tecnologia | Versão | Função |
|------------|--------|--------|
| React | 18.2 | Biblioteca UI |
| Vite | 5.0 | Build tool |
| React Router | 6.20 | Navegação SPA |
| Tailwind CSS | 3.3 | Estilização |
| Axios | 1.6 | Cliente HTTP |
| React Hook Form | 7.48 | Formulários |
| React Toastify | 9.1 | Notificações |
| date-fns | 2.30 | Manipulação de datas |
| Heroicons | 2.1 | Ícones |

### Banco de Dados
| Tecnologia | Função |
|------------|--------|
| MySQL 8.0 | SGBD Relacional |

---

## 🆘 Solução de Problemas

### Erro de conexão com o banco de dados
```
Error: Access denied for user 'root'@'localhost'
```
**Solução:** Verifique as credenciais no arquivo `.env`

### Porta já em uso
```
Error: listen EADDRINUSE: address already in use :::3001
```
**Solução:** Encerre o processo usando a porta ou altere a porta no `.env`

### Módulo não encontrado
```
Error: Cannot find module 'xxx'
```
**Solução:** Execute `npm install` na pasta correspondente

---

## 📞 Suporte

Para dúvidas ou problemas, verifique:
1. Se todas as dependências foram instaladas
2. Se o banco de dados está rodando
3. Se as variáveis de ambiente estão configuradas
4. Os logs do terminal para mensagens de erro

---

**Desenvolvido para a Clínica Saúde+** 🏥
