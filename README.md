# Incident Hub

Central operacional simples, rápida e persistente para registro, triagem e acompanhamento de incidentes por pequenas equipes em ambiente compartilhado.

Para consultar o resumo da entrega, validações e funcionalidades implementadas, veja o [FINAL_REPORT.md](FINAL_REPORT.md).

---

## 🎯 Sobre o Projeto

O **Incident Hub** foi desenvolvido para centralizar o fluxo operacional de incidentes sem dispersão de informações. A aplicação prioriza leveza, velocidade, facilidade de implantação e clareza visual para tomadas de decisão rápidas.

### Principais Recursos

- **Dashboard Operacional:** Resumo em tempo real com contadores de incidentes em aberto, em andamento e prioritários (severidade High ou Critical).
- **Cadastro e Detalhamento:** Registro estruturado com geração automática de identificador único (`INC-0001`), severidade, responsável e descrição detalhada.
- **Ciclo de vida do incidente:** Criação, edição de título e descrição, atualização de status, histórico de alterações e exclusão com confirmação.
- **Filtragem Dinâmica Instantânea:** Filtros por status e severidade atualizam somente a lista de incidentes recentes via AJAX, sem recarregar o dashboard nem saltar a rolagem; links reais permanecem como fallback.
- **Precisão Temporal:** Horários registrados em UTC no banco de dados e apresentados no fuso operacional (`America/Sao_Paulo`).
- **Tema Escuro Persistente:** Alternância entre tema claro e escuro salva no navegador (`localStorage`), pensada para conforto visual em plantões e turnos noturnos.
- **Persistência Confiável:** Armazenamento em SQLite com WAL ativado e preservação de dados entre reinicializações de contêineres.

---

## 🚀 Instruções rápidas de uso

### Como começar no dashboard

1. Abra a aplicação em `http://localhost:3000`.
2. Se quiser testar o sistema com dados prontos, clique em **Dados de teste**.
3. Para registrar uma ocorrência real, clique em **Adicionar novo** ou **Registrar incidente**.
4. Use os filtros de status e severidade para analisar o cenário operacional.
5. Em cada incidente, você pode editar título e descrição, alterar o status, acompanhar o histórico ou excluir o registro com confirmação.

> O botão **Dados de teste** foi pensado para avaliação do sistema sem exigir cadastro manual de vários registros. Ele repõe apenas os exemplos ausentes e preserva os incidentes já cadastrados.

> Os filtros usam URLs como `/?status=Open&severity=Critical` para manter o estado da busca. Com JavaScript ativo, apenas a lista de incidentes é atualizada; sem JavaScript, os links continuam funcionando.

### Reset dos dados locais de teste

O reset local apaga todos os incidentes e históricos armazenados no SQLite. Pare a aplicação antes de executar:

```bash
rm -rf data
mkdir -p data
npm start
```

Como a base estará vazia, a aplicação carregará novamente os três incidentes de exemplo ao iniciar. Esse procedimento é somente para a execução local; não use `rm -rf data` no ambiente Railway, pois os dados de produção estão no volume persistente.

## ☁️ Deploy recomendado: Railway

Para a versão atual, use Railway em vez de Vercel. A aplicação é um servidor Express persistente e usa SQLite local; o Railway permite executar o Dockerfile e associar um volume persistente ao diretório `/app/data`.

1. Crie um projeto no Railway e conecte o repositório do GitHub.
2. Selecione o serviço da aplicação. O Railway detectará o `Dockerfile` automaticamente.
3. Adicione um **Volume** com mount path `/app/data`.
4. Configure as variáveis:

```text
DATABASE_PATH=/app/data/incident-hub.db
DISPLAY_TIME_ZONE=America/Sao_Paulo
REQUIRE_PERSISTENT_DATABASE=true
```

5. Gere um domínio público pelo serviço e abra a URL fornecida pelo Railway.

### Ambiente publicado

A aplicação está disponível em:

https://incident-hub-production.up.railway.app/

O endereço foi validado com resposta HTTP 200. O banco SQLite deve estar associado a um volume persistente do Railway montado em `/app/data`. A aplicação agora encerra o deploy se esse volume não estiver montado, em vez de iniciar com um banco efêmero e perder dados no próximo redeploy.

Não use o disco local da Vercel para este SQLite: funções da Vercel são efêmeras e podem perder os dados. Para usar Vercel no futuro, seria necessário migrar a persistência para um banco externo, como PostgreSQL, e adaptar a aplicação.

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
