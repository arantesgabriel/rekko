"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { ThemeSwitcher } from "@/components/theme-switcher";
import { useHydrationSafeReducedMotion } from "@/components/landing/motion";

export function MarketingNavbar() {
  const [overHero, setOverHero] = useState(true);
  const [open, setOpen] = useState(false);
  const trigger = useRef<HTMLButtonElement>(null);
  const menu = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const hero = document.getElementById("hero");
    if (!hero) return;
    const observer = new IntersectionObserver(
      ([entry]) => setOverHero((entry?.intersectionRatio ?? 0) > 0.16),
      { threshold: [0, 0.16, 0.3], rootMargin: "-72px 0px 0px" },
    );
    observer.observe(hero);
    return () => observer.disconnect();
  }, []);
  useEffect(() => {
    if (!open) return;
    const overflow = document.body.style.overflow;
    const menuTrigger = trigger.current;
    document.body.style.overflow = "hidden";
    menu.current?.querySelector<HTMLElement>("a, button")?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = overflow;
      document.removeEventListener("keydown", onKey);
      menuTrigger?.focus();
    };
  }, [open]);
  const close = () => setOpen(false);
  return (
    <header
      className={`marketing-nav ${overHero ? "is-over-hero" : "is-scrolled"}`}
    >
      <div className="marketing-nav__inner">
        <NavbarBrand inverted={overHero} />
        <nav aria-label="Navegação principal" className="marketing-nav__links">
          <a href="#product">Produto</a>
          <a href="#how-it-works">Como funciona</a>
          <a href="#integrations">Integrações</a>
        </nav>
        <div className="marketing-nav__actions">
          <ThemeSwitcher />
          <Link className="marketing-nav__login" href="/login">
            Entrar
          </Link>
          <Link
            className={`button marketing-nav__cta ${overHero ? "button--light" : "button--primary"}`}
            href="/signup"
          >
            Começar grátis
          </Link>
          <button
            ref={trigger}
            className="mobile-menu-button"
            type="button"
            aria-expanded={open}
            aria-controls="mobile-menu"
            aria-label={open ? "Fechar menu" : "Abrir menu"}
            onClick={() => setOpen((value) => !value)}
          >
            <span />
            <span />
          </button>
        </div>
      </div>
      {open && (
        <div className="mobile-menu-backdrop" onMouseDown={close}>
          <div
            id="mobile-menu"
            ref={menu}
            className="mobile-menu"
            role="dialog"
            aria-modal="true"
            aria-label="Menu principal"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <nav>
              <a onClick={close} href="#product">
                Produto
              </a>
              <a onClick={close} href="#how-it-works">
                Como funciona
              </a>
              <a onClick={close} href="#integrations">
                Integrações
              </a>
              <Link onClick={close} href="/login">
                Entrar
              </Link>
            </nav>
            <div className="mobile-menu__theme">
              <span>Tema</span>
              <ThemeSwitcher />
            </div>
          </div>
        </div>
      )}
    </header>
  );
}

function NavbarBrand({ inverted }: { inverted: boolean }) {
  const reduced = useHydrationSafeReducedMotion();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (reduced) return;
    let timeout = 0;
    let cancelled = false;
    const wait = (ms: number) =>
      new Promise<void>((resolve) => {
        timeout = window.setTimeout(resolve, ms);
      });
    const loop = async () => {
      while (!cancelled) {
        await wait(4200 + Math.random() * 6400);
        if (cancelled) return;
        setOpen(true);
        await wait(2400);
        if (cancelled) return;
        setOpen(false);
      }
    };
    void loop();
    return () => {
      cancelled = true;
      window.clearTimeout(timeout);
    };
  }, [reduced]);

  return (
    <Link
      className={`brand-mark brand-mark--navbar${open || reduced ? " is-open" : ""}`}
      data-inverted={inverted || undefined}
      href="/"
      aria-label="Rekko — página inicial"
    >
      <span className="brand-mark__icon">
        <Image
          alt=""
          aria-hidden="true"
          className="brand-mark__mark brand-mark__mark--purple"
          height={40}
          priority
          src="/brand/logo/rekko-logo-purple.svg"
          width={40}
        />
        <Image
          alt=""
          aria-hidden="true"
          className="brand-mark__mark brand-mark__mark--white"
          height={40}
          priority
          src="/brand/logo/rekko-logo-white.svg"
          width={40}
        />
      </span>
      <span className="brand-mark__name">Rekko</span>
    </Link>
  );
}

