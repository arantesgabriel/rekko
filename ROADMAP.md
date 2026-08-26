# REKKO — ROADMAP.md

> **Status:** MVP Implementation Roadmap  
> **Purpose:** Definir a ordem oficial de implementação do Rekko e os critérios mínimos para considerar cada fase concluída.  
> **Sources of truth:** `CONTEXT.md`, `ARCHITECTURE.md`, `DESIGN.md`.

---

# 1. Princípios do roadmap

O Rekko deve ser construído em fases pequenas, testáveis e cumulativas.

Cada fase deve:

- terminar com software executável;
- respeitar `CONTEXT.md`, `ARCHITECTURE.md` e `DESIGN.md`;
- incluir testes proporcionais ao risco;
- não antecipar features de fases futuras sem necessidade técnica real;
- manter Light Mode e Dark Mode funcionais;
- manter responsividade nas telas tocadas;
- preservar isolamento de Workspace;
- deixar o repositório em estado utilizável.

Regra:

> Uma fase só está concluída quando código, migrations, testes e UX principal estão funcionando juntos.

---

# 2. Definition of Done global

Toda feature concluída deve passar por:

```text
pnpm lint
pnpm format:check
pnpm typecheck
pnpm test
pnpm build
```

Quando o fluxo estiver coberto por E2E:

```text
pnpm test:e2e
```

Também validar:

- Light Mode;
- Dark Mode;
- desktop;
- mobile;
- loading;
- empty state;
- error state;
- autorização server-side;
- nenhuma quebra de tenant isolation.

---

# 3. Fase 0 — Foundation

## Objetivo

Criar uma base sólida e executável antes de qualquer feature de produto.

## Entregas

- [x] Monorepo com pnpm workspaces;
- [x] `apps/web`;
- [x] `packages/db`;
- [x] `packages/shared`;
- [x] Next.js App Router;
- [x] TypeScript strict;
- [x] lint;
- [x] formatter;
- [x] Vitest;
- [x] Playwright;
- [x] env validation;
- [x] Supabase local;
- [x] Drizzle;
- [x] primeira migration;
- [x] GitHub Actions;
- [x] Sentry;
- [x] Pino;
- [x] PostHog básico;
- [x] estrutura inicial de módulos;
- [x] design tokens;
- [x] Light Mode;
- [x] Dark Mode;
- [x] seed exclusivamente local/test;
- [x] `.env.example`;
- [x] README com setup local.

## UX mínima

Criar:

- landing shell;
- auth shell;
- app shell inicial;
- theme switcher.

Não implementar ainda páginas completas de produto.

## Critério de saída

Uma pessoa deve conseguir:

```text
clone
↓
pnpm install
↓
configurar env local
↓
pnpm db:migrate
↓
pnpm db:seed
↓
pnpm dev
```

e abrir a aplicação funcionando.

---

# 4. Fase 1 — Landing + Authentication

## Objetivo

Permitir descoberta do produto, cadastro e acesso seguro.

## Entregas

### Landing

- [x] Navbar;
- [x] Hero;
- [x] tagline oficial;
- [x] preview visual inicial;
- [x] Track / Reconstruct / Understand;
- [x] Linear section;
- [x] Workspace section;
- [x] Estimated × Actual section;
- [x] `Free during beta`;
- [x] CTA final;
- [x] footer;
- [x] motion principal;
- [x] responsive;
- [x] reduced motion.

### Auth

- [x] signup email/password;
- [x] login email/password;
- [x] Google OAuth;
- [x] logout;
- [x] email verification;
- [x] janela de verificação de 72h;
- [x] resend verification;
- [x] forgot password;
- [x] reset password;
- [x] sign out all devices.

## Critério de saída

Usuário consegue:

```text
landing
→ criar conta
→ autenticar
→ receber confirmação
→ entrar no produto
```

O usuário não verificado deve receber a mensagem definida pelo produto e respeitar a regra de grace period.

---

# 5. Fase 2 — Workspace + Members

## Objetivo

Estabelecer o domínio multi-tenant antes do restante do produto.

## Entregas

### Workspace

