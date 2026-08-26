# REKKO — LANDING PAGE AUDIT

## 1. Executive Summary

A Landing Page atual possui uma base conceitual correta e reconhecível: a ordem das seções segue o `DESIGN.md`, a mensagem central é compreendida rapidamente, o produto aparece cedo, o preview é HTML/React real, gaps são tratados de forma neutra e Light/Dark compartilham uma fundação consistente de tokens.

O acabamento, porém, ainda não atende ao estado de Fase 1/10 descrito no `ROADMAP.md`. Os principais problemas são:

- o timer demonstrativo não mede tempo; ele apenas alterna entre `00:00:00` e `01:27:42`;
- a Navbar transparente usa tokens do tema sobre o Hero, tornando logo e links quase ilegíveis no Light Mode;
- no mobile, links de navegação, Login e seletor de tema são removidos sem menu ou alternativa;
- não existe arquitetura de scroll reveal, reverse scroll ou motion específico por seção;
- a transição Hero → Product é um corte horizontal reto, em divergência explícita com a direção solicitada;
- o Hero possui um gradient linear e um único glow radial estático, mas ainda não constrói a profundidade de “violet stage spotlight” esperada;
- pequenos textos violeta no Dark Mode e textos muted em certas superfícies claras não atingem WCAG AA;
- a única motion narrativa contínua é um loop infinito na Timeline, contrário ao estado final estável definido pelo Design System.

Qualidade visual geral: boa fundação, acabamento intermediário. Qualidade funcional: parcial, devido ao timer. Motion: insuficiente para a identidade do Rekko. Light/Dark: estruturalmente consistente, mas com falhas de contraste e transição. Responsividade: sem overflow horizontal nos viewports medidos, porém com perda de funções na Navbar mobile.

Foram encontrados **15 issues**: **0 P0**, **4 P1**, **8 P2** e **3 P3**.

Limitação de evidência: o briefing menciona screenshots Light e Dark, mas o diretório anexado continha apenas `pasted-text.txt`. A comparação visual foi feita contra o `DESIGN.md`, `DESIGN (1).md` e a aplicação renderizada localmente.

---

## 2. Test Environment

```text
Route: /
Test URL: http://127.0.0.1:3100/
Next.js: 16.3.3 (App Router)
React: 19.2.8
CSS: CSS global vanilla em apps/web/src/app/globals.css; Tailwind não está instalado
Motion: CSS animations/transitions; Framer Motion e motion/react não estão instalados
Theme: next-themes 0.4.x, class strategy, Light/Dark/System
Browser: Codex in-app browser (Chromium)
Viewports: 1440, 1280, 1024, 900, 820, 801, 800, 768, 430, 390 e 375 px
Build observado: produção local existente, servido com next start
Date: 2026-08-26
```

Fluxos executados:

- carregamento inicial;
- scroll progressivo para baixo e para cima;
- troca Light → Dark → Light e persistência após reload;
- troca de tema no topo, na seção de produto e próximo ao final da página;
- timer por 5 e 30 segundos;
- pause/reset visual do timer;
- reconstrução e desfazer;
- seleção de itens Linear;
- CTA “Ver como funciona”;
- inspeção visual e métricas nos viewports listados;
- console e carregamento dos assets presentes no DOM.

---

## 3. Current Landing Architecture

A implementação real não possui componentes separados por seção. Toda a Landing vive em `LandingPage`, com apenas `PreviewEvent` extraído localmente.

```text
HomePage
└── LandingPage (client component)
    ├── header.marketing-nav
    │   ├── BrandMark
    │   ├── nav.marketing-nav__links
    │   ├── ThemeSwitcher
    │   └── auth CTAs
    ├── main
    │   ├── section.hero
    │   │   ├── hero__glow
    │   │   ├── beta-note
    │   │   ├── headline/copy/CTAs
    │   │   └── reconstruction-visual + hero-timeline
    │   ├── section.product-section
    │   │   └── product-preview
    │   │       ├── preview-sidebar
    │   │       ├── preview-current / timer
    │   │       └── preview-timeline / PreviewEvent
    │   ├── section.pillars-section
    │   │   └── pillar-story (Track/Reconstruct/Understand)
    │   ├── section.story-section
    │   │   └── timeline-story
    │   ├── section.linear-section
    │   │   └── linear-selector
    │   ├── section.workspace-section
    │   │   └── workspace-visual
    │   ├── section.estimate-section
    │   │   └── estimate-visual
    │   ├── section.beta-section
    │   └── section.final-cta
    └── footer.landing-footer
```

Estado local em `LandingPage`:

```text
scrolled       → Navbar após 24px
running        → alterna o preview estático do timer
reconstructed  → alterna o gap demonstrativo
selected       → checkboxes do Linear
```

---

## 4. Current Visual Structure

Ordem real encontrada:

1. Navbar fixa.
2. Hero com badge, headline, copy, dois CTAs e visual de Timeline.
3. Product Preview interativo.
4. Track / Reconstruct / Understand.
5. Timeline Reconstruction Story.
6. Linear Integration.
7. Workspace / Team Collaboration.
8. Estimated vs Actual.
9. Free during beta.
10. Final CTA.
11. Footer.

A estrutura coincide com a ordem recomendada no `DESIGN.md`.

---

## 5. Design System Compliance

### Correct

- Manrope é a única família principal e é carregada localmente por `@fontsource-variable/manrope`.
- Brand Violet `#6857F5`, Brand Blue `#4D7CFE` e `--brand-gradient` coincidem com o baseline.
- Canvas, surfaces, borders, radius e sombras seguem majoritariamente tokens semânticos.
- O produto usa neutros; violeta é concentrado em ação, seleção, estado ativo e segmentos.
- O Hero é mais expressivo que as seções de produto.
- A estrutura da Landing segue exatamente a narrativa aprovada.
- Timer usa `font-variant-numeric: tabular-nums`.
- Gaps são neutros e usam copy não julgadora.
- Preview, Timeline, Linear, Team e Insights usam HTML real, não screenshots fictícias.
- O preview mobile é reorganizado, não simplesmente escalado.
- Existe `prefers-reduced-motion: reduce` global.
- Botões principais têm hover, press e foco visível.

### Partial

- Hero usa a paleta correta, porém possui pouca profundidade e nenhuma motion ambiental.
- Navbar é transparente no topo e recebe surface/blur após scroll, mas não adapta foreground ao Hero.
- Light/Dark usam tokens e mantêm layout, mas alguns foregrounds não possuem contraste adequado.
- Theme persistence funciona, porém a transição visual é aplicada apenas a parte das surfaces.
- Hero representa segmentos conectando, porém a sequência de entrada cobre somente o rail.
- Timeline possui motion de reconstrução, mas em loop infinito e sem relação com scroll/ação.
- Product Preview é interativo, mas o timer principal é apenas uma troca de estado estático.
- Responsive layout funciona sem overflow, mas a Navbar mobile remove funções importantes.

### Divergent

