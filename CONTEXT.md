# REKKO — CONTEXT.md

> **Status:** MVP Product Context  
> **Purpose:** Fonte de verdade conceitual para o Rekko antes da definição de arquitetura, design técnico e implementação.  
> **Produto:** Rekko  
> **Tagline:** **Reconstrua seu tempo. Entenda sua jornada.**

---

# 1. Visão do produto

## 1.1. Conceito central

**Rekko como “reconstruir o tempo”.**

O usuário não consegue voltar no tempo literalmente, mas consegue reconstruir o que aconteceu:

- quando começou;
- quando parou;
- quanto trabalhou;
- em qual projeto estava;
- em qual demanda trabalhou;
- quanto tempo era esperado gastar;
- quanto tempo realmente gastou;
- onde existiram lacunas;
- e como sua jornada de trabalho foi distribuída.

O Rekko não deve ser percebido apenas como um sistema de ponto.

> **O Rekko é uma plataforma de reconstrução e compreensão do tempo de trabalho.**

O cronômetro é uma das formas de alimentar essa reconstrução, mas não é o produto inteiro.

---

## 1.2. Problema que o Rekko resolve

O trabalho de uma pessoa normalmente está distribuído entre diversas ferramentas.

Exemplos:

- Linear para demandas;
- GitHub para código;
- Calendar para reuniões;
- Slack/Teams para comunicação;
- Notion para documentação;
- outras ferramentas específicas de cada organização.

Ao final do dia, é comum uma pessoa saber aproximadamente quanto trabalhou, mas não conseguir responder com precisão:

> “Onde meu tempo foi utilizado?”

Ou:

> “Por que uma tarefa estimada em 30 minutos consumiu 2 horas?”

O Rekko deve conectar:

**tempo + projeto + demanda + estimativa + trabalho realizado**

para permitir que o usuário compreenda a história do seu trabalho.

---

# 2. Posicionamento

## 2.1. O que o Rekko é

O Rekko é uma ferramenta para:

- registrar trabalho enquanto ele acontece;
- reconstruir períodos esquecidos;
- organizar horas por projetos e demandas;
- comparar tempo estimado e realizado;
- visualizar a jornada de trabalho em uma timeline;
- trabalhar individualmente ou em conjunto dentro de um Workspace;
- utilizar integrações para trazer contexto para o registro de horas.

---

## 2.2. O que o Rekko não deve ser

O Rekko não deve nascer como:

- ERP;
- folha de ponto tradicional;
- software de RH;
- ferramenta de vigilância de funcionários;
- sistema de screenshots periódicos;
- keylogger;
- sistema de captura invasiva de atividade;
- plataforma financeira complexa;
- clone visual ou funcional do Jibble.

A experiência deve ser centrada na pessoa que está trabalhando.

> **O Rekko trabalha para quem está trabalhando, não contra ele.**

---

# 3. Princípios do produto

Toda funcionalidade futura deve respeitar os seguintes princípios.

## 3.1. Fast

Iniciar, pausar, finalizar ou trocar de tarefa deve levar poucos segundos.

O sistema não deve exigir formulários extensos antes de iniciar um trabalho.

---

## 3.2. Contextual

Horas sem contexto possuem pouco valor.

Sempre que possível, o tempo deve estar relacionado a:

- Workspace;
- Projeto;
- Demanda;
- Tipo de atividade;
- estimativa;
- contexto externo, quando originado de integração.

---

## 3.3. Reconstructable

Esquecer de iniciar o cronômetro não deve destruir a capacidade de registrar corretamente o dia.

Reconstruir períodos passados faz parte da proposta principal do produto.

---

## 3.4. Transparent

O Rekko deve diferenciar claramente:

- tempo realmente registrado;
- tempo lançado manualmente;
- tempo estimado;
- informações sincronizadas;
- futuras sugestões automáticas.

Sugestões nunca devem ser apresentadas como fatos.

---

## 3.5. Human

A experiência deve transmitir produtividade e compreensão pessoal, e não vigilância.

---

# 4. Os três pilares funcionais

O produto deve ser guiado conceitualmente por três ações.

## Track

Registrar o trabalho enquanto ele está acontecendo.

Exemplo:

```text
AC-843
Cloudflare Turnstile

[ ▶ Iniciar ]
```

---

## Reconstruct

Registrar ou corrigir um período que aconteceu sem cronômetro ativo.

Exemplo:

```text
14:00 → 15:00

Reunião
Alinhamento técnico
```

---

## Understand

Entender como o tempo foi utilizado.

Exemplo:

```text
Hoje

7h42 trabalhadas

AMBLA                 3h15
AidCrusader            2h47
Reuniões               1h40
```

