# REKKO — ARCHITECTURE.md

> **Status:** Architecture Baseline — MVP  
> **Date:** 2026-08-26  
> **Purpose:** Fonte de verdade técnica para implementação do MVP do Rekko.  
> **Companion document:** `CONTEXT.md`  
> **Product tagline:** **Reconstrua seu tempo. Entenda sua jornada.**

---

# 1. Objetivo deste documento

Este arquivo define **como o Rekko deve ser construído tecnicamente**.

Ele deve ser usado pela equipe e por agentes de IA como a principal referência para:

- stack;
- estrutura do repositório;
- boundaries entre camadas;
- banco de dados;
- autenticação;
- multi-tenancy;
- autorização;
- integração com Linear;
- sincronização;
- timer;
- auditoria;
- exportação;
- segurança;
- testes;
- observabilidade;
- infraestrutura;
- CI/CD;
- ambientes.

Este documento **não substitui o `CONTEXT.md`**.

Regra de autoridade:

```text
Comportamento e requisitos de produto
→ CONTEXT.md

Decisões técnicas
→ ARCHITECTURE.md

UI/UX e identidade visual
→ DESIGN.md

Ordem de implementação
→ ROADMAP.md

Regras operacionais para agentes
→ AGENTS.md
```

Caso exista conflito entre este documento e o `CONTEXT.md` sobre comportamento do produto, o `CONTEXT.md` vence.

---

# 2. Princípios arquiteturais

A arquitetura do Rekko deve seguir estes princípios.

## 2.1. Simplicidade primeiro

O MVP não deve receber infraestrutura, serviços ou abstrações que ainda não possuem necessidade concreta.

Evitar inicialmente:

- microservices;
- message broker dedicado;
- Redis sem necessidade comprovada;
- Kubernetes;
- event sourcing;
- CQRS formal;
- service mesh;
- múltiplos backends;
- abstrações genéricas sem uso atual.

---

## 2.2. Modular monolith

O Rekko será inicialmente um:

> **Modular Monolith**

Existe uma aplicação full-stack, porém o domínio deve estar dividido por módulos claros.

Isso permite:

- desenvolver rápido;
- manter baixo custo;
- testar facilmente;
- evoluir sem acoplamento excessivo;
- extrair componentes no futuro se existir necessidade real.

---

## 2.3. Server-authoritative

Nenhuma regra crítica deve depender exclusivamente do frontend.

O servidor é responsável por validar:

- autenticação;
- autorização;
- Workspace;
- roles;
- projeto;
- propriedade de Time Entry;
- timer ativo;
- sobreposição;
- integração Linear;
- filtros de exportação;
- alterações administrativas.

O cliente nunca será considerado fonte confiável para permissões.

---

## 2.4. Multi-tenant by design

Workspace é a fronteira principal de tenant.

Nenhum dado de um Workspace pode ser acessado por membro de outro Workspace sem relação explícita.

O isolamento deve existir desde a primeira migration.

---

## 2.5. External systems are not the database

Linear é uma integração externa.

O Rekko deve persistir localmente os dados necessários para funcionar.

O sistema não deve depender de uma chamada ao Linear para renderizar cada página.

---

## 2.6. History must survive integrations

Alterações ou remoções no Linear nunca devem destruir o histórico de horas no Rekko.

---

## 2.7. Mobile-ready without mobile overengineering

Não existe decisão fechada de aplicativo mobile.

Entretanto:

- regras de negócio não devem ficar dentro de componentes React;
- regras de negócio não devem depender de Server Components;
- operações relevantes devem possuir uma camada de aplicação reutilizável;
- endpoints internos versionáveis podem ser expostos quando necessário.

O MVP não deve criar uma API pública apenas por causa de um possível app mobile futuro.

---

# 3. Stack oficial

## 3.1. Linguagem

```text
TypeScript
```

TypeScript será utilizado em toda a aplicação.

Configuração obrigatória:

```text
strict: true
```

Evitar:

```text
any
@ts-ignore
casts desnecessários
non-null assertion sem justificativa
```

---

## 3.2. Runtime

Usar:

> **Node.js LTS estável no momento da implementação**

Não utilizar releases `Current`, experimental ou nightly em produção.

O runtime deve ser fixado no repositório por:

```text
package.json engines
```

e/ou:

```text
.nvmrc
```

---

## 3.3. Framework

```text
Next.js
App Router
```

Usar a release estável mais recente e com todos os patches de segurança disponíveis.

Não usar:

- Canary;
- experimental builds;
- RCs;
- versões deliberadamente antigas sem justificativa.

---

## 3.4. React

Usar a versão estável suportada oficialmente pela versão escolhida do Next.js.

---

## 3.5. Banco

```text
PostgreSQL
Provider: Supabase
```

Supabase será utilizado principalmente como:

- PostgreSQL gerenciado;
- painel de administração do banco;
- infraestrutura simplificada para ambientes;
- potencial uso futuro de recursos Postgres/Supabase quando fizer sentido.

O Rekko **não depende arquiteturalmente do Supabase Auth**.

---

## 3.6. ORM

```text
Drizzle ORM
```

Motivos:

- TypeScript-first;
- schema explícito;
- migrations controladas;
- baixo overhead;
- bom suporte a PostgreSQL;
- menor abstração entre aplicação e SQL;
- adequado para constraints e indexes específicos que o Rekko necessita.

---

## 3.7. Autenticação

```text
Better Auth
```

Better Auth utilizará o mesmo PostgreSQL através do adapter Drizzle.

Métodos do MVP:

```text
Email + senha
Google OAuth
```

---

## 3.8. Package manager

```text
pnpm
```

Usar workspaces do pnpm.

Lockfile deve ser versionado.

---

## 3.9. Testes

```text
Vitest
Playwright
```

Vitest:

- unit;
- application/domain;
- integration.

Playwright:

- E2E.

---

## 3.10. Email transacional

```text
Resend
```

Usado para:

- confirmação de email;
- recuperação de senha;
- convite para Workspace.

A aplicação deve encapsular envio em um `EmailService`.

Não espalhar chamadas ao SDK do Resend pelo domínio.

---

## 3.11. Error tracking

```text
Sentry
```

Obrigatório desde o MVP.

Nenhum token OAuth, password, cookie, session token ou payload sensível deve ser enviado ao Sentry.

---

## 3.12. Structured logging

```text
Pino
```

Logs serão JSON em produção.

No desenvolvimento podem utilizar pretty-print.

---

## 3.13. Product analytics

```text
PostHog
```

Uso básico.

Eventos iniciais podem incluir:

```text
account_created
workspace_created
workspace_invite_sent
project_created
linear_connected
linear_items_imported
timer_started
timer_switched
timer_finished
manual_time_entry_created
csv_exported
```

Proibido enviar:

- descrição da demanda;
- conteúdo de Time Entry;
- emails;
- tokens;
- dados pessoais desnecessários;
- descrição do Linear.

Analytics deve utilizar IDs internos pseudônimos quando possível.

---

# 4. Política de versões

A filosofia escolhida é:

> **Latest stable**

Ao iniciar a implementação:

1. instalar a versão estável mais recente;
2. verificar advisories de segurança;
3. evitar beta/RC/canary;
4. versionar lockfile;
5. usar atualizações automáticas apenas para PRs, nunca auto-deploy de major version.

Recomendado:

```text
Dependabot ou Renovate
```

para abertura de PRs de atualização.

Atualizações de major version precisam passar:

```text
lint
typecheck
tests
build
E2E crítico
```

---

# 5. Estrutura do repositório

O Rekko será um monorepo.

Estrutura inicial:

```text
rekko/
│
├── apps/
│   └── web/
│
├── packages/
│   ├── db/
│   └── shared/
│
├── CONTEXT.md
├── ARCHITECTURE.md
├── DESIGN.md
├── ROADMAP.md
├── AGENTS.md
├── README.md
├── package.json
├── pnpm-workspace.yaml
└── pnpm-lock.yaml
```

Não criar pacotes extras sem necessidade concreta.

---

# 6. Responsabilidade dos pacotes

## 6.1. `apps/web`

Contém:

- Next.js;
- páginas;
- Server Components;
- Client Components;
- Route Handlers;
- Server Actions;
- autenticação;
- casos de uso;
- módulos de aplicação;
- integração Linear;
- emails;
- analytics;
- logging.

---

## 6.2. `packages/db`

Contém:

- Drizzle configuration;
- schema;
- enums;
- migrations;
- indexes;
- constraints;
- database client;
- local seed.

Não deve conter:

- regra visual;
- componentes;
- chamadas HTTP;
- lógica de produto de alto nível.

---

## 6.3. `packages/shared`

Somente código realmente compartilhável e independente de framework.

Exemplos possíveis:

- tipos de duração;
- parser de estimativas;
- helpers puros de datas;
- schemas compartilháveis;
- constantes.