- Não existe wave/curva na transição Hero → Product.
- Não existe scroll reveal por seção.
- Não existe motion reverso ou progress-driven.
- Não existe sequência de entrada para Navbar, badge, headline, copy, CTAs e preview.
- Não existe shared motion system, variants, hooks ou tokens de marketing/expressive.
- A Timeline executa animação infinita, apesar do Design System exigir estado final estável e evitar motion infinita distrativa.
- `--text-muted` diverge dos valores documentados em ambos os temas.

---

## 6. Light vs Dark Comparison

| Section         | Light                                        | Dark                            | Parity  | Issues                                                                                  |
| --------------- | -------------------------------------------- | ------------------------------- | ------- | --------------------------------------------------------------------------------------- |
| Navbar no topo  | Foregrounds de tema claro sobre Hero violeta | Foregrounds claros sobre Hero   | Partial | Light quase ilegível; Dark ainda usa secondary text de contraste insuficiente em partes |
| Hero            | Mesmo gradient e preview escuro              | Mesmo gradient e preview escuro | Good    | Background plano e transição inferior reta em ambos                                     |
| Product Preview | Canvas claro + card branco                   | Canvas carvão + card `#151823`  | Good    | Estrutura e interação preservadas                                                       |
| Pillars         | `--surface-subtle` claro                     | `--surface-subtle` escuro       | Good    | Labels violetas ficam abaixo de AA no Dark                                              |
| Timeline Story  | Canvas claro                                 | Canvas escuro                   | Good    | Motion infinita idêntica nos dois temas                                                 |
| Linear          | Surface subtle + card branco                 | Surface subtle + card carvão    | Good    | Labels/ações violetas precisam de foreground Dark específico                            |
| Workspace       | Canvas claro                                 | Canvas escuro                   | Good    | Estrutura preservada                                                                    |
| Estimate        | Surface subtle + card branco                 | Surface subtle + card carvão    | Good    | Estrutura preservada                                                                    |
| Beta            | Canvas claro                                 | Canvas escuro                   | Good    | CTA preservado                                                                          |
| Final CTA       | Brand gradient                               | Brand gradient                  | Exact   | Não há adaptação necessária; falta motion/emotional depth nos dois                      |
| Footer          | Canvas + border                              | Canvas carvão + border escuro   | Good    | Links possuem touch target pequeno no mobile                                            |

Surfaces observadas no Dark Mode:

```text
page background:    #0F1117
section background: transparent sobre canvas ou #1B1F2C
card background:    #151823
elevated/hover:      #222737
hero:                gradient fixo violeta/azul
footer:              transparente sobre #0F1117
```

Essas diferenças são tokenizadas e intencionais; não foram encontrados cards claros presos no Dark Mode.

---

## 7. Hero Deep Dive

### Current implementation

`LandingPage` renderiza `.hero`, `.hero__glow`, conteúdo central e `.reconstruction-visual`. O visual é HTML/CSS real.

### Background

Arquivo: `apps/web/src/app/globals.css`.

```text
.hero
→ linear-gradient(145deg, #4937cd 0%, #6857f5 52%, #416fef 100%)

.hero__glow
→ radial-gradient(circle, rgb(255 255 255 / 16%), transparent 65%)
→ 720 × 720px
→ right -180px / top -240px
```

Não existem:

- `background-image` com múltiplos gradients no Hero;
- pseudo-elements do Hero;
- SVG decorativo;
- `clip-path`;
- noise;
- linhas temporais ambientais;
- glows adicionais;
- ambient motion.

Conclusão: o Hero não é literalmente “apenas um gradient simples”, pois existe uma camada radial separada. Ainda assim, é uma composição mínima de **um linear gradient + um radial glow estático**, insuficiente para a direção “stage lighting / violet spotlight”.

### Lighting / Depth

A única zona de luz fica no canto superior direito. Não há foreground/midground/background nem luz central que enquadre headline e preview. O preview escuro cria contraste, mas não recebe ambient shadow ou conexão com o fundo. A percepção final é de faixa violeta uniforme, não de palco iluminado.

### Motion

Somente os três segmentos de `.reconstruction-visual__rail` executam `connect-segment` no carregamento. Headline, badge, copy, CTAs, preview e background aparecem sem sequencing. O rail usa delays de `0`, `180ms` e `360ms`, duração `1.3s`, easing `--ease-ui` e termina estável.

### Product Preview

O visual dentro do Hero é HTML/CSS, não imagem ou SVG. Ele comunica Timeline, gap e timer ativo com boa legibilidade. No mobile, três colunas viram duas + uma linha completa, preservando a informação sem overflow.

### Hero → Next Section Transition

O Hero termina como um bloco retangular. `.hero` usa `overflow: hidden`; `.landing-page` usa `overflow: clip`. Não existe pseudo-element, SVG, mask ou clip-path parcialmente implementado.

`overflow: hidden` no Hero não impede uma wave interna, mas exigirá que a forma seja desenhada dentro do Hero ou que o overflow seja deliberadamente revisto. `overflow: clip` no wrapper também precisa ser considerado caso a forma ultrapasse o container.

### Expected vs Current

| Attribute              | Current                                         | Expected                                                    |
| ---------------------- | ----------------------------------------------- | ----------------------------------------------------------- |
| Gradient               | Um linear gradient de três stops                | Gradient profundo com composição de luz em camadas          |
| Lighting               | Um radial glow branco no canto superior direito | Zonas de iluminação violeta/azul com sensação de spotlight  |
| Depth                  | Preview escuro sobre fundo plano                | Camadas sutis, glows e separação de planos                  |
| Decorative details     | Rail e mock Timeline apenas                     | Detalhes temporais/segmentos muito discretos                |
| Ambient motion         | Ausente                                         | Movimento ambiental extremamente sutil e reduzível          |
| Bottom transition      | Corte horizontal                                | Wave/curva orgânica discreta                                |
| Hero entrance          | Rail com três delays                            | Sequência Navbar → badge → headline → copy → CTAs → preview |
| Product preview motion | Rail interno; container aparece estático        | Reveal vertical/scale/perspective mínimo e estável          |

---

## 8. Motion Architecture

```text
library: CSS nativo
shared variants: ausentes
helpers: ausentes
hooks: ausentes
durations: --motion-instant, --motion-fast, --motion-standard
marketing duration token: ausente
expressive duration token: ausente
easing: --ease-ui apenas
exit easing: ausente
stagger token: ausente
scroll architecture: listener apenas para Navbar; sem observer/progress
reduced motion: media query global presente
```

Inventário técnico:

- `connect-segment`: `1.3s`, `--ease-ui`, `both`, delays `180ms/360ms`.
- `resolve-story`: `4s`, `--ease-ui`, `infinite`.
- Navbar: transitions de background e border `--motion-standard`.
- Body: transitions de background e color `--motion-standard`.
- Buttons: background/color/transform `--motion-fast`.
- ThemeSwitcher: background/color `--motion-fast`.
- Preview current: box-shadow `--motion-standard`.

Não existe `framer-motion`, `motion/react`, `motion.div`, `whileInView`, `useScroll`, `useTransform`, `AnimatePresence`, `useSpring`, `useMotionValue`, `useInView`, `IntersectionObserver` ou `requestAnimationFrame` na Landing.