---

# 5. Conceito de Workspace

## 5.1. Nomenclatura oficial

A estrutura colaborativa principal do Rekko será chamada de:

> **Workspace**

Essa nomenclatura é preferível a `Company`, `Organization` ou `Team` porque permite que a mesma estrutura seja usada para:

- uma empresa;
- uma pequena equipe;
- uma consultoria;
- um squad;
- um grupo de trabalho;
- um uso pessoal.

O termo `Team` poderá futuramente representar uma subdivisão interna de um Workspace.

---

## 5.2. Criação do Workspace

Após realizar o cadastro, o usuário deve poder:

1. criar um Workspace;
2. informar seu nome;
3. opcionalmente informar uma descrição;
4. posteriormente convidar outras pessoas.

Exemplos:

```text
AidCrusader
AMBLA
Minha Consultoria
Gabriel Workspace
```

O usuário que cria o Workspace se torna automaticamente seu `Owner`.

---

# 6. Roles e cargos

## 6.1. Roles oficiais do MVP

O Rekko terá três roles de acesso.

### Owner

Responsável máximo pelo Workspace.

Pode:

- alterar configurações gerais;
- convidar membros;
- remover membros;
- alterar roles;
- criar e editar projetos;
- configurar integrações;
- visualizar todos os lançamentos;
- exportar horas;
- transferir propriedade;
- excluir o Workspace.

Um Workspace deve possuir pelo menos um Owner.

---

### Admin

Responsável pela administração operacional.

Pode:

- convidar membros;
- editar membros;
- criar e editar projetos;
- configurar projetos;
- selecionar demandas sincronizadas;
- visualizar horas dos membros;
- realizar exportações;
- acompanhar indicadores do Workspace.

Não pode, inicialmente:

- excluir o Workspace;
- transferir propriedade do Workspace.

---

### Member

Usuário padrão do Workspace.

Pode:

- acessar projetos aos quais possui acesso;
- iniciar cronômetros;
- pausar;
- continuar;
- trocar de tarefa;
- finalizar;
- lançar horas manualmente;
- editar seus próprios lançamentos;
- visualizar seu histórico;
- visualizar seus próprios insights.

Permissões mais granulares poderão ser adicionadas futuramente.

---

## 6.2. Role não é cargo

A role representa **permissão dentro do Rekko**.

O cargo representa **função profissional da pessoa**.

Exemplo:

```text
Nome:
João Silva

Role:
Member

Cargo:
Desenvolvedor Backend
```

Outro exemplo:

```text
Nome:
Maria Oliveira

Role:
Admin

Cargo:
Tech Lead
```

---

## 6.3. Cargo

Ao convidar um membro, o usuário deverá poder informar um cargo.

Exemplos:

- Desenvolvedor Backend;
- Desenvolvedor Frontend;
- QA;
- Product Manager;
- Tech Lead;
- Designer;
- Analista;
- Gerente de Projetos;
- Consultor.

Para o MVP, o cargo pode ser um campo textual.

Não é necessário criar uma estrutura complexa de catálogo de cargos inicialmente.

---

# 7. Convite de membros

O Owner ou Admin deve poder convidar uma pessoa informando:

```text
Email
Role
Cargo
```

Exemplo:

```text
Email:
joao@empresa.com

Role:
Member

Cargo:
Desenvolvedor Backend
```

O convite deve possuir pelo menos os estados conceituais:

- Pending;
- Accepted;
- Expired/Cancelled.

No MVP, não é necessário construir hierarquia organizacional, departamentos ou organograma.

---

# 8. Domínio funcional principal

A estrutura conceitual do produto é:

```text
Workspace
    │
    ├── Members
    │
    ├── Projects
    │      │
    │      └── Work Items
    │             │
    │             └── Sub-items
    │
    ├── Time Entries
    │
    └── Integrations
           │
           └── Linear
```

---

# 9. Work Item

`Work Item` é o conceito genérico utilizado pelo Rekko para representar algo em que uma pessoa pode trabalhar.

Um Work Item poderá representar:

- demanda criada manualmente;
- task;
- bug;
- story;
- issue do Linear;
- sub-issue do Linear;
- card;
- item identificado como `[EPIC]`.

A interface pode utilizar termos amigáveis como `Demanda` ou `Task`, mas o modelo conceitual não deve ficar preso a uma ferramenta externa específica.

---

# 10. Projetos

## 10.1. Conceito

Um Projeto agrupa o trabalho realizado dentro do Rekko.

Exemplos:

```text
AMBLA
AidCrusader
PDDE WEB
Cliente XPTO
```

