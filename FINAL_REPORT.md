# 20. FINAL_REPORT.md

### 1. O que foi entregue?
-Foi entregue uma aplicação DashBoard de uma ferramenta simples de registro de incidentes operacionais, que antes eram feitos de modo informal, o que difuultava saber pontos como.

- quais incidentes continuam abertos;
- quais são mais graves;
- quem é responsável;
- o que aconteceu durante o tratamento;
- quais incidentes já foram resolvidos.

Agora é possivel a criação, edição e exclusão de incidentes, além de filtragem por status e severidade.

### 2. O que não foi entregue?
Todos os requisitos funcionais exigidos foram entregues, o vídeo foi gravado também e enviado.

### 3. O que você deliberadamente decidiu não fazer?
Todos os requisitos pedidos foram feitos. e eu decidi não seguir com determinadas ideia que não fariam sentido no moento atual da aplicação, ou poderiam quebrar na hora de mostrar o sistema, me contive ao que foi proposto.

### 4. Quais foram as três principais decisões técnicas?
As principais foram, a linguagem baseada em consumo de tokens, o banco de dados baseado em leveza e também usar docker e subir no Railways, para portabilidade.

Decidi usar JavaScript e tecnlogias as quais eu tenho maior afinidade, como docker, sql, express e railway

### 5. Qual foi o maior erro produzido pela IA durante o desenvolvimento?
O maior erro foi quando pedi para melhorar um ponto na versão do front para celular, e ela quebrou a filtragem por status e severidades.

### 6. Como você identificou esse erro?
Identifiquei usando a aplicação no meu navegador, procurando formas novas de usar e tentando quebrar a aplicação no uso, tudo manualmente.

### 7. Como você corrigiu e validou a correção?
Corrigi usando IA, fazendo teste e mais testes manualmente no navegador.

também tive 18 testes implementados, além das validações manuais no navegador.

### 8. Houve alguma regressão?
A única "regrassão" foi essa quebra na filtragem, que era algo que já estav implementado e funcionando, porém na atualização quebou, mas consegui resolver.

### 9. Em qual parte houve mais retrabalho?
Acredito que no frontend, na parte de filtragem mesmo e no visual so sistema. e acredito que a atualziação do AI_RESUME, que foi criado e constantemente atualizado para trabalhar entre uma ia e outra, caso chegasse ao fim do uso.

### 10. Cite uma situação em que você rejeitou ou alterou uma abordagem sugerida pela IA.
EM alguns pontos chaves a Ia queria, mas a principal delas foi no inicio, ela sugeriu usar python com flask, porém era melhor usar javascript na minha abordagem e em alguns momentos no front, não concordei com algums edições feitas.

### 11. Qual parte da aplicação você considera menos confiável?
Era um dos requisitos ter um sistema aberto, sem autenticação, isso possa impactar negativamente em um uso real, como qualquer pessoa com o link entrar e mudar a descrição de algum incidente.

### 12. Se tivesse mais duas horas, quais seriam suas três prioridades?
Seria enviar para pessaos proximas e de confiança para testar o sistema, em diferentes locais, eu mesmo tentaria em uma VM, faria uma auditoria com uma ia mais potente.

### 13. Como você avalia sua estratégia inicial?
Minha abordagem foi boa para a criação da aplicação, primeiro eu planejei e arquitetei como seria tudo, inclusive visando tokens de IA, já que usaria apenas modelos gratis e foquei também em economia de tokens e em deixar um historico para a proxima IA que eu usaria, desde a concepção do projeto eu foquei em confiabilidade e instabalidade, tanto se ia rodar em vários sistemas como se respeitava o que foi proposto, por isso pouco antes de iniciar o projeto eu foquei em programação orientada a testes (TDD)

### 14. Aproximadamente quantas interações relevantes com IA foram necessárias?
(1) Eu diria que as principais foram ao decidir como seria o projeto, explicar como seria a base, o que seria e como seria.
(2) Depois veio a decisão de trabalhar voltado à testes
(3) Onde eu subiria a aplicação, se seria no railways ou vercel com banco de dados externo, no fim acabei optando por railways pela forma como todo o sistema estava montado, a ia foi importante bessa tomada de decisão.
(4) No fim pedi que a IA fizesse uma auditoria do meu projeto e se ele cumpria todos os requisitos do que foi proposto no hackaton.
(5) e uma nova atualização que foi pedida quando tudo parecia fechado na aplicação, porém não quebrou


No restante foram apenas tomadas de decisão de código e ela trabalhou dentro desse escopo geral.

### 15. Quais ferramentas de IA foram utilizadas?
foram utilizadas Codex, antigravity e chat com modelos diversos (extensão do vscode), também tive à minha disposição o OPenCode. Todas elas em versão grátis.