import Link from "next/link";

import { BrandMark } from "@/components/brand-mark";
import {
  LinearSelector,
  MarketingNavbar,
  ProductDemo,
} from "./landing-interactions";
import {
  FinalItem,
  FinalSequence,
  HeroItem,
  HeroSequence,
  NarrativeStep,
  Reveal,
  ScaleBar,
  TeamAvatar,
  TimelineStory,
} from "./motion";

export function LandingPage() {
  return (
    <div className="landing-page">
      <MarketingNavbar />

      <main>
        <section className="hero" id="hero" aria-labelledby="hero-title">
          <div className="hero__glow" aria-hidden="true" />
          <HeroSequence>
            <HeroItem>
              <p className="beta-note">
                <span className="beta-note__mark" aria-hidden="true">
                  β
                </span>
                Grátis durante o beta
              </p>
            </HeroItem>
            <HeroItem>
              <h1 id="hero-title">
                Reconstrua seu tempo.
                <br />
                Entenda sua jornada.
              </h1>
            </HeroItem>
            <HeroItem>
              <p className="hero__copy">
                Registre o que está fazendo, reconstrua o que ficou pelo caminho
                e entenda onde suas horas realmente foram usadas.
              </p>
            </HeroItem>
            <HeroItem>
              <div className="hero__actions">
                <Link
                  className="button button--light button--marketing"
                  href="/signup"
                >
                  Começar grátis <span aria-hidden="true">→</span>
                </Link>
                <a
                  className="button button--quiet-light button--marketing"
                  href="#how-it-works"
                >
                  Ver como funciona
                </a>
              </div>
            </HeroItem>
            <HeroItem>
              <div
                className="reconstruction-visual"
                role="img"
                aria-label="Segmentos de tempo se conectando e formando uma timeline"
              >
                <div className="hero-timeline">
                  <div>
                    <small>08:12</small>
                    <strong>AMBLA</strong>
                    <span>Integração</span>
                  </div>
                  <div className="hero-timeline__gap">
                    <small>09:40</small>
                    <strong>20m</strong>
                    <span>sem registro</span>
                  </div>
                  <div className="hero-timeline__active">
                    <small>10:00</small>
                    <strong>AC-843</strong>
                    <span>
                      <i /> 01:27:42
                    </span>
                  </div>
                </div>
              </div>
            </HeroItem>
          </HeroSequence>
          <div className="hero__wave" aria-hidden="true" />
        </section>

        <section
          className="product-section landing-container"
          id="product"
          aria-labelledby="product-title"
        >
          <Reveal className="section-heading section-heading--center">
            <p className="section-label">Um dia, reconstruído</p>
            <h2 id="product-title">
              Sinta como o Rekko transforma tempo em contexto.
            </h2>
            <p>
              Experimente as ações abaixo. Esta demonstração é visual e não cria
              dados reais.
            </p>
          </Reveal>
          <Reveal className="product-preview" delay={0.08}>
            <aside
              className="preview-sidebar"
              aria-label="Navegação ilustrativa"
            >
              <BrandMark />
              <span className="is-active">Hoje</span>
              <span>Timeline</span>
              <span>Trabalho</span>
              <span>Insights</span>
            </aside>
            <ProductDemo />
          </Reveal>
        </section>

        <section
          className="pillars-section"
          id="how-it-works"
          aria-labelledby="pillars-title"
        >
          <div className="landing-container pillars-layout">
            <Reveal className="section-heading" direction="left">
              <p className="section-label">Do instante à compreensão</p>
              <h2 id="pillars-title">Registrar. Reconstruir. Entender.</h2>
              <p>Três movimentos, uma história contínua do seu trabalho.</p>
            </Reveal>
            <div className="pillar-story">
              <NarrativeStep index={0}>
                <span className="pillar-index">Registrar</span>
                <div className="pillar-demo pillar-demo--track">
                  <i />
                  <strong>AC-843</strong>
                  <span>Timer iniciado · 10:32</span>
                </div>
                <h3>Comece sem interromper seu ritmo.</h3>
                <p>
                  Escolha o trabalho e inicie. O contexto acompanha o tempo
                  desde o primeiro segundo.
                </p>
              </NarrativeStep>
              <NarrativeStep index={1}>
                <span className="pillar-index">Reconstruir</span>
                <div className="pillar-demo pillar-demo--reconstruct">
                  <span />
                  <i />
                  <span />
                </div>
                <h3>Preencha o que ficou pelo caminho.</h3>
                <p>
                  Um gap é só um período sem contexto. Reconstrua quando fizer
                  sentido, sem julgamentos.
                </p>
              </NarrativeStep>
              <NarrativeStep index={2}>
                <span className="pillar-index">Entender</span>
                <div className="pillar-demo pillar-demo--insight">
                  <div>
                    <span>AMBLA</span>
                    <strong>3h 12m</strong>
                  </div>
                  <div>
                    <span>AC-843</span>
                    <strong>1h 28m</strong>
                  </div>
                </div>
                <h3>Veja onde seu dia realmente aconteceu.</h3>
                <p>
                  Horas por projeto, demanda e estimativa aparecem como
                  respostas claras.
                </p>
              </NarrativeStep>
            </div>
          </div>
        </section>

        <section
          className="story-section landing-container"
          aria-labelledby="story-title"
        >
          <Reveal className="story-copy" direction="left">
            <p className="section-label">A assinatura Rekko</p>
            <h2 id="story-title">O tempo fragmentado volta a fazer sentido.</h2>
            <p>
              A Timeline conecta atividades, pausas e períodos reconstruídos em
              uma leitura cronológica — não em uma planilha de ponto.
            </p>
          </Reveal>
          <TimelineStory />
        </section>

        <section
          className="linear-section"
          id="integrations"
          aria-labelledby="linear-title"
        >
          <div className="landing-container split-section">
            <Reveal className="section-heading" direction="left">
              <p className="section-label">Linear, com intenção</p>
              <h2 id="linear-title">
                Suas tarefas já existem. O Rekko só conecta o tempo a elas.
              </h2>
              <p>
                Escolha apenas o que importa. Nada de importar o Workspace
                inteiro e criar mais ruído.
              </p>
            </Reveal>
            <Reveal direction="right" delay={0.08}>
              <LinearSelector />
            </Reveal>
          </div>
        </section>

        <section
          className="workspace-section landing-container"
          aria-labelledby="workspace-title"
        >
          <Reveal className="workspace-visual" direction="left">
            <TeamAvatar className="person--owner" index={0}>
              GA<span>Proprietário</span>
            </TeamAvatar>
            <TeamAvatar index={1}>
              MO<span>Administrador</span>
            </TeamAvatar>
            <TeamAvatar index={2}>
              JS<span>Membro</span>
            </TeamAvatar>
            <div className="workspace-line" />
          </Reveal>
          <Reveal className="section-heading" direction="right">
            <p className="section-label">Seu espaço, do seu jeito</p>
            <h2 id="workspace-title">
              Trabalhe sozinho ou reconstrua o tempo junto com seu time.
            </h2>
            <p>
              Um Workspace organiza contexto compartilhado sem transformar
              produtividade em vigilância.
            </p>
          </Reveal>
        </section>

        <section className="estimate-section" aria-labelledby="estimate-title">
          <div className="landing-container estimate-layout">
            <Reveal className="section-heading" direction="left">
              <p className="section-label">Intenção encontra realidade</p>
              <h2 id="estimate-title">
                Estimativa é intenção. Tempo real é aprendizado.
              </h2>
              <p>
                Compare sem julgamento e use a diferença para compreender melhor
                o trabalho.
              </p>
            </Reveal>
            <Reveal className="estimate-visual" direction="right" delay={0.08}>
              <div>
                <span>Estimado</span>
                <span className="estimate-bar">
                  <ScaleBar scale={0.62} />
                </span>
                <strong>30m</strong>
              </div>
              <div>
                <span>Registrado</span>
                <span className="estimate-bar">
                  <ScaleBar scale={0.86} />
                </span>
                <strong>42m</strong>
              </div>
              <p>
                Diferença <strong>+12m</strong>
              </p>
            </Reveal>
          </div>
        </section>

        <section className="beta-section" aria-labelledby="beta-title">
          <FinalSequence>
            <FinalItem>
              <p className="section-label">Grátis durante o beta</p>
              <h2 id="beta-title">
                Comece com tudo o que precisa. Sem planos para comparar.
              </h2>
              <p>Use o Rekko gratuitamente durante a fase beta.</p>
            </FinalItem>
            <FinalItem>
              <Link
                className="button button--light button--marketing"
                href="/signup"
              >
                Começar grátis <span aria-hidden="true">→</span>
              </Link>
            </FinalItem>
          </FinalSequence>
        </section>
      </main>

      <footer className="landing-footer">
        <Reveal className="landing-container">
          <BrandMark />
          <nav aria-label="Links do rodapé">
            <a href="#product">Produto</a>
            <a href="mailto:contato@rekko.app">Contato</a>
          </nav>
          <span>© {new Date().getFullYear()} Rekko</span>
        </Reveal>
      </footer>
    </div>
  );
}
