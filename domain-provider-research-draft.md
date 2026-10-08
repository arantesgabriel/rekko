# Avaliação de domínio e registradores — Rekko

**Data da pesquisa:** 2026-09-03 (America/Sao_Paulo)  
**Escopo:** preços públicos em USD para registros e renovações de 1 ano, nomes não premium, nos TLDs `.com`, `.app`, `.dev`, `.io` e `.co`.  
**Compras:** nenhuma compra, cadastro, login, checkout ou alteração de domínio foi realizada.

## Como ler os preços

- “Registro” é o primeiro ano. “Renovação” é o preço anual recorrente publicado pelo provider.
- Quando há promoção de primeiro ano, ela está marcada como **promo** e não deve ser comparada diretamente com a renovação.
- Valores de nomes premium, aftermarket, impostos, conversão cambial, taxas de pagamento, campanhas por conta/região e exigências de prazo podem alterar o total.
- Os preços abaixo são os exibidos nas páginas oficiais consultadas na data acima; não são uma cotação para um nome específico.
- `.io` e `.co` são ccTLDs; `.com`, `.app` e `.dev` são gTLDs. A política de privacidade, DNS e elegibilidade pode variar por registry/TLD.

## Resumo de preços

### Cloudflare Registrar

| TLD | Registro | Renovação | Observação |
|---|---:|---:|---|
| `.com` | Não publicado como preço varejo por TLD | Não publicado | Cloudflare cobra o custo do registry + ICANN, sem markup; a cotação é obtida no Dashboard/API para o domínio concreto. |
| `.app` | Não publicado como preço varejo por TLD | Não publicado | Mesmo modelo “at cost”; sem tabela pública consolidada. |
| `.dev` | Não publicado como preço varejo por TLD | Não publicado | Mesmo modelo “at cost”; sem tabela pública consolidada. |
| `.io` | Não publicado como preço varejo por TLD | Não publicado | Mesmo modelo “at cost”; sem tabela pública consolidada. |
| `.co` | Não publicado como preço varejo por TLD | Não publicado | Mesmo modelo “at cost”; sem tabela pública consolidada. |

**Por que não há números Cloudflare:** a documentação oficial informa que o Registrar cobra o preço do registry e da ICANN, e que a API `domain-check` retorna `registration_cost`/`renewal_cost` por domínio. Os exemplos numéricos da documentação da API são exemplos de resposta, não uma tabela de preços vigente, portanto não foram tratados como cotação atual.

