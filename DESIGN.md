# REKKO — DESIGN.md

> **Status:** Design Baseline — MVP  
> **Date:** 2026-08-26  
> **Purpose:** Fonte de verdade de UX/UI, identidade visual e comportamento de interface do Rekko.  
> **Companion documents:** `CONTEXT.md` · `ARCHITECTURE.md`  
> **Tagline:** **Reconstrua seu tempo. Entenda sua jornada.**

---

# 1. Objetivo deste documento

Este arquivo define como o Rekko deve:

- parecer;
- se comportar;
- comunicar;
- organizar informação;
- conduzir onboarding;
- apresentar o tempo;
- representar reconstrução;
- funcionar em Light e Dark Mode;
- se adaptar entre desktop e mobile;
- utilizar motion para criar conexão com o usuário.

Este documento não define:

- banco;
- infraestrutura;
- autenticação técnica;
- APIs;
- sincronização técnica;
- modelo de dados.

Esses assuntos pertencem ao `ARCHITECTURE.md`.

Hierarquia:

```text
Produto / comportamento
→ CONTEXT.md

Arquitetura
→ ARCHITECTURE.md

UX/UI
→ DESIGN.md

Ordem de execução
→ ROADMAP.md

Regras para agentes
→ AGENTS.md
```

---

# 2. Referência visual utilizada

O Rekko utiliza como referência conceitual o material `DESIGN (1).md`.

Elementos preservados da referência:

- violeta como assinatura principal;
- cor utilizada com moderação no produto;
- hero mais expressivo do que a aplicação;
- superfícies limpas;
- grande contraste entre marketing emocional e produto funcional;
- sombras suaves;
- tipografia moderna;
- ritmo confortável;
- alternância entre áreas de alta energia e áreas de leitura;
- foco em produto real como principal elemento visual da landing.

O Rekko **não deve copiar literalmente** o material de referência.

Adaptações necessárias:

- reduzir sensação de apresentação/showcase;
- evitar aparência excessivamente futurista;
- remover excesso de letter-spacing;
- não depender de duas famílias tipográficas;
- evitar amarelo como segunda assinatura forte;
- reduzir elementos 3D decorativos;
- aproximar o produto de Linear/Raycast sem perder personalidade;
- aumentar a importância de motion funcional;
- tornar Timeline e segmentos de tempo os principais elementos proprietários.

---

# 3. Direção visual oficial

A direção do Rekko será:

> **Modern productivity software with human motion.**

Visualmente, o Rekko vive entre:

```text
Linear
+
Raycast
+
Pitch
+
uma identidade própria baseada em segmentos de tempo
```

A interface deve equilibrar:

```text
profissional
+
pessoal
```

Ela precisa funcionar para:

- uma pessoa controlando o próprio trabalho;
- um pequeno time;
- uma empresa utilizando Workspace.

O Rekko não deve parecer:

- software de RH;
- ERP;
- folha de ponto;
- ferramenta de monitoramento;
- dashboard financeiro;
- produto cyberpunk;
- plataforma gamer;
- interface neon;
- produto excessivamente “AI-first”.

---

# 4. Personalidade

Palavras que descrevem a experiência:

```text
Precise
Calm
Human
Fluid
Focused
Modern
Trustworthy
Alive
```

A interface deve passar:

> “Eu consigo entender o meu dia.”

e não:

> “Estou sendo monitorado.”

---

# 5. Princípio de dualidade

A experiência possui duas intensidades.

## Marketing

Mais emocional.

Pode utilizar:

- gradientes;
- motion;
- grandes áreas de cor;
- transições;
- storytelling visual;
- previews animados do produto.

---

## Produto

Mais silencioso.

Utiliza:

- neutros;
- violeta racionado;
- poucas sombras;
- hierarquia tipográfica;
- layout estável;
- motion funcional;
- cor concentrada em ações e estados.

Regra:

> **A landing vende a sensação. O produto entrega clareza.**

---

# 6. Assinatura visual

A assinatura proprietária do Rekko será baseada em:

> **segmentos de tempo que se conectam.**

Exemplo:

```text
━━━━━━   ━━━   ━━━━━━━━━
```

reconstruído:

```text
━━━━━━━━━━━━━━━━━━━━━━━━
```

Esse conceito deve aparecer de forma sutil em:

- wordmark;
- loading;
- hero;
- timeline;
- transições;
- progresso;
- onboarding;
- estados de sucesso;
- ilustrações abstratas.

Não deve virar um gimmick utilizado em todo componente.

---

# 7. Color rationing

Cor é funcional.

Dentro da aplicação, violeta/azul deve aparecer principalmente em:

- CTA principal;
- item ativo;
- timer ativo;
- seleção;
- foco;
- progresso;
- pequenos indicadores da marca.

Evitar colorir simultaneamente:

- background;
- card;
- ícone;
- botão;
- badge;
- gráfico;

com a cor da marca na mesma área.

Regra:

> **Se tudo é violeta, nada é violeta.**

---

# 8. Paleta principal — Brand

## Rekko Violet

```text
#6857F5
```

Token:

```text
--brand-violet
```

Uso:

- CTA;
- logo;
- seleção;
- active state;
- timer;
- elementos proprietários.

---

## Rekko Blue

```text
#4D7CFE
```

Token:

```text
--brand-blue
```

Uso:

- segundo ponto do gradiente;
- progress;
- pequenas transições;
- estados de atividade relacionados à marca.

Não utilizar como segunda cor primária concorrente.

---

## Rekko Gradient

```css
linear-gradient(
  135deg,
  #6857F5 0%,
  #5F64F7 48%,
  #4D7CFE 100%
)
```

Token:

```text
--brand-gradient
```

Uso:

- hero;
- CTA de marketing selecionado;
- active timer glow;
- segmentos de reconstrução;
- momentos emocionais.

No produto, usar raramente.

---

## Rekko Soft Violet

