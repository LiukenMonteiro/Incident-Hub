# Plano Inicial — Incident Hub

## Objetivo

Construir uma aplicação web para registrar, acompanhar e comunicar incidentes em um único lugar.

## Fase 1 — Descoberta

- Identificar usuários, papéis e necessidades principais.
- Definir o ciclo de vida de um incidente (aberto, em investigação, mitigado e resolvido, por exemplo).
- Priorizar a primeira versão do produto (MVP).
- Definir requisitos de segurança, privacidade e auditoria.

## Fase 2 — Fundação técnica

- Escolher a stack de frontend, backend e autenticação; Docker e SQLite já estão definidos como base técnica.
- Criar uma imagem Docker oficial, estável e enxuta, com armazenamento persistente para o banco SQLite.
- Criar a estrutura do projeto, padrões de código e variáveis de ambiente documentadas.
- Configurar validação, lint, testes e integração contínua.
- Modelar as entidades essenciais, começando por incidentes, atualizações e usuários.

## Fase 3 — MVP

- Autenticação e autorização por papel.
- Criação, listagem, visualização e atualização de incidentes.
- Status, severidade, responsáveis e linha do tempo de atualizações.
- Painel com incidentes abertos e filtros básicos.
- Histórico/auditoria das alterações relevantes.

## Fase 4 — Qualidade e lançamento

- Testes dos fluxos críticos e revisão de acessibilidade.
- Revisão de segurança e tratamento de erros.
- Ambiente de homologação e documentação de implantação.
- Coleta de feedback e priorização das próximas entregas.

## Critérios para a primeira entrega

- Um usuário autorizado consegue criar e acompanhar um incidente.
- O estado e o histórico do incidente permanecem claros e rastreáveis.
- A aplicação possui documentação suficiente para desenvolvimento e operação local.
