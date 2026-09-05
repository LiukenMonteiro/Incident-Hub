# Checkpoint para IAs — Incident Hub

## Propósito

Este arquivo permite que outra IA ou pessoa retome o trabalho sem precisar inferir o contexto do repositório.

## Checkpoint atual
 
- **Data:** 2026-09-05
- **Etapa:** dashboard, criação e filtros dinâmicos de incidentes implementados
- **Branch principal:** `main`
- **Aplicação implementada:** sim — dashboard, criação de incidentes e filtros dinâmicos
- **Stack definida:** JavaScript, Node.js, Express, SQLite, Docker e Vitest
 
 ## O que já existe
 
 - `README.md`: identificação do repositório.
 - `START.md`: ponto de entrada e convenções iniciais.
 - `PLAN.md`: primeira versão do plano de desenvolvimento.
 
 ## Decisões tomadas
 
 - O produto será um hub web para gestão de incidentes.
 - A primeira implementação deve começar por descoberta e definição de MVP antes de escolher tecnologias.
 - O projeto usará Docker para execução em diferentes sistemas operacionais e SQLite para persistência leve.
 - As imagens Docker devem ser oficiais, estáveis e enxutas; o volume do SQLite deve ser persistente.
 - A aplicação usará Node.js com Express e templates renderizados no servidor; SQLite persistirá os dados e Vitest cobrirá os testes.
 - A primeira versão atenderá uma pequena equipe em um único ambiente compartilhado, sem autenticação, permissões ou múltiplos tenants.
 - O dashboard possui tema claro e um tema escuro persistente, salvo no `localStorage` do navegador para conforto em turnos noturnos.
 - Datas e horas são persistidas em UTC e exibidas no fuso operacional `America/Sao_Paulo`; precisão de horário é requisito crítico.
 - A filtragem de incidentes por status e severidade é dinâmica no cliente, sem recarregar a página nem reiniciar a posição de rolagem, com histórico e fallback para formulário tradicional.
 - A implementação seguirá marcos pequenos e verificáveis, com documentação atualizada quando relevante.
 - Commits devem ser descritivos.
 - Informações sensíveis e dados reais de incidentes não devem ser versionados.

## Próxima ação recomendada

Implementar a atualização de incidentes: permitir alterar o status entre Open, In Progress e Resolved, atualizar a data/hora de modificação e cobrir o fluxo com testes.

## Regras para continuidade

1. Leia `START.md`, `PLAN.md` e este arquivo antes de editar.
2. Preserve decisões existentes; se precisar alterá-las, explique o motivo neste documento.
3. Para cada alteração relevante, antes de criar uma entrada em `AI_LOG.md`, pergunte ao usuário pelos campos: Objetivo, Contexto, Instrução, Resultado, Validação e Decisão.
4. Após cada marco relevante, atualize o checkpoint com data, estado, arquivos modificados e próximo passo.
5. Após cada modificação pequena e validada, use um commit descritivo em português e envie-o ao GitHub; não acumule alterações grandes.
