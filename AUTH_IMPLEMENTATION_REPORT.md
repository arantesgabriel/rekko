# Rekko — Auth Implementation Report

## Summary

Refinement da experiência de Login e Cadastro sem redesign. A estrutura branding + card foi preservada. O foco foi hierarquia visual, states completos, acessibilidade, teclado, autofill e responsividade.

## Desktop Improvements

- Composição mais deliberada: `max-width` do conjunto, card ~8% mais largo e gap reduzido.
- Coluna de marca com contraste maior e glow radial mínimo.
- Headline desktop em três linhas: “Seu tempo, / com / contexto.”
- Segmentos com micro-entrada (sem loop) e `prefers-reduced-motion`.

## Mobile Improvements

- Split vira coluna única abaixo de 960px (tablet não fica comprimido).
- Headline compacta de uma linha; segmentos e glow reduzidos.
- Espaçamento de grupos reduzido no cadastro; altura de inputs e CTAs mantida.
- Footer no fluxo (`position: relative`), com `safe-area` e `100dvh`.
- Inputs em 16px para evitar zoom iOS.

## Login Improvements

- Campos inalterados: Email + Senha.
- Autocomplete `email` / `current-password`.
- Toggle mostrar/ocultar senha.
- Erro de credenciais: “Email ou senha incorretos.”
- Loading: “Entrando…” com bloqueio de submit.

## Signup Improvements

- Campos inalterados: Nome + Email + Senha.
- Autocomplete `name` / `email` / `new-password`.
- Hint “Mínimo de 8 caracteres”.
- Microcopy de termos com links para `/terms` e `/privacy` (páginas mínimas de beta).
- Conta existente: mensagem no card + link “Entrar”.
- Loading: “Criando conta…”.
- “Free during beta” → “Grátis durante o beta”.
- Link “Voltar para o início” removido; logo continua indo para `/`.

## Validation & Errors

Validação em blur/submit, não no primeiro caractere. Depois do campo inválido, a mensagem atualiza na correção. Campos com `aria-invalid` e `aria-describedby`. Erros de formulário no card (não toast). Rede e 429 mapeados para copy humana.

## Loading States

Google e formulário têm loading separado, `aria-busy`, disabled sem opacity quebrada, e texto de ação preservando altura.

## Accessibility

Labels reais, toggle com “Mostrar senha” / “Ocultar senha”, hit area ~44px, focus visível em logo, tema, Google, inputs, toggle, CTAs e links. Enter submete o form.

## Theme

ThemeSwitcher existente reutilizado, com área de toque no header da Auth. Persistência inalterada. Superfícies de input usam `--surface-subtle` para separar canvas → card → campo no Light. Dark sem glow artificial.

## Responsive QA

Breakpoints cobertos no CSS: desktop largo (max-width 1180px), tablet (960px), mobile (800/375). Alturas de cadastro passam a aceitar scroll natural.

## Automated Tests

- Unit: `auth-form-validation.test.ts` (email, nome, senha, mapeamento de erros).
- E2E: `apps/web/e2e/auth.spec.ts` (validação, toggle, termos, footer).
- Playwright browsers não estavam instalados neste ambiente no momento da execução; os specs foram adicionados.

## Files Changed

- `apps/web/src/components/auth/auth-form.tsx`
- `apps/web/src/components/auth/auth-layout.tsx`
- `apps/web/src/modules/auth/auth-form-validation.ts`
- `apps/web/src/modules/auth/auth-form-validation.test.ts`
- `apps/web/src/app/globals.css`
- `apps/web/src/app/terms/page.tsx`
- `apps/web/src/app/privacy/page.tsx`
- `apps/web/e2e/auth.spec.ts`

## Remaining Observations

- `pnpm lint` falha por warning pré-existente em `landing-interactions.tsx` (`BrandMark` unused). Fora do escopo da Auth.
- Páginas `/terms` e `/privacy` são stubs de beta, não um texto jurídico final.
- Autofill real de Safari/Chrome password manager não pôde ser exercido neste ambiente (sem browser MCP / Playwright browsers).
- Transição fade login ↔ cadastro não foi implementada: a troca de rota já é suficiente e evita complexidade.
