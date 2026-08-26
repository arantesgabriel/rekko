# REKKO — AGENTS.md

> **Purpose:** Instruções operacionais obrigatórias para agentes de IA que trabalham no repositório Rekko.

---

# 1. Primeira regra

Antes de modificar código, leia obrigatoriamente:

```text
CONTEXT.md
ARCHITECTURE.md
DESIGN.md
ROADMAP.md
AGENTS.md
```

Não comece implementação de produto sem entender esses documentos.

---

# 2. Hierarquia de autoridade

Quando existir conflito:

```text
Produto / regras de negócio
→ CONTEXT.md

Arquitetura / stack / segurança
→ ARCHITECTURE.md

UX / UI / visual / motion
→ DESIGN.md

Ordem de implementação
→ ROADMAP.md

Forma de trabalho do agente
→ AGENTS.md
```

Não invente uma solução para “resolver” conflito documental.

Identifique o conflito.

---

# 3. Objetivo dos agentes

O trabalho deve otimizar para:

```text
correctness
simplicity
security
maintainability
product quality
```

Não otimizar para:

```text
quantidade de código
quantidade de abstrações
arquitetura impressionante
uso de tecnologias desnecessárias
```

---

# 4. Filosofia

> **Build the smallest correct thing that fits the approved architecture and product vision.**

Não confundir simplicidade com código descartável.

---

# 5. Antes de implementar uma tarefa

Execute mentalmente este checklist:

- Qual fase do `ROADMAP.md` estou implementando?
- Qual requisito do `CONTEXT.md` suporta esta tarefa?
- Existe decisão técnica no `ARCHITECTURE.md`?
- Existe comportamento visual no `DESIGN.md`?
- Existe código existente que deve ser reutilizado?
- Existe risco de tenant isolation?
- Existe risco de segurança?
- Esta mudança precisa de migration?
- Esta mudança precisa de teste?
- Estou antecipando algo fora do MVP?

---

# 6. Escopo

Implemente somente:

1. o que foi solicitado;
2. o que é necessário para tornar o solicitado correto;
3. pequenos ajustes diretamente relacionados.

Não fazer refactors amplos não solicitados durante uma feature.

---

# 7. Não inventar requisitos

Se nenhum documento definir determinado comportamento:

- escolha o comportamento mais simples e reversível se for puramente técnico;
- não invente regra de negócio relevante;
- registre a suposição no resultado.

Nunca inventar:

- roles;
- permissões;
- workflows;
- campos de domínio;
- billing;
- aprovação;
- monitoramento;
- automações;
- IA.

---

# 8. Decisões técnicas congeladas

Não substituir:

```text
Next.js
TypeScript
pnpm
PostgreSQL
Supabase
Drizzle
Better Auth
Vitest
Playwright
Vercel
Sentry
Pino
```

Sem atualização explícita de `ARCHITECTURE.md`.

---

# 9. Proibido introduzir sem decisão arquitetural

Não adicionar:

```text
Prisma
Supabase Auth
NestJS
Express backend separado
Firebase
MongoDB
Redis
BullMQ
RabbitMQ
Kafka
microservices
GraphQL interno
tRPC
public API
Supabase client database access from browser
```

apenas por preferência pessoal.

---

# 10. Monorepo

Respeitar:

```text
apps/web
packages/db
packages/shared
```

Não criar novo package apenas para um arquivo ou helper.

Novo package exige benefício concreto.

---

# 11. Modular monolith

Domínios principais:

```text
auth
users
workspaces
invitations
projects
work-items
time-tracking
timeline
insights
exports
integrations/linear
```

Não colocar toda lógica em:

```text
utils/
helpers/
services/
```

genéricos.

---

# 12. Server-authoritative

Nunca confiar no browser para:

- role;
- `workspace_id`;
- duração;
- hora oficial do timer;
- ownership;
- filtros de segurança;
- estado do Linear;
- permissão de exportação.

Todas essas regras são validadas no servidor.

---

# 13. Tenant isolation

Esta é uma regra crítica.

Toda operação em dado de Workspace deve verificar:

```text
session.user
+
workspace membership
+
required role
```

Não assumir que possuir um ID válido significa possuir acesso.

---

# 14. Queries tenant-aware

Evitar:

```ts
db.query.projects.findFirst({
  where: eq(projects.id, projectId)
})
```

quando o contexto exige Workspace.

Preferir conceitualmente:

```text
project.id
AND
project.workspace_id
```

ou repository/use case que já tenha realizado a autorização explicitamente.

---

# 15. Banco

Usar:

```text
UUID
timestamptz
UTC
snake_case
```

Não usar IDs do Linear como primary key.

---

# 16. Migrations

Toda mudança de schema:

1. alterar schema Drizzle;
2. gerar migration;
3. revisar migration;
4. executar local;
5. testar;
6. versionar migration.

Nunca modificar production manualmente como solução normal.

---

# 17. Seeds

Seeds somente:

```text
local
test
```

Nunca production.

Se criar novo seed:

- deterministic quando possível;
- útil para desenvolvimento;
- sem dados reais.

---

# 18. Time tracking

Fonte da verdade:

```text
TimeEntry
+
TimeSegments
+
server clock
```

Nunca criar timer real dependente de:

```text
setInterval
localStorage
browser session
```

O frontend apenas exibe o tempo calculado a partir de timestamps.

---

# 19. Timer concurrency

Ao tocar timer:

- use transaction;
- respeite unique partial constraint;
- trate conflito;
- teste concorrência.

Não confiar em botão disabled.

---

# 20. Switch

Switch é operação atômica:

```text
finish current
+
start new
```

na mesma operação transacional.

Não implementar como duas chamadas independentes da UI.

---

# 21. Duração

Cliente não envia duração confiável.

Calcular server-side a partir de:

```text
TimeSegments
```

`duration_seconds` é materialização derivada.

---

# 22. Timezone

Banco:

```text
UTC
```

Today/Timeline:

```text
User timezone
```

Admin/export:

```text
Workspace timezone
```

Não fazer lógica de timezone com offsets hardcoded.

Usar IANA timezone.

---

# 23. Linear

A integração é:

```text
Workspace-owned
OAuth
read-only
selective import
```

Nunca importar todo Linear automaticamente.

---

# 24. Linear queries

Centralizar em:

```text
LinearGateway / LinearClient
```

Não espalhar GraphQL por:

- React components;
- Server Actions;
- pages;
- unrelated services.

---

# 25. Linear tokens

Tokens devem:

- ser criptografados;
- nunca aparecer em logs;
- nunca aparecer no browser;
- nunca aparecer no Sentry;
- nunca aparecer em analytics.

Usar encryption abstraction definida pela arquitetura.

---

# 26. Linear estimate

No MVP:

> a estimativa vem exclusivamente do parser da descrição.

Não utilizar automaticamente estimate nativo do Linear.

Não permitir override local de Work Item Linear.

---

# 27. Estimate editing UX

Ao tentar alterar uma estimativa Linear:

```text
A estimativa deste item vem do Linear.
```

Oferecer:

```text
Open in Linear
Sync now
```

---

# 28. Parser

O parser deve:

- ser função pura;
- viver em código compartilhável;
- possuir testes;
- não utilizar IA;
- retornar minutos normalizados.

---

# 29. Webhooks Linear

Obrigatório:

```text
raw body
HMAC
timestamp
delivery id
idempotency
```

Nunca processar webhook sem validar assinatura.

---

# 30. Security baseline

Toda nova feature deve considerar:

- authentication;
- authorization;
- input validation;
- tenant isolation;
- rate limiting quando sensível;
- logging seguro;
- secrets;
- PII;
- CSRF quando aplicável.

---

# 31. Validation

Toda entrada externa deve ser validada em runtime.

Preferir:

```text
Zod
```

Validar:

- form;
- query;
- params;
- JSON;
- webhook;
- env.

TypeScript não substitui runtime validation.

---

# 32. Audit

Alterações críticas devem gerar audit conforme arquitetura.

Principalmente:

```text
role changes
member removal
time entry correction
project archive
integration changes
```

Nunca guardar secrets em `before_json` / `after_json`.

---

# 33. Logging

Logs devem ser estruturados.

Contexto útil:

```text
request_id
workspace_id
user_id quando adequado
module
operation
duration_ms
```

Nunca logar:

```text
password
cookie
Authorization
OAuth token
encryption key
full webhook secret
```

---

# 34. Sentry

Sentry é para erro, não datastore.

Antes de capturar payload:

- remova PII desnecessária;
- remova secrets;
- remova descrições sensíveis quando não forem necessárias.

---

# 35. Analytics

Analytics é best-effort.

Falha do PostHog nunca pode quebrar uma ação.

Não enviar:

- descrições;
- emails;
- títulos sensíveis sem necessidade;
- tokens;
- conteúdo do Linear.

---

# 36. Design system

Antes de criar CSS próprio em um componente, verifique `DESIGN.md`.

Reutilizar:

- colors;
- spacing;
- radius;
- typography;
- shadows;
- motion tokens;
- semantic tokens.

Não inventar novos violetas por tela.

---

# 37. Brand

Brand base:

```text
Violet #6857F5
Blue   #4D7CFE
```

Produto usa brand com moderação.

Landing pode ser mais expressiva.

---

# 38. UI não deve parecer