---

## 9. Motion Inventory

| Section   | Element                         | Current Motion                         | Trigger        | Reverse         | Quality                               |
| --------- | ------------------------------- | -------------------------------------- | -------------- | --------------- | ------------------------------------- |
| Navbar    | Surface/border                  | transition 240ms                       | `scrollY > 24` | Yes, boolean    | Functional; foreground bug no topo    |
| Hero      | Navbar/badge/headline/copy/CTAs | None                                   | —              | No              | Missing                               |
| Hero      | Segment rail                    | scaleX + opacity, 1.3s, stagger manual | page load      | No replay       | Good micro idea, incomplete narrative |
| Hero      | Background                      | None                                   | —              | No              | Missing                               |
| Hero      | Preview container               | None                                   | —              | No              | Missing                               |
| Product   | Timer card                      | inset accent transition                | click          | Yes             | Visual state works; time does not     |
| Product   | Gap                             | class/color/rail state                 | click          | Yes             | Working, sem transition expressiva    |
| Pillars   | All                             | None                                   | —              | No              | Missing                               |
| Timeline  | Reconstructed row               | opacity + translateY loop 4s           | automatic      | Repeats forever | Concept relevant, execution unstable  |
| Linear    | Checkbox count/state            | Native checkbox update                 | click          | Yes             | Working, no connection motion         |
| Workspace | People                          | None                                   | —              | No              | Missing stagger                       |
| Insights  | Bars                            | None                                   | —              | No              | Missing progressive reveal            |
| Beta CTA  | Button                          | hover/press only                       | pointer        | Yes             | Adequate microinteraction             |
| Final CTA | Button                          | hover/press only                       | pointer        | Yes             | Emotional entrance missing            |
| Footer    | All                             | None                                   | —              | No              | Acceptable fade missing               |

---

## 10. Scroll Down Audit

| Section                      | Trigger            | Entrance              | Stagger     | Current Quality | Issue                                      |
| ---------------------------- | ------------------ | --------------------- | ----------- | --------------- | ------------------------------------------ |
| Hero                         | page load          | rail only             | 0/180/360ms | Partial         | Conteúdo principal aparece simultaneamente |
| Product Preview              | none               | none                  | none        | Missing         | Não existe reveal                          |
| Track/Reconstruct/Understand | none               | none                  | none        | Missing         | Progressão é apenas estática               |
| Timeline                     | automatic CSS loop | opacity/translate row | none        | Partial         | Não depende do viewport/scroll             |
| Tasks/Linear                 | none               | none                  | none        | Missing         | Não existe conexão visual                  |
| Team                         | none               | none                  | none        | Missing         | Não existe stagger                         |
| Insights                     | none               | none                  | none        | Missing         | Barras já aparecem completas               |
| Free CTA                     | none               | none                  | none        | Missing         | Sem entrada                                |
| Final CTA                    | none               | none                  | none        | Missing         | Sem pico emocional de motion               |
| Footer                       | none               | none                  | none        | Missing         | Sem fade discreto                          |

Ao descer lentamente ou rapidamente, a única mudança dependente do scroll é a Navbar após 24px. Nenhuma seção corre risco de ficar presa invisível, porque nenhuma delas inicia com `opacity: 0`.

---

## 11. Scroll Up Audit

Ao retornar para cima:

- seções permanecem totalmente visíveis;
- não existe fade-out;
- não existe reverse reveal;
- a Navbar volta ao estado transparente quando `scrollY <= 24`;
- `resolve-story` continua repetindo sem relação com a direção do scroll.

A arquitetura atual não suporta diretamente scroll progress-driven animation. Ela pode receber essa evolução, mas hoje exigiria introduzir um primitive/hook ou Motion e decompor as seções; não há seam compartilhado para progress, viewport ou reduced motion por componente.

---

## 12. Section-by-Section Motion Opportunities

Direção conceitual, sem implementação:

- **Hero:** sequência hierárquica curta; segmentos conectam e preview entra em estado estável.
- **Product Preview:** reveal vertical com scale mínimo; interação continua imediata.
- **Pillars:** progressão Track → Reconstruct → Understand, preferencialmente compartilhando uma cena ou rail.
- **Timeline:** conectar fragmentos conforme progresso do viewport; terminar estável.
- **Linear:** seleção específica viajando/ligando Linear → Rekko.
- **Workspace:** entrada em grupo com stagger curto nos avatares.
- **Insights:** barras crescem uma vez quando ficam visíveis.
- **Beta:** entrada simples, sem competir com o CTA final.
- **Final CTA:** retorno emocional controlado ao Hero e aos segmentos.
- **Footer:** fade discreto.

O orçamento do `DESIGN.md` deve ser preservado: uma ideia primária + uma ou duas micro motions por viewport, sem múltiplos loops simultâneos.

---

## 13. Timer Deep Dive

```text
Component: bloco inline .preview-current dentro de LandingPage
File: apps/web/src/components/landing/landing-page.tsx
State: running: boolean
Event: onClick={() => setRunning(value => !value)}
Time source: ausente
Interval: ausente
Cleanup: não aplicável; não há timer registrado
Current behavior: alterna 00:00:00 ↔ 01:27:42 e Iniciar timer ↔ Pausar
Root cause: valor exibido é uma expressão ternária com duas strings constantes
Confidence: Confirmed
```

Reprodução:

1. Abrir `/`.
2. Ir ao Product Preview.
3. Clicar em `Iniciar timer`.
4. Observar `01:27:42` imediatamente.
5. Esperar 5 segundos: `01:27:42`.
6. Esperar 30 segundos: `01:27:42`.
7. Trocar tema e scrollar: valor permanece estático.
8. Clicar `Pausar`: display volta a `00:00:00`, descartando qualquer elapsed.

Não existem `setInterval`, `setTimeout`, `Date.now`, `performance.now`, `useRef`, `requestAnimationFrame` ou timestamp associados ao preview. A arquitetura existente cobre apenas dois estados visuais; não cobre elapsed time, pause/resume acumulado ou continuidade entre abas.

---

## 14. Theme Architecture

Estratégia confirmada:

```text
Provider: next-themes
attribute: class
defaultTheme: system
enableSystem: true
storageKey: rekko-theme
DOM: html.light / html.dark
tokens: CSS variables em :root e .dark
SSR mitigation: suppressHydrationWarning no <html>
mounted state: useSyncExternalStore desabilita botões até o client mount
```

A arquitetura é centralizada em `ThemeProvider`, `ThemeSwitcher` e tokens globais. Componentes da Landing usam majoritariamente variables. O Hero e seu mockup interno possuem cores hardcoded por serem uma surface de marketing propositalmente estável.

Persistência confirmada: selecionar Dark, recarregar e observar `html.dark` preservou o tema. Não houve warning de hydration no console. Um flash no primeiro frame não pôde ser capturado deterministicamente; nenhum flash perceptível foi observado nas trocas repetidas após mount.

---

## 15. Light Mode Audit

