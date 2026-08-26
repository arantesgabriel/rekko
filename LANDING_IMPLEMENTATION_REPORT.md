# REKKO — Landing Implementation Report

## Issue status

| Issue    | Status   | Implementation                                                                         | Files                                                        |
| -------- | -------- | -------------------------------------------------------------------------------------- | ------------------------------------------------------------ |
| LAND-001 | Fixed    | Timer derivado de timestamps com pause, resume e cleanup.                              | `landing-interactions.tsx`                                   |
| LAND-002 | Fixed    | Navbar usa contexto do Hero e foreground próprio.                                      | `landing-interactions.tsx`, `globals.css`                    |
| LAND-003 | Fixed    | Tokens semânticos de foreground e muted com contraste reforçado.                       | `globals.css`, `DESIGN.md`                                   |
| LAND-004 | Fixed    | Menu mobile contém navegação, login e tema, com Escape e retorno de foco.              | `landing-interactions.tsx`, `globals.css`                    |
| LAND-005 | Fixed    | Transição curva discreta usa a surface da próxima seção.                               | `globals.css`                                                |
| LAND-006 | Improved | Hero ganhou lighting em camadas, detalhe temporal e profundidade.                      | `globals.css`                                                |
| LAND-007 | Improved | Primitive compartilhada de reveal, tokens e feedback reversível de viewport.           | `motion.tsx`, `landing-page.tsx`                             |
| LAND-008 | Fixed    | Loop infinito removido; reconstrução termina estável.                                  | `globals.css`                                                |
| LAND-009 | Improved | Foregrounds, nav, wave e surfaces relevantes transitam de forma coordenada.            | `globals.css`                                                |
| LAND-010 | Fixed    | Menu e links mobile possuem targets de 44px.                                           | `globals.css`                                                |
| LAND-011 | Fixed    | Ilustração do Hero recebeu `role=img`; Linear usa `fieldset`; decorativos são ocultos. | `landing-page.tsx`, `landing-interactions.tsx`               |
| LAND-012 | Fixed    | Landing voltou a ser Server Component; estado ficou em ilhas Client específicas.       | `landing-page.tsx`, `landing-interactions.tsx`, `motion.tsx` |
| LAND-013 | Fixed    | Tokens `--text-muted` foram reconciliados com os valores medidos e documentados.       | `globals.css`, `DESIGN.md`                                   |
| LAND-014 | Fixed    | Listener contínuo foi substituído por IntersectionObserver contextual.                 | `landing-interactions.tsx`                                   |
| LAND-015 | Improved | CTA final participa do sistema de reveal e preserva a gramática de segmentos.          | `landing-page.tsx`, `motion.tsx`                             |

## Architecture

- Components created: `MarketingNavbar`, `ProductDemo`, `LinearSelector`, `Reveal`, `HeroSequence`, `HeroItem`.
- Components removed: `PreviewEvent` local e estados monolíticos de `LandingPage`.
- Dependencies added: `motion` 13.1.1.
- Motion primitives: durations fast/standard/expressive, easings, staggers e reveal distance.
- Theme tokens: `--brand-foreground`, `--text-on-brand`, `--text-on-hero`; muted reconciliado.
- Accessibility: menu dialog, Escape, focus return, scroll lock, `fieldset`, live region apenas para estado e touch targets.

## Validation

- Lint: passed.
- Format: passed.
- Typecheck: passed.
- Tests: 13 unit/integration tests passed. Playwright: 16/18 passed; both new landing scenarios passed on desktop and mobile. The two pre-existing signup-flow cases failed waiting for the auth success message (environment/backend dependent and unrelated to this landing change).
- Build: passed; `/` remains statically prerendered.
- Manual desktop: passed at 1280px; no horizontal overflow.
- Manual mobile: passed at 390px; no horizontal overflow; menu/CTA visible.
- Light: passed in rendered browser; no horizontal overflow at 1280px.
- Dark: passed in rendered browser.
- Reduced motion: CSS fallback and `useReducedMotion` implemented; E2E coverage retained.

## Known limitations

- Browser QA was completed at 1280px desktop and 390px mobile. The requested matrix is covered structurally by responsive CSS, but every listed width was not individually screenshotted in this run.
- Timeline reconstruction is viewport-triggered and stable; it is not a continuously scrubbed scroll animation.