Não usar `shared` como depósito genérico.

---

# 7. Estrutura modular da aplicação

Dentro de `apps/web/src`, organizar por módulos de negócio.

Exemplo:

```text
src/
├── app/
├── modules/
│   ├── auth/
│   ├── users/
│   ├── workspaces/
│   ├── invitations/
│   ├── projects/
│   ├── work-items/
│   ├── time-tracking/
│   ├── timeline/
│   ├── insights/
│   ├── exports/
│   └── integrations/
│       └── linear/
│
├── lib/
├── components/
└── styles/
```

Cada módulo pode conter:

```text
application/
domain/
repository/
schemas/
server/
```

quando necessário.

Não criar todas as pastas antecipadamente.

A estrutura deve crescer conforme o módulo exigir.

---

# 8. Camadas

O Rekko usará separação pragmática.

```text
Presentation
    ↓
Application
    ↓
Domain rules
    ↓
Repositories / Integrations
    ↓
PostgreSQL / Linear / Email
```

---

## 8.1. Presentation

Responsável por:

- páginas;
- components;
- input do usuário;
- form state;
- serialização para UI.

Não deve decidir autorização.

---

## 8.2. Application

Responsável por casos de uso.

Exemplos:

```text
CreateWorkspace
InviteMember
CreateProject
ImportLinearItems
StartTimer
PauseTimer
ResumeTimer
SwitchTimer
FinishTimer
CreateManualTimeEntry
ExportTimeEntries
```

Essa camada é a principal fronteira reutilizável.

---

## 8.3. Domain rules

Contém regras que não dependem de framework.

Exemplos:

```text
uma pessoa não pode possuir duas sessões ativas
Member não pode criar projeto
Admin não pode corrigir horas de outro Member
Owner pode corrigir horas
Done sai de trabalho ativo
estimativa importada do Linear não pode ser editada localmente
```

---

## 8.4. Infrastructure

Responsável por:

- Drizzle;
- Linear API;
- Resend;
- Sentry;
- PostHog;
- encryption;
- clock;
- external services.

---

# 9. Server Components, Server Actions e Route Handlers

## 9.1. Server Components

Usar para leitura/renderização server-side quando fizer sentido.

Server Components podem chamar diretamente a camada de aplicação.

Não fazer HTTP da aplicação para ela mesma.

---

## 9.2. Server Actions

Permitidas para:

- forms do web app;
- mutations simples;
- ações fortemente ligadas à interface.

Devem ser wrappers finos.

Exemplo:

```text
Server Action
→ validate input
→ get session
→ call use case
→ return result
```

Não colocar toda regra de negócio dentro da Server Action.

---

## 9.3. Route Handlers

Usar para:

- OAuth callbacks;
- webhooks;
- CSV;
- endpoints consumidos por browser quando necessário;
- futuros endpoints de mobile;
- integrações externas.

Rotas internas relevantes devem usar namespace:

```text
/api/v1/
```

quando fizer sentido expor um contrato HTTP estável.

Webhooks podem utilizar:

```text
/api/webhooks/linear
```

---

# 10. Banco de dados — princípios

## 10.1. IDs

Usar:

```text
UUID
```

Preferencialmente gerados pelo PostgreSQL.

Não usar IDs externos como primary key.

---

## 10.2. Timestamps

Utilizar PostgreSQL:

```text
timestamptz
```

Todos os instantes são persistidos em UTC.

Nunca armazenar horário local sem timezone como fonte de verdade de Time Entry.

---

## 10.3. Nomenclatura

Banco:

```text
snake_case
```

TypeScript:

```text
camelCase
```

---

## 10.4. Soft delete / archive

Entidades históricas importantes não devem sofrer hard delete no fluxo normal.

Usar conforme contexto:

```text
archived_at
deleted_at
```

Hard delete fica reservado para:

- manutenção;
- exigência de privacidade;
- purge administrativo controlado.

---

# 11. Modelo de dados macro

Entidades principais:

```text
users

sessions
accounts
verifications
(Better Auth)

workspaces
workspace_members
workspace_invitations

projects
project_members (reservado; não necessário para acesso no MVP)

work_items

time_entries
time_segments

activity_types

integrations
linear_connections
linear_items

audit_logs

integration_events
```

`project_members` não precisa ser implementado no MVP se não houver uso.

Todos os Members do Workspace possuem acesso a todos os Projects no MVP.

---

# 12. User

Responsabilidade:

- identidade Rekko;
- perfil;
- timezone;
- preferências.

Campos de domínio adicionais esperados:

```text
id
name
email
email_verified
timezone
week_starts_on
created_at
updated_at
```

Tabelas de autenticação podem ser gerenciadas pelo Better Auth.

---

# 13. Workspace

Campos principais:

```text
id
name
slug
timezone
created_by_user_id
created_at
updated_at
archived_at
```

Um User pode:

- criar múltiplos Workspaces;
- participar de múltiplos Workspaces.

---

# 14. WorkspaceMember

Campos:

```text
id
workspace_id
user_id
role
job_title
created_at
updated_at
```

Roles:

```text
OWNER
ADMIN
MEMBER
```

Constraint:

```text
unique(workspace_id, user_id)
```

Um Workspace precisa sempre possuir ao menos um Owner.

Operações que removam/rebaixem o último Owner devem falhar.

---

# 15. Invitation

Campos:

```text
id
workspace_id
email
role
job_title
token_hash
invited_by_user_id
expires_at
accepted_at
cancelled_at
created_at
```

Regras:

```text
expiração padrão = 7 dias
```

Armazenar somente hash do token do convite quando tecnicamente aplicável.

Ao aceitar:

1. validar token;
2. validar expiração;
3. criar conta caso necessário;
4. criar `workspace_member`;
5. marcar convite como aceito.

---

# 16. Project

Campos principais:

```text
id
workspace_id
name
description
source
status
estimated_minutes
created_by_user_id
created_at
updated_at
archived_at
```

`source`:

```text
MANUAL
LINEAR
```

Todos os membros do Workspace podem:

- visualizar;
- registrar tempo.

Apenas:

```text
Owner
Admin
```

podem criar ou administrar Projects.

---

# 17. WorkItem

Campos principais:

```text
id
workspace_id
project_id

source
external_id
external_identifier
external_url

parent_work_item_id

title
description

status
is_active

estimated_minutes
estimate_source

assignee_external_id

source_created_at
source_updated_at

last_synced_at
archived_at

created_at
updated_at
```

`source`:

```text
MANUAL
LINEAR
```

`estimate_source` inicialmente:

```text
MANUAL
LINEAR_DESCRIPTION
```

---

# 18. TimeEntry

Uma Time Entry representa a atividade lógica.

Campos:

```text
id
workspace_id
user_id
project_id
work_item_id
activity_type_id

source
status

description

started_at
finished_at

duration_seconds

created_at
updated_at
archived_at
```

`source`:

```text
TIMER
MANUAL
```

`status`:

```text
RUNNING
PAUSED
COMPLETED
ARCHIVED
```

---

# 19. TimeSegment

Para representar corretamente pause/resume, cada Time Entry possui segmentos reais de trabalho.

Campos:

```text
id
time_entry_id
user_id
workspace_id

started_at
ended_at

created_at
```

Exemplo:

```text
TimeEntry AC-843

Segment 1:
08:00 → 10:00

pause

Segment 2:
10:15 → 12:00
```

Duração:

```text
2h + 1h45 = 3h45
```

Isso é preferível a calcular:

```text
finished_at - started_at
```

porque pausas não contam como trabalho.

---

# 20. Regra de um timer ativo

O banco deve colaborar para evitar race conditions.

Um usuário não pode possuir mais de uma Time Entry em:

```text
RUNNING
PAUSED
```

ao mesmo tempo.

Implementar constraint/index parcial no PostgreSQL.

Conceitualmente:

```sql
UNIQUE user_id
WHERE status IN ('RUNNING', 'PAUSED')
```

A validação também deve existir na camada de aplicação.

O banco é a última barreira contra requests simultâneos.

---

# 21. Start Timer

Operação deve ocorrer em transação.

Fluxo:

```text
authenticate
↓
resolve Workspace
↓
verify membership
↓
verify Project / Work Item
↓
verify no active TimeEntry
↓
create TimeEntry RUNNING
↓
create open TimeSegment
↓
commit
```

O frontend não é responsável por calcular a hora oficial de início.

Usar clock do servidor/banco.

---

# 22. Pause Timer

Transação:

```text
get active TimeEntry
↓
must be RUNNING
↓
close current TimeSegment
↓
status = PAUSED
↓
recalculate duration
```

---

# 23. Resume Timer

Transação:

```text
get active TimeEntry
↓
must be PAUSED
↓
create new open TimeSegment
↓
status = RUNNING
```

---

# 24. Finish Timer

Transação:

```text
get active TimeEntry
↓
if RUNNING:
    close open segment
↓
if PAUSED:
    no segment to close
↓
calculate duration
↓
finished_at = now
↓
status = COMPLETED
```

---

# 25. Switch Timer

`Switch` deve ser atômico.

Em uma única transação:

```text
finish current TimeEntry
↓
create new TimeEntry
↓
create new TimeSegment
```

Se a criação da nova atividade falhar, a operação inteira deve rollback sempre que possível.

Objetivo:

não criar gaps acidentais por falha parcial.

---

# 26. Timer e fechamento do browser

O timer não roda de verdade no navegador.

O navegador apenas renderiza:

```text
now - timestamps persistidos
```

Portanto:

- fechar aba não encerra timer;
- fechar browser não encerra timer;
- reiniciar computador não encerra timer;
- trocar dispositivo não encerra timer.

A fonte da verdade está no servidor.

---

# 27. Timer esquecido

Nunca finalizar automaticamente no MVP.

Caso uma sessão esteja aberta por período excessivo:

```text
alertar
não modificar automaticamente
```

Um limiar poderá ser configurado posteriormente.

No MVP, uma regra visual default pode alertar sessões excepcionalmente longas sem possuir automação de encerramento.

---

# 28. Manual Time Entry

Campos recebidos:

```text
workspace
project
work item opcional
activity type opcional
local date/time
timezone
description opcional
```

Servidor:

1. converte para UTC;
2. valida acesso;
3. verifica duração;
4. verifica sobreposição;
5. cria TimeEntry COMPLETED;
6. cria TimeSegment único.

---

# 29. Sobreposição

Sobreposição deve ser verificada com base nos períodos realmente trabalhados (`time_segments`).

Antes de salvar Time Entry manual ou corrigir uma existente:

```text
novo intervalo
vs
time_segments existentes do mesmo usuário
```

Se houver overlap:

```text
reject + conflict details
```

O MVP não corrige automaticamente.

---

# 30. Edição de Time Entry

## Member

Pode:

```text
editar os próprios registros
```

Não pode:

```text
deletar
editar registro de outra pessoa
```

---

## Admin

Pode:

```text
visualizar todos
exportar todos
```

Não pode editar registro de outro membro no MVP.

---

## Owner

Pode:

```text
visualizar todos
corrigir registros de qualquer membro
arquivar registros
```

Hard delete não faz parte da UI.

---

# 31. Audit Log

Auditoria básica é obrigatória desde o MVP.

Não precisa existir UI de auditoria inicialmente.

Campos:

```text
id
workspace_id
actor_user_id

entity_type
entity_id
action

before_json
after_json

created_at
```

Eventos que devem ser auditados:

```text
role_changed
member_removed
project_archived
time_entry_updated
time_entry_archived
linear_connection_created
linear_connection_removed
```

Não registrar:

- password;
- session token;
- OAuth access token;
- OAuth refresh token;
- secrets.

---

# 32. Timezones

Cada User possui:

```text
timezone
```

Cada Workspace possui:

```text
timezone
```

Formato:

```text
IANA timezone
```

Exemplos:

```text
America/Sao_Paulo
Europe/London
```

Todos os timestamps são UTC no banco.

---

# 33. Timezone de relatórios

Relatórios administrativos e exportações do Workspace usam:

> **Workspace timezone**

A experiência pessoal Today/Timeline utiliza:

> **User timezone**

---

# 34. Início da semana

MVP:

```text
Monday
```

Arquitetura pode manter o campo de preferência, mas a UI inicial não precisa expor configuração.

---

# 35. Autenticação

Better Auth é responsável por:

- email/password;
- Google OAuth;
- sessão;
- password reset;
- email verification tokens;
- session management.

---

# 36. Email verification com grace period

Requisito:

> o usuário pode entrar antes de verificar o email.

Política MVP:

```text
EMAIL_VERIFICATION_GRACE_HOURS = 72
```

Após cadastro com email/password:

1. usuário recebe email de confirmação;
2. login é permitido;
3. banner persistente informa prazo;
4. usuário pode reenviar confirmação.

Durante as primeiras 72 horas:

```text
acesso normal
```

Depois das 72 horas, caso continue não verificado:

```text
login continua permitido
```

mas o acesso ao core do produto fica bloqueado até confirmar o email.

Rotas permitidas nesse estado:

```text
verify email
resend verification
account
logout
support/legal pages
```

Google OAuth com email confirmado pelo provider não exige nova confirmação.

A regra deve ser implementada pela camada de aplicação/guard e não apenas visualmente.

---

# 37. Password reset

Fluxo padrão seguro do Better Auth.

Requisitos:

- token expira;
- token single-use;
- não revelar se email existe;
- revogar sessões anteriores após mudança de senha quando suportado/configurado.

---

# 38. Sessions

Sessões persistidas no banco.

Requisitos:

```text
secure cookies em produção
HttpOnly
SameSite apropriado
HTTPS only
```

O usuário deve possuir a ação:

```text
Sign out all devices
```

Essa ação revoga todas as sessões do usuário.

---

# 39. 2FA

Fora do MVP.

A arquitetura não deve impedir inclusão futura.

---

# 40. Autorização

Nunca confiar em role enviada pelo frontend.

Toda operação deve resolver:

```text
session.user
↓
workspace_members
↓
role
```

Permissões principais:

| Ação | Owner | Admin | Member |
|---|---:|---:|---:|
| Ver Workspace | ✅ | ✅ | ✅ |
| Convidar membro | ✅ | ✅ | ❌ |
| Alterar cargo | ✅ | ✅ | ❌ |
| Alterar role | ✅ | ✅* | ❌ |
| Criar Project | ✅ | ✅ | ❌ |
| Conectar Linear | ✅ | ✅ | ❌ |
| Importar cards em projeto existente | ✅ | ✅ | ✅ |
| Registrar tempo | ✅ | ✅ | ✅ |
| Ver próprias horas | ✅ | ✅ | ✅ |
| Ver horas de todos | ✅ | ✅ | ❌ |
| Exportar todos | ✅ | ✅ | ❌ |
| Exportar próprias horas | ✅ | ✅ | ✅ |
| Corrigir horas alheias | ✅ | ❌ | ❌ |
| Excluir Workspace | ✅ | ❌ | ❌ |

`*` Admin não pode promover alguém a Owner, remover o último Owner ou modificar poderes de Owner de forma que viole as regras de ownership.

---

# 41. Multi-tenancy

Todas as entidades relacionadas a Workspace devem carregar:

```text
workspace_id
```

quando possível.

Exemplos:

```text
projects
work_items
time_entries
time_segments
integrations
linear_items
audit_logs
invitations
```

Mesmo quando `workspace_id` poderia ser derivado por joins, duplicá-lo em entidades críticas pode ser aceitável para:

- autorização explícita;
- índices;
- auditoria;
- proteção contra queries incorretas.

A consistência deve ser garantida.

---

# 42. Estratégia de acesso ao PostgreSQL

Regra:

> O browser não acessa diretamente tabelas de domínio do Supabase.

A aplicação utiliza:

```text
Next.js server
→ Drizzle
→ PostgreSQL
```

Isso mantém uma única camada de autorização server-side.

---

# 43. Supabase Data API

No MVP, a aplicação de domínio não depende da Data API do Supabase.

Recomendação:

- desabilitar exposição de tabelas desnecessárias;
- revogar grants de `anon` e `authenticated` onde não houver uso;
- habilitar RLS nas tabelas expostas;
- preferencialmente não expor tabelas de domínio ao browser.

RLS é defesa em profundidade, não substituto da autorização da aplicação.

---

# 44. Row Level Security

Ativar RLS nas tabelas relevantes dentro de schemas expostos pelo Supabase.

Como o Rekko usa Better Auth em vez de Supabase Auth, as policies não devem assumir automaticamente `auth.uid()` como identidade do Rekko.

No MVP:

```text
browser direct data access = forbidden
```

e o isolamento é aplicado:

```text
application authorization
+
database grants
+
RLS deny-by-default para caminhos expostos
```

Se futuramente o Rekko decidir utilizar acesso client-side via Supabase Data API, será criada uma estratégia explícita de JWT/claims antes de liberar qualquer tabela.

---

# 45. Criptografia

O Rekko exige criptografia em duas camadas.

## Layer 1 — database at rest

Todo dado armazenado no PostgreSQL gerenciado pelo Supabase se beneficia da criptografia at-rest da infraestrutura do provider.

Isso protege o armazenamento físico.

---

## Layer 2 — application-level encryption

Dados altamente sensíveis devem ser criptografados antes de persistir.

Obrigatório para:

```text
Linear OAuth access token
Linear OAuth refresh token
outros tokens OAuth futuros
segredos persistidos pela aplicação
```

Algoritmo:

```text
AES-256-GCM
```

Para cada valor:

```text
ciphertext
iv/nonce
auth tag
key version
```

Usar nonce aleatório por valor.

---

# 46. Encryption key management

A chave não fica no banco.

Produção:

```text
REKKO_ENCRYPTION_KEY_V1
```

armazenada no secret manager/environment do host.

Nunca:

- commit;
- log;
- retorno de API;
- analytics;
- Sentry.

Preparar formato para rotação:

```text
key_version = 1
```

Futuro:

```text
V1
V2
...
```

---

# 47. Não criptografar indiscriminadamente no application layer

Não aplicar AES manual em toda coluna.

Motivo:

- impede indexes úteis;
- prejudica buscas;
- dificulta constraints;
- aumenta complexidade;
- não adiciona benefício proporcional para dados não sensíveis.

Todo banco já possui criptografia at-rest.

Application-level encryption é aplicada nos campos de maior sensibilidade.

---

# 48. Linear — ownership da integração

A conexão Linear pertence ao:

> **Workspace Rekko**

Owner ou Admin realiza OAuth com Linear.

O token resultante é armazenado associado ao Workspace.

Membros não precisam conectar individualmente suas contas Linear para consumir a integração do Workspace.

---

# 49. Múltiplos Workspaces Linear

MVP:

```text
1 Linear workspace conectado por Rekko Workspace
```

A arquitetura deve permitir múltiplos no futuro.

Portanto, não criar constraints que tornem impossível:

```text
Workspace Rekko
├── Linear Workspace A
└── Linear Workspace B
```

Mas a UI do MVP pode limitar a um.

---

# 50. Linear OAuth

Usar:

```text
OAuth 2.0
```

Não usar Personal API Key para fluxo de produto multiusuário.

Tokens devem ser armazenados criptografados.

Persistir metadados:

```text
linear_organization_id
organization_name
access_token encrypted
refresh_token encrypted
token_expiry
scopes
connected_by_user_id
created_at
updated_at
revoked_at
```

---

# 51. Linear scopes

Solicitar somente scopes necessários.

Princípio:

> least privilege

O MVP é read-only do ponto de vista funcional do Linear.

Não solicitar permissões de escrita sem necessidade real.

Webhooks/OAuth podem exigir scopes administrativos específicos conforme configuração do app Linear; qualquer ampliação deve ser documentada.

---

# 52. Linear API client

Criar um adapter isolado:

```text
LinearClient
```

Responsável por:

- GraphQL;
- OAuth token refresh;
- pagination;
- retries controlados;
- error normalization;
- rate limit handling.

A aplicação não deve espalhar queries GraphQL diretamente por componentes/handlers.

---

# 53. Linear selective import

Fluxo:

```text
Browse external items
↓
filter/search
↓
select parent/sub-items
↓
confirm selection
↓
persist selected items locally
```

Não importar tudo.

---

# 54. Browsing do Linear

Busca de cards deve ocorrer sob demanda.

Suportar inicialmente filtros suficientes para seleção:

```text
Team
Project
Status
Assignee
Search
```

Paginação obrigatória.

Nunca:

```text
fetch all issues and filter in JavaScript
```

---

# 55. Itens Done

Por padrão:

```text
Done / completed
→ hidden from import browser
```

Pode ser necessário manter parents/contexto já importado.

Cards já importados que ficam Done:

```text
is_active = false
```

ou status equivalente.

Não apagar.

---

# 56. Parent/sub-issue

Persistir:

```text
parent_work_item_id
```

Quando somente uma sub-issue for selecionada:

- importar o Work Item escolhido;
- manter metadata mínima do parent se necessária para exibição;
- parent contextual não precisa ser apontável caso não selecionado.

Separar conceitualmente:

```text
synced_for_context
sync_selected
trackable
```

não necessariamente com esses nomes exatos.

---

# 57. Novas sub-issues

Não importar automaticamente novas sub-issues.

Webhooks podem registrar que houve mudança relevante.

A UI oferece:

```text
Review Linear changes
```

e o usuário escolhe novos itens.

---

# 58. Quem pode importar Linear

Owner/Admin:

- conectam integração;
- criam Projects;
- administram sync.

Member:

- pode navegar/selecionar cards da integração existente;
- pode adicionar cards a um Project Linear existente;
- não pode criar Project;
- não pode alterar credenciais da integração.

---

# 59. Estimativa Linear

Fonte inicial exclusiva:

> parser da descrição.

O Rekko não utiliza estimativa nativa do Linear para horas no MVP.

Padrão principal:

```text
Estimativa

30m
```

Suportar:

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

Normalizar para:

```text
estimated_minutes: integer
```

---

# 60. Parser de estimativa

Implementar como função pura e testável no `packages/shared`.

Exemplo de assinatura:

```ts
parseEstimateFromDescription(description: string): EstimateParseResult
```

Retorno conceitual:

```text
found
minutes
rawValue
confidence/reason opcional
```

Não utilizar IA no parser MVP.

---

# 61. Estimate source of truth

Para Work Item Linear:

> Linear description é source of truth.

Usuário não pode alterar localmente.

Se tentar editar:

```text
A estimativa deste item vem do Linear.
Altere a descrição no Linear e depois sincronize o item no Rekko.
```

A UI deve oferecer:

```text
Open in Linear
Sync now
```

---

# 62. Linear sync strategy

Estratégia escolhida:

> **Hybrid sync**

Combina:

```text
Linear Webhooks
+
manual Sync
```

Objetivo de atualização automática:

```text
alguns minutos ou menos
```

Na maioria dos casos webhook será praticamente imediato.

---

# 63. Linear webhooks

Assinar inicialmente eventos relevantes de:

```text
Issue
```

e demais recursos somente se necessários.

Webhook endpoint:

```text
POST /api/webhooks/linear
```

Obrigatório:

- ler raw body;
- validar HMAC;
- validar timestamp;
- prevenir replay;
- usar delivery ID para idempotência;
- responder rapidamente.

---

# 64. Webhook processing

Sem queue dedicada no MVP.

Fluxo preferido:

```text
receive
↓
verify
↓
deduplicate
↓
check if item matters to Rekko
↓
update local projection
↓
persist integration event
↓
200
```

Não fazer chamadas externas desnecessárias durante processamento.

Se o payload possuir informação suficiente, atualizar diretamente.

---

# 65. Webhook idempotency

Persistir identificador da entrega.

Exemplo:

```text
provider
delivery_id
event_type
received_at
processed_at
status
```

Constraint:

```text
unique(provider, delivery_id)
```

Eventos repetidos retornam sucesso sem reprocessar.

---

# 66. Sync manual

Botão:

```text
Sync now
```

deve consultar Linear e reconciliar dados selecionados.

Atualizar quando aplicável:

```text
title
description
status
assignee
parent
estimate parsed
external updated_at
```

Manual sync funciona também como mecanismo de recuperação caso webhooks falhem.

---

# 67. Issue moved to another parent

Rekko acompanha a nova hierarquia.

Atualizar:

```text
parent_work_item_id
```

sem alterar Time Entries históricas.

---

# 68. Issue deleted/archived externally

Rekko:

```text
marca item como archived/inactive
preserva snapshot
preserva horas
preserva reports
```

Link externo pode ficar sinalizado como indisponível.

---

# 69. Linear errors

Tipos a distinguir:

```text
AUTH_REVOKED
RATE_LIMITED
NOT_FOUND
PERMISSION_DENIED
NETWORK_ERROR
GRAPHQL_ERROR
INVALID_PAYLOAD
```

Não retornar mensagem técnica crua para usuário.

---

# 70. Revogação do Linear OAuth

Quando integração for revogada:

```text
mark connection revoked
disable automatic sync
preserve imported data
preserve historical Time Entries
```

UI informa:

```text
Reconnection required
```

---

# 71. Activity Types

Começar com tipos padrão.

Podem ser seeds de sistema ou constantes persistidas.

Exemplos:

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

No MVP, `activity_type` pode ser nullable quando exigir seleção prejudicar fluxo rápido.

---

# 72. CSV export

Obrigatório no MVP.

Geração:

> síncrona, no request.

Não criar job/background export inicialmente.

---

# 73. CSV permissions

Owner/Admin:

```text
export all members in Workspace
```

Member:

```text
export own Time Entries only
```

Servidor deve ignorar qualquer tentativa de Member enviar outro `user_id`.

---

# 74. CSV filters

Mínimos:

```text
date range
member
project
work item
```

Filtros devem ser validados server-side.

---

# 75. CSV implementation

Gerar no servidor.

Preferências:

```text
UTF-8
BOM para compatibilidade com Excel
text/csv
```

Campos conforme `CONTEXT.md`.

Incluir duração:

```text
HH:mm
decimal hours
```

Decimal deve ser calculado com precisão a partir de segundos.

---

# 76. CSV data access

Evitar carregar datasets enormes na memória.