- Canvas e surfaces seguem os tokens aprovados.
- Product Preview tem boa separação por surface, border e shadow.
- Hierarquia tipográfica e whitespace são fortes.
- O Hero mantém excelente contraste para headline/copy/CTAs.
- A Navbar no topo falha: logo violeta, links `--text-secondary` e Login são desenhados diretamente sobre o gradient violeta.
- Contraste aproximado de `#5E6172` sobre `#6857F5`: **1.25:1**.
- O wordmark violeta pode atingir aproximadamente **1:1** sobre o stop central violeta.
- `--text-muted: #707586` tem **4.10:1** sobre `--surface-subtle` e **4.29:1** sobre canvas, abaixo de 4.5:1 para textos pequenos.
- A transição Hero → Product é um corte reto.
- Section rhythm é limpo, mas muito estático para a personalidade “Alive”.

---

## 16. Dark Mode Audit

- Canvas não usa preto absoluto; segue o carvão azulado aprovado.
- Surface hierarchy `#0F1117 → #151823 → #1B1F2C → #222737` é consistente.
- Product Preview, Linear e Estimate mantêm legibilidade e elevação por surface/border.
- Não foram encontrados backgrounds claros presos no Dark Mode.
- `--brand-violet: #6857F5` é reutilizado como foreground sem uma variante clara para Dark.
- Contraste aproximado do violeta sobre canvas/surface escura: **3.34–3.84:1**, insuficiente para labels de 12–13px.
- A Navbar no Hero fica melhor que no Light graças ao wordmark branco, mas links `#A9AEBE` sobre o stop violeta ficam em torno de **2.22:1** no centro do gradient.
- A Final CTA mantém coerência com o Hero, porém não fecha o ciclo em motion.

---

## 17. Theme Switch Audit

| Test                         | Result                                                                                 |
| ---------------------------- | -------------------------------------------------------------------------------------- |
| Light → Dark → Light → Dark  | Working                                                                                |
| Topo                         | Working; evidencia contraste incorreto no Light                                        |
| Meio/Product                 | Working; cards e surfaces atualizam                                                    |
| Próximo ao footer            | Working; posição de leitura preservada                                                 |
| Persistência Dark + refresh  | Working                                                                                |
| Persistência Light + refresh | Working                                                                                |
| SVG/wordmark                 | Alterna purple/white corretamente segundo tema, mas não segundo contexto do Hero       |
| Console/hydration            | Sem errors/warnings observados                                                         |
| Transição                    | Partial; body/nav/buttons animam, muitas surfaces/text/borders mudam de forma imediata |

No mobile (`<=800px`), o ThemeSwitcher é `display: none`, portanto o usuário não consegue executar a troca manual pela Landing.

---

## 18. Responsive Audit

### Desktop — 1280/1440

- Content width de 1164px fica dentro do range aprovado.
- Hero, preview e layouts 2-colunas têm boa proporção.
- Sem overflow horizontal de conteúdo; o único elemento fora do viewport é o glow decorativo, recortado intencionalmente.
- Navbar completa cabe e permanece fixa.
- Headline máxima de 5.75rem respeita o teto de 96px.

### Laptop — 1024

- Grid e Navbar completos ainda cabem.
- Product Preview permanece legível.
- Gaps de 90px tornam os split layouts mais densos, mas sem colisão observada.

### Tablet — 768/800 e borda 801

- Em `<=800px`, a página troca para layout de uma coluna.
- Em `801px`, retorna imediatamente para Navbar e grids desktop; não houve overflow, mas a mudança é abrupta e deixa pouco espaço de respiro.
- O breakpoint implementado não coincide exatamente com o conceito `tablet 768–1023`, porém a renderização observada continuou funcional.

### Mobile — 430/390/375

- Sem overflow horizontal mensurável.
- Headline quebra de forma legível.
- CTAs empilham e ocupam a largura disponível.
- Hero Timeline vira duas colunas + active row completa.
- Product Preview remove sidebar e reorganiza timer/timeline; não usa scale artificial.
- Split sections viram uma coluna.
- Navbar mantém logo e CTA, mas remove navegação, Login e tema sem menu.
- Botão `Reconstruir` e links do Footer possuem alvo visual abaixo de 44px.
- O Hero cresce para acomodar conteúdo; não há clipping de headline ou CTAs.

---

## 19. Interaction Audit

| Element                 | Expected                    | Actual                                           | Status  |
| ----------------------- | --------------------------- | ------------------------------------------------ | ------- |
| Começar grátis — Navbar | Navegar para `/signup`      | href correto                                     | Working |
| Começar grátis — Hero   | Navegar para `/signup`      | href correto                                     | Working |
| Ver como funciona       | Scroll para `#how-it-works` | Smooth scroll; destino correto                   | Working |
| Criar minha conta       | Navegar para `/signup`      | href correto                                     | Working |
| CTA final               | Navegar para `/signup`      | href correto                                     | Working |
| Entrar                  | Navegar para `/login`       | href correto no desktop; ausente no mobile       | Partial |
| Theme switch            | Light/Dark/System           | Funciona e persiste no desktop; oculto no mobile | Partial |
| Iniciar timer           | Contagem progressiva        | Salta para valor fixo                            | Broken  |
| Pausar                  | Congelar elapsed            | Reseta para zero                                 | Broken  |
| Reconstruir             | Alterar gap de demo         | Copy/rail/ação alternam                          | Working |
| Desfazer                | Restaurar gap               | Estado retorna                                   | Working |
| Linear checkboxes       | Atualizar seleção           | Contagem 2 → 3 confirmada                        | Working |
| Navbar anchors          | Ir às seções                | hrefs corretos; ocultos no mobile                | Partial |
| Button hover            | Feedback sutil              | translateY(-1px)                                 | Working |
| Button press            | Feedback de pressão         | scale(.98)                                       | Working |
| Focus                   | Indicador visível           | outline global de 3px                            | Working |
| Cards/mockups           | Interações declaradas       | Somente controles explícitos interagem           | Working |

---

## 20. Accessibility

Pontos positivos:

- landmarks `header`, `main`, `footer`, `nav`, `aside` e `section` são usados;
- hierarquia H1 → H2 → H3 é coerente;
- seções principais usam `aria-labelledby`;
- ThemeSwitcher possui group label, labels individuais e `aria-pressed`;
- checkboxes usam `<label>` nativo;
- botões são elementos `<button>` e CTAs são links;
- foco global é visível;
- reduced motion está presente;
- wordmark decorativo tem alt vazio e link possui nome acessível.

Problemas:

- Navbar sobre o Hero falha contraste no Light e parcialmente no Dark;
- small/muted text falha AA em combinações específicas;
- labels violetas no Dark falham AA;
- `aria-label` é aplicado a `div` sem role em alguns visuais, podendo ser ignorado por tecnologias assistivas;
- timer não possui atualização real nem política `aria-live`;
- botão `Reconstruir`, Footer links e ThemeSwitcher desktop/tablet têm alvos menores que 44px;
- funções de Login/tema/navegação desaparecem no mobile.

