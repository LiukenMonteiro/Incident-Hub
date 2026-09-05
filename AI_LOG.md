# Registro de Interações com IA

## Objetivo

Registrar apenas interações, decisões e orientações relevantes para entender como o Incident Hub foi construído. Este arquivo não é uma transcrição de conversas com IAs.

## Responsabilidade editorial

O usuário decide quais alterações e interações são relevantes e devem constar neste registro. Durante o desenvolvimento, a IA deve perguntar se uma decisão, mudança ou situação relevante deve ser incluída antes de registrar a entrada.

## Quando registrar

Registre interações que ajudem a compreender como a solução foi construída, especialmente:

- decisões de produto, arquitetura ou tecnologia;
- mudanças de requisitos e suas motivações;
- problemas relevantes, alternativas avaliadas e a solução escolhida;
- marcos que afetem a continuidade do projeto.
- situações em que a IA produziu algo incorreto;
- abordagens abandonadas, regressões ou mudanças de estratégia;
- sugestões da IA rejeitadas pelo usuário;
- contexto adicional necessário para concluir uma decisão ou implementação.

Não inclua conversas rotineiras, tentativas sem impacto, mensagens de status ou conteúdo que não ajude a compreender a solução.

## Estrutura de cada entrada

Cada interação relevante deve registrar, de forma resumida:

### Objetivo

O que se buscava alcançar.

### Contexto

Informações, restrições ou arquivos fornecidos à IA.

### Instrução

A solicitação, orientação ou estratégia utilizada.

### Resultado

O que ocorreu.

### Validação

Como foi verificado que o resultado estava correto — ou que havia um problema.

### Decisão

O próximo passo ou a decisão tomada a partir do resultado.

## Regra de continuidade

Se uma solicitação para este arquivo não estiver ligada à compreensão de como a solução foi construída, a IA deve sinalizar que ela parece fora do escopo antes de registrá-la.

## Entradas

### 2026-09-05 — Definição do padrão de registro de IA

#### Objetivo

Estabelecer como interações relevantes com IA serão documentadas durante a construção do Incident Hub.

#### Contexto

O repositório já continha `AI_LOG.md`, criado como um registro seletivo para continuidade do projeto.

#### Instrução

O usuário definiu que a IA deve perguntar, durante decisões de desenvolvimento, quando fizer sentido registrar uma interação. Também determinou os campos mínimos de cada entrada e situações que devem ser consideradas relevantes.

#### Resultado

O log passou a exigir os campos Objetivo, Contexto, Instrução, Resultado, Validação e Decisão, além de listar casos relevantes como erros, regressões, abordagens abandonadas e mudanças de estratégia.

#### Validação

A estrutura e as regras foram incorporadas a este arquivo para uso nas próximas decisões.

#### Decisão

Antes de registrar futuras interações relevantes, a IA perguntará ao usuário se deseja incluí-las no log.

### 2026-09-05 — Docker e SQLite como fundação técnica

#### Objetivo

Manter o Incident Hub simples, leve e capaz de rodar em diferentes sistemas operacionais.

#### Contexto

O projeto deve economizar tokens de IA sem comprometer uma entrega leve, rápida e funcional. Os dados precisam permanecer persistentes, mas o sistema terá escopo pequeno e simples.

#### Instrução

Usar Docker para portabilidade entre sistemas operacionais e SQLite como banco de dados persistente e leve. Preferir imagens Docker oficiais e versões estáveis para reduzir riscos em produção.

#### Resultado

Docker e SQLite foram definidos como restrições técnicas iniciais; o framework e os demais componentes da aplicação continuam em aberto.

#### Validação

A futura implementação deverá iniciar corretamente em ambientes suportados pelo Docker, persistir dados entre reinicializações do contêiner e atender aos fluxos definidos como funcionais.

#### Decisão

Prosseguir com uma arquitetura enxuta baseada em Docker e SQLite, priorizando baixo consumo de processamento, persistência de dados e facilidade de uso.

### 2026-09-05 — Estratégia de desenvolvimento incremental

#### Objetivo

Manter o desenvolvimento organizado.

#### Contexto

O usuário deseja que a solução seja documentada de forma concisa e descritiva, preservando a qualidade de `AI_LOG.md`, `IA_RESUME.md` e `PLAN.md`.

#### Instrução

Implementar o projeto em partes pequenas, pois mudanças grandes podem comprometer os registros de log, o checkpoint e o plano.

#### Resultado

Foi definido que o desenvolvimento seguirá marcos menores e verificáveis, com documentação atualizada conforme a relevância de cada etapa.

#### Validação

Cada marco será validado por revisão das alterações, testes proporcionais à funcionalidade e conferência da documentação relacionada.

#### Decisão

Iniciar o desenvolvimento do código pela fundação técnica e avançar uma parte pequena por vez.

### 2026-09-05 — Migração da stack para JavaScript