Mesmo sendo síncrono no MVP, implementar query paginada/streamable quando simples.

Para volume inicial de dezenas de usuários:

```text
single request
```

é aceitável.

Criar limite defensivo de período/rows se necessário no futuro.

---

# 77. Insights

Insights são derivados de PostgreSQL.

Não usar serviço analítico separado no MVP.

Queries:

```text
SUM duration
GROUP BY project
GROUP BY work item
GROUP BY user
date range
estimate vs actual
```

Criar indexes apropriados antes de considerar cache externo.

---

# 78. Cache

Não usar Redis no MVP.

Priorizar:

```text
PostgreSQL
Next.js cache quando correto
HTTP/browser cache para dados públicos/estáticos
```

Dados de timer devem ser tratados com cuidado para não servir estado stale.

---

# 79. Redis / queue trigger

Redis/queue só será introduzido quando existir necessidade concreta como:

- alto volume de webhooks;
- background exports;
- integração pesada;
- emails em massa;
- retries duráveis;
- processamento demorado;
- jobs com SLA.

Antes disso:

> não adicionar.

---

# 80. Emails

`EmailService` com interface interna.

Templates:

```text
VerifyEmail
ResetPassword
WorkspaceInvitation
```

Templates podem usar React Email se isso simplificar manutenção.

---

# 81. Resend

Free tier pode ser usado inicialmente.

Configuração por ambiente.

Nunca enviar emails reais a usuários externos em desenvolvimento local.

Local:

```text
console email adapter
ou mailbox local
```

---

# 82. Evidências e uploads

Fora do MVP.

Não configurar Supabase Storage apenas por antecipação.

Sem:

- upload;
- evidence files;
- attachment pipeline.

---

# 83. Notificações in-app

Fora do MVP.

Não criar tabela genérica `notifications` agora.

---

# 84. Segurança — baseline obrigatório

Implementar desde o início:

- HTTPS em produção;
- secure cookies;
- HttpOnly;
- SameSite;
- CSRF protections quando aplicável;
- authorization server-side;
- input validation;
- rate limiting;
- security headers;
- tenant isolation;
- OAuth state validation;
- PKCE quando aplicável;
- webhook signature validation;
- encryption at rest;
- field encryption de tokens;
- secret management;
- session revocation;
- dependency vulnerability monitoring.

---

# 85. Input validation

Usar:

```text
Zod
```

ou equivalente TypeScript-first.

Toda entrada de boundary deve ser validada:

```text
forms
route params
query params
JSON body
webhook payload
env vars
```

Não confiar em tipos TypeScript para runtime validation.

---

# 86. Environment validation

Validar env na inicialização.

Variáveis ausentes devem falhar claramente.

Separar:

```text
public env
server secret env
```

Nunca prefixar secret como variável client-side.

---

# 87. Rate limiting

Não adicionar Redis só para rate limit.

Estratégia:

1. usar rate limiting nativo de auth/provider quando disponível;
2. proteger endpoints sensíveis;
3. usar solução simples Postgres-backed quando necessário.

Endpoints prioritários:

```text
login
signup
resend verification
password reset
invite
Linear OAuth start
Linear sync
CSV export
```

---

# 88. Security headers

Configurar no host/Next:

```text
Content-Security-Policy
Strict-Transport-Security
X-Content-Type-Options
Referrer-Policy
Permissions-Policy
frame-ancestors
```

Evitar políticas que quebrem OAuth/analytics sem necessidade; manter CSP explícita.

---

# 89. Secrets

Secrets ficam apenas no host.

Exemplos:

```text
DATABASE_URL
BETTER_AUTH_SECRET
GOOGLE_CLIENT_ID
GOOGLE_CLIENT_SECRET
LINEAR_CLIENT_ID
LINEAR_CLIENT_SECRET
LINEAR_WEBHOOK_SECRET
REKKO_ENCRYPTION_KEY_V1
RESEND_API_KEY
SENTRY_DSN
POSTHOG_KEY
```

Nunca versionar `.env`.

Versionar:

```text
.env.example
```

sem valores secretos.

---

# 90. Infraestrutura — decisão oficial

## Web application

```text
Vercel
```

Motivos:

- Next.js é a plataforma nativa;
- deploy a partir do GitHub;
- Preview Deployments para PRs;
- domínio e TLS gerenciados;
- baixo esforço operacional no MVP;
- alinhado ao monorepo `apps/web`.

Plano de produção:

```text
Vercel Pro (ou superior)
```

Hobby não é plano de produção do Rekko.

Implicações serverless a respeitar:

- conectar ao Postgres via **pooler** do Supabase (não abrir um processo Postgres “longo” por instância);
- manter webhook Linear, CSV e sync dentro do timeout da função do plano;
- não introduzir Redis/fila só para “compensar serverless”;
- secrets por Environment da Vercel (`Development` / `Preview` / `Production`).

---

# 91. Por que não Vercel Hobby como produção

O hosting oficial é Vercel.

Hobby possui restrição de uso não comercial e limites inadequados para um SaaS (timeout, equipe, ambientes).

Produção e staging do Rekko devem usar:

```text
plano compatível com uso comercial (Pro ou superior)
```

Não usar Hobby como default de produção, mesmo que o deploy “funcione”.

---

# 92. Por que não Cloudflare Workers inicialmente

Cloudflare Workers possui excelente free tier.

Entretanto, para o MVP Rekko:

- Next.js exige camada de adaptação;
- ambiente não é Node tradicional;
- free tier possui CPU limitada por request;
- adiciona risco operacional sem benefício necessário agora.

Pode ser reavaliado futuramente.

---

# 93. Supabase — ambientes

Supabase oferece dois projetos gratuitos ativos.

Estratégia inicial:

```text
rekko-staging
rekko-production
```

Local usa Supabase CLI/Docker local.

---

# 94. Supabase Free caveat

O free tier é aceitável para:

- desenvolvimento;
- staging;
- alpha;
- beta pequena.

Antes de tratar Rekko como serviço público/critical ou armazenar dados importantes de clientes, revisar upgrade.

Motivos:

- limite de banco;
- ausência de backup automático no free;
- projetos free podem pausar por inatividade;
- menor retenção de logs/SLA.

O custo baixo é prioridade, mas perda de dados não deve ser aceita em produção madura.

---

# 95. Deploy environments

Existem três ambientes lógicos:

```text
local
staging
production
```

---

## Local

```text
Next.js local
PostgreSQL/Supabase local
seed local
fake/mock email
mock Linear quando apropriado
```

---

## Staging

- database separado (`rekko-staging`);
- secrets no Environment **Preview** da Vercel (ou projeto/staging dedicado);
- OAuth callback separado e URL estável (domínio `staging.…`, não só URL de preview efêmera para Linear/Google);
- nunca reutilizar DB de production.

Preview Deployments de PR podem apontar ao banco de staging.

Para reduzir custo:

> um domínio de staging estável é suficiente; não é obrigatório um segundo projeto Vercel.

---

## Production

- database próprio (`rekko-production`);
- projeto Vercel de produção (Environment **Production**);
- secrets próprios;
- Linear OAuth callback de produção;
- domínio de produção.

---

# 96. Seeds

Seeds existem somente para:

```text
local development
automated tests
```

Nunca executar seed de dados fictícios em production.

CI também pode utilizar fixtures isoladas.

---

# 97. Seed local

Criar cenário útil:

```text
Owner
Admin
Member

Workspace Rekko Demo

2 manual Projects
1 Linear-like Project mocked

10 Work Items

Time Entries:
today
yesterday
week

running timer opcional
```

O objetivo é facilitar desenvolvimento visual e testes.

---

# 98. CI/CD

Provider:

```text
GitHub Actions
```

Pipeline obrigatório em Pull Request:

```text
install
lint
format check
typecheck
unit/integration tests
build
```

E2E críticos podem ser:

```text
PR main
pre-deploy
```

dependendo do tempo do pipeline.

---

# 99. Production deploy

Deploy apenas após CI verde.

Branch default:

```text
main
```

Pull Requests devem passar checks obrigatórios.

Evitar deploy manual não rastreável como fluxo normal.

---

# 100. Conventional Commits

Obrigatório.

Exemplos:

```text
feat(workspace): add member invitations
fix(timer): prevent concurrent active sessions
refactor(linear): isolate graphql client
test(export): cover member permissions
docs(architecture): update sync strategy
```

---

# 101. Database migrations

Migration-first.

Nunca alterar schema manualmente em production sem migration correspondente.

Fluxo:

```text
edit Drizzle schema
↓
generate/review migration
↓
test local
↓
commit migration
↓
apply staging
↓
apply production
```

---

# 102. Migration safety

Evitar migration destrutiva direta.

Para mudanças de risco:

```text
expand
migrate data
switch
contract
```

mesmo dentro de modular monolith.

---

# 103. Test strategy