```text
#EEEAFE
```

Light Mode.

Uso:

- seleção suave;
- background de callout;
- badge ativo discreto;
- hover contextual.

---

## Rekko Soft Blue

```text
#EBF1FF
```

Light Mode.

Uso secundário.

---

# 9. Paleta Light Mode

## Canvas

```text
#F7F7FB
```

```text
--bg-canvas
```

---

## Surface

```text
#FFFFFF
```

```text
--surface-primary
```

---

## Surface Subtle

```text
#F1F2F7
```

```text
--surface-subtle
```

---

## Surface Hover

```text
#ECEEF5
```

---

## Text Primary

```text
#181821
```

---

## Text Secondary

```text
#5E6172
```

---

## Text Muted

```text
#707586
```

---

## Border

```text
#E2E4EC
```

---

## Border Strong

```text
#D2D5E0
```

---

# 10. Paleta Dark Mode

Dark Mode será carvão levemente azulado.

Não utilizar preto absoluto como canvas principal.

## Canvas

```text
#0F1117
```

---

## Surface

```text
#151823
```

---

## Surface Subtle

```text
#1B1F2C
```

---

## Surface Hover

```text
#222737
```

---

## Text Primary

```text
#F5F6FA
```

---

## Text Secondary

```text
#A9AEBE
```

---

## Text Muted

```text
#9299AA
```

---

## Border

```text
#292E3D
```

---

## Border Strong

```text
#363D50
```

---

# 11. Cores semânticas

Cores semânticas não devem utilizar Brand Violet.

## Success

```text
#2EA36A
```

## Warning

```text
#C7871B
```

## Danger

```text
#D85353
```

## Info

```text
#4D7CFE
```

Uso restrito a estados reais.

---

# 12. CSS semantic tokens

Exemplo:

```css
:root {
  --brand-violet: #6857F5;
  --brand-blue: #4D7CFE;
  --brand-gradient: linear-gradient(
    135deg,
    #6857F5 0%,
    #5F64F7 48%,
    #4D7CFE 100%
  );

  --bg-canvas: #F7F7FB;
  --surface-primary: #FFFFFF;
  --surface-subtle: #F1F2F7;
  --surface-hover: #ECEEF5;

  --text-primary: #181821;
  --text-secondary: #5E6172;
  --text-muted: #707586;

  --border-default: #E2E4EC;
  --border-strong: #D2D5E0;

  --success: #2EA36A;
  --warning: #C7871B;
  --danger: #D85353;
  --info: #4D7CFE;
}

.dark {
  --bg-canvas: #0F1117;
  --surface-primary: #151823;
  --surface-subtle: #1B1F2C;
  --surface-hover: #222737;

  --text-primary: #F5F6FA;
  --text-secondary: #A9AEBE;
  --text-muted: #9299AA;

  --border-default: #292E3D;
  --border-strong: #363D50;
}
```

---

# 13. Gradientes

Gradientes são parte da marca, mas não devem dominar o produto.

Permitidos:

## Hero

```css
linear-gradient(
  135deg,
  #4F3ED8 0%,
  #6857F5 48%,
  #4D7CFE 100%
)
```

---

## Brand CTA marketing

```css
linear-gradient(
  135deg,
  #6857F5,
  #4D7CFE
)
```

---

## Active Timer Glow

Muito sutil:

```css
radial-gradient(
  circle,
  rgba(104, 87, 245, 0.14),
  transparent 68%
)
```

---

Não usar gradiente em:

- tabelas;
- todos os cards;
- inputs;
- todos os badges;
- status comuns.

---

# 14. Tipografia

O Rekko utilizará **uma única família tipográfica**.

Família recomendada:

> **Manrope**

Fallback:

```css
'Manrope',
Inter,
ui-sans-serif,
system-ui,
-apple-system,
BlinkMacSystemFont,
"Segoe UI",
sans-serif
```

Motivos:

- moderna;
- tecnológica sem parecer fria;
- mais humana que uma grotesca extremamente neutra;
- funciona em UI e marketing;
- números fortes;
- grande variedade de pesos.

---

# 15. Tipografia — regra de uso

A diferenciação entre marketing e produto será feita por:

- peso;
- tamanho;
- tracking;
- line-height;

e não por duas famílias diferentes.

---

# 16. Display typography

Hero:

```text
64–80px desktop
44–56px tablet
38–46px mobile
```

Peso:

```text
700–800
```

Tracking:

```text
-0.035em
```

Line-height:

```text
0.98–1.05
```

---

# 17. Product headings

## Page title

```text
28–32px
600–700
-0.02em
```

## Section title

```text
20–24px
600
-0.015em
```

## Card title

```text
15–17px
600
```

---

# 18. Body typography

## Body

```text
15px
400
1.55
```

## Secondary

```text
14px
400
1.5
```

## Caption

```text
12–13px
500
1.4
```

---

# 19. Timer typography

Utilizar a mesma família.

Obrigatório:

```css
font-variant-numeric: tabular-nums;
```

Timer principal:

```text
48–64px
600
-0.035em
```

Timer global compacto:

```text
14–16px
600
tabular nums
```

---

# 20. Spacing

Escala principal:

```text
4
8
12
16
20
24
32
40
48
64
80
96
120
```

Não utilizar dezenas de valores arbitrários.

---

# 21. Density

Densidade:

> **comfortable balanced**

Produto não será tão compacto quanto Linear em todas as áreas.

Diferenças:

```text
Today / Timeline
→ mais respirado

Work Item lists
→ mais compacto

Settings
→ confortável

Landing
→ bastante espaço vertical
```

---

# 22. Border Radius

Sistema mais contido que a referência.

## Inputs

```text
10px
```

## Product buttons

```text
10–12px
```

## Product cards

```text
14–16px
```

## Drawers / dialogs

```text
18px
```

## Marketing cards

```text
22–26px
```

## Marketing CTA pills

```text
999px
```