Fontes: [modelo de cobrança do Cloudflare Registrar](https://developers.cloudflare.com/registrar/), [API de preços e verificação](https://developers.cloudflare.com/api/resources/registrar/), [FAQ de cobrança](https://developers.cloudflare.com/registrar/faq/).

### Spaceship

| TLD | Registro publicado | Renovação publicada | ICANN exibida |
|---|---:|---:|---:|
| `.com` | **US$ 8,88 promo**; US$ 9,66 regular | US$ 9,98 | US$ 0,20/ano |
| `.app` | **US$ 6,21 promo**; US$ 14,49 regular | US$ 14,49 | US$ 0,20/ano |
| `.dev` | **US$ 6,21 promo**; US$ 12,42 regular | US$ 12,42 | US$ 0,20/ano |
| `.io` | **US$ 31,98 promo**; US$ 51,75 regular | US$ 51,75 | US$ 0,00/ano |
| `.co` | **US$ 4,98 promo**; US$ 31,05 regular | US$ 31,05 | US$ 0,00/ano |

As promoções acima são para o primeiro ano e não são comparáveis ao custo de renovação. A página oficial também publica transferências, mas elas não fazem parte do pedido. Fonte: [Domain registration prices — Spaceship](https://www.spaceship.com/domains/). A política informa ainda que domínios não padrão/premium podem ter preço de renovação não uniforme: [Domain Registration Agreement, seção 12](https://www.spaceship.com/legal/domain-registration-agreement/).

### Porkbun

| TLD | Registro publicado | Renovação publicada |
|---|---:|---:|
| `.com` | US$ 11,08 | US$ 11,08 |
| `.app` | **US$ 8,75 promo**; US$ 14,93 regular | US$ 14,93 |
| `.dev` | **US$ 8,75 promo**; US$ 12,87 regular | US$ 12,87 |
| `.io` | **US$ 28,12 promo**; US$ 51,80 regular | US$ 51,80 |
| `.co` | **US$ 15,76 promo**; US$ 31,20 regular | US$ 31,20 |

A tabela do Porkbun declara que os preços são para registros/renovações/transferências de 1 ano, nomes não premium, em USD, e incluem ICANN e outras taxas. As promoções “1st Yr Sale” são somente primeiro ano salvo indicação específica; portanto não são comparáveis à renovação. Fontes: [tabela oficial de preços](https://porkbun.com/products/domains), [estrutura de preços e exemplo do .com](https://kb.porkbun.com/article/266-how-does-domain-pricing-work).

### Dynadot

| TLD | Registro publicado | Renovação publicada |
|---|---:|---:|
| `.com` | US$ 10,88 (página mostra o código promocional `899COM`) | US$ 10,88 |
| `.app` | **US$ 9,99 promo**; US$ 14,00 regular | US$ 14,50 |
| `.dev` | **US$ 8,00 promo**; US$ 12,00 regular | US$ 12,50 |
| `.io` | **US$ 28,89 promo**; US$ 53,50 regular | US$ 53,50 |
| `.co` | US$ 15,50 regular | US$ 31,20 |

O preço de `.com` é o preço mostrado na página específica, que associa a oferta ao cupom `899COM`; não foi assumido que seja o preço sem cupom. As promoções de `.app`, `.dev` e `.io` são de primeiro ano e não são comparáveis à renovação. A Dynadot alerta que a moeda escolhida, câmbio, fim de promoção e preço do registry podem mudar o valor. Fontes: [preços gerais Dynadot](https://www.dynadot.com/domain/prices), [.com](https://www.dynadot.com/domain/com), [.app](https://www.dynadot.com/domain/app), [.dev](https://www.dynadot.com/domain/dev), [.io](https://www.dynadot.com/domain/io), [.co](https://www.dynadot.com/domain/co).

### Namecheap

| TLD | Registro publicado | Renovação publicada | Observação |
|---|---:|---:|---|
| `.com` | **US$ 11,28 promo**; US$ 14,98 regular | US$ 18,48 | A página também exibe banner de US$ 6,79 para novos clientes; é uma oferta ainda menos comparável. |
| `.app` | **US$ 10,98 promo**; US$ 17,98 regular | US$ 22,98 | Asterisco indica possível taxa ICANN de US$ 0,20 na finalização. |
| `.dev` | **US$ 10,98 promo**; US$ 15,98 regular | US$ 20,98 | Asterisco indica possível taxa ICANN de US$ 0,20 na finalização. |
| `.io` | **US$ 34,98 promo**; US$ 65,98 regular | US$ 75,98 | Sem asterisco na tabela consultada. |
| `.co` | **US$ 19,98 promo**; US$ 38,48 regular | US$ 45,48 | Sem asterisco na tabela consultada. |

As promoções de `.com`, `.app`, `.dev`, `.io` e `.co` são de primeiro ano e não representam o custo de renovação. A página Namecheap informa que a taxa obrigatória da ICANN de US$ 0,20 é adicionada a alguns domínios no momento da compra; por isso, os valores acima preservam a forma como a tabela foi publicada e não somam essa taxa novamente. Fonte: [Domain Prices — Namecheap](https://www.namecheap.com/domains/). A proteção de privacidade é indicada como “FREE for life” na própria tabela.

### GoDaddy

Para manter a comparação estável, usei a **tarifa padrão/list price anual** da documentação oficial de preços do GoDaddy, não a tarifa promocional ou a tarifa de API com desconto. A própria documentação diz que as tarifas com desconto se aplicam à API v3 e que o site varejo cobra tarifas padrão.

| TLD | Registro padrão/lista | Renovação padrão/lista | Promoção observada |
|---|---:|---:|---|
| `.com` | US$ 22,99 | US$ 22,99 | US$ 0,01 no 1º ano, exigindo compra de 3 anos; anos adicionais US$ 22,99. |
| `.app` | US$ 27,99 | US$ 27,99 | US$ 19,99 no 1º ano na página de extensão. |
| `.dev` | US$ 23,99 | US$ 23,99 | US$ 19,99 no 1º ano na página de extensão. |
| `.io` | US$ 89,99 | US$ 89,99 | Não foi usada promoção de primeiro ano. |
| `.co` | US$ 59,99 | US$ 59,99 | Não foi usada promoção de primeiro ano. |

As promoções não são comparáveis às renovações. Separadamente, a API v3 publica tarifas com desconto — por exemplo, registro/auto-renovação de `.com` US$ 10,49/US$ 14,99, `.app` US$ 9,49/US$ 19,99, `.dev` não aparece na tabela de TLDs publicada, `.io` US$ 30,00/US$ 69,99 e `.co` US$ 9,99/US$ 42,99 — mas isso não é a tarifa varejo padrão e exige manter auto-renovação para a tarifa automática. Fontes: [preços da API v3 e distinção entre API/site varejo](https://developer.godaddy.com/en/docs/api-users/domains/pricing), [tabela de tarifa/list price do Discount Domain Club](https://www.godaddy.com/domains/discount-domain-club), [página de busca e promoções de domínio](https://www.godaddy.com/domains), [página oficial de .app](https://www.godaddy.com/de/tlds/app-domain), [página oficial de .dev](https://www.godaddy.com/tlds/dev-domain).

## Privacidade WHOIS/RDDS

| Provider | Situação oficial relevante para os cinco TLDs |
|---|---|
| Cloudflare Registrar | Redação de dados pessoais gratuita quando permitida pelo registry; nome, email e endereço podem aparecer como `Data Redacted`, enquanto país/estado, nameservers, lock e datas continuam públicos. [WHOIS redaction](https://developers.cloudflare.com/registrar/account-options/whois-redaction/). |
| Spaceship | Privacidade gratuita por toda a vida para domínios elegíveis, adicionada automaticamente; usa Withheld for Privacy. A exceção é quando o registry impede. [Domain Privacy](https://www.spaceship.com/domains/domain-name-privacy/) e [WHOIS Privacy Service Agreement](https://www.spaceship.com/legal/whois-privacy-service-agreement/). |
| Porkbun | Privacidade WHOIS gratuita para a maioria dos TLDs; pode ser escolhida nas configurações do domínio. [Domain management](https://kb.porkbun.com/article/173-how-to-use-domain-management). |
| Dynadot | Privacidade gratuita por toda a vida nos TLDs elegíveis; as páginas dos cinco TLDs consultados indicam “Privacy Allowed: Yes”. Há opções parcial e completa. [Domain security/privacy](https://www.dynadot.com/domain/security). |
| Namecheap | Domain Privacy gratuita para a vida em todo registro/transferência elegível; a tabela dos cinco TLDs a marca como gratuita. [Domain Privacy](https://www.namecheap.com/security/domain-privacy-service/). |
| GoDaddy | A página oficial de domínios anuncia privacidade básica gratuita/para sempre; a privacidade pode ser ajustada por domínio. A elegibilidade final pode depender do TLD/registry. [Domain search](https://www.godaddy.com/domains) e [change privacy level](https://www.godaddy.com/en-ca/help/change-my-domain-privacy-level-32283). |

Privacidade não elimina a obrigação de fornecer dados corretos ao registrador nem impede divulgação mediante processo legal, política ICANN ou exigência do registry.

## Nameservers, DNS e DNSSEC

| Provider | Nameservers/DNS | Restrição ou detalhe relevante |
|---|---|---|
| Cloudflare Registrar | O domínio adquirido usa nameservers Cloudflare e o DNS é administrado na rede Cloudflare; DNSSEC de um clique é gratuito. | Não é possível trocar para nameservers de outro DNS provider no plano normal do Registrar. É possível delegar subdomínios; custom-branded nameservers ficam para Business/Enterprise. [Register a domain](https://developers.cloudflare.com/registrar/get-started/register-domain/) e [FAQ](https://developers.cloudflare.com/registrar/faq/). |
| Spaceship | Pode usar nameservers Spaceship ou manter nameservers externos e apontar registros DNS no provider externo; para hosting Spaceship, a empresa recomenda `launch1.spaceship.net` e `launch2.spaceship.net`. | Trocar nameservers pode levar até 48h; ao mudar para os nameservers Spaceship, é preciso copiar registros existentes para não interromper email/site. [Connect external domain](https://www.spaceship.com/en-GB/knowledgebase/connect-domain-to-spaceship-hosting/). |
| Porkbun | Permite editar registros DNS nos nameservers Porkbun, trocar nameservers autoritativos e gerenciar glue; DNSSEC/DS também é suportado. | Se o DNS estiver em nameservers externos, os registros são administrados lá. [API/DNS/nameservers](https://porkbun.com/api/json/v3/documentation) e [DNSSEC](https://kb.porkbun.com/article/93-how-to-install-dnssec). |
| Dynadot | Permite nameservers Dynadot ou de terceiros; os registros são gerenciados no painel quando se usa Dynadot DNS. | Os nameservers de forwarding/parking/custom DNS/email da Dynadot não são configurados para DNSSEC; para DNSSEC, primeiro atribua nameservers de terceiros. [Nameservers/DNSSEC](https://www.dynadot.com/help/account-domain-management/dns-name-server-settings/name-servers). |
| Namecheap | BasicDNS, FreeDNS, PremiumDNS ou nameservers customizados; Host Records aparecem no painel somente quando o domínio usa um serviço DNS Namecheap compatível. | Com nameservers de terceiros ou de hosting, os registros devem ser alterados nesse provider. [Host records](https://www.namecheap.com/support/knowledgebase/article.aspx/434/2237/how-do-i-set-up-host-records-for-a-domain/) e [DNS records](https://www.namecheap.com/support/knowledgebase/article.aspx/10594/10/all-types-of-dns-records-explained/). |
| GoDaddy | O gerenciamento de DNS da API inclui registros A, AAAA, CNAME, MX, TXT, SRV, NS, SOA e CAA para domínios que usam nameservers autoritativos GoDaddy. | O número permitido de nameservers é específico do TLD; em `.app`, a página oficial indica 1–13 e DNSSEC suportado. [Domains REST API](https://developer.godaddy.com/en/docs/references/rest/domains) e [`.app` requirements](https://www.godaddy.com/en-ca/help/about-app-domains-27900). |

## Restrições de TLD e do provider

- **`.com`:** registro aberto, sem requisito de profissão, residência ou entidade nas páginas de TLD consultadas; nomes premium/aftermarket não seguem o preço padrão. A taxa de transação ICANN vigente para registradores é US$ 0,20 por incremento anual de add/renew/transfer: [ICANN FY26 Registrar Fees](https://www.icann.org/en/announcements/details/icann-accredited-registrars-approve-registrar-level-fees-for-fiscal-year-2026-21-07-2025-en).
- **`.app`:** qualquer pessoa pode registrar nos providers consultados; o requisito material é de uso: `.app` é um namespace HTTPS e sites precisam servir HTTPS. GoDaddy informa que forwarding não é suportado para `.app`; algumas páginas incluem crédito de SSL. Fontes: [GoDaddy `.app`](https://www.godaddy.com/en-ca/help/about-app-domains-27900), [Dynadot `.app`](https://www.dynadot.com/domain/app).
- **`.dev`:** aberto a pessoas, empresas e organizações; Dynadot informa que não há restrição de profissão/indústria e que o namespace exige HTTPS. Fonte: [Dynadot `.dev`](https://www.dynadot.com/domain/dev).
- **`.io`:** é ccTLD; Dynadot informa registro mundial, sem requisito de residência/entidade, privacy permitida, DNSSEC suportado e sem restrições na ficha do TLD. GoDaddy alerta que ccTLDs possuem regras próprias e devem ser verificados individualmente. Fontes: [Dynadot `.io`](https://www.dynadot.com/domain/io), [GoDaddy ccTLD overview](https://help-center.dc-aws.godaddy.com/help/about-country-code-domain-extensions-cctlds-6243).
- **`.co`:** é ccTLD; Dynadot informa que é aberto a qualquer pessoa, sem restrições na ficha do TLD, com privacy e DNSSEC permitidos. O limite de prazo pode ser menor que nos gTLDs: Dynadot publica 1–5 anos para `.co`. Fontes: [Dynadot `.co`](https://www.dynadot.com/domain/co), [GoDaddy ccTLD overview](https://help-center.dc-aws.godaddy.com/help/about-country-code-domain-extensions-cctlds-6243).
- **Todos os cinco:** nomes premium podem ter preço inicial e/ou renovação diferente; disponibilidade também depende do nome concreto. Dados de contato devem ser verdadeiros e atualizados. As buscas de disponibilidade dos nomes avaliados estão registradas nas seções específicas; nenhum domínio foi adicionado ao carrinho.

## Conclusão de comparabilidade

Para custo recorrente previsível, a coluna de renovação é a referência principal. As ofertas mais baixas de primeiro ano são campanhas de aquisição e podem esconder um salto significativo na renovação: isso é especialmente evidente em `.co`, `.io`, `.app` e `.dev` em vários providers. Cloudflare é a única opção da lista sem markup declarado, mas não permite comparar um preço público fixo sem consultar uma conta/domínio específico. GoDaddy deve ser comparado com cuidado porque mistura tarifa varejo padrão, promoções e uma tabela separada de desconto da API v3.

## O que melhor encaixa no produto Rekko

O Rekko é um SaaS de reconstrução e entendimento do tempo de trabalho, com posicionamento profissional, humano e internacional. O nome precisa transmitir trabalho e confiança sem parecer sistema de RH, ponto eletrônico ou ferramenta exclusivamente para desenvolvedores. Essa leitura vem de `CONTEXT.md`, `DESIGN.md` e `ARCHITECTURE.md` do repositório.

### Disponibilidade verificada para o nome exato

Consulta pública realizada em 03/09/2026, sem adicionar itens ao carrinho:

| Domínio | Resultado | Leitura |
|---|---|---|
| `rekko.work` | **Disponível no Spaceship** | O melhor encaixe semântico para uma aplicação sobre trabalho e tempo. |
| `rekko.com.br` | **Registrado** | Deixou de ser uma opção de compra normal; não recomendo negociar com o titular sem necessidade. |
| `rekko.app` | Registrado | Seria o melhor sufixo de produto, mas não está livre para registro normal. |
| `rekko.dev` | Registrado | Posicionaria o produto como ferramenta de desenvolvimento. |
| `rekko.io` | Registrado | Além de indisponível, tem renovação muito cara. |
| `rekko.co` | Registrado | Além de indisponível, tem risco de confusão com `.com` e renovação alta. |
| `rekko.com` | Registrado | Não recomendo comprar de terceiro sem uma avaliação jurídica e financeira específica. |

As disponibilidades são momentâneas e o checkout do registrador é a autoridade final. A consulta do `.work` foi feita no [buscador do Spaceship](https://www.spaceship.com/domain-search/?query=rekko.work&beast=false&tab=domains). O status de `rekko.com.br` foi atualizado nesta revisão conforme a confirmação do usuário.

## Recomendação de compra

### Recomendação principal: `rekko.work` no Spaceship

Esta é a melhor combinação de disponibilidade, significado e custo para o Rekko hoje.

- A busca ao vivo exibiu aproximadamente **US$ 1,55 no primeiro ano** e **US$ 10,38/ano** como preço anual padrão.
- Se o checkout confirmar a renovação próxima de US$ 10,38 e o nome não for premium, o custo estimado em cinco anos é **US$ 43,07**: `1,55 + 4 × 10,38`.
- O Spaceship oferece privacidade elegível, DNSSEC e permite usar nameservers externos. Isso deixa o domínio livre para Vercel, Cloudflare DNS ou outro provedor sem transferência.
- O sufixo `.work` explica imediatamente o território do produto: trabalho, jornada e tempo.

O ponto de atenção é a promoção: a tela de busca não rotulou de forma inequívoca a cifra de US$ 10,38 como renovação. Antes de pagar, confirmar no checkout: preço do primeiro ano, preço do segundo ano, impostos, se há preço premium e se a renovação automática está configurada.

### Se o foco inicial fosse exclusivamente o Brasil: `rekko.com.br` no Registro.br

O `.com.br` seria a alternativa de menor risco para uma operação brasileira, com manutenção normal de aproximadamente **R$ 40 por ano** em material oficial recente. Porém, `rekko.com.br` está agora registrado, conforme a confirmação do usuário, portanto esta opção não está disponível para compra normal. [Valores e regras do Registro.br](https://registro.br/dominio/processo-de-liberacao/resultado/) e [requisitos para novos domínios](https://registro.br/ajuda/registro-de-novos-dominios/).

Trade-offs:

- transmite confiança local e é simples para clientes brasileiros;
- não funciona como endereço global principal tão bem quanto um gTLD;
- exige titular elegível com CPF/CNPJ e dados cadastrais corretos;
- a política do Registro.br divulga mais dados de titulares empresariais do que um registrador com redaction WHOIS, incluindo dados de contato previstos na política. [Política de privacidade do Registro.br](https://registro.br/politica-de-privacidade/)

Minha decisão prática é: **`rekko.work` como domínio principal**. Se a prioridade for possuir um `.com`, a melhor alternativa verificada é **`tryrekko.com`**, seguida de `getrekko.com`; ambos são ligeiramente mais caros em cinco anos e adicionam um prefixo ao nome. Não recomendo tentar comprar `rekko.com.br` de terceiro apenas para obter o sufixo brasileiro.

## Custo recorrente estimado

Para evitar a armadilha de escolher pela promoção, a comparação abaixo usa cinco anos sempre que há registro e renovação publicados. Valores estão na moeda original, sem impostos e sem conversão.

| Opção | Estimativa de cinco anos | Observação |
|---|---:|---|
| Spaceship — `rekko.work` | **~US$ 43,07** | Usa a cotação ao vivo de US$ 1,55 + quatro anos a US$ 10,38; confirmar no checkout. |
| Registro.br — `rekko.com.br` | **Indisponível** | O nome está registrado; R$ 40/ano é apenas a referência do TLD, não uma cotação de compra. |
| Dynadot — `.work` | **US$ 54,60** | Cinco anos a US$ 10,92, se o nome estiver disponível lá. |
| Spaceship — `.com` | US$ 48,80 + taxas exibidas | Boa política de preço, mas `rekko.com` não está disponível. |
| Porkbun — `.com` | US$ 55,40 | Boa transparência, mas `rekko.com` não está disponível. |
| Spaceship — `.co` | ~US$ 129,18 | Promoção barata, renovação de US$ 31,05; não vale a pena. |
| Spaceship — `.io` | ~US$ 238,98 | Renovação de US$ 51,75; não vale a pena para este produto. |

Os totais são ferramenta de decisão, não cotação garantida. Registries, promoções, impostos e câmbio podem mudar. Para registrar `.work` sem depender de promoção, a [página oficial do Dynadot](https://www.dynadot.com/domain/work) publica US$ 10,92 para registro, renovação e transferência.

## Ranking dos providers para este caso

1. **Spaceship — melhor compra agora.** Vence porque `rekko.work` apareceu disponível, tem preço baixo, privacidade elegível e nameservers externos. É a escolha recomendada para o domínio.
2. **Cloudflare Registrar — melhor infraestrutura, não necessariamente melhor registrador.** Cobra registry + ICANN sem markup e oferece DNSSEC/integração Cloudflare, mas obriga o uso de nameservers Cloudflare e não publica uma tabela varejo simples. [FAQ do Cloudflare Registrar](https://developers.cloudflare.com/registrar/faq/)
3. **Dynadot — melhor alternativa de preço previsível.** Publica preço estável para `.work` e tem privacy/DNSSEC, mas é preciso confirmar a disponibilidade do nome no checkout.
4. **Porkbun — ótimo equilíbrio.** Preços transparentes, privacy gratuita e boa operação de DNS; não resolve o problema de disponibilidade de `rekko.com`.
5. **Registro.br — melhor alternativa local quando o nome está livre.** O custo anual do `.br` é baixo, mas `rekko.com.br` não está disponível e há menor flexibilidade de marca global e mais exposição cadastral para empresas.
6. **Namecheap — funcional, mas caro na renovação.** É simples e tem privacy gratuita, porém `.com`, `.app` e `.dev` renovam substancialmente acima das alternativas.
7. **GoDaddy — não recomendado para o Rekko.** As promoções de entrada escondem condições e a tarifa padrão/renovação é alta, sobretudo em `.io` e `.co`.

## Por que não escolher outro TLD barato

- `.app`: semanticamente forte para o produto e exige HTTPS, mas `rekko.app` está registrado.
- `.dev`: excelente para uma ferramenta de engenharia, porém estreita demais a percepção de um produto de tempo e trabalho.
- `.io`: associação comum com startups, mas custo recorrente alto e pouco ganho semântico.
- `.co`: pode parecer uma abreviação de company, mas confunde facilmente com `.com` e tem saltos de renovação.
- `.xyz`, `.online`, `.site` e `.store`: podem custar pouco no primeiro ano, porém não comunicam o produto com a mesma clareza e reduzem a confiança de um SaaS B2B/profissional.
- `.ai`: não se encaixa na visão atual do Rekko, que explicitamente não é um produto AI-first; também não há motivo para pagar o prêmio dessa extensão.

## Checklist antes do pagamento

1. Confirmar que `rekko.work` está marcado como **standard**, não premium/aftermarket.
2. Conferir no resumo do Spaceship o valor de renovação do segundo ano e o total com impostos.
3. Ativar renovação automática e 2FA no registrador; guardar o acesso em um gerenciador de senhas da equipe/fundador.
4. Manter o email do titular sob controle permanente e verificar o email de validação do registrador.
5. Não trocar nameservers ainda sem planejar DNS, email e deploy. Depois da compra, apontar o domínio para o host escolhido e configurar `www`, SPF, DKIM e DMARC antes de enviar email transacional.
6. Não comprar `rekko.com`, `rekko.app` ou outro domínio registrado de terceiro sem validar marca, histórico, preço e risco de disputa.

## Limitações da pesquisa

- Preços e disponibilidade foram verificados em 03/09/2026 e podem mudar sem aviso.
- Valores não incluem impostos, câmbio, taxas de pagamento nem possíveis preços premium.
- Cloudflare exige cotação por domínio/conta para produzir números comparáveis.
- Não foi feita análise jurídica de marca registrada nem compra, login, cadastro ou checkout.
- O custo de `.work` no Spaceship veio da busca do nome exato; a renovação precisa ser confirmada na tela final antes do pagamento.

---

## Pesquisa ampliada — alternativas solicitadas (03/09/2026)

Esta seção registra somente consultas públicas realizadas em 03/09/2026, sem login, compra, checkout ou adição ao carrinho. Para os TLDs abaixo, a disponibilidade foi verificada no resultado do buscador do Spaceship, que exibiu o nome exato como **is available** e ofereceu a ação **Add to cart**. Os valores são os exibidos para o nome consultado, em USD, sem impostos; o primeiro ano pode estar promocional.

### TLDs alternativos

| Domínio | Disponibilidade verificada | Registro exibido | Renovação exibida | Custo indicativo de 5 anos* | Leitura de marca/semântica |
|---|---|---:|---:|---:|---|
| `rekko.work` | **Disponível — Spaceship** | US$ 1,55 | US$ 10,38/ano | US$ 43,07 | Melhor conexão direta com trabalho, jornada e tempo; é menos neutro caso o produto se expanda para fora do trabalho. |
| `rekko.team` | **Disponível — Spaceship** | US$ 2,07 | US$ 28,98/ano | US$ 117,99 | Reforça colaboração e Workspace, mas pode fazer o produto parecer exclusivamente voltado a equipes. |
| `rekko.space` | **Disponível — Spaceship** | US$ 0,98 | US$ 19,48/ano | US$ 78,90 | “Space” combina com Workspace e território digital, porém é menos específico e pode evocar espaço físico/astronomia. |
| `rekko.today` | **Disponível — Spaceship** | US$ 2,07 | US$ 22,77/ano | US$ 93,15 | Comunica acompanhamento diário, mas estreita a percepção diante de Reconstruct e Insights históricos. |
| `rekko.so` | **Disponível — Gandi** | US$ 95,05 na tabela pública do TLD | US$ 183,98/ano na tabela pública do TLD | US$ 830,97** | “So” é pouco autoexplicativo como marca; é o ccTLD oficial da Somália e a política consultada exige conexão bona fide com o país. Alto risco semântico, regulatório e de custo. |
| `rekko.tools` | **Disponível — Spaceship** | US$ 7,25 | US$ 28,98/ano | US$ 123,17 | Posiciona Rekko como ferramenta/utilitário, com menor espaço para a ideia de reconstrução e compreensão do tempo. |
| `rekko.cloud` | **Disponível — Spaceship** | US$ 3,29 | US$ 20,70/ano | US$ 86,09 | Comunica SaaS/infraestrutura, mas pode sugerir produto de cloud computing em vez de ferramenta humana de trabalho. |

\* Cálculo: registro do primeiro ano + quatro renovações, sem impostos, câmbio ou alteração futura do registry/registrador.\
\*\* Baseado na tabela pública do Gandi para `.so`, em USD e sem impostos; a busca exata do nome no próprio Gandi exibiu uma cotação em EUR diferente por região/moeda.

O menor primeiro ano entre os candidatos é `rekko.space`, mas o menor custo recorrente e o melhor encaixe semântico continuam sendo `rekko.work`. `.team` é uma alternativa coerente apenas se a narrativa principal passar a ser colaboração de equipes. `.today`, `.tools` e `.cloud` são semanticamente mais estreitos. `.so` não é uma alternativa econômica nem recomendável para este produto.

### Alternativas `get/try/use/join + rekko` em `.com`

As quatro consultas exatas apareceram disponíveis no Spaceship:

| Domínio | Disponibilidade verificada | Registro exibido | Renovação exibida | Custo indicativo de 5 anos | Risco/uso semântico |
|---|---|---:|---:|---:|---|
| `getrekko.com` | **Disponível — Spaceship** | US$ 8,88 | US$ 9,98/ano | US$ 48,80 | CTA claro, mas soa mais como aquisição/campanha do que como nome institucional. |
| `tryrekko.com` | **Disponível — Spaceship** | US$ 8,88 | US$ 9,98/ano | US$ 48,80 | Bom para landing e beta; “try” pode envelhecer quando o produto sair da fase de experimentação. |
| `userekko.com` | **Disponível — Spaceship** | US$ 8,88 | US$ 9,98/ano | US$ 48,80 | Construção menos natural em inglês e pouco memorável; menor recomendação. |
| `joinrekko.com` | **Disponível — Spaceship** | US$ 8,88 | US$ 9,98/ano | US$ 48,80 | Evoca convite/comunidade e combina com colaboração, mas não descreve o núcleo de tempo. |

Esses quatro `.com` têm custo recorrente público inferior ao dos TLDs alternativos, mas nenhum substitui semanticamente `rekko.work` tão bem. Se a prioridade absoluta for possuir um `.com`, `tryrekko.com` é o melhor nome de campanha/entrada e `joinrekko.com` o melhor para uma narrativa colaborativa; não os trataria como domínio canônico sem validar a estratégia de marca.

### Fontes oficiais e verificação

- Buscador exato do Spaceship para [`rekko.work`](https://www.spaceship.com/domain-search/?query=rekko.work&beast=false&tab=domains), [`rekko.team`](https://www.spaceship.com/domain-search/?query=rekko.team&beast=false&tab=domains), [`rekko.space`](https://www.spaceship.com/domain-search/?query=rekko.space&beast=false&tab=domains), [`rekko.today`](https://www.spaceship.com/domain-search/?query=rekko.today&beast=false&tab=domains), [`rekko.tools`](https://www.spaceship.com/domain-search/?query=rekko.tools&beast=false&tab=domains), [`rekko.cloud`](https://www.spaceship.com/domain-search/?query=rekko.cloud&beast=false&tab=domains), [`getrekko.com`](https://www.spaceship.com/domain-search/?query=getrekko.com&beast=false&tab=domains), [`tryrekko.com`](https://www.spaceship.com/domain-search/?query=tryrekko.com&beast=false&tab=domains), [`userekko.com`](https://www.spaceship.com/domain-search/?query=userekko.com&beast=false&tab=domains) e [`joinrekko.com`](https://www.spaceship.com/domain-search/?query=joinrekko.com&beast=false&tab=domains).
- [Preços públicos de domínios do Spaceship](https://www.spaceship.com/domains/), incluindo registro, renovação e aviso de taxa ICANN.
- [Página oficial do Gandi para `.so`](https://www.gandi.net/en-US/domain/tld/so), com preços públicos, registry SONIC e regra de conexão bona fide.
- [Busca exata do Gandi para `rekko.so`](https://shop.gandi.net/en/domain/suggest?search=rekko.so&tld=so&country=US&currency=USD&taxes=no), que exibiu “Good news! This domain is available!”.
- [Políticas oficiais do SONIC](https://sonic.so/policies/), registry do `.so`, para as regras e períodos de graça.

As avaliações de semântica acima são análise de posicionamento baseada no contexto do produto em `CONTEXT.md`, `DESIGN.md` e `ARCHITECTURE.md`; não constituem clearance de marca. A disponibilidade é momentânea e a confirmação final deve ser feita no checkout, especialmente para preço premium, impostos e renovação.
