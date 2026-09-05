# Checkpoint para IAs — Incident Hub

## Propósito

Este arquivo permite que outra IA ou pessoa retome o trabalho sem precisar inferir o contexto do repositório.

## Checkpoint atual

- **Data:** 2026-09-05
- **Etapa:** planejamento concluído; início da implementação
- **Branch principal:** `main`
- **Aplicação implementada:** não
- **Stack definida:** Python, Flask, SQLite, SQLAlchemy, Docker e pytest

## O que já existe

- `README.md`: identificação do repositório.
- `START.md`: ponto de entrada e convenções iniciais.
- `PLAN.md`: primeira versão do plano de desenvolvimento.

## Decisões tomadas

- O produto será um hub web para gestão de incidentes.
- A primeira implementação deve começar por descoberta e definição de MVP antes de escolher tecnologias.
- O projeto usará Docker para execução em diferentes sistemas operacionais e SQLite para persistência leve.
- As imagens Docker devem ser oficiais, estáveis e enxutas; o volume do SQLite deve ser persistente.
- A aplicação usará Flask com templates renderizados no servidor, SQLAlchemy para persistência e pytest para testes.
- A implementação seguirá marcos pequenos e verificáveis, com documentação atualizada quando relevante.
- Commits devem ser descritivos.
- Informações sensíveis e dados reais de incidentes não devem ser versionados.

## Próxima ação recomendada

Criar a fundação técnica: estrutura inicial do projeto Flask, dependências, Docker e testes básicos. Executar e validar essa primeira parte antes de avançar.

## Regras para continuidade

1. Leia `START.md`, `PLAN.md` e este arquivo antes de editar.
2. Preserve decisões existentes; se precisar alterá-las, explique o motivo neste documento.
3. Para cada alteração relevante, antes de criar uma entrada em `AI_LOG.md`, pergunte ao usuário pelos campos: Objetivo, Contexto, Instrução, Resultado, Validação e Decisão.
4. Após cada marco relevante, atualize o checkpoint com data, estado, arquivos modificados e próximo passo.
5. Antes de encerrar, valide as alterações e use um commit descritivo.
