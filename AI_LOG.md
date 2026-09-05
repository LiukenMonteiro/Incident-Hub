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