---

## 10.2. Criação de projeto

Ao criar um Projeto, o Rekko deve perguntar:

> **Como você deseja criar este projeto?**

Opções do MVP:

```text
[ Criar manualmente ]

[ Criar com Linear ]
```

O fluxo não deve importar automaticamente todo o conteúdo do Linear.

---

# 11. Projeto manual

Ao escolher criação manual:

Campos mínimos:

```text
Nome
Descrição opcional
Status
Estimativa total opcional
```

Após criar o projeto, o usuário pode cadastrar Work Items manualmente.

---

# 12. Projeto conectado ao Linear

## 12.1. Princípio

A integração Linear do V1 deve ser:

> **seletiva e controlada pelo usuário**

Conectar o Linear não significa importar todas as issues do workspace externo.

---

## 12.2. Fluxo conceitual

Ao selecionar:

```text
Criar com Linear
```

o Rekko deverá:

1. solicitar a conexão com o Linear, caso ainda não exista;
2. carregar os contextos disponíveis para navegação;
3. permitir pesquisa e filtros;
4. apresentar cards/issues disponíveis;
5. permitir seleção individual dos cards;
6. preservar relação entre parent e sub-issues;
7. importar somente o escopo selecionado;
8. criar o Projeto Rekko com os Work Items selecionados.

---

## 12.3. Seleção de cards

A seleção deve funcionar visualmente como uma árvore.

Exemplo:

```text
☑ [EPIC] Cloudflare Turnstile
   ☑ AC-844 Login frontend
   ☑ AC-845 Login backend
   ☐ AC-846 Ajuste documentação

☐ Dashboard
   ☐ AC-851 Cards
   ☐ AC-852 Filtros
```

O usuário deve poder:

- selecionar um card individual;
- selecionar múltiplos cards;
- selecionar um parent;
- visualizar seus sub-items;
- desmarcar filhos individualmente.

---

## 12.4. Comportamento ao selecionar um parent

Ao selecionar um parent com sub-issues:

- os sub-items ativos são selecionados por padrão;
- o usuário pode desmarcar qualquer sub-item;
- somente os itens escolhidos ficam disponíveis para apontamento de horas.

Se o usuário selecionar somente um sub-item:

- o Rekko pode manter os dados mínimos do parent apenas para contexto visual;
- o parent não precisa ficar disponível para apontamento caso não tenha sido selecionado.

---

## 12.5. Novas sub-issues após a importação

No V1:

> novas sub-issues criadas posteriormente no Linear não precisam entrar automaticamente no Rekko.

O usuário poderá utilizar uma ação como:

```text
Sync / Review Linear changes
```

e escolher novos itens para adicionar.

Isso mantém o princípio de importação seletiva.

Sincronização automática de novos descendentes poderá ser avaliada posteriormente.

---

# 13. Filtros durante importação do Linear

Para evitar listas gigantes, o seletor deverá permitir, quando aplicável:

- busca textual;
- filtro por Team;
- filtro por Project;
- filtro por Status;
- filtro por Assignee.

Não é necessário implementar todos os filtros avançados do Linear.

O objetivo é apenas tornar a seleção de cards confortável.

---

# 14. Cards concluídos no Linear

## 14.1. Regra padrão

Cards concluídos não devem aparecer como candidatos principais para importação.

Por padrão:

```text
Done / Completed → oculto da seleção
```

---

## 14.2. Card já importado que se torna Done

Quando um card anteriormente sincronizado for concluído no Linear:

- ele deixa de aparecer entre os trabalhos ativos;
- continua existindo no histórico do Rekko;
- horas registradas nunca são apagadas;
- relatórios históricos continuam funcionando.

O Rekko não deve destruir seu próprio histórico por causa de mudanças externas.

---

# 15. Sincronização Linear no MVP

A integração deve trazer, quando disponível:

```text
Linear ID
Identifier
Título
Descrição
Status
Assignee
Parent
Sub-issues
Project
Team
URL original
Updated at
```

O V1 deve tratar o Linear prioritariamente como fonte de contexto.

Não é necessário escrever alterações do Rekko de volta no Linear inicialmente.

---

# 16. Estimativas vindas do Linear

O usuário utiliza nas descrições das sub-tasks o padrão:

```text
Estimativa

30m.
```

O Rekko deverá identificar essa informação.

Formatos desejáveis:

```text
15m
30m
45m
1h
1h 30m
1h30
2h
2h 15m
```

A estimativa será normalizada internamente para permitir comparação.

Exemplo:

```text
AC-843

Estimated
30m

Tracked
42m

Difference
+12m
```

