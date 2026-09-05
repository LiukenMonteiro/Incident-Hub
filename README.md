# Incident Hub

Central operacional simples, rápida e persistente para registro, triagem e acompanhamento de incidentes por pequenas equipes em ambiente compartilhado.

---

## 🎯 Sobre o Projeto

O **Incident Hub** foi desenvolvido para centralizar o fluxo operacional de incidentes sem dispersão de informações. A aplicação prioriza leveza, velocidade, facilidade de implantação e clareza visual para tomadas de decisão rápidas.

### Principais Recursos

- **Dashboard Operacional:** Resumo em tempo real com contadores de incidentes em aberto, em andamento e prioritários (severidade High ou Critical).
- **Cadastro e Detalhamento:** Registro estruturado com geração automática de identificador único (`INC-0001`), severidade, responsável e descrição detalhada.
- **Filtragem Dinâmica Instantânea:** Filtros por status e severidade aplicados em tempo real na seleção, sem recarregar a página e sem saltar a rolagem da tela, preservando o histórico de navegação.
- **Precisão Temporal:** Horários registrados em UTC no banco de dados e apresentados no fuso operacional (`America/Sao_Paulo`).
- **Tema Escuro Persistente:** Alternância entre tema claro e escuro salva no navegador (`localStorage`), pensada para conforto visual em plantões e turnos noturnos.
- **Persistência Confiável:** Armazenamento em SQLite com WAL ativado e preservação de dados entre reinicializações de contêineres.

---

## 🚀 Como Executar com Docker (Recomendado)

O projeto foi projetado para iniciar de forma simples e consistente em qualquer sistema operacional compatível com Docker.

### Pré-requisitos
- [Docker](https://docs.docker.com/get-docker/) e Docker Compose instalados.

### 1. Iniciar a aplicação

No diretório raiz do projeto, execute:

```bash
docker compose up -d --build
```

A aplicação estará disponível em:
👉 **http://localhost:3000**

### 2. Parar a aplicação

Para parar os serviços mantendo os dados salvos:

```bash
docker compose down
```

> **Nota sobre persistência:** Os dados do SQLite ficam salvos no volume Docker nomeado `incident-hub-data`. Ao reiniciar ou recriar o contêiner, todos os incidentes registrados continuam intactos.

---

## 💻 Execução Local para Desenvolvimento (Opcional)

Caso deseje rodar no ambiente local sem Docker:

### Pré-requisitos
- Node.js 20 ou superior
- npm

### 1. Instalar dependências
```bash
npm install
```

### 2. Executar a aplicação
```bash
npm run dev
```

### 3. Executar os testes automatizados
```bash
npm test
```

---

## 🛠️ Stack Tecnológica

- **Backend:** Node.js, Express
- **Interface:** Renderização no servidor (SSR) com EJS, CSS nativo e JavaScript vanilla
- **Banco de Dados:** SQLite via `better-sqlite3` (modo WAL)
- **Containerização:** Docker (imagem oficial `node:20-slim`) e Docker Compose
- **Testes:** Vitest e Supertest (com banco em memória para testes isolados)