Não foi encontrado keyboard trap no código. A tentativa automatizada de percorrer toda a ordem de tabulação no browser não produziu sinal confiável; semântica e CSS foram usados como evidência complementar.

---

## 21. Performance

Pontos positivos:

- não existem imagens pesadas de marketing; apenas SVGs de logo;
- os SVGs carregaram com dimensões naturais válidas;
- animações usam `transform` e `opacity`;
- scroll listener é `passive` e possui cleanup;
- não existem listeners duplicados, blur animado, box-shadow contínuo, layout-property animation ou requestAnimationFrame;
- mockups são HTML/CSS e respondem sem assets raster grandes;
- não houve layout overflow mensurável nos viewports pedidos.

Riscos:

- toda a Landing é um Client Component e hidrata markup que é majoritariamente estático;
- quatro estados e todas as seções vivem no mesmo componente, ampliando o escopo de render/hidratação;
- `onScroll` chama `setScrolled` em cada evento, mesmo quando o boolean não muda;
- `resolve-story` roda indefinidamente enquanto a página estiver aberta, inclusive fora do viewport;
- as duas variantes do wordmark são montadas em cada BrandMark, ainda que uma fique oculta; o browser observou seis elementos de imagem para três BrandMarks, embora existam apenas dois URLs únicos cacheáveis.

Não foi possível extrair waterfall/status HTTP completo pelo browser disponível. Não houve erro de asset ou warning de console, e todas as imagens presentes estavam `complete` com `naturalWidth > 0`.

---

## 22. Runtime / Console

Resultado durante carregamento, interações, resize, theme switch e reload:

```text
React errors: none observed
Hydration warnings: none observed
Motion warnings: n/a
Missing key warnings: none observed
Runtime exceptions: none observed
Failed image signals: none observed
```

O detector estático do Impeccable retornou `[]` para `landing-page.tsx`. Isso não invalida os issues manuais: o detector não cobre timer sem relógio, contraste contextual sobre gradient, ausência de wave ou requisitos específicos de motion.

---

## 23. Network

- Nenhum asset quebrado foi observado.
- Wordmarks purple/white carregaram corretamente.
- Manrope é empacotada localmente; não foi observada dependência de font CDN.
- Não foram observadas chamadas de backend para as interações de demonstração, como esperado.
- Não foram observados requests inesperados provocados por timer, reconstrução ou checkboxes.
- A Landing carrega chunks do App Router, layout, page, global error, polyfills e um CSS compilado.

Limitação: o browser disponível não expôs um waterfall de rede completo com status/size confiável para cada request; portanto a ausência de 404 foi cruzada com console vazio e assets DOM completos.

---

## 24. File / Component Map

| Area                 | Component                          | File                                                   |
| -------------------- | ---------------------------------- | ------------------------------------------------------ |
| Route                | `HomePage`                         | `apps/web/src/app/page.tsx`                            |
| Landing completa     | `LandingPage`                      | `apps/web/src/components/landing/landing-page.tsx`     |
| Timeline row         | `PreviewEvent`                     | `apps/web/src/components/landing/landing-page.tsx`     |
| Brand                | `BrandMark`                        | `apps/web/src/components/brand-mark.tsx`               |
| Theme control        | `ThemeSwitcher`                    | `apps/web/src/components/theme-switcher.tsx`           |
| Theme provider       | `ThemeProvider`                    | `apps/web/src/components/providers/theme-provider.tsx` |
| Theme mount          | `RootLayout`                       | `apps/web/src/app/layout.tsx`                          |
| Tokens               | `:root`, `.dark`                   | `apps/web/src/app/globals.css`                         |
| Landing styles       | `.landing-page` até reduced-motion | `apps/web/src/app/globals.css`                         |
| Button primitive CSS | `.button*`                         | `apps/web/src/app/globals.css`                         |
| Motion helpers       | Não existem                        | —                                                      |
| Motion tokens        | `--motion-*`, `--ease-ui`          | `apps/web/src/app/globals.css`                         |
| Timer logic          | estado inline `running`            | `apps/web/src/components/landing/landing-page.tsx`     |
| Dependencies         | Next/React/next-themes             | `apps/web/package.json`                                |

---

# Issue Inventory

| ID       | Severity | Area                     | Problem                                           | File                                | Root Cause                                                              | Confidence |
| -------- | -------- | ------------------------ | ------------------------------------------------- | ----------------------------------- | ----------------------------------------------------------------------- | ---------- |
| LAND-001 | P1       | Functionality            | Timer não avança e Pause reseta                   | `landing-page.tsx`                  | Boolean + strings constantes; sem time source                           | Confirmed  |
| LAND-002 | P1       | Hero/Navbar              | Navbar quase ilegível sobre Hero no Light         | `landing-page.tsx`, `globals.css`   | Foreground segue tema, não contexto do Hero                             | Confirmed  |
| LAND-003 | P1       | Accessibility/Theme      | Contraste AA falha em muted/brand foregrounds     | `globals.css`                       | Um token violeta e muted usados em surfaces com luminâncias diferentes  | Confirmed  |
| LAND-004 | P1       | Mobile/Navbar            | Login, tema e navegação somem no mobile           | `globals.css`                       | `display: none` sem menu/alternativa                                    | Confirmed  |
| LAND-005 | P2       | Hero                     | Wave Hero → Product ausente                       | `globals.css`                       | Nenhuma layer/pseudo/SVG/clip-path de transição                         | Confirmed  |
| LAND-006 | P2       | Hero                     | Background não atinge stage-lighting depth        | `globals.css`                       | Apenas um linear gradient + um radial glow estático                     | Confirmed  |
| LAND-007 | P2       | Motion                   | Scroll reveal/reverse e motion por seção ausentes | `landing-page.tsx`, `globals.css`   | Sem observer, progress hook, Motion ou section primitives               | Confirmed  |
| LAND-008 | P2       | Motion/Timeline          | Reconstrução pisca em loop infinito               | `globals.css`                       | `resolve-story 4s ... infinite`                                         | Confirmed  |
| LAND-009 | P2       | Theme                    | Theme transition é parcial                        | `globals.css`, `theme-provider.tsx` | Transitions cobrem body/nav/buttons, não todas as surfaces/text/borders | Confirmed  |
| LAND-010 | P2       | Accessibility/Mobile     | Touch targets abaixo de 44px                      | `globals.css`                       | Ações text-only e icon buttons sem hit-area adequada                    | Confirmed  |
| LAND-011 | P2       | Accessibility            | `aria-label` em containers genéricos sem role     | `landing-page.tsx`                  | Visuais são `div` nomeadas, mas sem semântica explícita                 | Confirmed  |
| LAND-012 | P2       | Architecture/Performance | Landing monolítica e totalmente client-side       | `landing-page.tsx`                  | Todas as seções e estados no mesmo Client Component                     | Confirmed  |
| LAND-013 | P3       | Design tokens            | `--text-muted` diverge do `DESIGN.md`             | `globals.css`, `DESIGN.md`          | Valores implementados diferentes do source of truth                     | Confirmed  |
| LAND-014 | P3       | Performance              | Scroll handler atualiza state a cada evento       | `landing-page.tsx`                  | Handler sem guarda de mudança/observer                                  | Confirmed  |
| LAND-015 | P3       | Final CTA                | Fechamento visual não completa o ciclo em motion  | `landing-page.tsx`, `globals.css`   | CTA repete gradient/segmentos de forma estática                         | Confirmed  |