Nem todo botão dentro do produto deve parecer uma pílula.

---

# 23. Borders

Produto prioriza:

```text
surface contrast
+
thin border
```

Border default:

```text
1px solid var(--border-default)
```

Evitar:

- 2px borders desnecessárias;
- divisores escuros;
- outlines permanentes.

---

# 24. Shadows

Sombras são discretas.

## Small

```css
0 1px 2px rgba(20, 20, 40, 0.04)
```

## Medium

```css
0 8px 24px rgba(20, 20, 40, 0.08)
```

## Floating

```css
0 18px 50px rgba(20, 20, 40, 0.14)
```

Dark Mode usa sombras menos perceptíveis e mais contraste de surface/border.

---

# 25. Product layout

Desktop:

```text
┌──────────────┬──────────────────────────────────────┐
│              │                                      │
│   Sidebar    │             Main Content             │
│              │                                      │
│              │                                      │
└──────────────┴──────────────────────────────────────┘
```

Sidebar:

```text
expanded: ~240px
collapsed: ~72px
```

---

# 26. Sidebar

A sidebar será recolhível.

Topo:

```text
[ Rekko / Workspace ▼ ]
```

Itens:

```text
Today
Timeline
Work
Insights
```

Área de Workspace:

```text
Members
Integrations
Settings
```

Rodapé:

```text
Profile
Theme
```

O Workspace Switcher fica no topo.

---

# 27. Sidebar states

## Expanded

Mostrar:

- ícone;
- label;
- shortcut quando útil;
- current Workspace.

## Collapsed

Mostrar:

- ícone;
- tooltip;
- avatar/Workspace mark.

A transição entre estados deve ser animada.

---

# 28. Active navigation

Não utilizar grande bloco violeta sólido.

Preferir:

Light:

```text
soft violet background
+
violet icon/text
```

Dark:

```text
subtle elevated surface
+
light violet foreground
```

---

# 29. Global Timer Dock

O timer ativo deve acompanhar o usuário por toda a aplicação.

Desktop:

> dock compacto fixado próximo à base da área principal/sidebar.

Composição:

```text
●  AMBLA / Onboarding
   01:27:42

[ Pause ] [ Switch ] [ Finish ]
```

Quando o espaço for reduzido:

```text
● AMBLA · 01:27:42   [ controls ]
```

---

# 30. Global Timer Dock behavior

Quando inicia:

1. aparece com transition;
2. o segmento ativo percorre suavemente a borda superior;
3. timer entra em contagem;
4. nenhuma animação pulsante contínua agressiva.

O usuário deve sentir:

> “algo está acontecendo”

sem ser distraído.

---

# 31. Today — prioridade

Today divide protagonismo entre:

```text
Current activity
+
Today's timeline
```

Nenhum dos dois deve esmagar o outro.

---

# 32. Today — estrutura desktop

```text
Today
Wednesday, Aug 26

┌─────────────────────────────────┐
│  05:42:18 tracked today         │
│                                 │
│  ● Working                      │
│  AMBLA                          │
│  Onboarding flow                │
│                                 │
│  01:27:42                       │
│                                 │
│  Pause   Switch       Finish    │
└─────────────────────────────────┘

Today timeline
──────────────────────────────────

08:12  ┃ AMBLA / Authentication
09:40  ┃ Daily
10:00  ┊ 32m not recorded
10:32  ┃ AMBLA / Onboarding
```

---

# 33. Today sem timer ativo

Combinar:

- Start Working;
- search;
- recent items;
- recently tracked;
- Work Items relevantes.

Estrutura:

```text
Ready to start?

[ Search project or task... ]

Recent
AC-843 Cloudflare Turnstile
AMBLA — Onboarding
PDDE — School Query

[ Start ]
```

Evitar empty state genérico.

---

# 34. Timer Card

Timer Card não deve ser um card roxo gigante.

Surface neutra.

Marca aparece em:

- status dot;
- thin progress line;
- primary action;
- subtle glow.

Isso mantém o produto elegante.

---

# 35. Timeline — conceito

A Timeline é a principal assinatura de interface.

Modelo:

> **calendar rail + structured activity list**

Ela deve permitir entender a jornada sem exigir leitura de tabela.

---

# 36. Timeline — desktop

Estrutura:

```text
08:00 ┃
      ┃  AMBLA
08:12 ┃  Authentication
      ┃  1h28
09:40 ┃

09:40 ┃  Daily
      ┃  20m
10:00 ┃

10:00 ┊ ─────────────────────
      ┊  32 minutes untracked
10:32 ┊ ─────────────────────

10:32 ┃  AMBLA
      ┃  Onboarding
```

---

# 37. Timeline blocks

Cada bloco mostra prioritariamente:

```text
Project
Work Item
Duration
```

Secundariamente:

```text
Activity type
Source
description
```

Nunca exibir 8 metadados no bloco.

Detalhes adicionais entram:

- hover;
- popover;
- drawer.

---

# 38. Timeline color strategy

Não utilizar uma cor forte diferente para cada projeto.

Padrão:

```text
neutral block
+
small project indicator
```

O projeto pode receber uma cor opcional discreta futuramente.

Brand Violet representa:

```text
active
selected
current
```

e não cada categoria.

---

# 39. Gaps

Gaps são:

- discretos;
- visíveis;
- neutros;
- não punitivos.

Visual:

```text
dashed rail
+
soft neutral background
```

Texto:

```text
32 minutos sem registro
```

CTA:

```text
Reconstruir
```

Evitar vermelho/alerta.

---

# 40. Reconstruction Drawer

Ao clicar em Gap:

> abrir Drawer pela direita.

Drawer preserva a Timeline visível.

Conteúdo:

```text
Reconstruir período

10:00 — 10:32
32 minutos

Projeto
Demanda
Tipo
Descrição

[ Salvar período ]
```

A abertura deve ser fluida.

---

# 41. Reconstruction motion