- ERP;
- RH;
- folha de ponto;
- cyberpunk;
- AI startup genérica;
- dashboard cheio de cards;
- app neon.

---

# 39. Typography

Usar:

```text
Manrope
```

como família principal.

Timer:

```text
tabular-nums
```

Não adicionar nova fonte sem atualização de `DESIGN.md`.

---

# 40. Light / Dark

Toda UI nova deve funcionar nos dois modos.

Não finalizar tarefa visual sem verificar:

```text
Light
Dark
```

---

# 41. Responsive

Toda tela tocada deve ser revisada em:

```text
desktop
mobile
```

Tablet quando layout estrutural mudar.

Não considerar desktop-only uma feature concluída.

---

# 42. Mobile

No mobile:

- bottom navigation;
- timer sticky;
- drawers podem virar bottom sheet;
- Timeline não deve ser desktop comprimido.

---

# 43. Motion

Motion é importante, mas deve comunicar:

```text
continuity
time
state change
reconstruction
```

Não adicionar animações decorativas infinitas.

---

# 44. Reduced motion

Toda motion expressiva deve respeitar:

```text
prefers-reduced-motion
```

A funcionalidade deve funcionar sem animação.

---

# 45. Timeline

A Timeline é assinatura do Rekko.

Mudanças nessa área devem preservar:

- rail temporal;
- leitura cronológica;
- blocks;
- gaps neutros;
- reconstruction;
- conexão visual entre segmentos.

Não transformar Timeline em tabela.

---

# 46. Gaps

Gap não é erro.

Nunca usar:

```text
red
danger
warning alarm
```

como padrão de gap.

Copy deve ser neutra.

---

# 47. Product language

Preferir:

> Você já tem uma atividade em andamento.

Evitar:

> Operação inválida. Registro ativo existente.

Copy:

```text
direct
human
short
non-judgmental
```

---

# 48. Components

Antes de criar componente novo:

1. procurar componente existente;
2. verificar se extensão é suficiente;
3. criar novo somente se houver responsabilidade própria.

Evitar componentes gigantes com muitas props booleanas.

---

# 49. Abstractions

Não criar abstração com uma única implementação apenas “para o futuro”, exceto boundaries explicitamente definidos:

```text
LinearGateway
EmailService
Analytics
ErrorReporter
EncryptionService
Clock
```

---

# 50. Dependencies

Antes de adicionar dependência:

- verificar se plataforma/stack já resolve;
- verificar manutenção;
- verificar bundle impact;
- verificar security;
- explicar necessidade.

Evitar biblioteca para função trivial.

---

# 51. Error handling

Usar erros tipados de domínio/aplicação.

Não depender de:

```text
if error.message === "..."
```

quando uma categoria de erro pode ser explícita.

---

# 52. User-visible errors

Nunca mostrar:

- SQL;
- stack trace;
- raw GraphQL errors;
- internal secret;
- provider response completo.

Converter em mensagem humana.

---

# 53. Testing strategy

## Unit

Para regras puras:

```text
estimate parser
duration
timezone helper
permissions
CSV calculations
encryption helper
```

## Integration

Para:

```text
repositories
transactions
tenant isolation
timer
authorization
sync
audit
```

## E2E

Para fluxos críticos do usuário.

---

# 54. Não mockar banco crítico desnecessariamente

Timer, tenant isolation e constraints devem ser testados contra PostgreSQL real em testes de integração quando viável.

Mocks não provam comportamento de constraint/transação.

---

# 55. E2E críticos

Priorizar:

```text
signup/login
Workspace
invitation
Project
timer
switch
manual entry
Linear import
CSV export
```

---

# 56. Accessibility

Nova UI deve possuir:

- semantic HTML;
- keyboard;
- focus visible;
- label;
- contrast;
- accessible dialogs;
- touch targets adequados.

Não adicionar `aria-*` aleatoriamente quando HTML semântico resolve.

---

# 57. Performance

Antes de criar cache:

1. verificar query;
2. indexes;
3. N+1;
4. pagination;
5. payload;
6. medir.

Não adicionar Redis para “melhorar performance” sem evidência.

---

# 58. Paginação

Listas potencialmente grandes devem paginar.

Nunca:

```text
fetch all Linear issues
filter client-side
```

---

# 59. CSV

CSV é síncrono no MVP.

Member só exporta si mesmo.

Owner/Admin podem exportar todos.

Permissão sempre server-side.

---

# 60. Emails

Falha do provider não deve apagar convite já persistido.

Permitir retry/reenvio.

Nunca colocar lógica de domínio dentro de template.

---

# 61. Commits

Usar Conventional Commits.

Exemplos:

```text
feat(timer): add atomic task switching
fix(auth): enforce verification grace period
test(workspace): cover tenant isolation
refactor(linear): isolate webhook reconciliation
docs(roadmap): update beta gate
```