---

# 17. Registro de tempo

Cada Time Entry deve estar relacionado, quando aplicável, a:

```text
Member
Workspace
Project
Work Item
Activity Type
Start
End
Duration
Description
Source
```

---

# 18. Cronômetro

## 18.1. Iniciar

O caminho ideal é:

```text
Projeto / Demanda

[ ▶ Iniciar ]
```

Se o Work Item veio do Linear, o Rekko já possui contexto suficiente e não deve solicitar novamente informações desnecessárias.

---

## 18.2. Cronômetro ativo

Exemplo:

```text
● Trabalhando

AMBLA
Onboarding Flow

01:27:42

[ Pausar ]
[ Trocar ]
[ Finalizar ]
```

---

## 18.3. Apenas um cronômetro ativo

Um membro não pode possuir dois cronômetros ativos simultaneamente.

Se tentar iniciar outro:

```text
Você já possui uma atividade em andamento.

AMBLA — Onboarding
00:42:18
```

O Rekko deverá oferecer:

```text
[ Continuar atividade atual ]

[ Trocar para esta tarefa ]
```

---

# 19. Troca de tarefa

`Switch` / `Trocar` será uma ação central.

Exemplo:

Atividade atual:

```text
AMBLA
Authentication
```

Usuário seleciona:

```text
AidCrusader
AC-843
```

O Rekko deve:

```text
finalizar AMBLA no instante da troca
iniciar AC-843 no mesmo instante
```

sem exigir duas operações manuais.

---

# 20. Pause / Resume

Exemplo:

```text
08:00 Start
10:00 Pause
10:15 Resume
12:00 Finish
```

Resultado:

```text
Tempo decorrido:
4h

Tempo trabalhado:
3h45
```

Pausas não devem contar como tempo trabalhado.

---

# 21. Lançamento manual

O usuário poderá reconstruir um período manualmente.

Campos mínimos:

```text
Projeto
Demanda opcional
Data
Início
Fim
Descrição opcional
```

O sistema calcula automaticamente a duração.

---

# 22. Sobreposição de horários

O Rekko deve detectar lançamentos sobrepostos.

Exemplo:

```text
Existente:
09:00 – 10:00

Novo:
09:30 – 10:30
```

O sistema deve alertar antes de salvar.

No MVP não é necessário criar regras excessivamente rígidas; o objetivo é impedir erros óbvios.

---

# 23. Edição de lançamentos

O usuário poderá editar seus lançamentos.

No MVP:

- Member edita os próprios registros;
- Admin e Owner possuem visibilidade administrativa;
- histórico de auditoria avançado pode ficar para evolução posterior.

Não é necessário exigir justificativa para toda alteração no primeiro MVP.

Essa política poderá se tornar configurável no futuro.

---

# 24. Timeline — assinatura do Rekko

A Timeline deve ser um dos elementos centrais da identidade do produto.

Ela não deve ser apenas uma tabela.

Exemplo:

```text
Wednesday, Aug 26

08:02 ┃██████████████┃ 09:37
      AC-843
      Cloudflare Turnstile
      1h35

09:37 ┃ gap ┃ 10:04

10:04 ┃██████┃ 10:46
      Daily
      42m

10:46 ┃██████████████████┃ 12:20
      AMBLA / Onboarding
      1h34
```

---

# 25. Reconstrução de gaps

Períodos não registrados podem aparecer na Timeline como lacunas.

Exemplo:

```text
10:00 → 10:32

32 minutos não registrados
```

A interface deve oferecer:

```text
[ + Reconstruir período ]
```

O gap não representa necessariamente um erro.

Ele é apenas um período sem contexto conhecido.

---

# 26. Today

A Home principal do produto será orientada ao dia atual.

Evitar uma página inicial genérica chamada apenas `Dashboard`.

Estrutura conceitual:

```text
Today

03:42:18
TRACKED TODAY

● Working

AMBLA
Onboarding flow

01:27:42

[ Pause ] [ Switch ] [ Finish ]
```

Abaixo:

```text
TODAY

08:12 ━━━━━━━━━ 09:40
       AMBLA / Authentication

09:40 ━━━ 10:00
       Daily

10:00 ───── 10:32
       Not recorded

10:32 ━━━━━━━━━━━ now
       AMBLA / Onboarding
```

---

# 27. Tela do Work Item

Um Work Item deverá permitir visualizar rapidamente:

```text
AC-843

Cloudflare Turnstile

Linear
In Progress

Estimated
4h

Tracked
2h48

Remaining
1h12
```

Além de:

- histórico de registros;
- contexto do parent;
- projeto;
- status;
- link para origem;
- botão para iniciar trabalho.