Ao salvar um gap:

1. drawer fecha;
2. gap reduz;
3. novo bloco ocupa o intervalo;
4. segmentos separados se conectam;
5. pequeno highlight violeta percorre a nova união;
6. estado volta ao neutro.

Esse é um dos momentos de marca do Rekko.

---

# 42. Work

Overview:

> Projects em cards.

Dentro do projeto:

> Work Items em lista.

Motivo:

- projetos precisam ser escaneáveis;
- dezenas de Work Items precisam de densidade.

---

# 43. Project Card

Mostrar:

```text
Project name
source
tracked time
estimated time
progress
active work item count
```

Não mostrar tudo simultaneamente se não houver dado.

Exemplo:

```text
AMBLA
Linear

32h 12m tracked
41h estimated

78%
```

---

# 44. Work Item List

Lista semelhante à disciplina visual do Linear, mas com identidade Rekko.

Colunas/áreas:

```text
Identifier
Title
Status
Estimate
Tracked
Difference
Action
```

Em telas menores reduzir progressivamente.

---

# 45. Work Item active row

Ao passar mouse:

- surface hover;
- ações aparecem;
- Start fica disponível.

Não preencher toda linha de violeta.

---

# 46. Linear import

A importação será:

> árvore de checkbox + lista expansível.

Exemplo:

```text
☑ [EPIC] Cloudflare Turnstile
   ☑ AC-844 Login frontend
   ☑ AC-845 Login backend
   ☐ AC-846 Docs

☐ Dashboard
   ☐ AC-851 Cards
```

---

# 47. Linear import UI

Topo:

```text
Search...

Team
Project
Status
Assignee
```

Conteúdo:

```text
tree
```

Footer sticky:

```text
7 selected

[ Cancel ]
[ Import selected ]
```

---

# 48. Selected Linear items

Seleção:

```text
checkbox violet
soft violet row background
```

Parent parcialmente selecionado:

```text
indeterminate state
```

---

# 49. Insights

Princípio:

> poucos gráficos, respostas claras.

Topo:

```text
This week

38h 42m
Tracked

+4h 12m
Above estimate

6
Tasks completed/tracked context
```

Não criar grid com 12 KPI cards.

---

# 50. Insights — charts

Gráfico principal:

> barras horizontais.

Uso:

```text
hours by project
hours by work item
```

Exemplo:

```text
AMBLA          █████████████ 16h12
AidCrusader    ███████████   13h41
PDDE           █████          6h04
```

---

# 51. Estimate vs Actual

Preferir:

```text
paired bars
or
progress comparison
```

e não gauges.

Exemplo:

```text
Estimated   ━━━━━━━━━━━  3h
Tracked     ━━━━━━━━━━━━━━━ 4h05
```

---

# 52. Charts color

Brand Violet:

```text
primary series
```

Blue:

```text
secondary comparison
```

Neutrals:

```text
historical/background series
```

Não criar rainbow charts.

---

# 53. Landing Page — objetivo

A landing deve:

1. explicar o conceito rapidamente;
2. criar conexão emocional;
3. mostrar produto real;
4. demonstrar reconstrução;
5. explicar Linear;
6. mostrar uso individual + time;
7. conduzir para cadastro.

---

# 54. Landing — estrutura

Ordem recomendada:

```text
Navbar
↓
Hero
↓
Interactive Product Preview
↓
Track / Reconstruct / Understand
↓
Timeline Reconstruction Story
↓
Linear Integration
↓
Workspace / Team Collaboration
↓
Estimated vs Actual
↓
Beta / Pricing
↓
Final CTA
↓
Footer
```

---

# 55. Landing Navbar

Desktop:

```text
rekko

Product
How it works
Integrations

Log in
[ Start free ]
```

Navbar inicialmente transparente/leve sobre Hero.

Ao scroll:

```text
surface translucent
+
backdrop blur leve
+
thin border
```

Evitar glassmorphism intenso.

---

# 56. Landing Hero

Mensagem principal:

> **Reconstrua seu tempo.  
> Entenda sua jornada.**

Supporting copy:

> Registre o que está fazendo, reconstrua o que ficou pelo caminho e entenda onde suas horas realmente foram usadas.

CTAs:

```text
[ Começar grátis ]
[ Ver como funciona ]
```

Badge:

```text
Free during beta
```

---

# 57. Hero visual

O Hero não utiliza pessoa/fotografia como principal elemento.

Visual principal:

> uma Timeline do Rekko parcialmente fragmentada que se reconstrói durante a entrada da página.

Exemplo inicial:

```text
━━━━━━   ━━━       ━━━━━
```

Durante animação:

```text
━━━━━━━━━━━━━━━━━━━━━━━━
```

Depois, alguns segmentos se transformam em:

- AMBLA;
- Daily;
- AC-843;
- gap;
- active timer.

A animação explica o produto sem texto extra.

---

# 58. Hero background

Usar gradiente violeta/azul profundo.

Não neon.

Pode conter:

- soft light;
- blur shapes;
- noise muito discreto;
- grid ou linhas temporais quase invisíveis.

Evitar:

- objetos cromados;
- 3D futurista;
- planetas;
- hologramas;
- efeitos cyberpunk.

---

# 59. Hero motion

Motion mais expressivo que no app.

Sequência sugerida:

```text
0ms
headline reveal

150ms
supporting copy

280ms
CTA

400ms
fragmented segments enter

650–1400ms
segments connect

1400ms+
preview enters stable state
```

O Hero deve terminar em estado estável.

Não manter animações grandes infinitas.

---

# 60. Interactive Product Preview

Logo após hero:

> preview grande do produto.

Pode permitir pequenas interações sem login:

```text
Start
Pause
Reconstruct sample gap
Switch
```

Não precisa executar backend real.

Objetivo:

> deixar o visitante “sentir” o Rekko.

---

# 61. Track / Reconstruct / Understand section