---

## LAND-001 — Timer demonstrativo não avança

**Severity:** P1

**Area:** Functionality / Product Preview

**Observed behavior:** clicar `Iniciar timer` troca imediatamente `00:00:00` por `01:27:42`; o valor permanece igual após 5 e 30 segundos. `Pausar` volta a zero.

**Expected behavior:** elapsed cresce por segundo e Pause congela o valor; uma evolução futura pode adicionar Resume.

**Steps to reproduce:** Product Preview → Iniciar timer → aguardar 30s → Pausar.

**Affected file(s):** `apps/web/src/components/landing/landing-page.tsx`.

**Affected component(s):** `LandingPage`, `.preview-current`, `.preview-timer`.

**Root cause:** `running` é apenas boolean e o display é `{running ? "01:27:42" : "00:00:00"}`. Não existe clock, timestamp, elapsed state, interval ou cleanup.

**Evidence:** source lines 11, 143–160; browser: `t0 = t5 = t30 = 01:27:42`.

**Suggested direction:** preservar a interação e introduzir uma fonte monotônica/recalculada de elapsed adequada a uma demo, com Pause/Resume e cleanup. Não confundir esse preview local com o timer server-authoritative do produto.

**Dependencies:** definição pequena de comportamento da demo; testes com fake clock.

**Risks:** interval ingênuo pode driftar ou duplicar em lifecycle/Strict Mode.

**Confidence:** Confirmed.

## LAND-002 — Navbar usa foreground do tema sobre o Hero

**Severity:** P1

**Area:** Hero / Navbar / Accessibility

**Observed behavior:** no Light Mode, wordmark violeta e links cinza ficam quase invisíveis sobre o Hero violeta. No Dark, o logo branco funciona, mas links continuam fracos.

**Expected behavior:** Navbar transparente deve usar foreground invertido sobre o Hero e migrar para foreground do tema após scroll.

**Steps to reproduce:** selecionar Light → retornar ao topo.

**Affected file(s):** `landing-page.tsx`, `brand-mark.tsx`, `globals.css`.

**Affected component(s):** `BrandMark`, `.marketing-nav`, `.marketing-nav__links`, `.marketing-nav__login`.

**Root cause:** `BrandMark` não recebe `inverted`; links sempre usam `--text-secondary`; a troca de contexto só adiciona surface/border, sem estado de foreground.

**Evidence:** browser computed `#5E6172` sobre Hero; contraste aproximado 1.25:1; screenshot reproduz logo violeta sobre violeta.

**Suggested direction:** modelar explicitamente estado “over hero” vs “scrolled surface”, incluindo wordmark e foregrounds.

**Dependencies:** nenhuma nova dependência.

**Risks:** troca de foreground precisa acompanhar scroll e tema sem flicker.

**Confidence:** Confirmed.

## LAND-003 — Tokens de foreground não garantem contraste por tema/surface

**Severity:** P1

**Area:** Accessibility / Theming

**Observed behavior:** textos muted pequenos falham no Light sobre subtle/canvas; labels violetas falham no Dark; links da Navbar falham sobre Hero.

**Expected behavior:** texto normal ≥4.5:1; texto grande ≥3:1.

**Steps to reproduce:** inspecionar labels de seção, timestamps, helper text e Linear flow nos dois temas.

**Affected file(s):** `apps/web/src/app/globals.css`.

**Affected component(s):** `.section-label`, `.preview-event time`, `.timeline-story time`, `.pillar-demo--track span`, `.linear-selector__flow i` e similares.

**Root cause:** brand color é usado simultaneamente como fill e foreground; muted não varia por surface; não existe token como `--brand-foreground`/`--text-on-brand` por tema.

**Evidence:** `#707586/#F1F2F7 = 4.10:1`; `#6857F5` sobre dark surfaces = 3.34–3.84:1.

**Suggested direction:** auditar pares reais e criar foreground semântico claro para Dark, mantendo brand fill original.

**Dependencies:** revisão de tokens e contraste.

**Risks:** alterar o brand token global pode quebrar fills; separar papéis é mais seguro.

**Confidence:** Confirmed.

## LAND-004 — Navbar mobile remove funções sem alternativa

**Severity:** P1

**Area:** Responsive / Navigation / Theme

**Observed behavior:** abaixo de 801px desaparecem links Produto/Como funciona/Integrações, Login e ThemeSwitcher. Restam logo + Começar grátis.

**Expected behavior:** ações essenciais continuam acessíveis por menu/drawer apropriado; Light/Dark continuam selecionáveis.

**Steps to reproduce:** viewport 390/430/768.

**Affected file(s):** `apps/web/src/app/globals.css`.

**Affected component(s):** `.marketing-nav__links`, `.marketing-nav__login`, `.marketing-nav__actions .theme-switcher`.

**Root cause:** media query usa `display: none` sem criar trigger/menu mobile.

**Evidence:** CSS lines 855–859; DOM visual confirma apenas logo + CTA.

**Suggested direction:** preservar CTA e adicionar navegação mobile compacta acessível com Login e Theme.

**Dependencies:** primitive de menu/dialog acessível já alinhado ao Design System.

**Risks:** stacking/scroll lock/focus management.

**Confidence:** Confirmed.

## LAND-005 — Transição orgânica do Hero está ausente

**Severity:** P2

**Area:** Visual / Hero

**Observed behavior:** Hero termina em corte horizontal direto.

**Expected behavior:** wave/curva discreta conectando Hero e Product.

**Steps to reproduce:** observar limite inferior do Hero em qualquer tema/viewport.

**Affected file(s):** `apps/web/src/app/globals.css`.

**Affected component(s):** `.hero`, `.landing-page`, `.product-section`.

**Root cause:** não existe pseudo-element, SVG, mask ou clip-path; overflow apenas recorta.

**Evidence:** source e render.

**Suggested direction:** forma simples em CSS/SVG, responsiva e sem caricatura, revisando os dois overflows.

**Dependencies:** nenhuma biblioteca.

**Risks:** gaps/aliasing e recorte em mobile.

**Confidence:** Confirmed.

## LAND-006 — Hero tem pouca profundidade de iluminação

**Severity:** P2

**Area:** Visual / Hero background

**Observed behavior:** gradient uniforme com um glow branco no canto.

**Expected behavior:** spotlight violeta clean, zonas de luz e profundidade sutil.

**Steps to reproduce:** observar Hero completo Light/Dark.

**Affected file(s):** `apps/web/src/app/globals.css`.

**Affected component(s):** `.hero`, `.hero__glow`.

**Root cause:** composição limitada a duas layers, sem relação espacial com conteúdo.