---

# 28. Planned × Actual

Comparar estimativa com tempo real faz parte do MVP.

Exemplo:

```text
AC-843

Estimated
3h

Tracked
4h05

Difference
+1h05
```

No projeto:

```text
Estimated
32h30

Tracked
36h42

Difference
+4h12
```

O objetivo não é punir estimativas incorretas, mas permitir compreensão e aprendizado.

---

# 29. Insights do V1

O Rekko deverá possuir insights simples.

Exemplo:

```text
This week

38h42 tracked
```

Por projeto:

```text
AMBLA             16h12
AidCrusader        13h41
PDDE                6h04
Other               2h45
```

Outros indicadores simples podem incluir:

- horas hoje;
- horas na semana;
- horas por projeto;
- horas por demanda;
- estimado × realizado.

Não é necessário criar um BI complexo no V1.

---

# 30. Exportação de horas — obrigatória no MVP

O V1 deve possuir pelo menos uma forma simples e universal de exportar a relação:

> **Colaborador × Projeto × Demanda × Horas trabalhadas**

A solução escolhida para o MVP será:

> **Exportação CSV**

CSV é preferido inicialmente porque:

- é simples de implementar;
- é universal;
- abre no Excel;
- abre no Google Sheets;
- pode ser importado em sistemas externos;
- preserva dados detalhados;
- não exige a complexidade de geração de PDF.

PDF poderá ser adicionado posteriormente.

---

# 31. Exportação CSV

A exportação deve respeitar os filtros selecionados na tela.

Filtros mínimos:

```text
Período
Colaborador
Projeto
Demanda
```

O botão pode ser:

```text
Export CSV
```

---

## 31.1. Estrutura mínima do CSV

Cada linha representa um lançamento de tempo.

Colunas:

```text
Data
Colaborador
Email
Cargo
Projeto
Código da Demanda
Demanda
Início
Fim
Duração
Duração em Horas
Tipo de Atividade
Descrição
Origem
```

Exemplo:

```text
26/08/2026,
João Silva,
joao@empresa.com,
Desenvolvedor Backend,
AidCrusader,
AC-843,
Cloudflare Turnstile,
08:05,
10:30,
02:25,
2.4167,
Development,
Implementação da validação,
Linear
```

---

## 31.2. Duração em dois formatos

O CSV deve possuir:

```text
Duração
02:25
```

e:

```text
Duração em Horas
2.4167
```

Isso permite:

- leitura humana;
- soma direta no Excel/Sheets;
- criação de tabelas dinâmicas;
- cálculos financeiros futuros.

---

## 31.3. Relação desejada

Com esse CSV será possível gerar facilmente:

```text
Colaborador
    ↓
Projeto
    ↓
Demanda
    ↓
Horas trabalhadas
```

sem necessidade de desenvolver um sistema complexo de relatórios no primeiro momento.

---

# 32. Activity Types

O Rekko poderá fornecer categorias iniciais como:

```text
Development
Meeting
Code Review
Research
Planning
Documentation
Testing
Support
Other
```

No MVP, Activity Type deve existir, mas não precisa ser obrigatório em todos os fluxos se isso prejudicar a velocidade do registro.

---

# 33. Navegação principal

Estrutura inicial recomendada:

```text
REKKO

Today
Timeline
Work
Insights

────────────

Workspace
Members
Integrations
Settings

────────────

Current Task
```

Dependendo da solução de UX, itens administrativos podem ficar agrupados nas configurações do Workspace.

---

# 34. Work

`Work` será a área para:

- Projetos;
- Work Items;
- demandas manuais;
- demandas vindas do Linear;
- busca;
- filtros;
- histórico relacionado ao trabalho.

---

# 35. Busca rápida / Command Palette

Desejável para o MVP, mas pode ser cortada caso ameace o cronograma.

Atalho conceitual:

```text
⌘ K
```

Exemplo:

```text
Search work...

AC-843 Turnstile
AMBLA Onboarding
PDDE School Query
```

Ações:

```text
Start timer
Open task
Add manual time
```

---

# 36. Onboarding

Fluxo inicial recomendado:

```text
Welcome to Rekko.

Reconstrua seu tempo.
Entenda sua jornada.
```

Após o cadastro, o onboarding do primeiro Workspace possui exatamente três
etapas:

1. informar o nome do Workspace;
2. preparar convites opcionais para o time;
3. revisar e confirmar.

As duas primeiras etapas mantêm apenas estado temporário. Workspace,
membership do Owner e convites são criados somente na confirmação final. O
usuário pode voltar e editar qualquer informação sem perder os dados.