Três conceitos.

Não utilizar três cards idênticos sem personalidade.

Pode ser uma única cena mudando por scroll/controle.

## Track

Mostrar timer iniciando.

## Reconstruct

Mostrar gap preenchido.

## Understand

Mostrar Insight surgindo.

---

# 62. Scroll storytelling

Permitido na landing:

- sticky visual;
- texto muda conforme scroll;
- timeline se transforma.

Proibido:

- scroll hijacking;
- impedir scroll normal;
- animações que dificultem leitura;
- dezenas de segundos de animação obrigatória.

---

# 63. Linear section

Mensagem:

> **Suas tarefas já existem. O Rekko só conecta o tempo a elas.**

Visual:

```text
Linear tree
       ↓
selected items
       ↓
Rekko Work
```

Mostrar claramente seleção parcial.

Isso diferencia o produto de uma “importação massiva”.

---

# 64. Workspace section

Mostrar:

```text
Owner
Admin
Member
```

e exemplo de equipe.

O foco não é gerenciamento de RH.

Mensagem:

> Trabalhe sozinho ou reconstrua o tempo junto com seu time.

---

# 65. Estimated vs Actual section

Visual forte:

```text
30m estimated
42m tracked

+12m
```

Pode utilizar animação de barra crescendo.

Mensagem:

> Estimativa é intenção. Tempo real é aprendizado.

---

# 66. Pricing no MVP

Não criar tabela complexa de planos.

Mostrar:

```text
Free during beta
```

Com texto:

> Use o Rekko gratuitamente durante a fase beta.

CTA:

```text
[ Criar meu Workspace ]
```

---

# 67. Landing final CTA

Seção de alta emoção.

Pode retornar ao gradiente.

Headline:

> **Seu tempo já aconteceu.  
> O Rekko ajuda você a entendê-lo.**

CTA:

```text
[ Começar grátis ]
```

---

# 68. Footer

Simples.

```text
rekko

Product
Privacy
Terms
GitHub/Contact when applicable

© Rekko
```

Não criar footer gigantesco.

---

# 69. Onboarding — filosofia

Modelo:

> **short wizard + post-onboarding checklist**

Objetivo:

levar o usuário ao primeiro valor rapidamente.

Nunca exigir configuração completa da empresa antes de usar.

---

# 70. Onboarding flow

```text
Account
↓
Create Workspace
↓
Invite team (optional)
↓
Create Project
    ├── Manual
    └── Linear
↓
If Linear:
    connect
    select cards
↓
Today
```

---

# 71. Onboarding shell

Visual:

```text
rekko logo

Step 2 of 4
━━━━━━━━━━━━━━

Main question

Content

Back        Continue
```

Utilizar uma área central, sem sidebar completa.

---

# 72. Onboarding progress

Não utilizar bolinhas numeradas gigantes.

Usar:

```text
thin segmented progress
```

Exemplo:

```text
━━━━━━  ━━━━━━  ━━━━━━  ━━━━━━
  done    now
```

A própria barra pode remeter à reconstrução.

---

# 73. Create Workspace onboarding

Pergunta:

> **Onde seu tempo acontece?**

Supporting:

> Crie um Workspace para organizar projetos, tarefas e pessoas.

Input:

```text
Workspace name
```

CTA:

```text
[ Criar Workspace ]
```

---

# 74. Invite onboarding

Etapa opcional.

Headline:

> **Quer trazer seu time?**

Campos:

```text
Email
Role
Cargo
```

Permitir múltiplos convites.

Link claro:

```text
Pular por agora
```

Nunca esconder skip.

---

# 75. Project onboarding

Pergunta:

> **Como você quer organizar seu primeiro projeto?**

Opções:

```text
Create manually
Connect Linear
```

Visual:

duas opções grandes, mas não cards decorativos excessivos.

---

# 76. Linear onboarding

Depois de conectar:

> **Escolha o que realmente importa.**

Mostrar tree seletiva.

Não importar tudo automaticamente.

Depois:

```text
12 items selected
[ Importar e continuar ]
```

---

# 77. First Today experience

Ao entrar no produto pela primeira vez:

não mostrar uma tela vazia.

Mostrar:

```text
Your Workspace is ready.

Start with one task.

[ Search work... ]
```

Se Linear:

mostrar Work Items recém-importados.

---

# 78. Getting Started checklist

Após onboarding:

```text
Getting started

✓ Create Workspace
○ Invite your team
✓ Connect Linear
○ Track your first task
○ Reconstruct your first gap
```

Checklist deve ser:

- dispensável;
- recolhível;
- desaparecer após conclusão.

---

# 79. First tracked task moment

Ao iniciar o primeiro timer:

- micro motion;
- timer dock aparece;
- pequeno segmento começa a crescer;
- copy breve:

```text
Seu tempo está sendo registrado.
```

Não mostrar confetti.

---

# 80. First reconstruction moment

Esse pode ser um momento emocional mais forte.

Após reconstruir primeiro gap:

```text
Timeline complete for this period.
```

Visualmente:

segmentos se conectam.

Pode existir subtle spark/shine.

Sem confetti.

---

# 81. Motion philosophy

Motion é parte importante do Rekko.

Não é decoração.

Motion deve comunicar:

```text
continuity
time
cause → effect
state change
reconstruction
```

---

# 82. Motion intensity

Landing:

```text
high but controlled
```

Produto:

```text
medium
```

Core productivity flows:

```text
fast
```

---

# 83. Motion tokens

## Instant

```text
100–140ms
```

Hover/focus.

## Fast

```text
160–200ms
```

Buttons, tabs.

## Standard

```text
220–280ms
```

Panels, rows, sidebar.

## Expressive

```text
400–700ms
```

Reconstruction, onboarding success.

## Marketing

```text
600–1400ms
```

Hero storytelling.

---

# 84. Easing

UI:

```css
cubic-bezier(0.2, 0.8, 0.2, 1)
```