function formatElapsed(milliseconds: number) {
  const seconds = Math.floor(milliseconds / 1000);
  return [
    Math.floor(seconds / 3600),
    Math.floor((seconds % 3600) / 60),
    seconds % 60,
  ]
    .map((value) => String(value).padStart(2, "0"))
    .join(":");
}

export function ProductDemo() {
  const [status, setStatus] = useState<"idle" | "running" | "paused">("idle");
  const [elapsed, setElapsed] = useState(0);
  const [accumulated, setAccumulated] = useState(0);
  const startedAt = useRef<number | null>(null);
  const [reconstructed, setReconstructed] = useState(false);
  useEffect(() => {
    if (status !== "running") return;
    const update = () =>
      setElapsed(accumulated + Date.now() - (startedAt.current ?? Date.now()));
    update();
    const interval = window.setInterval(update, 250);
    return () => window.clearInterval(interval);
  }, [status, accumulated]);
  const toggle = () => {
    if (status === "running") {
      const next = accumulated + Date.now() - (startedAt.current ?? Date.now());
      setAccumulated(next);
      setElapsed(next);
      setStatus("paused");
      startedAt.current = null;
    } else {
      startedAt.current = Date.now();
      setStatus("running");
    }
  };
  const running = status === "running";
  return (
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
            <i />{" "}
            {running
              ? "Em andamento"
              : status === "paused"
                ? "Em pausa"
                : "Pronto para começar"}
          </span>
          <strong>AMBLA</strong>
          <p>Fluxo de integração</p>
        </div>
        <div
          className="preview-timer"
          aria-label={`Tempo decorrido ${formatElapsed(elapsed)}`}
        >
          {formatElapsed(elapsed)}
        </div>
        <button
          className="button button--primary"
          type="button"
          onClick={toggle}
        >
          {running
            ? "Pausar"
            : status === "paused"
              ? "Retomar"
              : "Iniciar timer"}
        </button>
        <span className="sr-only" aria-live="polite">
          {status === "running"
            ? accumulated
              ? "Timer retomado"
              : "Timer iniciado"
            : status === "paused"
              ? "Timer pausado"
              : ""}
        </span>
      </div>
      <div
        className="preview-timeline"
        role="img"
        aria-label="Timeline de demonstração com atividades e um período reconstruível"
      >
        <PreviewEvent
          time="08:12"
          title="AMBLA"
          detail="Integração"
          duration="1h28"
        />
        <PreviewEvent
          time="09:40"
          title="Alinhamento diário"
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

export function LinearSelector() {
  const [selected, setSelected] = useState([true, true, false]);
  const labels = [
    "[EPIC] Cloudflare Turnstile",
    "AC-844 Login frontend",
    "AC-845 Login backend",
  ];
  return (
    <fieldset className="linear-selector">
      <legend className="sr-only">Itens do Linear para importar</legend>
      <div className="linear-selector__top">
        <strong>Linear</strong>
        <span>{selected.filter(Boolean).length} selecionadas</span>
      </div>
      {labels.map((label, index) => (
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
      <div className="linear-selector__flow" aria-hidden="true">
        <span>Linear</span>
        <i>→</i>
        <span>Seleção específica</span>
        <i>→</i>
        <strong>Rekko</strong>
      </div>
    </fieldset>
  );
}
