# Plano de Implementação — Incident Hub

## Entendimento

O Incident Hub será uma aplicação web pequena para registrar e acompanhar incidentes em um único lugar. A solução deve permitir cadastrar, consultar e atualizar incidentes com status, severidade, responsável e informações essenciais. O foco do desafio é entregar um fluxo funcional, simples, rápido e com dados persistentes.

## Escopo

### Obrigatório

- Operação em um único ambiente compartilhado por uma pequena equipe de operações.
- Interface web para criar, listar, visualizar e atualizar incidentes.
- Campos essenciais: título, descrição, status, severidade, responsável e datas relevantes.
- Datas e horas armazenadas em UTC e exibidas com precisão no fuso operacional `America/Sao_Paulo`.
- Persistência em SQLite após reiniciar o contêiner Docker.
- Execução padronizada por Docker em diferentes sistemas operacionais.
- Validações básicas e mensagens de erro compreensíveis.
- Testes automatizados dos fluxos críticos e documentação de execução local.

### Desejável

- Filtros por status e severidade.
- Linha do tempo de atualizações do incidente.
- Interface responsiva, acessível e com tema escuro persistente para reduzir o cansaço visual em turnos noturnos.
- Dados de exemplo e histórico simples de alterações.

### Fora de escopo

- Autenticação, recuperação de senha e gestão avançada de permissões.
- Integrações externas, notificações em tempo real e envio de e-mails.
- Multi-tenancy, alta disponibilidade e escalabilidade horizontal.
- Banco de dados remoto ou infraestrutura de produção.
- Dados reais, credenciais ou informações sensíveis.

## Decisões técnicas

### Stack

- **Backend e interface:** JavaScript com Node.js, Express e templates HTML renderizados no servidor.
- **Estilos:** CSS próprio, sem bibliotecas pesadas.
- **Banco de dados:** SQLite, acessado por uma biblioteca JavaScript leve.
- **Testes:** Vitest e Supertest para os fluxos HTTP.
- **Execução:** Docker com imagem oficial, estável e enxuta `node:slim`.

Essa stack reduz componentes, consumo de recursos e manutenção. JavaScript é familiar ao responsável pelo projeto; templates no servidor evitam um frontend separado, e SQLite é suficiente para um sistema pequeno com persistência local.

### Persistência

O arquivo SQLite ficará em um diretório de dados montado como volume Docker. Assim, os dados permanecem disponíveis quando o contêiner for recriado ou reiniciado.

### Estrutura geral da solução

```text
src/
  app.js            # criação da aplicação e configurações
  db.js             # conexão e acesso ao SQLite
  routes/           # rotas e fluxos web
  views/            # templates HTML
  public/           # CSS e recursos estáticos
tests/              # testes automatizados
data/               # banco SQLite local (ignorado pelo Git)
Dockerfile
docker-compose.yml
package.json
README.md
```

As responsabilidades serão separadas entre rotas, modelos e visualização. Não haverá serviços independentes além do contêiner da aplicação, porque SQLite é embarcado.

### Estratégia de testes

Os testes cobrirão criação, consulta e atualização de incidentes, além das validações de campos obrigatórios. Usarão um banco SQLite temporário e isolado, sem depender do banco persistente local.
Também cobrirão a conversão de horários UTC para o fuso operacional, pois a precisão temporal é crítica no tratamento de incidentes.

## Decomposição

1. Criar a estrutura Node.js, dependências e configuração Docker.
2. Modelar a entidade de incidente e configurar SQLite persistente.
3. Implementar páginas e rotas para criar, listar, detalhar e atualizar incidentes.
4. Aplicar estilos, validações e mensagens de feedback.
5. Implementar filtros e, se houver tempo, linha do tempo de atualizações.
6. Criar e executar testes automatizados dos fluxos críticos.
7. Validar Docker, persistência e documentar o uso no README.

## Critérios de aceite

- O projeto inicia com um único comando Docker documentado em ambiente compatível.
- Um incidente válido pode ser criado e aparece na lista.
- Um incidente pode ser aberto e atualizado; alterações permanecem após reiniciar o contêiner.
- A data/hora exibida de um incidente corresponde ao horário operacional configurado.
- Campos obrigatórios inválidos não criam registros incompletos e exibem feedback.
- Os testes automatizados dos fluxos críticos passam.
- O repositório contém instruções suficientes para execução local por outra pessoa.

## Riscos

- O tempo do hackathon pode não comportar todos os itens desejáveis; o CRUD essencial terá prioridade.
- SQLite não é apropriado para alta concorrência, mas atende ao escopo local e pequeno.
- Configurações incorretas de imagem ou volume podem comprometer leveza e persistência.
- Recursos visuais ou funcionalidades adicionais podem desviar o foco da entrega funcional.
- Dependências sem versões estáveis podem introduzir falhas de instalação ou execução.

## Estratégia de IA

Codex e OpenCode serão usados como apoio pontual para estruturar o projeto, revisar código, criar testes e investigar erros. A IA não substitui validação manual: mudanças relevantes serão revisadas, testadas e documentadas. Para economizar tokens, as solicitações serão específicas, com contexto mínimo e uma tarefa por vez.