---

# 62. Pull Requests

PR deve ser:

- pequeno quando possível;
- focado;
- revisável;
- sem mudanças não relacionadas.

Descrição deve incluir:

```text
What changed
Why
How tested
Migrations
Screenshots when UI
Known limitations
```

---

# 63. Antes de concluir uma tarefa

Rodar:

```text
pnpm lint
pnpm format:check
pnpm typecheck
pnpm test
pnpm build
```

E E2E quando relevante.

---

# 64. Ao concluir UI

Relatar validação:

```text
Light: OK
Dark: OK
Desktop: OK
Mobile: OK
Keyboard: OK
Loading: OK
Empty: OK
Error: OK
```

Não afirmar OK sem ter verificado.

---

# 65. Ao concluir mudança de banco

Relatar:

```text
Migration created:
...

Schema changed:
...

Data migration:
yes/no

Rollback risk:
...
```

---

# 66. Ao concluir integração externa

Relatar:

```text
Scopes:
...

Secrets:
...

Failure modes:
...

Retries:
...

Security validation:
...
```

---

# 67. Atualização de documentos

Atualize documentação quando a decisão mudou.

Não atualizar `ARCHITECTURE.md` apenas porque uma variável mudou de nome.

Atualizar quando houver mudança real de:

- stack;
- data model conceitual;
- security policy;
- integration strategy;
- infrastructure;
- domain rule;
- UX pattern central.

---

# 68. ROADMAP

Ao finalizar uma fase:

- marcar itens realmente concluídos;
- não marcar itens parcialmente implementados;
- registrar dependências pendentes;
- não iniciar silenciosamente feature de fase muito posterior.

---

# 69. Dívida técnica

Se for necessário assumir dívida:

registrar claramente:

```text
What
Why
Impact
Recommended follow-up
```

Não esconder TODO importante no código sem contexto.

---

# 70. TODOs

TODO aceitável:

```text
TODO(rekko): reason + intended follow-up
```

TODO inaceitável:

```text
TODO fix later
```

---

# 71. Segurança supera conveniência

Se uma implementação mais rápida viola:

- tenant isolation;
- secret handling;
- auth;
- data integrity;

não faça.

Escolha a implementação segura.

---

# 72. Dados externos

Linear é contexto externo.

Rekko deve preservar localmente o necessário para:

- Timeline;
- Time Entries;
- histórico;
- export;
- Insights.

Não criar telas que falham completamente apenas porque Linear está temporariamente indisponível.

---

# 73. Graceful degradation

Falhas externas:

```text
Linear
Resend
PostHog
Sentry
```

não devem derrubar o core além do inevitável.

Exemplo:

Linear indisponível:

```text
timer de Work Item já importado continua funcionando
```

---

# 74. Source of truth

Resumo:

```text
Auth
→ Better Auth

Workspace / permissions
→ Rekko DB

Manual Projects / Work Items
→ Rekko DB

Linear metadata
→ Linear + local projection

Estimate Linear
→ description parser

Time
→ Rekko DB

Timeline
→ Rekko DB

Insights
→ Rekko DB
```

---

# 75. O que o agente pode decidir sozinho

Pode decidir autonomamente:

- nome de função interna;
- decomposição de componente;
- query optimization equivalente;
- organização interna de arquivos dentro do padrão;
- mensagens técnicas internas;
- implementação exata de helper;
- detalhes de testes;
- small UX implementation details que não alteram comportamento.

---

# 76. O que o agente não pode decidir sozinho

Não pode mudar:

- roles;
- permissões;
- onboarding conceitual;
- Linear ownership;
- Linear import policy;
- timer semantics;
- source of truth;
- framework;
- database;
- auth provider;
- hosting direction;
- visual identity;
- MVP scope;
- billing;
- privacy behavior.

---

# 77. Não implementar pós-MVP antecipadamente

Explicitamente proibido sem solicitação:

```text
AI
automatic reconstruction
Calendar
GitHub
Slack
Notion
Jira
extension
monitoring
screenshots
billing
payroll
approval
public API
native mobile
```

---

# 78. Resultado esperado de cada execução do agente

Ao finalizar trabalho, responder de forma objetiva com:

```text
Implemented
Files changed
Migration
Tests run
UX validation
Known limitations
Next recommended roadmap item
```

Não produzir longos ensaios quando o trabalho é implementação.

---

# 79. Regra final

> O Rekko deve parecer simples para o usuário porque a complexidade correta foi tratada na arquitetura, não porque regras importantes foram ignoradas.

Construa com disciplina.

Não sobrearquitetar.

Não cortar segurança.

Não perder a identidade do produto.