Estratégia:

> Integration + E2E para fluxos críticos, unit para regras complexas.

---

# 104. Unit tests

Obrigatórios para regras puras como:

```text
estimate parser
duration calculation
timezone/date helpers
permission matrix
CSV decimal conversion
encryption helpers
```

---

# 105. Integration tests

Priorizar:

```text
workspace authorization
tenant isolation
timer transactions
pause/resume
switch atomicity
manual entry overlap
role restrictions
Linear item persistence
sync reconciliation
audit log
CSV permissions
```

Usar banco PostgreSQL real de teste quando viável.

Não testar SQL crítico apenas com mocks.

---

# 106. E2E obrigatório

Fluxos críticos:

```text
signup/login
workspace creation
workspace invitation
project creation
timer start
pause/resume
timer switch
timer finish
manual time entry
Linear import
CSV export
```

---

# 107. Linear tests

Não usar API real do Linear na suíte comum.

Mockar:

- GraphQL;
- OAuth;
- webhook payloads.

Adicionar fixtures para:

```text
parent issue
sub-issue
Done
description estimate
moved parent
archived item
OAuth revoked
duplicate webhook
```

---

# 108. Security tests

Testes obrigatórios para tentativas de:

```text
Workspace A → read Workspace B
Member → create Project
Member → export another member
Admin → edit Member TimeEntry
Member → change own role
reuse invitation
expired invitation
duplicate timer race
invalid Linear webhook signature
replayed Linear webhook
```

---

# 109. Observabilidade

## Sentry

Capturar:

- uncaught errors;
- route errors;
- integration failures;
- server exceptions.

Configurar scrubbing.

---

## Logs

Logs estruturados com:

```text
request_id
user_id quando seguro
workspace_id
module
event
duration_ms
```

Nunca incluir:

```text
password
cookie
auth header
OAuth token
encryption key
full sensitive body
```

---

# 110. Correlation IDs

Gerar/propagar request ID para operações server-side.

Especialmente útil em:

- Linear webhooks;
- OAuth;
- exports;
- timer operations.

---

# 111. Metrics iniciais

Não adicionar Prometheus inicialmente.

Acompanhar por:

- host metrics;
- Sentry;
- logs;
- Supabase dashboard;
- analytics básicos.

Escalar observabilidade conforme uso.

---

# 112. Product analytics privacy

Analytics nunca deve ser requisito para a aplicação funcionar.

Falha do PostHog:

```text
must not break product flow
```

Eventos podem ser enviados de forma best-effort.

---

# 113. API pública

Fora do MVP.

Não emitir API keys para clientes.

Não criar developer portal.

---

# 114. Internal API readiness

Caso seja criado aplicativo mobile posteriormente:

- reutilizar application use cases;
- criar endpoints `/api/v1`;
- autenticação pode continuar com Better Auth;
- não duplicar regras.

Não extrair backend separado antecipadamente.

---

# 115. Performance baseline

Antes de adicionar cache:

1. criar indexes;
2. evitar N+1;
3. paginar;
4. selecionar apenas colunas necessárias;
5. medir;
6. otimizar queries.

---

# 116. Indexes mínimos

Criar indexes apropriados para:

```text
workspace_members(workspace_id, user_id)

projects(workspace_id)

work_items(workspace_id, project_id)
work_items(external_id)
work_items(parent_work_item_id)

time_entries(workspace_id, user_id, started_at)
time_entries(workspace_id, project_id, started_at)
time_entries(workspace_id, work_item_id, started_at)

time_segments(user_id, started_at, ended_at)

workspace_invitations(workspace_id, email)

linear_items(external_id)
integration_events(provider, delivery_id)
```

Revisar com query planner conforme uso real.

---

# 117. Query pagination

Obrigatória em listas potencialmente grandes:

```text
Members
Work Items
Time Entries
Linear issue browser
Audit history quando exposto
```

Preferir cursor pagination onde houver benefício.

Para telas pequenas internas, offset pode ser aceitável inicialmente.

---

# 118. N+1

Evitar N+1 em:

- Work Items + parent;
- Projects + tracked totals;
- Members + hours;
- Linear import tree.

Usar queries agregadas e joins quando apropriado.

---

# 119. Transactions

Transações obrigatórias em operações que precisam atomicidade.

Principais:

```text
create workspace + owner membership
accept invitation
switch timer
pause timer
resume timer
finish timer
Owner correction of time entry
Linear import batch
```

---

# 120. Concurrency

Timer é o principal ponto de concorrência.

Proteção:

```text
transaction
+
unique partial index
+
server-side validation
```

Nunca confiar apenas em botão desabilitado no frontend.

---

# 121. Optimistic UI

Pode ser usado para melhorar experiência.

Entretanto:

```text
server result is authoritative
```

Em conflito, UI deve reconciliar com servidor.

---

# 122. Error handling

Criar erros de domínio tipados.

Exemplos:

```text
UNAUTHORIZED
FORBIDDEN
WORKSPACE_NOT_FOUND
PROJECT_NOT_FOUND
ACTIVE_TIMER_EXISTS
NO_ACTIVE_TIMER
TIME_OVERLAP
INVITATION_EXPIRED
LINEAR_NOT_CONNECTED
LINEAR_AUTH_REVOKED
LINEAR_SYNC_FAILED
```

Não depender de comparação de strings de erro.

---

# 123. HTTP status mapping

Exemplo:

```text
validation → 400
unauthenticated → 401
forbidden → 403
not found → 404
conflict → 409
rate limited → 429
external dependency → 502/503 quando apropriado
```

GraphQL errors do Linear devem ser convertidos em erros internos.

---

# 124. UI error messages

Mensagens devem ser amigáveis.

Detalhes técnicos ficam em log/Sentry.

Nunca exibir:

- SQL;
- stack trace;
- tokens;
- internal IDs sensíveis;
- exception raw.

---

# 125. Light/Dark mode architecture

Light e Dark são obrigatórios no MVP.

Implementação deve utilizar design tokens/CSS variables.

Evitar:

```text
hardcoded colors espalhadas em components
```

Estado de tema:

```text
light
dark
system (se simples)
```

`system` é desejável, mas Light/Dark são obrigatórios.

Detalhamento visual pertence ao `DESIGN.md`.

---

# 126. Internacionalização

MVP:

```text
Portuguese UI
```

Arquitetura preparada para i18n.

Não escrever mensagens de negócio espalhadas em centenas de componentes de forma impossível de extrair.

Entretanto, não é obrigatório instalar framework complexo de i18n no primeiro commit caso ainda não exista segundo idioma.

Preparar estrutura para:

```text
pt-BR
en
```

futuramente.

---

# 127. Locale

Default inicial:

```text
pt-BR
```

Display de duração:

```text
2h 25m
```

Horas decimais ficam principalmente para exportação/cálculos.

---

# 128. Accessibility

Baseline obrigatório:

- keyboard navigation;
- labels;
- focus states;
- semantic HTML;
- contrast;
- aria somente quando necessário;
- dialogs acessíveis.

E2E deve incluir pelo menos navegação crítica via teclado quando possível.

---

# 129. Browser support

Priorizar navegadores modernos:

```text
Chrome
Edge
Safari
Firefox
```

Não suportar browsers legados.

---

# 130. Domain model — source of truth summary

```text
Authentication
→ Better Auth

User identity
→ Rekko PostgreSQL

Workspace membership
→ Rekko PostgreSQL

Projects
→ Rekko PostgreSQL

Manual Work Items
→ Rekko PostgreSQL

Linear Work Item metadata
→ Linear source + Rekko local projection

Linear estimate
→ Linear description parser

Time tracking
→ Rekko PostgreSQL

Timeline
→ Rekko PostgreSQL

Insights
→ Rekko PostgreSQL

CSV
→ Rekko PostgreSQL
```

---

# 131. Data ownership summary

O Rekko possui integralmente:

- Workspace;
- membership;
- Project Rekko;
- timer;
- Time Entry;
- Time Segment;
- audit;
- insights;
- export.

Linear possui a fonte externa de:

- issue title;
- issue description;
- issue status;
- parent relation;
- assignee externo;
- descrição usada para estimativa.

---

# 132. Offline mode

Fora do MVP.

Se internet cair durante timer ativo:

- timer continua conceitualmente porque timestamps estão no servidor;
- UI pode manter relógio visual local;
- mutations exigem conexão.

Não implementar sync offline complexo.

---

# 133. Realtime

Supabase Realtime não é necessário para o MVP.

Pode ser avaliado futuramente para:

- timer cross-device;
- team monitoring;
- collaborative views.

Inicialmente:

```text
normal server fetch
+
client refresh/revalidation
```

é suficiente.

---

# 134. Cross-device timer

Mesmo sem realtime, abrir Rekko em outro dispositivo deve buscar o timer ativo no servidor.

A informação exibida deve refletir:

```text
TimeEntry server state
```

Não localStorage.

---

# 135. LocalStorage

Não usar localStorage como fonte de verdade para:

- auth;
- timer;
- membership;
- project access;
- Time Entries.

Pode ser usado para preferências de UI não críticas.

---

# 136. Data retention

No MVP:

- Time Entries não expiram;
- Work Items históricos não são apagados quando Linear muda;
- audit logs não expiram automaticamente.

Política completa de retenção/LGPD será definida antes de escala pública relevante.

---

# 137. Privacy / LGPD readiness

Mesmo sem implementar programa completo de compliance no MVP:

- coletar somente dados necessários;
- permitir futura exportação/eliminação;
- manter boundaries claras de PII;
- não colocar PII em analytics/logs;
- não armazenar conteúdo externo sem finalidade.

---

# 138. Development setup

Objetivo:

```text
pnpm install
pnpm dev
```

com setup documentado.

Supabase local pode exigir Docker/Supabase CLI.

README deve listar passos exatos.

---

# 139. Commands esperados

Raiz:

```text
pnpm dev
pnpm build
pnpm lint
pnpm format
pnpm format:check
pnpm typecheck
pnpm test
pnpm test:e2e
pnpm db:generate
pnpm db:migrate
pnpm db:seed
```

`db:seed` deve falhar em production.

---

# 140. Production seed guard

Adicionar guarda explícita:

```text
if NODE_ENV === "production":
    refuse seed
```

e/ou exigir variável específica de ambiente local/test.

---

# 141. Linear local development

OAuth real pode ser usado em ambiente de desenvolvimento quando necessário.

Também manter fixtures/mocks para:

- trabalhar sem Linear;
- testes;
- CI.

Não exigir uma conta Linear real para rodar toda suíte.

---

# 142. External service abstractions

Criar interfaces somente nos boundaries úteis:

```text
EmailService
LinearGateway
Analytics
ErrorReporter
EncryptionService
Clock
```

Não criar interfaces para cada repository se não trouxer benefício prático.

---

# 143. Clock abstraction

Recomendado para time tracking.

Use cases recebem/consultam `Clock`.

Isso facilita testar:

```text
Start
Pause
Resume
Switch
Finish
```

sem depender do relógio real.

---

# 144. Encryption abstraction

Centralizar:

```text
encryptSecret()
decryptSecret()
```

Nenhum módulo deve implementar AES diretamente.

---

# 145. CSV decimal calculation

Usar:

```text
seconds / 3600
```

com precisão definida para exportação.

Exemplo:

```text
8700 seconds
→ 2.4167
```

Não usar strings HH:mm para cálculo.

---

# 146. Duration persistence

Fonte primária:

```text
time_segments
```

`time_entries.duration_seconds` pode ser armazenado como valor materializado para performance.

Deve ser recalculado na mesma transação sempre que segmentos mudarem.

Não aceitar duração enviada pelo cliente como verdade.

---

# 147. Estimate persistence

Guardar:

```text
estimated_minutes
```

inteiro.

Não persistir `1h30` como formato principal.

`raw estimate` pode ser mantido para debugging/contexto se útil.

---

# 148. Workspace deletion

Owner possui ação de exclusão.

MVP deve implementar como soft delete/archive do Workspace.

Não executar cascata destrutiva imediata.

Uma futura política de purge poderá apagar definitivamente após prazo definido.

---

# 149. Removing member

Remover Member:

- remove acesso;
- preserva User;
- preserva Time Entries;
- preserva autoria;
- não deleta histórico.

---

# 150. Role changes

Role changes devem:

- validar actor;
- validar target;
- proteger último Owner;
- gerar audit log.

---

# 151. Linear connection removal

Disconnect:

- revoga/desativa conexão;
- apaga tokens ou os torna inutilizáveis;
- preserva Work Items importados;
- preserva Time Entries;
- marca itens como sem sync ativo.

---

# 152. Email/account identity linking

Email/password + Google para mesmo endereço devem seguir comportamento seguro do Better Auth.

Não criar contas duplicadas silenciosamente.

Testar especificamente:

```text
signup email/password
later Google same email
```

e o inverso.

---

# 153. Signup flow

Fluxo:

```text
Create account
↓
send verification
↓
create User
↓
first Workspace onboarding
```

Workspace não precisa ser criado dentro da mesma transação do auth provider.

Onboarding deve ser retomável.

---

# 154. Onboarding state

Não depender apenas de frontend.

Persistir estado mínimo quando necessário.

Exemplo:

```text
user has no workspace
→ show Create Workspace
```

Evitar flag redundante se o estado puder ser derivado de dados reais.

---

# 155. Slugs

Workspace e Project podem possuir slug para URLs legíveis.

IDs internos continuam fonte segura para lookup.

URLs podem seguir:

```text
/w/{workspaceSlug}/...
```

Nunca autorizar somente porque o slug foi encontrado.

Sempre verificar membership.

---

# 156. Route design

Exemplo conceitual:

```text
/
 /login
 /signup
 /verify-email

 /w/:workspaceSlug/today
 /w/:workspaceSlug/timeline
 /w/:workspaceSlug/work
 /w/:workspaceSlug/projects/:projectId
 /w/:workspaceSlug/insights
 /w/:workspaceSlug/members
 /w/:workspaceSlug/integrations
 /w/:workspaceSlug/settings
```

Design final pertence ao `DESIGN.md`.

---

# 157. Active Workspace

Usuário pode participar de múltiplos Workspaces.

Workspace atual deve estar explícito na URL.

Não confiar apenas em:

```text
active_workspace_id in cookie/localStorage
```

para autorização.

Um preference pode existir para redirecionamento, mas a URL + server membership define contexto.

---

# 158. Project access MVP

Todos os Members do Workspace:

```text
can view all active Projects
can track time against all active Projects
```

Não implementar project-level ACL no MVP.

Arquitetura não deve depender de `project_members`.

---

# 159. Project visibility future

No futuro pode existir:

```text
PUBLIC_TO_WORKSPACE
RESTRICTED
```

Não implementar agora.

---

# 160. Admin vs Owner correction

Regra congelada:

```text
Owner:
    corrigir horas alheias

Admin:
    não corrigir horas alheias
```

Admin pode exportar/visualizar.

---

# 161. No approval workflow

MVP não possui:

```text
PENDING
APPROVED
REJECTED
```

para timesheet.

Não criar workflow escondido antecipadamente.

---

# 162. No financial domain

MVP não possui:

- hourly rate;
- payroll;
- cost center;
- billing;
- invoice;
- project cost.

Não criar tabelas para isso agora.

---

# 163. No file storage domain

MVP não possui uploads.

Não criar buckets Supabase Storage apenas por antecipação.

---

# 164. No employee monitoring

Não criar:

- screenshot;
- browser history;
- app usage agent;
- activity capture;
- keylogging.

Isso é explicitamente fora da proposta atual.

---

# 165. Background jobs

Nenhum worker dedicado inicialmente.

Se aparecer uma necessidade de background:

1. documentar caso;
2. provar que request síncrono não atende;
3. escolher solução mínima.

Não introduzir BullMQ/Redis preventivamente.

---

# 166. Retry policy external calls

Linear:

- retry apenas erros transitórios;
- exponential backoff curto;
- respeitar rate limits;
- não retry 4xx permanentes.

Email:

- request pode falhar sem perder integridade principal;
- convite deve existir mesmo se email falhar;
- permitir reenvio.

---

# 167. Invitation email failure

Transação:

```text
create invitation
commit
↓
send email
```

Se email falhar:

- convite continua válido;
- log/Sentry;
- UI informa envio falhou;
- Admin pode reenviar.

Não rollback invitation por falha do provider de email.

---

# 168. Analytics failure

Nunca rollback operação de produto porque analytics falhou.

---

# 169. Audit failure

Audit de operações críticas deve ocorrer na mesma transação quando viável.

Exemplo:

```text
Owner modifies TimeEntry
+
audit log
```

Se audit obrigatório falhar:

```text
rollback
```

---

# 170. Backups

Free Supabase não oferece a mesma garantia de backups do plano pago.

Antes de produção pública relevante:

> upgrade/review backup strategy é gate obrigatório.

Este gate deve entrar no ROADMAP antes de lançamento comercial.

---

# 171. Cost strategy

Prioridades:

```text
1. custo baixo
2. simplicidade
3. performance
4. escalabilidade
5. vendor independence
```

Toda nova dependência paga deve justificar:

```text
necessidade
custo mensal estimado
alternativas
trigger de upgrade
```

---

# 172. Expected initial scale

Projetar para:

> dezenas de usuários.

Não otimizar prematuramente para milhões.

Ao mesmo tempo, evitar decisões obviamente limitantes como:

- JSON blobs para tudo;
- ausência de tenant index;
- timers somente no browser;
- importar todo Linear.