Depois da criação, a configuração de projeto acontece progressivamente dentro
do produto, sem alongar o onboarding inicial.

O usuário não deve ser obrigado a configurar toda a empresa antes de começar a trabalhar.

---

# 37. Light Mode e Dark Mode

Ambos são:

> **obrigatórios no MVP**

O Rekko deve possuir:

- Light Mode;
- Dark Mode;
- opção `System`, se tecnicamente simples.

A implementação visual deve tratar os dois temas como experiências de primeira classe.

Dark Mode não deve ser apenas uma inversão automática de cores.

---

# 38. Direção visual

O Rekko não deve parecer um ERP de RH.

Evitar como linguagem principal:

```text
FUNCIONÁRIO
MATRÍCULA
ENTRADA
SAÍDA
JUSTIFICATIVA
```

A referência conceitual deve estar mais próxima de:

```text
Linear
+
Timeline
+
Timer
+
Personal productivity tool
```

Características desejadas:

- visual limpo;
- tipografia forte;
- muito espaço em branco;
- poucos cards desnecessários;
- timer em destaque;
- timeline visual;
- interfaces rápidas;
- motion discreto;
- forte cuidado com microinterações;
- excelente experiência desktop;
- responsividade real.

---

# 39. Conceito visual de reconstrução

O conceito de Rekko pode ser representado visualmente por segmentos de tempo.

Exemplo incompleto:

```text
━━━━━━━   ━━━━━   ━━━━━━━━━━━━━
```

Depois de reconstruído:

```text
━━━━━━━ ━━━━━━━ ━━━━━━━━━━━━━━━
```

Esse conceito pode inspirar futuramente:

- identidade;
- logo;
- loading;
- timeline;
- gráficos;
- motion;
- estados de preenchimento.

---

# 40. Estados principais de uma Time Entry

Uma Time Entry poderá ser originada de:

```text
Timer
Manual
```

Estados de aprovação formal não são obrigatórios no primeiro MVP.

Fluxos como:

```text
Pending
Approved
Rejected
```

ficam fora do core inicial e poderão entrar quando o Rekko evoluir para gestão organizacional mais rígida.

---

# 41. MVP oficial

## 41.1. Conta e acesso

- [x] Cadastro;
- [x] Login;
- [x] Logout;
- [x] Recuperação básica de acesso;
- [x] Light Mode;
- [x] Dark Mode.

---

## 41.2. Workspace

- [x] Criar Workspace após cadastro;
- [x] Owner automático;
- [x] Convidar membros;
- [x] Informar cargo no convite;
- [x] Definir role no convite;
- [x] Owner;
- [x] Admin;
- [x] Member;
- [x] Listar membros;
- [x] Alterar role;
- [x] Remover membro.

---

## 41.3. Projetos

- [x] Criar Projeto;
- [x] Escolher origem;
- [x] Projeto manual;
- [x] Projeto via Linear;
- [x] Status do Projeto;
- [x] estimativa total opcional.

---

## 41.4. Work Items manuais

- [x] Criar demanda;
- [x] editar demanda;
- [x] status;
- [x] descrição;
- [x] estimativa opcional.

---

## 41.5. Linear

- [x] Conectar Linear;
- [x] navegar pelos cards disponíveis;
- [x] pesquisar;
- [x] filtrar o suficiente para facilitar a seleção;
- [x] selecionar cards individualmente;
- [x] selecionar múltiplos cards;
- [x] preservar parent/sub-issue;
- [x] selecionar/desmarcar descendants;
- [x] não importar automaticamente tudo;
- [x] ocultar Done por padrão;
- [x] manter histórico se um item ficar Done;
- [x] sincronizar metadados essenciais;
- [x] revisar mudanças e adicionar novos cards manualmente;
- [x] parser da convenção `Estimativa`;
- [x] integração inicialmente read-only do ponto de vista do Linear.

---

## 41.6. Timer

- [x] Start;
- [x] Pause;
- [x] Resume;
- [x] Finish;
- [x] Switch task;
- [x] apenas um cronômetro ativo por usuário;
- [x] duração em tempo real.

---

## 41.7. Registro manual

- [x] Data;
- [x] horário inicial;
- [x] horário final;
- [x] projeto;
- [x] demanda;
- [x] descrição opcional;
- [x] cálculo automático de duração;
- [x] detecção de sobreposição.

---

## 41.8. Timeline

- [x] Timeline diária;
- [x] blocos por atividade;
- [x] gaps;
- [x] reconstrução de gaps;
- [x] histórico diário.

---

## 41.9. Today