Exit:

```css
cubic-bezier(0.4, 0, 1, 1)
```

Expressive transitions podem utilizar spring moderado.

Evitar bounce/cartoon spring em produtividade.

---

# 85. Button motion

Hover:

```text
translateY(-1px)
```

ou leve mudança de surface.

Press:

```text
scale(0.98)
```

Não exagerar.

---

# 86. Card motion

Cards não devem ficar flutuando constantemente.

Hover:

```text
border/surface
+
0–2px elevation
```

Marketing cards podem utilizar:

```text
translateY(-4px)
```

---

# 87. Timeline motion

Eventos:

## New block

```text
opacity 0 → 1
scaleY .96 → 1
```

origem na direção temporal.

## Gap reconstructed

segmentos conectam.

## Switch

bloco atual fecha e novo nasce no mesmo ponto temporal.

Essa animação deve tornar visual a regra atômica de Switch.

---

# 88. Timer motion

Quando ativo:

- status dot vivo;
- thin progress accent;
- números estáveis.

Não:

- pulsar o card inteiro;
- glow forte contínuo;
- animação atrás do texto.

---

# 89. Theme transition

Light ↔ Dark:

```text
180–240ms
```

Animar:

- background;
- surface;
- text;
- border.

Não fazer flash branco.

---

# 90. Reduced Motion

Obrigatório respeitar:

```css
prefers-reduced-motion: reduce
```

Nesse estado:

- eliminar parallax;
- eliminar grandes transformações;
- reduzir transitions;
- manter mudanças de estado instantâneas/curtas.

Funcionalidade nunca depende de animação.

---

# 91. Mobile priority

Mobile web deve ser:

> **muito bem resolvido**

não apenas funcional.

Desktop continua sendo ambiente principal.

---

# 92. Mobile navigation

Desktop sidebar vira:

> bottom navigation.

Itens principais:

```text
Today
Timeline
Work
Insights
```

Workspace/Admin fica em:

```text
Profile/Menu
```

---

# 93. Mobile Global Timer

Timer ativo fica:

> sticky acima da bottom navigation.

Exemplo:

```text
● AC-843     01:27:42
[ Pause ] [ ••• ]
```

Tap abre full timer controls.

---

# 94. Mobile Today

Prioridade:

1. current timer;
2. tracked today;
3. quick start;
4. timeline.

A Timeline deve continuar vertical e legível.

---

# 95. Mobile Timeline

Não tentar reproduzir desktop comprimido.

Mobile:

```text
time
│
├── block
│
├── block
│
┊ gap
│
└── block
```

Blocos ocupam largura quase total.

---

# 96. Mobile Linear import

Tree continua funcionando.

Sub-items:

```text
indent smaller
```

Filters:

```text
horizontal chips
or
filter drawer
```

Footer de seleção continua sticky.

---

# 97. Responsive breakpoints

Conceituais:

```text
mobile      < 768
tablet      768–1023
desktop     1024+
wide        1440+
```

Não criar layout diferente para dezenas de breakpoints.

---

# 98. Content width

Produto:

```text
main content max ~1440px
```

dependendo da tela.

Landing:

```text
content max 1180–1240px
```

Text blocks:

```text
max 680–760px
```

para leitura.

---

# 99. Forms

Inputs:

```text
44px minimum height
```

Labels sempre visíveis.

Placeholder não substitui label.

Focus:

```text
brand ring suave
```

Erro:

```text
danger border/text
```

---

# 100. Buttons

Hierarquia:

```text
Primary
Secondary
Ghost
Danger
Icon
```

Uma área não deve possuir três Primary Buttons.

---

# 101. Primary Button

Produto:

```text
background: Rekko Violet
text: white
radius: 10–12px
```

Marketing:

pode usar:

```text
brand gradient
pill radius
```

---

# 102. Secondary Button

Surface:

```text
surface primary/subtle
border default
text primary
```

---

# 103. Ghost Button

Sem border permanente.

Hover cria surface.

---

# 104. Destructive Button

Danger apenas para destruição real.

Nunca reutilizar vermelho para:

- Finish timer;
- gap;
- over-estimate.

`Finish` é ação normal, não destrutiva.

---

# 105. Badges

Small.

Uso:

```text
Linear
Manual
In Progress
Done
Owner
Admin
Member
```

Evitar badge em tudo.

---

# 106. Status language

Preferir linguagem humana.

Ruim:

```text
STATUS: ACTIVE
```

Bom:

```text
Working
Paused
Done
```

---

# 107. Empty states

Todo Empty State responde:

1. o que está vazio;
2. por que importa;
3. qual ação fazer.

Exemplo:

```text
No projects yet.

Create a project manually or bring selected work from Linear.

[ Create Project ]
```

---

# 108. Loading

Evitar spinner central para tudo.

Usar:

- skeleton;
- inline loader;
- segment loader Rekko.

---

# 109. Rekko Loader

Pequeno loader proprietário:

```text
━━  ━━━   ━
```

segmentos entram e se conectam.

Motion curto.

Não usar em cargas longas repetidamente se skeleton for melhor.

---

# 110. Toasts

Toast:

- curto;
- canto inferior/superior dependendo do shell;
- duração adequada;
- actions quando útil.

Exemplo:

```text
Time entry updated.
```

Não exibir toast para toda interação trivial.

---

# 111. Drawers

Preferidos para edição contextual:

- reconstruct gap;
- Work Item details;
- filters;
- quick controls.

Desktop:

right side.

Mobile:

bottom sheet/full-height sheet.

---

# 112. Dialogs

Reservar para:

- confirmação destrutiva;
- escolha curta;
- segurança.

Não transformar todos os forms em modal.

---

# 113. Tables

Usar somente onde estrutura tabular realmente ajuda.

Exemplos:

- Members;
- exports/report relation;
- admin lists.

Work Items preferem lista estruturada.

---