#### Objetivo

Reduzir o gasto de tokens, usar uma linguagem familiar ao responsável pelo projeto e trabalhar de forma mais consciente no desenvolvimento web.

#### Contexto

O Incident Hub será uma aplicação web. A implementação ainda não havia começado, portanto a mudança de stack não exigiria retrabalho de código.

#### Instrução

Substituir a stack inicialmente planejada em Python por uma stack JavaScript, mantendo Docker e SQLite como decisões técnicas vigentes.

#### Resultado

O plano passou a adotar Node.js, Express, templates renderizados no servidor, SQLite e Vitest para testes.

#### Validação

A fundação técnica será considerada validada quando a aplicação JavaScript iniciar pelo Docker, os testes automatizados passarem e os dados SQLite persistirem após reiniciar o contêiner.

#### Decisão

Prosseguir com JavaScript por ser mais familiar ao responsável e adequado ao escopo de uma aplicação web pequena.

### 2026-09-05 — Tema escuro persistente

#### Objetivo

Oferecer uma experiência visual mais confortável para pessoas que trabalham à noite ou passam longos períodos em frente a telas, como integrantes de equipes de operações e enfermagem.

#### Contexto

O dashboard inicial já possuía um tema claro de cores calmas. Parte do público pode registrar incidentes em turnos noturnos ou em condições de cansaço visual.

#### Instrução

Adicionar um toggle para alternar para uma versão escura persistente da interface.

#### Resultado

O cabeçalho passou a incluir um seletor de tema. A preferência é salva no navegador por `localStorage` e aplicada ao abrir novamente a aplicação. O tema escuro preserva contraste e a identidade de cores do dashboard.

#### Validação

O contêiner foi reconstruído, e o dashboard, o JavaScript do tema e os estilos do tema escuro foram servidos corretamente. A persistência é implementada pela chave `incident-hub-theme` no armazenamento local do navegador.

#### Decisão

Manter o tema claro como padrão e disponibilizar o tema escuro como escolha persistente e acessível ao usuário.

### 2026-09-05 — Correção da exibição de data e hora

#### Objetivo

Garantir que a data e a hora exibidas no cadastro de um incidente sejam exatas, pois minutos podem ser decisivos em uma situação operacional crítica.

#### Contexto

Um incidente criado às 09:47 estava sendo exibido aproximadamente às 12:42. O SQLite registra `CURRENT_TIMESTAMP` em UTC, e a primeira versão da interface mostrava esse valor sem conversão para o fuso operacional.

#### Instrução

Corrigir a exibição do horário para o fuso `America/Sao_Paulo`, preservando a data/hora em UTC no banco de dados.

#### Resultado

Foi criado um formatador centralizado de data/hora. A interface passou a converter os horários persistidos em UTC antes de exibi-los, e o Docker recebeu a configuração explícita do fuso operacional.

#### Validação

Um teste automatizado confirma que `2026-09-05 12:42:00` em UTC é exibido como `05/09/2026, 09:42` em São Paulo. A suíte passou com 4 testes, e o registro existente no contêiner foi confirmado com a hora corrigida.

#### Decisão

Manter UTC como referência de persistência e usar `America/Sao_Paulo` como fuso de apresentação configurável. Qualquer mudança futura que afete horários de incidentes deve incluir teste de fuso horário.

### 2026-09-05 — Filtros dinâmicos e preservação de rolagem

#### Objetivo

Permitir filtrar incidentes por status e severidade com agilidade e fluidez, sem recarregamento da página e sem que a tela role de volta ao topo.

#### Contexto

O usuário relatou que ao aplicar filtros a página recarregava por completo e retornava ao topo da tela, além de exigir o clique manual em um botão de aplicação, prejudicando a velocidade e o dinamismo da operação.

#### Instrução

Implementar filtragem dinâmica acionada no evento de mudança dos campos de seleção (`change`), atualizando apenas a área de resultados de incidentes e o botão de limpeza via requisições assíncronas, ocultando o botão de envio quando o JavaScript estiver ativo e preservando o estado do histórico do navegador.

#### Resultado

Foi criado o script `filters.js` e ajustados os estilos em `filters.css` e templates. Ao alterar qualquer seleção, a lista de incidentes é atualizada de forma imediata e sem reload de página, com tratamento de cancelamento com `AbortController`, indicação sutil de carregamento e compatibilidade com botões de voltar/avançar via `history.pushState`. O contêiner Docker foi reconstruído para refletir as alterações no ambiente local.

#### Validação

A suíte de testes automatizados com Vitest foi ampliada e validada com 6 testes passando com sucesso. A reconstrução e execução no Docker foram validadas no contêiner com `docker compose up -d --build`.

#### Decisão

Adotar filtragem assíncrona com substituição de fragmentos de DOM e fallback progressivo (caso o JavaScript esteja desabilitado, o formulário tradicional continua funcional).