- [x] criar Workspace;
- [x] Owner automático;
- [x] selecionar Workspace ativo;
- [x] múltiplos Workspaces por usuário;
- [x] Workspace Switcher;
- [x] timezone do Workspace;
- [x] proteção do último Owner.

### Members

- [x] Owner;
- [x] Admin;
- [x] Member;
- [x] cargo separado da role;
- [x] lista de membros;
- [x] convite por email;
- [x] convite expira em 7 dias;
- [x] aceitar convite;
- [x] cancelar convite;
- [x] reenviar convite;
- [x] alterar cargo;
- [x] alterar role;
- [x] remover membro;
- [x] preservar histórico do membro removido.

### Onboarding

- [x] Create Workspace;
- [x] convite opcional;
- [x] skip explícito;
- [x] progresso segmentado.

## Testes obrigatórios

- tenant isolation;
- último Owner;
- Member tentando alterar role;
- Admin tentando promover Owner indevidamente;
- convite expirado;
- convite reutilizado;
- usuário em múltiplos Workspaces.

## Critério de saída

Dois usuários em Workspaces diferentes não conseguem acessar dados entre si.

---

# 6. Fase 3 — Projects + Manual Work Items

## Objetivo

Permitir uso real do Rekko sem depender de integração externa.

## Entregas

### Projects

- [x] criação de Projeto;
- [x] escolha da origem;
- [x] projeto manual;
- [x] nome;
- [x] descrição;
- [x] status;
- [x] estimativa total opcional;
- [x] archive;
- [x] Project Cards.

### Manual Work Items

- [x] criar Work Item;
- [x] editar;
- [x] descrição;
- [x] status;
- [x] estimativa;
- [x] parent/sub-item quando aplicável;
- [x] Work Item List;
- [x] busca básica;
- [x] filtros básicos.

## Permissões

- Owner/Admin criam Projects;
- todos os Members visualizam Projects;
- todos os Members podem apontar horas posteriormente.

## Critério de saída

Um Workspace deve conseguir organizar trabalho totalmente manual.

---

# 7. Fase 4 — Time Tracking Core

## Objetivo

Implementar o coração operacional do Rekko.

## Entregas

### Timer

- [ ] Start;
- [ ] Pause;
- [ ] Resume;
- [ ] Finish;
- [ ] Switch;
- [ ] Global Timer Dock;
- [ ] apenas um timer ativo por usuário;
- [ ] constraint no PostgreSQL;
- [ ] Clock abstraction;
- [ ] estado persistido no servidor;
- [ ] timer continua após fechar navegador;
- [ ] cross-device fetch do timer atual.

### Time model

- [ ] TimeEntry;
- [ ] TimeSegment;
- [ ] duração materializada;
- [ ] transações;
- [ ] atomic Switch.

## Testes obrigatórios

- start simultâneo;
- race condition;
- pause/resume;
- finish paused;
- switch atomic;
- fechar/reabrir navegador;
- acesso entre Workspaces.

## Critério de saída

O cronômetro não pode depender de estado local do browser para funcionar corretamente.

---

# 8. Fase 5 — Manual Time + Timeline + Reconstruction

## Objetivo

Entregar o diferencial conceitual central do Rekko.

## Entregas

### Manual Time

- [ ] lançamento manual;
- [ ] data;
- [ ] início;
- [ ] fim;
- [ ] Project;
- [ ] Work Item opcional;
- [ ] descrição;
- [ ] cálculo server-side;
- [ ] detecção de overlap.

### Timeline

- [ ] Timeline diária;
- [ ] rail temporal;
- [ ] Activity Blocks;
- [ ] duração;
- [ ] gaps;
- [ ] active segment;
- [ ] responsive mobile timeline.

### Reconstruction

- [ ] Reconstruction Drawer;
- [ ] preencher gap;
- [ ] atualizar timeline;
- [ ] motion de segmentos conectando;
- [ ] mensagens não julgadoras.

### Today

- [ ] tracked today;
- [ ] current activity;
- [ ] quick start;
- [ ] recentes;
- [ ] timeline resumida;
- [ ] zero-state útil.