---

# 173. Scale triggers

Reavaliar arquitetura quando ocorrer:

- centenas/milhares de usuários ativos;
- alto volume de webhooks;
- exports muito grandes;
- queries analíticas pesadas;
- necessidade de realtime;
- necessidade mobile significativa;
- integração com múltiplos providers;
- SLA de produção.

---

# 174. What must not change casually

Decisões estruturais congeladas:

```text
TypeScript
Next.js full-stack
modular monolith
monorepo
PostgreSQL/Supabase
Drizzle
Better Auth
Workspace multi-tenant
server-authoritative authorization
UTC persistence
time segments
Linear OAuth workspace-owned
Linear selective import
hybrid webhook + manual sync
no Redis initially
CSV synchronous
Vercel web hosting (Pro or higher)
Vitest + Playwright
Sentry
Pino
```

Mudar qualquer uma exige atualização deste documento.

---

# 175. Architecture Decision Summary

```text
Repository:
Monorepo

Architecture:
Modular monolith

Application:
Next.js full-stack

Language:
TypeScript strict

Runtime:
Node.js LTS

Database:
PostgreSQL on Supabase

ORM:
Drizzle

Auth:
Better Auth

Login:
Email/password + Google

Email verification:
72h grace period, then core blocked until verified

Email:
Resend

Workspace:
Multiple per user

Roles:
Owner / Admin / Member

Projects:
Workspace-wide visibility in MVP

Linear connection:
Workspace-owned

Linear project count:
UI one initially, data model ready for multiple

Linear import:
Selective

Linear source:
Read-only in MVP

Linear estimates:
Description parser only

Linear sync:
Webhook + manual Sync

Timer persistence:
Server/Postgres

Pause model:
TimeEntry + TimeSegments

One active timer:
DB constraint + application validation

Timezone persistence:
UTC

User timezone:
IANA

Workspace timezone:
IANA

Admin reports:
Workspace timezone

Week starts:
Monday

Audit:
Persist now, UI later

CSV:
Synchronous

Uploads:
None

In-app notifications:
None

Redis:
None unless justified

Queue:
None unless justified

Cache:
No external cache initially

2FA:
Post-MVP

Public API:
Post-MVP

Error tracking:
Sentry

Logging:
Pino structured logs

Analytics:
PostHog basic

CI:
GitHub Actions

Commit format:
Conventional Commits

Testing:
Vitest + Playwright

Web hosting:
Vercel (Pro or higher)

Database hosting:
Supabase

Environments:
Local / Staging / Production

Seeds:
Local/test only

i18n:
pt-BR first, architecture ready for future languages

Theme:
Light + Dark mandatory
```

---

# 176. Security Decision Summary

```text
Tenant isolation:
server-side mandatory

Workspace ID:
present on tenant-owned entities

Database:
encrypted at rest by provider

Sensitive OAuth tokens:
AES-256-GCM application encryption

Secrets:
host secret environment only

Passwords:
auth library responsibility, never plaintext

Cookies:
Secure + HttpOnly

Input:
runtime validated

Webhook:
HMAC + timestamp + delivery id

OAuth:
state/PKCE as applicable

Rate limit:
mandatory on sensitive endpoints

RLS:
deny-by-default on exposed Supabase schemas

Browser direct database access:
not used for domain data

Hard delete:
not normal application flow

Audit:
critical mutations recorded
```

---

# 177. Infrastructure Decision Summary

Initial low-cost setup:

```text
GitHub
│
├── GitHub Actions
│
└── Vercel
     └── Next.js Rekko

Next.js Rekko
│
├── Supabase PostgreSQL
├── Linear API
├── Resend
├── Sentry
└── PostHog
```

Staging:

```text
Vercel Preview (stable staging domain)
+
Supabase staging project
```

Production initial:

```text
Vercel Production (Pro or higher)
+
Supabase production project
```

---

# 178. High-level request flow

Normal authenticated operation:

```text
Browser
   │
   ▼
Next.js
   │
   ├── Authenticate
   │
   ├── Authorize Workspace
   │
   ├── Validate input
   │
   ▼
Application Use Case
   │
   ▼
Drizzle
   │
   ▼
Supabase PostgreSQL
```

---

# 179. Linear sync flow

```text
Linear
   │
   │ Webhook
   ▼
/api/webhooks/linear
   │
   ├── Verify signature
   ├── Verify timestamp
   ├── Deduplicate delivery
   ▼
Linear Sync Application Service
   │
   ├── Check Rekko selection
   ├── Parse estimate
   ├── Update local projection
   ▼
PostgreSQL
```

Manual recovery:

```text
User → Sync now
          │
          ▼
     Linear GraphQL
          │
          ▼
     Reconcile
          │
          ▼
     PostgreSQL
```

---

# 180. Timer flow

```text
User clicks Start
       │
       ▼
StartTimer use case
       │
       ├── Membership
       ├── Project access
       ├── Active timer check
       ▼
Transaction
       │
       ├── TimeEntry
       └── TimeSegment
       ▼
PostgreSQL
```

Browser timer:

```text
render only
```

Server timestamps:

```text
source of truth
```

---

# 181. Architecture gates before coding

Antes da primeira feature de negócio, garantir:

- [ ] monorepo criado;
- [ ] Next.js estável;
- [ ] TypeScript strict;
- [ ] pnpm;
- [ ] Drizzle;
- [ ] Supabase local;
- [ ] migration workflow;
- [ ] Better Auth;
- [ ] env validation;
- [ ] lint;
- [ ] formatter;
- [ ] typecheck;
- [ ] Vitest;
- [ ] Playwright;
- [ ] basic CI;
- [ ] Sentry;
- [ ] structured logger;
- [ ] Light/Dark token foundation;
- [ ] seed local protegido.

---

# 182. Gates before Linear implementation

- [ ] Workspace authorization finalizada;
- [ ] encryption service implementado;
- [ ] OAuth callback infrastructure;
- [ ] secrets configurados;
- [ ] integration table;
- [ ] webhook idempotency table;
- [ ] estimate parser testado;
- [ ] Linear client isolated;
- [ ] HMAC webhook verification;
- [ ] manual sync reconciliation.

---

# 183. Gates before production beta

- [ ] tenant isolation integration tests;
- [ ] timer concurrency tests;
- [ ] password reset testado;
- [ ] email verification grace testado;
- [ ] invitation expiry testado;
- [ ] OAuth token encryption testada;
- [ ] Linear webhook replay testado;
- [ ] Sentry PII scrub verificado;
- [ ] CSV authorization testada;
- [ ] staging separado;
- [ ] production secrets separados;
- [ ] migrations testadas;
- [ ] backup strategy revisada;
- [ ] rate limits habilitados;
- [ ] security headers habilitados;
- [ ] dependency audit sem vulnerabilidades críticas conhecidas.

---

# 184. Things AI agents must not invent

Agentes não podem decidir autonomamente implementar:

- microservices;
- Redis;
- queue;
- Supabase Auth;
- Prisma;
- backend NestJS separado;
- Firebase;
- MongoDB;
- Vercel production Hobby;
- auto-import de todo Linear;
- bidirectional Linear writes;
- automatic timer stop;
- timesheet approval;
- files/evidence upload;
- financial domain;
- project-level permissions;
- employee monitoring;
- AI reconstruction.

Se houver necessidade, agente deve apontar conflito e solicitar/registrar alteração arquitetural.

---

# 185. Final architecture statement

> O Rekko MVP será um modular monolith full-stack em Next.js e TypeScript, hospedado na Vercel (plano comercial Pro ou superior), utilizando PostgreSQL gerenciado pelo Supabase e Drizzle como camada de dados. Better Auth será responsável por autenticação com email/senha e Google, enquanto autorização e isolamento multi-tenant serão controlados explicitamente pela aplicação através de Workspaces e roles.

> Time tracking será server-authoritative, persistido como `TimeEntry + TimeSegments`, garantindo pause/resume correto, continuidade após fechamento do navegador e proteção transacional contra timers simultâneos.

> A integração Linear será pertencente ao Workspace, read-only no MVP, seletiva e baseada em OAuth 2.0. Itens escolhidos serão projetados localmente no PostgreSQL. Atualizações serão recebidas por webhooks assinados, com sincronização manual como mecanismo de reconciliação. Estimativas virão exclusivamente do parser da descrição do Linear.

> A segurança será construída desde o início com isolamento de tenant server-side, database grants/RLS defensivos, criptografia at-rest do banco e criptografia AES-256-GCM para tokens OAuth e segredos persistidos.

> A arquitetura otimiza primeiro para baixo custo e simplicidade, suporta dezenas de usuários confortavelmente e mantém boundaries suficientes para evoluir posteriormente para mobile, integrações adicionais, jobs assíncronos, realtime e escala maior sem introduzir essa complexidade antes da necessidade real.