**Evidence:** CSS lines 194–209.

**Suggested direction:** compor poucos gradients/pseudo-elements com luz direcionada e motion ambiental reduzível.

**Dependencies:** wave e motion foundation podem compartilhar layers.

**Risks:** virar neon/template; custo de blur excessivo.

**Confidence:** Confirmed.

## LAND-007 — Não existe sistema de motion por scroll

**Severity:** P2

**Area:** Motion / Architecture

**Observed behavior:** seções aparecem estáticas; scroll up/down não altera entrada/saída.

**Expected behavior:** fade + deslocamento sutil por seção, linguagem diferenciada e possibilidade de progress-driven motion.

**Steps to reproduce:** percorrer toda a página lentamente e rapidamente, depois voltar.

**Affected file(s):** `landing-page.tsx`, `globals.css`, `apps/web/package.json`.

**Affected component(s):** todas as sections.

**Root cause:** sem Motion, observer, hook ou primitive compartilhado; todas as sections estão inline.

**Evidence:** busca por APIs de motion/scroll retornou apenas listener da Navbar e CSS keyframes.

**Suggested direction:** estabelecer motion tokens/primitive primeiro, depois motions específicos; conteúdo deve permanecer visível por padrão.

**Dependencies:** decisão entre CSS/IntersectionObserver e Motion; reduced motion já existe como baseline.

**Risks:** ocultar conteúdo antes do trigger, excesso de animação, reflows.

**Confidence:** Confirmed.

## LAND-008 — Timeline reconstruída pisca indefinidamente

**Severity:** P2

**Area:** Motion / Timeline

**Observed behavior:** row reconstruída some, entra e some novamente a cada 4s, mesmo fora do viewport.

**Expected behavior:** reconstrução ligada a entrada/ação/scroll e terminando estável.

**Steps to reproduce:** observar Timeline por mais de 4s; scrollar para fora e voltar.

**Affected file(s):** `apps/web/src/app/globals.css`.

**Affected component(s):** `.timeline-story__resolved`.

**Root cause:** `animation: resolve-story 4s var(--ease-ui) infinite`.

**Evidence:** CSS lines 648–670.

**Suggested direction:** executar uma vez por contexto significativo e manter estado final visível.

**Dependencies:** LAND-007.

**Risks:** replay agressivo ao reler; invisibilidade em reduced motion se initial state for mal definido.

**Confidence:** Confirmed.

## LAND-009 — Theme transition cobre apenas parte da composição

**Severity:** P2

**Area:** Theming / Motion

**Observed behavior:** tema atualiza corretamente, mas surfaces, borders e vários textos mudam sem a transição 180–240ms desejada.

**Expected behavior:** background, surface, text e border fazem transição coordenada sem flash.

**Steps to reproduce:** alternar rapidamente Light/Dark no Product e próximo ao Footer.

**Affected file(s):** `globals.css`, `theme-provider.tsx`.

**Affected component(s):** sections/cards gerais.

**Root cause:** transitions estão em body, Navbar, buttons e ThemeSwitcher; os cards/sections não declaram transition e `disableTransitionOnChange` está false.

**Evidence:** source e troca repetida no browser.

**Suggested direction:** aplicar transição por primitives/surfaces relevantes, respeitando reduced motion; evitar wildcard caro.

**Dependencies:** tokens semânticos estáveis.

**Risks:** transicionar propriedades demais e degradar performance.

**Confidence:** Confirmed.

## LAND-010 — Alvos de toque menores que 44px

**Severity:** P2

**Area:** Accessibility / Responsive

**Observed behavior:** `Reconstruir` mede aproximadamente 81×18.5px; footer links ~16.5px de altura; theme options 36×36px em desktop/tablet.

**Expected behavior:** hit-area confortável de pelo menos 44×44px quando touch é plausível.

**Steps to reproduce:** viewport 390 e inspeção de rects.

**Affected file(s):** `apps/web/src/app/globals.css`.

**Affected component(s):** `.preview-event button`, `.landing-footer nav a`, `.theme-switcher__option`.

**Root cause:** text/icon controls sem padding/min-height adequada.

**Evidence:** browser bounding boxes e CSS.

**Suggested direction:** aumentar hit-area sem inflar visualmente o controle.

**Dependencies:** nenhuma.

**Risks:** desalinhamento da Timeline; resolver com wrapper/hit padding.

**Confidence:** Confirmed.

## LAND-011 — Nomes acessíveis estão em `div` sem role

**Severity:** P2

**Area:** Accessibility / Semantics

**Observed behavior:** visuais usam `aria-label` em containers genéricos.

**Expected behavior:** visual decorativo é oculto e descrito em copy, ou recebe semântica/role coerente.

**Steps to reproduce:** inspecionar accessibility tree/DOM de reconstruction visual, preview timeline, timeline story e Linear selector.

**Affected file(s):** `apps/web/src/components/landing/landing-page.tsx`.

**Affected component(s):** `.reconstruction-visual`, `.preview-timeline`, `.timeline-story`, `.linear-selector`.

**Root cause:** `aria-label` usado como substituto de role/estrutura.

**Evidence:** source lines 77–80, 162–165, 279–282, 322–325.

**Suggested direction:** decidir caso a caso entre `role="img"` + descrição, lista semântica, fieldset ou `aria-hidden`.

**Dependencies:** revisão de narrativa para screen reader.

**Risks:** duplicar toda a copy visual e gerar ruído.

**Confidence:** Confirmed.

## LAND-012 — Landing inteira hidrata como um componente monolítico

**Severity:** P2

**Area:** Architecture / Performance / Maintainability

**Observed behavior:** `LandingPage` tem cerca de 470 linhas, quatro estados, listener global e todas as seções.

**Expected behavior:** seções estáticas server-rendered e islands/client components apenas onde interação/motion exige.

**Steps to reproduce:** inspecionar arquivo e directive `"use client"`.

**Affected file(s):** `apps/web/src/components/landing/landing-page.tsx`.

**Affected component(s):** Landing inteira.

**Root cause:** primeira implementação concentrou estrutura, estado e demo no mesmo boundary.

**Evidence:** directive line 1; árvore real do componente.

**Suggested direction:** decompor por responsabilidade durante a wave de implementação, sem criar abstrações genéricas prematuras.

**Dependencies:** definição do motion system para escolher boundaries.

**Risks:** refactor amplo; deve ser incremental e visualmente neutro.

**Confidence:** Confirmed.

## LAND-013 — `--text-muted` diverge do source of truth

**Severity:** P3

**Area:** Design tokens / Documentation

**Observed behavior:** implementação usa Light `#707586` e Dark `#9299AA`; `DESIGN.md` documenta Light `#8D91A1` e Dark `#747B8F`.

**Expected behavior:** documentos e tokens concordam ou a decisão é registrada.

**Steps to reproduce:** comparar `DESIGN.md` com `globals.css`.

**Affected file(s):** `DESIGN.md`, `apps/web/src/app/globals.css`.

**Affected component(s):** todos que usam `--text-muted`.

**Root cause:** token foi alterado sem atualização de decisão ou vice-versa.