## Critério de saída

O usuário deve conseguir olhar o Today e responder:

> “Onde meu tempo foi parar hoje?”

Essa é a primeira versão que deve parecer claramente **Rekko**, e não apenas um time tracker.

---

# 9. Fase 6 — Linear Integration

## Objetivo

Conectar o tempo ao trabalho já existente no Linear.

## Pré-requisitos

- Workspace estável;
- Projects;
- Work Items;
- encryption service;
- audit;
- OAuth infrastructure;
- timer estável.

## Entregas

### OAuth

- [ ] conectar Linear por Workspace;
- [ ] Owner/Admin conecta;
- [ ] tokens AES-256-GCM;
- [ ] scopes mínimos;
- [ ] disconnect;
- [ ] reconnect state.

### Browse

- [ ] GraphQL client isolado;
- [ ] paginação;
- [ ] Search;
- [ ] Team filter;
- [ ] Project filter;
- [ ] Status filter;
- [ ] Assignee filter.

### Selective Import

- [ ] árvore parent/sub-issue;
- [ ] checkbox;
- [ ] indeterminate;
- [ ] seleção múltipla;
- [ ] ocultar Done por padrão;
- [ ] importar somente selecionados;
- [ ] parent contextual;
- [ ] sticky selected count.

### Estimate Parser

- [ ] `Estimativa 30m`;
- [ ] `15m`;
- [ ] `1h`;
- [ ] `1h30`;
- [ ] `1h 30m`;
- [ ] `2h 15m`;
- [ ] normalização em minutos;
- [ ] testes unitários extensos.

### Sync

- [ ] Sync now;
- [ ] Linear webhook endpoint;
- [ ] HMAC;
- [ ] timestamp;
- [ ] delivery id;
- [ ] idempotência;
- [ ] atualização de title;
- [ ] description;
- [ ] status;
- [ ] parent;
- [ ] assignee;
- [ ] estimate;
- [ ] archive externo preservando histórico.

### Estimate source of truth UX

Se usuário tentar editar estimativa Linear:

```text
A estimativa deste item vem do Linear.
```

Ações:

```text
Open in Linear
Sync now
```

## Testes obrigatórios

- OAuth revoked;
- duplicate webhook;
- invalid webhook;
- parent changed;
- Done;
- archived;
- selective import;
- Workspace permissions;
- parser.

## Critério de saída

Conectar Linear nunca deve significar importar todo o Workspace externo automaticamente.

---

# 10. Fase 7 — Insights + Estimated vs Actual

## Objetivo

Transformar horas registradas em compreensão.

## Entregas

### Insights

- [ ] tracked today;
- [ ] tracked week;
- [ ] hours by Project;
- [ ] hours by Work Item;
- [ ] horizontal bar charts;
- [ ] filters básicos.

### Estimated × Actual

- [ ] Work Item comparison;
- [ ] Project aggregate;
- [ ] estimated;
- [ ] tracked;
- [ ] difference;
- [ ] linguagem neutra;
- [ ] sem gauges.

## Critério de saída

Insights devem responder perguntas úteis sem virar dashboard de BI.

---

# 11. Fase 8 — CSV Export + Administrative Visibility

## Objetivo

Permitir uso prático das horas fora do Rekko.

## Entregas

- [ ] export page/action;
- [ ] período;
- [ ] colaborador;
- [ ] projeto;
- [ ] demanda;
- [ ] CSV UTF-8;
- [ ] BOM para Excel;
- [ ] HH:mm;
- [ ] decimal hours;
- [ ] Owner/Admin exportam todos;
- [ ] Member exporta somente si;
- [ ] Workspace timezone.

Relação principal:

```text
Colaborador
×
Projeto
×
Demanda
×
Horas trabalhadas
```

## Testes obrigatórios

- Member tentando exportar outro usuário;
- filtro por Workspace;
- timezone;
- decimal calculation;
- CSV escaping.

---

# 12. Fase 9 — Audit + Settings Completion

## Objetivo

Completar governança mínima do MVP.

## Entregas