- [x] tempo total do dia;
- [x] atividade atual;
- [x] ações do timer;
- [x] timeline resumida;
- [x] gaps visíveis.

---

## 41.10. Insights

- [x] horas hoje;
- [x] horas na semana;
- [x] horas por projeto;
- [x] horas por demanda;
- [x] estimado × realizado.

---

## 41.11. Exportação

- [x] exportação CSV;
- [x] filtro por período;
- [x] filtro por colaborador;
- [x] filtro por projeto;
- [x] filtro por demanda;
- [x] relação Colaborador × Projeto × Demanda × Horas;
- [x] duração HH:mm;
- [x] duração decimal.

---

# 42. Desejável, mas cortável do MVP

Funcionalidades úteis que podem ser removidas caso aumentem significativamente o prazo:

- [ ] Command Palette;
- [ ] atalhos avançados de teclado;
- [ ] customização extensa de Activity Types;
- [ ] exportação agregada adicional;
- [ ] modo `System` além de Light/Dark.

Light Mode e Dark Mode não são cortáveis.

---

# 43. Fora do MVP

Não implementar no primeiro ciclo:

- [ ] PDF;
- [ ] extensão Chrome/Edge;
- [ ] Google Calendar;
- [ ] Outlook Calendar;
- [ ] GitHub;
- [ ] Slack;
- [ ] Microsoft Teams;
- [ ] Notion;
- [ ] Jira;
- [ ] screenshots automáticos;
- [ ] captura automática de aplicativos;
- [ ] captura de URLs;
- [ ] monitoramento invasivo;
- [ ] IA;
- [ ] reconstrução automática;
- [ ] aprovação formal de timesheets;
- [ ] folha de pagamento;
- [ ] billing por hora;
- [ ] custo por colaborador;
- [ ] centro de custo;
- [ ] faturamento;
- [ ] departamentos;
- [ ] organograma;
- [ ] Teams internos ao Workspace;
- [ ] permissões extremamente granulares.

---

# 44. Evolução prevista

## Rekko V1

```text
Track
+
Reconstruct
+
Understand
+
Workspace collaboration
+
Selective Linear integration
```

---

## Rekko Connect

Integrações adicionais para enriquecer contexto:

```text
Google Calendar
Outlook
GitHub
Notion
Jira
Slack
Teams
```

---

## Rekko Intelligence

Reconstrução assistida.

Exemplo:

```text
10:32
Linear issue moved to In Progress

10:38
GitHub branch created

11:14
Commit

12:03
Pull Request
```

Sugestão:

```text
Possible work session

AC-843
10:32 – 12:03
~1h31

[ Add to timeline ]
```

O usuário sempre confirma.

---

## Rekko Teams

Evolução da gestão organizacional:

- aprovação;
- regras de apontamento;
- períodos fechados;
- auditoria avançada;
- Teams internos;
- permissões adicionais;
- gestão de capacidade.

---

## Rekko Business

Camada financeira:

- valor/hora;
- custo;
- orçamento;
- centro de custo;
- faturamento;
- relatórios financeiros.

---

# 45. Regras conceituais essenciais

## RN001 — Um cronômetro ativo

Um Member não pode possuir dois cronômetros ativos simultaneamente.

---

## RN002 — Switch encerra e inicia

Trocar de tarefa deve finalizar a anterior e iniciar a nova no mesmo instante.

---

## RN003 — Pause não conta como trabalho

Tempo pausado não entra na duração trabalhada.

---

## RN004 — Histórico externo não pode apagar histórico Rekko

Mudanças ou conclusão de uma demanda no Linear não removem horas históricas.

---

## RN005 — Importação Linear é seletiva

Conectar o Linear não importa automaticamente todas as issues.

---

## RN006 — Done não é trabalho ativo

Cards concluídos ficam fora da seleção e do trabalho ativo por padrão.

---

## RN007 — Seleção de parent preserva hierarquia

Ao importar parent/sub-issues, o Rekko preserva o contexto hierárquico.

---

## RN008 — Estimativa e realizado são diferentes

O sistema nunca deve substituir um pelo outro.

---

## RN009 — Lançamento manual é parte legítima do produto

Um lançamento manual não é tratado automaticamente como irregular.

---

## RN010 — Sobreposição deve ser detectada

O sistema alerta sobre períodos conflitantes antes de salvar.

---

## RN011 — Cargo e role são conceitos diferentes

`Role` controla acesso.

`Cargo` representa a função profissional.

---

## RN012 — Exportação respeita filtros

O CSV exportado deve refletir o período e os filtros escolhidos pelo usuário.

---

# 46. Momento “Aha!”

O momento esperado de percepção de valor é:

1. usuário cria sua conta;
2. cria um Workspace;
3. conecta o Linear;
4. seleciona somente as demandas relevantes;
5. visualiza as estimativas;
6. inicia uma tarefa em um clique;
7. trabalha normalmente;
8. troca ou finaliza;
9. reconstrói gaps caso necessário;
10. abre o Today;
11. enxerga exatamente onde seu dia foi utilizado;
12. compara estimativa × realizado.

O pensamento desejado é:

> **“É aqui que meu tempo foi parar.”**

---

# 47. Critério de sucesso conceitual do MVP

O Rekko V1 estará conceitualmente completo quando um usuário conseguir:

1. criar sua conta;
2. criar um Workspace;
3. convidar outras pessoas;
4. definir `Owner`, `Admin` ou `Member`;
5. registrar o cargo profissional de cada membro;
6. criar um projeto manual;
7. criar um projeto conectado ao Linear;
8. escolher explicitamente quais cards do Linear serão trazidos;
9. preservar a hierarquia entre parent e sub-issues;
10. visualizar estimativas extraídas das descrições;
11. iniciar uma tarefa rapidamente;
12. pausar e continuar;
13. trocar de tarefa;
14. finalizar o trabalho;
15. registrar um período manualmente;
16. reconstruir gaps;
17. consultar a Timeline;
18. visualizar estimado × realizado;
19. consultar horas por projeto e demanda;
20. exportar CSV com Colaborador × Projeto × Demanda × Horas;
21. utilizar o produto integralmente em Light Mode;
22. utilizar o produto integralmente em Dark Mode.

Se esses pontos forem executados excepcionalmente bem, o Rekko já terá um MVP coerente, útil e com identidade própria.

---

# 48. Decisões congeladas para a próxima fase

As seguintes decisões ficam congeladas neste contexto:

```text
Nome do produto:
Rekko

Tagline:
Reconstrua seu tempo. Entenda sua jornada.

Estrutura colaborativa:
Workspace

Roles:
Owner
Admin
Member

Cargo:
Campo separado da role

Projeto:
Manual ou Linear

Importação Linear:
Seletiva

Importação automática de todo Linear:
Não

Done:
Oculto do trabalho ativo por padrão

Estimativa:
Suporte ao padrão textual "Estimativa 30m"

Timer:
Start / Pause / Resume / Switch / Finish

Timeline:
Core do produto

Reconstrução manual:
Core do produto

Insights:
Básicos no V1

Exportação:
CSV obrigatório

PDF:
Pós-MVP

Light Mode:
Obrigatório

Dark Mode:
Obrigatório

Monitoramento invasivo:
Fora da proposta

IA:
Pós-MVP
```

---

# 49. Limites deste documento

Este arquivo define:

- visão;
- escopo;
- conceitos;
- comportamento esperado;
- regras de negócio;
- prioridades de produto.

Este arquivo **não define ainda**:

- stack;
- arquitetura;
- banco de dados;
- framework;
- cloud;
- autenticação técnica;
- estratégia de filas;
- modelo de cache;
- webhooks;
- polling;
- schema GraphQL interno;
- estrutura final de pastas;
- CI/CD;
- observabilidade.

Essas decisões devem ser tomadas na próxima fase, respeitando este `CONTEXT.md`.

---

# 50. Referências técnicas validadas para a integração Linear

A viabilidade da importação seletiva foi considerada com base na API pública atual do Linear.

Pontos relevantes:

- API pública GraphQL;
- suporte a OAuth 2.0 para aplicações usadas por terceiros;
- consulta de issues individuais;
- consulta paginada;
- relação nativa entre parent e sub-issues;
- filtros e propriedades de Team/Project/Status disponíveis no ecossistema do Linear.

Documentação oficial:

- https://linear.app/developers/graphql
- https://linear.app/developers/pagination
- https://linear.app/docs/parent-and-sub-issues
- https://linear.app/docs/filters

---

# 51. Resumo final

> **Rekko é uma plataforma de reconstrução e compreensão do tempo de trabalho.**

O produto permite que uma pessoa ou Workspace:

- registre trabalho enquanto ele acontece;
- reconstrua períodos esquecidos;
- conecte tempo a projetos e demandas;
- integre seletivamente demandas do Linear;
- preserve parent/sub-issues;
- compare estimado × realizado;
- entenda a jornada através de uma Timeline;
- trabalhe colaborativamente com Owner, Admin e Member;
- exporte sua relação de horas em CSV;
- utilize uma experiência visual moderna em Light ou Dark Mode.

> **Reconstrua seu tempo. Entenda sua jornada.**
