"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { BrandMark } from "@/components/brand-mark";
import { ThemeSwitcher } from "@/components/theme-switcher";

export function LandingPage() {
  const [scrolled, setScrolled] = useState(false);
  const [running, setRunning] = useState(false);
  const [reconstructed, setReconstructed] = useState(false);
  const [selected, setSelected] = useState([true, true, false]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div className="landing-page">
      <header className={`marketing-nav${scrolled ? " is-scrolled" : ""}`}>
        <div className="marketing-nav__inner">
          <BrandMark />
          <nav
            aria-label="Navegação principal"
            className="marketing-nav__links"
          >
            <a href="#product">Produto</a>
            <a href="#how-it-works">Como funciona</a>
            <a href="#integrations">Integrações</a>
          </nav>
          <div className="marketing-nav__actions">
            <ThemeSwitcher />
            <Link className="marketing-nav__login" href="/login">
              Entrar
            </Link>
            <Link className="button button--primary" href="/signup">
              Começar grátis
            </Link>
          </div>
        </div>
      </header>

      <main>
        <section className="hero" aria-labelledby="hero-title">
          <div className="hero__glow" aria-hidden="true" />
          <div className="landing-container hero__content">
            <p className="beta-note">
              <span /> Free during beta
            </p>
            <h1 id="hero-title">
              Reconstrua seu tempo.
              <br />
              Entenda sua jornada.
            </h1>
            <p className="hero__copy">
              Registre o que está fazendo, reconstrua o que ficou pelo caminho e
              entenda onde suas horas realmente foram usadas.
            </p>
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
            <div
              className="reconstruction-visual"
              aria-label="Segmentos de tempo se conectando e formando uma timeline"
            >
              <div className="reconstruction-visual__rail" aria-hidden="true">
                <span />
                <span />
                <span />
              </div>
              <div className="hero-timeline">
                <div>
                  <small>08:12</small>
                  <strong>AMBLA</strong>
                  <span>Onboarding</span>
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
          </div>
        </section>

        <section
          className="product-section landing-container"
          id="product"
          aria-labelledby="product-title"
        >
          <div className="section-heading section-heading--center">
            <p className="section-label">Um dia, reconstruído</p>
            <h2 id="product-title">
              Sinta como o Rekko transforma tempo em contexto.
            </h2>
            <p>
              Experimente as ações abaixo. Esta demonstração é visual e não cria
              dados reais.
            </p>
          </div>
          <div className="product-preview">
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
            <div className="preview-main">
              <div className="preview-main__header">
                <div>
                  <small>Quarta-feira, 26 de agosto</small>
                  <h3>Hoje</h3>
                </div>
                <span>3h 42m registradas</span>
              </div>
              <div className={`preview-current${running ? " is-running" : ""}`}>
                <div>
                  <span className="working-state">
                    <i /> {running ? "Em andamento" : "Pronto para começar"}
                  </span>
                  <strong>AMBLA</strong>
                  <p>Onboarding flow</p>
                </div>
                <div className="preview-timer">
                  {running ? "01:27:42" : "00:00:00"}
                </div>
                <button
                  className="button button--primary"
                  type="button"
                  onClick={() => setRunning((value) => !value)}
                >
                  {running ? "Pausar" : "Iniciar timer"}
                </button>
              </div>
              <div
                className="preview-timeline"
                aria-label="Timeline de demonstração"
              >
                <PreviewEvent
                  time="08:12"
                  title="AMBLA"
                  detail="Onboarding"
                  duration="1h28"
                />
                <PreviewEvent
                  time="09:40"
                  title="Daily"
                  detail="Alinhamento"
                  duration="20m"
                />
                <div
                  className={`preview-event preview-gap${reconstructed ? " is-reconstructed" : ""}`}
                >
                  <time>10:00</time>
                  <span className="preview-event__rail" />
                  <div>
                    <strong>
                      {reconstructed ? "Reunião" : "32 minutos sem registro"}
                    </strong>
                    <span>
                      {reconstructed
                        ? "Alinhamento técnico"
                        : "Quer reconstruir este período?"}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setReconstructed((value) => !value)}
                  >
                    {reconstructed ? "Desfazer" : "Reconstruir"}
                  </button>
                </div>
                <PreviewEvent
                  current
                  time="10:32"
                  title="AidCrusader"
                  detail="AC-843 · Cloudflare Turnstile"
                  duration="agora"
                />
              </div>
            </div>
          </div>
        </section>

        <section
          className="pillars-section"
          id="how-it-works"
          aria-labelledby="pillars-title"
        >
          <div className="landing-container pillars-layout">
            <div className="section-heading">
              <p className="section-label">Do instante à compreensão</p>
              <h2 id="pillars-title">Track. Reconstruct. Understand.</h2>
              <p>Três movimentos, uma história contínua do seu trabalho.</p>
            </div>
            <div className="pillar-story">
              <article>
                <span className="pillar-index">Track</span>
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
              </article>
              <article>
                <span className="pillar-index">Reconstruct</span>
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
              </article>
              <article>
                <span className="pillar-index">Understand</span>
                <div className="pillar-demo pillar-demo--insight">
                  <span style={{ width: "78%" }} />
                  <span style={{ width: "58%" }} />
                  <span style={{ width: "35%" }} />
                </div>
                <h3>Veja onde seu dia realmente aconteceu.</h3>
                <p>
                  Horas por projeto, demanda e estimativa aparecem como
                  respostas claras.
                </p>
              </article>
            </div>
          </div>
        </section>

        <section
          className="story-section landing-container"
          aria-labelledby="story-title"
        >
          <div className="story-copy">
            <p className="section-label">A assinatura Rekko</p>
            <h2 id="story-title">O tempo fragmentado volta a fazer sentido.</h2>
            <p>
              A Timeline conecta atividades, pausas e períodos reconstruídos em
              uma leitura cronológica — não em uma planilha de ponto.
            </p>
          </div>
          <div
            className="timeline-story"
            aria-label="História visual de reconstrução"
          >
            <div>
              <time>09:40</time>
              <span />
              <strong>Daily</strong>
            </div>
            <div className="timeline-story__gap">
              <time>10:00</time>
              <span />
              <strong>32m sem registro</strong>
            </div>
            <div>
              <time>10:32</time>
              <span />
              <strong>Onboarding</strong>
            </div>
            <div className="timeline-story__resolved">
              <time>10:00</time>
              <span />
              <strong>Reunião reconstruída</strong>
            </div>
          </div>
        </section>

        <section
          className="linear-section"
          id="integrations"
          aria-labelledby="linear-title"
        >
          <div className="landing-container split-section">
            <div className="section-heading">
              <p className="section-label">Linear, com intenção</p>
              <h2 id="linear-title">
                Suas tarefas já existem. O Rekko só conecta o tempo a elas.
              </h2>
              <p>
                Escolha apenas o que importa. Nada de importar o Workspace
                inteiro e criar mais ruído.
              </p>
            </div>
            <div
              className="linear-selector"
              aria-label="Demonstração de seleção específica do Linear"
            >
              <div className="linear-selector__top">
                <strong>Linear</strong>
                <span>{selected.filter(Boolean).length} selecionadas</span>
              </div>
              {[
                "[EPIC] Cloudflare Turnstile",
                "AC-844 Login frontend",
                "AC-845 Login backend",
              ].map((label, index) => (
                <label className={index ? "is-child" : ""} key={label}>
                  <input
                    type="checkbox"
                    checked={selected[index]}
                    onChange={() =>
                      setSelected((values) =>
                        values.map((value, itemIndex) =>
                          itemIndex === index ? !value : value,
                        ),
                      )
                    }
                  />
                  <span>{label}</span>
                </label>
              ))}
              <div className="linear-selector__flow">
                <span>Linear</span>
                <i>→</i>
                <span>Seleção específica</span>
                <i>→</i>
                <strong>Rekko</strong>
              </div>
            </div>
          </div>
        </section>

        <section
          className="workspace-section landing-container"
          aria-labelledby="workspace-title"
        >
          <div className="workspace-visual" aria-hidden="true">
            <div className="person person--owner">
              GA<span>Owner</span>
            </div>
            <div className="person">
              MO<span>Admin</span>
            </div>
            <div className="person">
              JS<span>Member</span>
            </div>
            <div className="workspace-line" />
          </div>
          <div className="section-heading">
            <p className="section-label">Seu espaço, do seu jeito</p>
            <h2 id="workspace-title">
              Trabalhe sozinho ou reconstrua o tempo junto com seu time.
            </h2>
            <p>
              Um Workspace organiza contexto compartilhado sem transformar
              produtividade em vigilância.
            </p>
          </div>
        </section>

        <section className="estimate-section" aria-labelledby="estimate-title">
          <div className="landing-container estimate-layout">
            <div className="section-heading">
              <p className="section-label">Intenção encontra realidade</p>
              <h2 id="estimate-title">
                Estimativa é intenção. Tempo real é aprendizado.
              </h2>
              <p>
                Compare sem julgamento e use a diferença para compreender melhor
                o trabalho.
              </p>
            </div>
            <div className="estimate-visual">
              <div>
                <span>Estimado</span>
                <i style={{ width: "62%" }} />
                <strong>30m</strong>
              </div>
              <div>
                <span>Registrado</span>
                <i style={{ width: "86%" }} />
                <strong>42m</strong>
              </div>
              <p>
                Diferença <strong>+12m</strong>
              </p>
            </div>
          </div>
        </section>

        <section
          className="beta-section landing-container"
          aria-labelledby="beta-title"
        >
          <div>
            <p className="section-label">Free during beta</p>
            <h2 id="beta-title">
              Comece com tudo o que precisa. Sem planos para comparar.
            </h2>
            <p>Use o Rekko gratuitamente durante a fase beta.</p>
          </div>
          <Link
            className="button button--primary button--marketing"
            href="/signup"
          >
            Criar minha conta
          </Link>
        </section>
        <section className="final-cta" aria-labelledby="final-title">
          <div className="landing-container">
            <div className="segment-mark" aria-hidden="true">
              <span />
              <span />
              <span />
            </div>
            <h2 id="final-title">
              Seu tempo já aconteceu.
              <br />O Rekko ajuda você a entendê-lo.
            </h2>
            <Link
              className="button button--light button--marketing"
              href="/signup"
            >
              Começar grátis <span aria-hidden="true">→</span>
            </Link>
          </div>
        </section>
      </main>

      <footer className="landing-footer">
        <div className="landing-container">
          <BrandMark />
          <nav aria-label="Links do rodapé">
            <a href="#product">Produto</a>
            <a href="mailto:contato@rekko.app">Contato</a>
          </nav>
          <span>© {new Date().getFullYear()} Rekko</span>
        </div>
      </footer>
    </div>
  );
}

function PreviewEvent({
  current = false,
  detail,
  duration,
  time,
  title,
}: {
  current?: boolean;
  detail: string;
  duration: string;
  time: string;
  title: string;
}) {
  return (
    <div className={`preview-event${current ? " is-current" : ""}`}>
      <time>{time}</time>
      <span className="preview-event__rail" />
      <div>
        <strong>{title}</strong>
        <span>{detail}</span>
      </div>
      <small>{duration}</small>
    </div>
  );
}
