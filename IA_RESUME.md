# Checkpoint para IAs — Incident Hub

## Propósito

Este arquivo permite que outra IA ou pessoa retome o trabalho sem precisar inferir o contexto do repositório.

## Checkpoint atual
 
- **Data:** 2026-09-05
- **Etapa:** ciclo completo de incidentes (criação, edição, exclusão, comentários, filtros parciais, transição de status com regra Critical, histórico persistido, métricas e seed inicial) coberto por suíte de testes funcionais
- **Branch principal:** `main`
- **Aplicação implementada:** sim — aplicação funcional completa atendendo a todos os requisitos técnicos essenciais
- **Stack definida:** JavaScript, Node.js, Express, SQLite, Docker e Vitest
 
 ## O que já existe
 
 - `README.md`: identificação do repositório, guia de uso com Docker e documentação da aplicação.
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
 - Um incidente de severidade Critical não pode ser resolvido diretamente a partir de Open; deve obrigatoriamente transitar por In Progress antes de Resolved.
 - Cada alteração de status gera um registro persistido no histórico (`incident_history`) contendo status anterior, novo status e data/hora, exibido em ordem cronológica na página de detalhes.
 - O dashboard apresenta as três métricas operacionais obrigatórias: incidentes em aberto, críticos pendentes e resolvidos.
- A tela de detalhes permite editar título e descrição, preservando status, severidade e responsável; também permite excluir com confirmação.
- A tela de detalhes permite registrar múltiplos comentários persistidos, cada um com autor, conteúdo e data/hora de criação.
- Os filtros por status e severidade usam links com query string como fallback e, com JavaScript ativo, atualizam apenas `#incidents-results` via AJAX.
 - Caso a base de dados esteja vazia, a aplicação carrega automaticamente os 3 incidentes iniciais de exemplo (Payment API instability, Reconciliation delay, Incorrect customer notification).
 - O projeto adota oficialmente a metodologia de Desenvolvimento Orientado a Testes (TDD): novos requisitos, regras de negócio ou correções devem ser previamente estruturados com testes funcionais reais no Vitest.
 - A implementação seguirá marcos pequenos e verificáveis, com documentação atualizada quando relevante.
 - Commits devem ser descritivos.
 - Informações sensíveis e dados reais de incidentes não devem ser versionados.
 
## Próxima ação recomendada

Realizar validação manual e visual dos fluxos no navegador, especialmente filtros parciais, edição e exclusão, e avaliar possíveis melhorias ou registros no `AI_LOG.md`.

## Regras para continuidade

1. Leia `START.md`, `PLAN.md` e este arquivo antes de editar.
2. Preserve decisões existentes; se precisar alterá-las, explique o motivo neste documento.
3. Para cada alteração relevante, antes de criar uma entrada em `AI_LOG.md`, pergunte ao usuário pelos campos: Objetivo, Contexto, Instrução, Resultado, Validação e Decisão.
4. Após cada marco relevante, atualize o checkpoint com data, estado, arquivos modificados e próximo passo.
5. Após cada modificação pequena e validada, use um commit descritivo em português e envie-o ao GitHub; não acumule alterações grandes.
