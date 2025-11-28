# 🏥 Sistema de Agendamento de Consultas desenvolvido para a matéria de Melhoria de Processos de Software

Sistema completo de agendamento de consultas médicas desenvolvido com **React** e **Node.js**.

![React](https://img.shields.io/badge/React-18.x-61DAFB?logo=react)
![Node.js](https://img.shields.io/badge/Node.js-18.x-339933?logo=node.js)
![MySQL](https://img.shields.io/badge/MySQL-8.x-4479A1?logo=mysql)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.x-38B2AC?logo=tailwind-css)

## 📋 Índice

- [Sobre o Projeto](#-sobre-o-projeto)
- [Funcionalidades](#-funcionalidades)
- [Tecnologias](#-tecnologias)
- [Pré-requisitos](#-pré-requisitos)
- [Instalação](#-instalação)
- [Configuração](#-configuração)
- [Executando o Projeto](#-executando-o-projeto)
- [Credenciais de Teste](#-credenciais-de-teste)
- [Estrutura do Projeto](#-estrutura-do-projeto)
- [Regras de Negócio](#-regras-de-negócio)

## 📖 Sobre o Projeto

O **Clínica Saúde+** é um sistema web completo para gerenciamento de agendamentos de consultas médicas, composto por três módulos:

- **Módulo Paciente**: Cadastro, login, agendamento e gerenciamento de consultas
- **Módulo Médico**: Gerenciamento de agenda, horários e atendimentos
- **Módulo Administrativo**: Gestão de médicos, convênios, pacientes e relatórios

## ✨ Funcionalidades

### 👤 Módulo Paciente
- ✅ Cadastro e autenticação
- ✅ Agendamento de consultas por especialidade/médico
- ✅ Visualização de consultas futuras e histórico
- ✅ Cancelamento e remarcação de consultas
- ✅ Atualização de perfil

### 👨‍⚕️ Módulo Médico
- ✅ Login exclusivo para médicos
- ✅ Dashboard com estatísticas
- ✅ Visualização de agenda por data
- ✅ Gerenciamento de horários de atendimento
- ✅ Bloqueio de horários (imprevistos)
- ✅ Registro de observações e marcação de faltas

### 🔧 Módulo Administrativo
- ✅ Gestão completa de médicos (CRUD)
- ✅ Gestão de convênios
- ✅ Gestão de pacientes (bloqueio/desbloqueio)
- ✅ Relatórios em PDF
- ✅ Dashboard com métricas

## 🛠 Tecnologias

### Backend
- **Node.js** + **Express**
- **MySQL** (mysql2)
- **JWT** para autenticação
- **bcryptjs** para hash de senhas
- **PDFKit** para geração de relatórios

### Frontend
- **React 18** + **Vite**
- **React Router DOM** v6
- **Tailwind CSS**
- **Axios**
- **React Hook Form**
- **React Toastify**
- **Heroicons**
- **date-fns**

## 📦 Pré-requisitos

- **Node.js** 18.x ou superior
- **MySQL** 8.x
- **npm** ou **yarn**

## 🚀 Instalação

1. **Clone o repositório**
```bash
git clone https://github.com/seu-usuario/sistema-clinica.git
cd clinica-saude
```

2. **Instale as dependências do Backend**
```bash
cd backend
npm install
```

3. **Instale as dependências do Frontend**
```bash
cd ../frontend
npm install
```

## ⚙️ Configuração

### Banco de Dados

1. Crie o banco de dados MySQL:
```sql
CREATE DATABASE clinica_saude;
```

2. Execute o script de criação das tabelas:
```bash
mysql -u root -p clinica_saude < database/schema.sql
```

### Variáveis de Ambiente

Crie o arquivo `backend/.env`:

```env
# Servidor
PORT=3001

# Banco de Dados
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=sua_senha_aqui
DB_NAME=clinica_saude

# JWT
JWT_SECRET=sua_chave_secreta_aqui
JWT_EXPIRES_IN=7d
```

## ▶️ Executando o Projeto

### Terminal 1 - Backend
```bash
cd backend
npm run dev
```
> Servidor rodando em http://localhost:3001

### Terminal 2 - Frontend
```bash
cd frontend
npm run dev
```
> Aplicação rodando em http://localhost:5173

## 🔑 Credenciais de Teste

| Módulo | URL | Email | Senha |
|--------|-----|-------|-------|
| **Paciente** | /login | Cadastre-se | - |
| **Médico** | /medico/login
| **Admin** | /admin/login

## 📁 Estrutura do Projeto

```
SistemaClinica/
├── backend/
│   ├── src/
│   │   ├── config/         # Configurações (DB, env)
│   │   ├── controllers/    # Lógica de negócios
│   │   ├── middlewares/    # Autenticação JWT
│   │   ├── routes/         # Rotas da API
│   │   └── server.js       # Entry point
│   ├── package.json
│   └── .env
│
├── frontend/
│   ├── src/
│   │   ├── components/     # Layouts
│   │   ├── contexts/       # Contextos de autenticação
│   │   ├── pages/          # Páginas da aplicação
│   │   │   ├── admin/      # Páginas do admin
│   │   │   └── medico/     # Páginas do médico
│   │   ├── services/       # APIs (axios)
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── package.json
│   └── vite.config.js
│
├── database/
│   └── schema.sql          # Script de criação do BD
│
├── .gitignore
└── README.md
```

## 📄 Licença

Este projeto está sob a licença MIT.

---