**Evidence:** CSS variables.

**Suggested direction:** resolver a divergência junto da auditoria de contraste; não copiar cegamente o valor documentado, pois ele também precisa ser validado por surface.

**Dependencies:** LAND-003.

**Risks:** regressão de contraste se o documento vencer sem medição.

**Confidence:** Confirmed.

## LAND-014 — Scroll handler executa setter em todo evento

**Severity:** P3

**Area:** Performance

**Observed behavior:** cada evento chama `setScrolled(window.scrollY > 24)`.

**Expected behavior:** atualizar somente ao cruzar threshold ou usar observer/guard simples.

**Steps to reproduce:** inspecionar effect da Landing.

**Affected file(s):** `apps/web/src/components/landing/landing-page.tsx`.

**Affected component(s):** `LandingPage`.

**Root cause:** handler sem comparação contra estado anterior.

**Evidence:** lines 15–20. Listener é passive e possui cleanup, reduzindo impacto.

**Suggested direction:** resolver como parte da motion/nav foundation, não como refactor isolado urgente.

**Dependencies:** LAND-007 opcional.

**Risks:** baixo.

**Confidence:** Confirmed.

## LAND-015 — Final CTA não fecha o ciclo em motion

**Severity:** P3

**Area:** Motion / Brand

**Observed behavior:** Final CTA repete gradient, segmentos e headline, porém tudo aparece estático.

**Expected behavior:** fechamento emocional conectado ao Hero e à ideia de segmentos reconstruídos.

**Steps to reproduce:** chegar à Final CTA em qualquer tema.

**Affected file(s):** `landing-page.tsx`, `globals.css`.

**Affected component(s):** `.final-cta`, `.segment-mark`.

**Root cause:** somente layout/hover foi implementado.

**Evidence:** source e render.

**Suggested direction:** entrada única, forte mas curta, reutilizando a gramática temporal do Hero.

**Dependencies:** LAND-007.

**Risks:** competir com Hero ou manter loop decorativo.

**Confidence:** Confirmed.

---

# Expected vs Current — Motion

| Requirement             | Current Status                  | Gap                                                          |
| ----------------------- | ------------------------------- | ------------------------------------------------------------ |
| Section fade-in         | Ausente                         | Todas as seções aparecem estáticas                           |
| Vertical reveal         | Somente Timeline loop usa 8px   | Não existe reveal de seção/preview                           |
| Stagger                 | Rail do Hero com delays manuais | Não existe primitive nem stagger por seção                   |
| Section-specific motion | Quase ausente                   | Pillars, Linear, Team, Insights e CTAs sem linguagem própria |
| Scroll reverse          | Ausente                         | Somente Navbar reverte threshold                             |
| Reduced motion          | Presente globalmente            | Deve continuar válido após nova arquitetura                  |
| Shared motion system    | Ausente                         | Apenas UI tokens genéricos e duas keyframes locais           |

---

# What Should Be Preserved

1. **Copy e hierarquia do Hero.** A promessa é clara, humana e alinhada à tagline oficial.
2. **Conceito do preview interativo.** Timer, reconstrução e seleção Linear fazem a Landing demonstrar o produto em vez de apenas descrevê-lo.
3. **Narrativa Track / Reconstruct / Understand.** A sequência traduz o domínio sem parecer folha de ponto.
4. **Timeline e gaps neutros.** Rail, dashed gap e copy não julgadora são a parte mais proprietária da interface.
5. **Fundação Light/Dark tokenizada.** Surfaces e layout possuem boa paridade; a correção deve focar foregrounds/transitions, não redesenhar tudo.
6. **Product Preview como HTML real.** Ele é responsivo, interativo e evita dependência de screenshots obsoletas.
7. **Uso contido de cor.** O produto permanece neutro e o violeta atua como assinatura/ação.
8. **Seção Linear seletiva.** Árvore/checks/count deixam clara a política de importação intencional.
9. **Team e Insights sem linguagem de RH/BI.** Os visuais são simples e coerentes com o posicionamento.
10. **Estrutura de CTA.** CTA primário, beta simples e final emocional formam um funil claro.
11. **Responsividade do mockup.** Sidebar some e conteúdo se reorganiza sem scale artificial nem overflow.
12. **Reduced motion e microinterações de botão.** São uma base correta para evoluir.

---

# What Should Change

| Type               | Change                                                             |
| ------------------ | ------------------------------------------------------------------ |
| Bug                | Tornar o timer progressivo e Pause coerente                        |
| Bug                | Corrigir foreground da Navbar sobre o Hero                         |
| Bug                | Restaurar Login/tema/navegação no mobile por alternativa acessível |
| Bug                | Corrigir contrastes AA de muted/brand foreground                   |
| Design divergence  | Adicionar wave Hero → Product                                      |
| Design divergence  | Construir stage lighting com maior profundidade                    |
| Motion improvement | Criar hero entrance hierárquica                                    |
| Motion improvement | Criar scroll reveal e language específica por seção                |
| Motion improvement | Remover loop infinito da reconstrução                              |
| Motion improvement | Completar theme transition                                         |
| UX improvement     | Aumentar touch targets                                             |
| UX improvement     | Corrigir semântica dos visuais nomeados                            |
| Technical debt     | Decompor boundary client monolítico                                |
| Technical debt     | Alinhar tokens documentados e implementados                        |
| Polish             | Fechar o ciclo Hero/Final CTA em motion                            |

---

# Recommended Execution Waves

## Wave 1 — Functional Stability

1. LAND-001 — timer progressivo, Pause/Resume e lifecycle.
2. LAND-002 — Navbar contextual sobre Hero.
3. LAND-003 — contrastes AA.
4. LAND-004 — navegação/tema/Login mobile.
5. LAND-010/LAND-011 — touch targets e semântica concreta.

## Wave 2 — Theme & Visual Foundation

1. LAND-013 — reconciliar tokens e documento com contraste medido.
2. LAND-009 — transition coordenada Light/Dark.
3. LAND-006 — lighting/depth do Hero.
4. LAND-005 — wave Hero → Product.

## Wave 3 — Motion Foundation

1. LAND-012 — decomposição mínima das seções/boundaries.
2. LAND-007 — primitive de viewport/progress, durations/easing/stagger e reduced motion.
3. LAND-008 — substituir loop infinito por evento/entrada estável.
4. LAND-014 — integrar Navbar ao mecanismo de scroll mais eficiente.

## Wave 4 — Section-specific Motion

1. Hero sequencing e preview reveal.
2. Pillars progressivos.
3. Timeline reconstruction progress-driven.
4. Linear connections.
5. Team stagger.
6. Insight bars.
7. Beta/Final/Footer entrances.

## Wave 5 — Final Polish

1. LAND-015 — ciclo Hero → Final CTA.
2. Hover/focus/press finais.
3. Ajustes de spacing/timing por viewport.
4. Teste visual Light/Dark/Desktop/Tablet/Mobile/Keyboard.
5. Performance profiling e nova auditoria.

Nenhuma wave foi implementada nesta etapa.
