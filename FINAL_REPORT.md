# Relatório Final — Incident Hub

## Entrega

O Incident Hub é uma aplicação web para registro, acompanhamento e triagem de incidentes em um ambiente compartilhado.

### Funcionalidades entregues

- Dashboard operacional com métricas de incidentes abertos, críticos pendentes e resolvidos.
- Criação de incidentes com identificador `INC-xxxx`.
- Validação de título, descrição, severidade e responsável.
- Filtros por status e severidade.
- Atualização parcial da lista de incidentes via AJAX, sem recarregar o dashboard inteiro.
- Links server-side como fallback para os filtros.
- Visualização detalhada do incidente.
- Edição de título e descrição.
- Alteração de status com regras de negócio.
- Bloqueio da transição direta de `Open` para `Resolved` em incidentes `Critical`.
- Histórico persistido das alterações de status.
- Exclusão de incidentes com confirmação e remoção em cascata do histórico.
- Dados iniciais de exemplo para avaliação rápida.
- Tema claro/escuro persistente.
- Interface responsiva para desktop e celular.
- Datas armazenadas em UTC e apresentadas no fuso `America/Sao_Paulo`.

## Tecnologia

- Node.js 20+
- Express
- EJS
- SQLite com `better-sqlite3` e WAL
- CSS e JavaScript nativos
- Vitest e Supertest
- Docker e Docker Compose

## Validação

A suíte automatizada foi executada com:

```bash
npm test
```

Resultado final:

- 17 testes aprovados
- 0 falhas

Os testes cobrem criação, validações, listagem, filtros, detalhes, edição, exclusão, transições de status, regras para incidentes críticos, histórico, métricas, seed e recursos estáticos.

## Execução

Com Docker:

```bash
docker compose up -d --build
```

A aplicação fica disponível em `http://localhost:3000`.

Para execução local:

```bash
npm install
npm run dev
```

Os dados persistentes ficam em `data/` ou no volume Docker configurado. Os arquivos do banco local não são versionados.

## Documentação complementar

- [README.md](README.md): instalação e uso.
- [START.md](START.md): ponto de entrada do projeto.
- [PLAN.md](PLAN.md): escopo e critérios de aceite.
- [AI_LOG.md](AI_LOG.md): decisões e ocorrências relevantes durante o desenvolvimento.
- [IA_RESUME.md](IA_RESUME.md): checkpoint para continuidade do trabalho.