# 114. Accessibility

Obrigatório:

- WCAG contrast adequado;
- keyboard navigation;
- focus visible;
- semantic HTML;
- accessible dialogs;
- accessible dropdowns;
- accessible tree/checkbox;
- 44px touch target no mobile;
- aria-live para mudanças relevantes do timer quando apropriado.

---

# 115. Keyboard UX

Desejável:

```text
⌘ K / Ctrl K
```

Command Palette pode entrar após core inicial.

Atalhos futuros:

```text
Start
Pause
Switch
Search
```

Nunca depender exclusivamente de atalhos.

---

# 116. Command Palette

Quando implementada:

```text
Search work...

AC-843 — Turnstile
AMBLA — Onboarding
```

Ações:

```text
Start timer
Open
Add manual time
```

Visual semelhante à disciplina de Raycast/Linear, usando tokens Rekko.

---

# 117. Product copy tone

Tom:

> **direto e humano.**

Evitar:

```text
operational corporate language
```

Exemplo:

Ruim:

> Não é permitido possuir mais de um registro ativo.

Bom:

> Você já tem uma atividade em andamento.

---

# 118. Copy principles

Textos devem ser:

```text
short
clear
non-judgmental
actionable
```

Especialmente em gaps e estimativas.

---

# 119. Gap copy

Nunca:

> Você esqueceu de registrar 32 minutos.

Preferir:

> 32 minutos sem registro.

ou:

> Quer reconstruir este período?

---

# 120. Estimate copy

Nunca:

> Você excedeu a tarefa em 40%.

Preferir:

```text
Estimated   1h
Tracked     1h24
Difference  +24m
```

Dados primeiro, julgamento nunca.

---

# 121. Error tone

Exemplo:

> Não conseguimos sincronizar este item agora. Tente novamente ou abra a tarefa no Linear para conferir o status.

Não:

> GraphQL error 429.

---

# 122. Landing copy tone

Landing pode ser mais emocional.

Ainda assim:

- frases curtas;
- sem jargão;
- sem claims grandiosos;
- sem “revolutionize productivity”.

---

# 123. Wordmark

Logo inicial:

> **rekko**

Lowercase recomendado.

Personalidade:

- simples;
- forte;
- limpa;
- pequena customização tipográfica permitida.

O logo não deve parecer:

- relógio genérico;
- ampulheta genérica;
- cronômetro genérico.

---

# 124. Wordmark concept

Uma futura customização pode explorar:

- cortes/segmentos em `r`, `k` ou `o`;
- pequeno deslocamento de segmento;
- ligação visual entre duas partes.

Sutil.

Nunca prejudicar legibilidade de `rekko`.

---

# 125. Logo use

Landing Hero:

```text
white wordmark
```

Product Light:

```text
dark wordmark
```

Product Dark:

```text
light wordmark
```

Brand Violet pode aparecer no símbolo futuro.

---

# 126. Imagery

Prioridade:

1. produto real;
2. interface animada;
3. diagramas;
4. abstrações de segmentos.

Não priorizar fotografia lifestyle.

---

# 127. Decorative imagery

Pode utilizar:

- linhas;
- segmentos;
- soft blobs;
- temporal paths;
- glow discreto.

Evitar:

- chrome 3D;
- glass spheres;
- robots;
- relógios 3D;
- hologramas.

---

# 128. Illustration principle

Toda ilustração deve explicar:

```text
time
context
connection
reconstruction
```

Se for apenas decoração, deve ser mínima.

---

# 129. Do

- Use Violet como principal assinatura.
- Use Blue como complemento do gradient.
- Use neutrals para a maior parte do produto.
- Faça Timeline ser visualmente memorável.
- Use motion para explicar state change.
- Use Product UI real na landing.
- Preserve bastante whitespace.
- Use listas para alta densidade.
- Use cards apenas quando agrupamento fizer sentido.
- Use tabular numbers no timer.
- Faça Light e Dark igualmente bem acabados.
- Use linguagem não julgadora.
- Mantenha gaps neutros.
- Faça onboarding curto.
- Faça Linear import seletivo parecer simples.
- Use hover/focus states ricos e discretos.

---

# 130. Don't

- Não usar neon.
- Não usar cyberpunk.
- Não usar glassmorphism pesado.
- Não criar card soup.
- Não criar dashboard com dezenas de KPIs.
- Não colorir cada Project com cor saturada.
- Não usar rainbow charts.
- Não usar confetti para produtividade básica.
- Não deixar motion bloquear interação.
- Não usar violet background em todas as telas.
- Não usar preto absoluto como canvas.
- Não utilizar gradiente em todos os botões.
- Não transformar Finish em ação vermelha.
- Não tratar gaps como erro.
- Não copiar o Linear visualmente.
- Não copiar literalmente o Pitch.
- Não usar sombras pesadas no produto.
- Não usar bordas grossas.
- Não depender de ícones sem label em ações críticas.

---

# 131. Core components

Componentes essenciais:

```text
AppShell
Sidebar
WorkspaceSwitcher
GlobalTimerDock
TimerCard
Timeline
TimelineBlock
TimelineGap
ReconstructionDrawer
ProjectCard
WorkItemRow
LinearImportTree
LinearImportRow
EstimateComparison
InsightMetric
HorizontalBarChart
MemberRow
RoleBadge
ThemeToggle
SearchInput
FilterBar
Drawer
Dialog
Dropdown
Tooltip
Toast
Button
Input
Select
Checkbox
Tabs
Skeleton
RekkoLoader
EmptyState
```

Não criar uma biblioteca gigante antes das telas exigirem.

---

# 132. Component states

Todo componente interativo deve considerar:

```text
default
hover
focus
active
disabled
loading
error
```

Quando aplicável:

```text
selected
indeterminate
success
```

---

# 133. Light/Dark parity

Nenhuma feature pode ser considerada visualmente concluída se:

```text
Light works
Dark is broken
```