- [ ] audit log backend;
- [ ] time entry changes auditadas;
- [ ] role changes;
- [ ] member removal;
- [ ] project archive;
- [ ] integration connect/disconnect;
- [ ] Owner corrigir horas alheias;
- [ ] Admin apenas visualizar;
- [ ] Member apenas editar próprias horas;
- [ ] Workspace settings;
- [ ] User settings;
- [ ] theme setting;
- [ ] session management.

Audit UI completa continua fora do MVP.

---

# 13. Fase 10 — Product Polish

## Objetivo

Transformar um produto funcional em um produto pronto para beta.

## UX/UI

- [ ] motion pass;
- [ ] Today polish;
- [ ] Timeline polish;
- [ ] Reconstruction motion;
- [ ] Global Timer Dock polish;
- [ ] Sidebar transitions;
- [ ] theme transition;
- [ ] mobile pass;
- [ ] tablet pass;
- [ ] keyboard navigation;
- [ ] focus states;
- [ ] accessibility review;
- [ ] reduced motion;
- [ ] loading states;
- [ ] empty states;
- [ ] errors;
- [ ] copy review.

### Getting Started

- [ ] checklist;
- [ ] dismiss;
- [ ] progress;
- [ ] primeira task;
- [ ] primeira reconstruction.

### Landing polish

- [ ] Hero reconstruction animation;
- [ ] interactive/product preview;
- [ ] responsive;
- [ ] performance;
- [ ] SEO metadata;
- [ ] social metadata.

---

# 14. Fase 11 — Beta Readiness

## Objetivo

Validar que o Rekko pode receber usuários reais.

## Segurança

- [ ] security headers;
- [ ] rate limits;
- [ ] tenant isolation suite;
- [ ] OAuth security;
- [ ] webhook replay protection;
- [ ] token encryption;
- [ ] Sentry scrub;
- [ ] dependency audit;
- [ ] production secrets review.

## Infra

- [ ] Vercel production (Pro or higher);
- [ ] Supabase production;
- [ ] staging separado;
- [ ] production domain;
- [ ] migrations production-safe;
- [ ] backup strategy revisada;
- [ ] health checks;
- [ ] logs acessíveis;
- [ ] Sentry alerts.

## Produto

- [ ] onboarding completo;
- [ ] Linear real;
- [ ] timer real;
- [ ] CSV real;
- [ ] landing;
- [ ] terms/privacy mínimos antes de abertura pública.

## Critério de saída

O produto deve poder receber uma pequena beta de dezenas de usuários sem intervenção manual constante.

---

# 15. Pós-MVP — não antecipar

Não implementar durante o roadmap acima sem decisão explícita:

```text
PDF
GitHub integration
Google Calendar
Outlook
Slack
Teams
Notion
Jira
Chrome extension
automatic reconstruction
AI
file uploads
screenshots
application tracking
employee monitoring
timesheet approval
hourly rate
billing
payroll
cost center
project ACL
Teams internos
public API
mobile native
Redis
queue workers
microservices
```

---

# 16. Marco de produto

## Milestone A — Usável individualmente

Após Fase 5:

```text
manual project
+
timer
+
manual entry
+
Today
+
Timeline
+
Reconstruction
```

Primeiro marco real de valor.

---

## Milestone B — Diferencial Linear

Após Fase 6:

```text
Milestone A
+
selective Linear integration
+
estimates
+
sync
```

Primeiro marco competitivo.

---

## Milestone C — MVP completo

Após Fase 9:

```text
core
+
Linear
+
Insights
+
CSV
+
governança mínima
```

---

## Milestone D — Beta

Após Fase 11:

```text
MVP
+
polish
+
security
+
production readiness
```

---

# 17. Regra para mudanças de roadmap

Se uma necessidade nova surgir:

1. verificar se já existe em `CONTEXT.md`;
2. verificar impacto em `ARCHITECTURE.md`;
3. verificar impacto em `DESIGN.md`;
4. classificar:
   - necessário para fase atual;
   - dívida técnica;
   - pós-MVP;
5. atualizar este arquivo antes de expandir escopo significativamente.

Não adicionar features silenciosamente.