ou vice-versa.

Checklist visual obrigatório para cada tela:

```text
Light
Dark
Desktop
Mobile
Keyboard focus
Loading
Empty
Error
```

---

# 134. Theme default

Default:

> System preference

desde que a implementação permaneça simples.

Usuário pode selecionar:

```text
Light
Dark
System
```

Mesmo que `System` seja cortado por cronograma, Light/Dark não podem ser cortados.

---

# 135. Design QA — Today

Validar:

- timer legível;
- atividade atual clara;
- Start em poucos segundos;
- Timeline visível sem scroll excessivo;
- gap não parece erro;
- timer global não compete com Timer Card;
- responsive.

---

# 136. Design QA — Timeline

Validar:

- leitura cronológica;
- duração clara;
- blocos não parecem cards soltos;
- gaps reconhecíveis;
- drawer preserva contexto;
- overlapping/conflict states compreensíveis;
- motion de reconstrução suave.

---

# 137. Design QA — Work

Validar:

- Projects facilmente identificáveis;
- Work Items densos sem confusão;
- Estimated × Tracked legível;
- Start action rápida;
- Linear source distinguível sem dominar.

---

# 138. Design QA — Linear import

Validar:

- parent/sub-item hierarchy;
- checkbox indeterminate;
- filtro;
- seleção em massa;
- quantidade selecionada;
- sticky confirmation;
- mobile.

---

# 139. Design QA — Insights

Validar:

- usuário entende resposta sem interpretar dashboard complexo;
- máximo de poucos KPIs principais;
- bar charts legíveis;
- estimated vs actual neutro;
- filtros claros.

---

# 140. Design QA — Landing

Validar:

- proposta compreendida em menos de 10 segundos;
- CTA visível;
- produto aparece cedo;
- motion explica Rekko;
- não parece “AI startup genérica”;
- hero não parece cyberpunk;
- Timeline é memorável;
- Free during beta claro;
- performance aceitável.

---

# 141. Design QA — Onboarding

Validar:

- usuário sabe progresso;
- convite pode ser pulado;
- não exige configuração excessiva;
- Linear selection não assusta;
- primeiro Today nunca parece morto;
- usuário chega ao primeiro timer rapidamente.

---

# 142. Motion QA

Validar:

- 60fps quando viável;
- sem layout shift;
- sem animação infinita distrativa;
- reduced-motion funcional;
- mobile não sofre;
- inputs respondem instantaneamente;
- motion nunca atrasa action.

---

# 143. Landing animation budget

Para evitar excesso:

Por viewport:

```text
1 primary animated idea
+
1–2 secondary micro motions
```

Não animar simultaneamente:

- headline;
- background;
- cards;
- icons;
- cursor;
- mockup;
- graph;

de forma contínua.

---

# 144. Product animation budget

Em telas de trabalho:

> no máximo um estado expressivo acontecendo de cada vez.

Exemplo:

Reconstrução de gap pode ser expressiva.

Ao mesmo tempo:

- sidebar não deve pulsar;
- cards não devem flutuar;
- gráfico não deve animar continuamente.

---

# 145. Visual recognition target

O objetivo é que, sem logo, uma captura de:

```text
Today
+
Timeline
+
Global Timer Dock
```

ainda seja reconhecível como Rekko.

Isso depende principalmente de:

- temporal rail;
- segmentos;
- density;
- typography;
- restrained violet;
- reconstruction motion.

---

# 146. MVP design priorities

Prioridade P0:

```text
Design tokens
Light Mode
Dark Mode
App Shell
Sidebar
Workspace Switcher
Today
Timer
Global Timer Dock
Timeline
Gap
Reconstruction Drawer
Work
Project
Work Item list
Linear import
Onboarding
Landing Hero
Responsive core
```

---

# 147. MVP design priorities P1

```text
Insights
Members
Integrations
Settings
CSV filters/export UI
Landing full sections
Getting Started checklist
polished animations
```

---

# 148. Desired but cuttable

Se cronograma apertar:

```text
Command Palette
advanced hover choreography
interactive landing sandbox
complex scroll storytelling
custom logo symbol
advanced chart animation
```

Não cortáveis:

```text
Light
Dark
responsive core
Timeline identity
basic motion
onboarding
landing
```

---

# 149. Final design statement

> O Rekko será uma ferramenta de produtividade moderna, humana e precisa. Sua identidade nasce de uma paleta violeta com complemento azul elétrico controlado, utilizada sobre superfícies predominantemente neutras. A landing pode explorar a marca de forma emocional e animada; a aplicação deve reduzir a intensidade cromática e priorizar clareza.

> A Timeline será a assinatura visual central do produto. Segmentos de tempo representam o trabalho registrado e a reconstrução conecta visualmente períodos antes fragmentados. Motion será utilizado como linguagem para demonstrar continuidade, passagem do tempo e causa/efeito — não como decoração gratuita.

> O app utilizará uma sidebar recolhível no desktop, bottom navigation no mobile, Workspace Switcher no topo e um Global Timer Dock disponível durante toda a navegação. Today equilibra o timer atual com a Timeline do dia. Work usa Project Cards e Work Item Lists. Insights utiliza poucos KPIs e barras horizontais. A importação do Linear usa árvore expansível com checkboxes e seleção explícita.

> O onboarding será curto e progressivo: criar Workspace, convite opcional, criar/conectar projeto e chegar ao Today. A landing apresentará “Reconstrua seu tempo. Entenda sua jornada.” através de uma Timeline fragmentada que se reconstrói, seguida por uma demonstração real do produto, os pilares Track/Reconstruct/Understand, Linear, colaboração, Estimated × Actual e o posicionamento “Free during beta”.

> O Rekko não deve parecer um ERP, um software de monitoramento ou uma interface futurista genérica. Deve parecer uma ferramenta que respeita o trabalho do usuário e transforma o tempo em uma história compreensível.
