"use client";

import {
  motion,
  useReducedMotion,
  useScroll,
  useTransform,
} from "motion/react";
import { useRef } from "react";
import type { PropsWithChildren } from "react";

export const motionTokens = {
  duration: { fast: 0.18, standard: 0.4, expressive: 0.62 },
  easeOut: [0.16, 1, 0.3, 1] as const,
  easeInOut: [0.65, 0, 0.35, 1] as const,
  staggerTight: 0.07,
  staggerStandard: 0.09,
  revealDistance: 32,
};

export function Reveal({
  children,
  className,
  delay = 0,
}: PropsWithChildren<{
  className?: string;
  delay?: number;
  direction?: "up" | "left" | "right";
}>) {
  const reduced = useReducedMotion();
  return (
    <motion.div
      className={className}
      initial={{
        opacity: 0.86,
        y: reduced ? 0 : motionTokens.revealDistance,
      }}
      whileInView={{ opacity: 1, x: 0, y: 0 }}
      viewport={{ amount: 0.2, margin: "0px 0px -8%", once: false }}
      transition={{
        delay: reduced ? 0 : delay,
        duration: reduced ? 0 : motionTokens.duration.expressive,
        ease: motionTokens.easeOut,
      }}
    >
      {children}
    </motion.div>
  );
}

export function HeroSequence({ children }: PropsWithChildren) {
  const reduced = useReducedMotion();
  return (
    <motion.div
      className="landing-container hero__content"
      initial="hidden"
      animate="visible"
      variants={{
        hidden: {},
        visible: {
          transition: {
            staggerChildren: reduced ? 0 : motionTokens.staggerStandard,
          },
        },
      }}
    >
      {children}
    </motion.div>
  );
}

export function HeroItem({ children }: PropsWithChildren) {
  const reduced = useReducedMotion();
  return (
    <motion.div
      variants={{
        hidden: { opacity: 0.82, y: reduced ? 0 : 18 },
        visible: { opacity: 1, y: 0 },
      }}
      transition={{
        duration: reduced ? 0 : motionTokens.duration.expressive,
        ease: motionTokens.easeOut,
      }}
    >
      {children}
    </motion.div>
  );
}

export function NarrativeStep({
  children,
  index,
}: PropsWithChildren<{ index: number }>) {
  const reduced = useReducedMotion();
  return (
    <motion.article
      initial={{ opacity: 0.82, y: reduced ? 0 : 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ amount: 0.55, once: false }}
      transition={{
        delay: reduced ? 0 : index * motionTokens.staggerStandard,
        duration: reduced ? 0 : motionTokens.duration.expressive,
        ease: motionTokens.easeOut,
      }}
    >
      {children}
    </motion.article>
  );
}

export function TimelineStory() {
  const reduced = useReducedMotion();
  const target = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target,
    offset: ["start 82%", "end 38%"],
  });
  const resolutionOpacity = useTransform(
    scrollYProgress,
    [0.42, 0.72],
    reduced ? [1, 1] : [0.75, 1],
  );
  const resolutionY = useTransform(
    scrollYProgress,
    [0.42, 0.72],
    reduced ? [0, 0] : [10, 0],
  );

  return (
    <div
      className="timeline-story"
      ref={target}
      role="img"
      aria-label="Fragmentos de tempo se conectam em uma reunião reconstruída"
    >
      <TimelineRow time="09:40" title="Alinhamento diário" />
      <TimelineRow gap time="10:00" title="32m sem registro" />
      <TimelineRow time="10:32" title="Integração" />
      <motion.div
        className="timeline-story__resolved"
        style={{ opacity: resolutionOpacity, y: resolutionY }}
      >
        <time>10:00</time>
        <span />
        <strong>Reunião reconstruída</strong>
      </motion.div>
    </div>
  );
}

function TimelineRow({
  gap = false,
  time,
  title,
}: {
  gap?: boolean;
  time: string;
  title: string;
}) {
  const reduced = useReducedMotion();
  return (
    <motion.div
      className={gap ? "timeline-story__gap" : undefined}
      initial={{ opacity: 0.82, x: reduced ? 0 : 18 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ amount: 0.6, once: false }}
      transition={{
        duration: reduced ? 0 : motionTokens.duration.standard,
        ease: motionTokens.easeOut,
      }}
    >
      <time>{time}</time>
      <span />
      <strong>{title}</strong>
    </motion.div>
  );
}

export function ScaleBar({ scale }: { scale: number }) {
  const reduced = useReducedMotion();
  return (
    <motion.i
      initial={{ scaleX: reduced ? scale : 0.08 }}
      whileInView={{ scaleX: scale }}
      viewport={{ amount: 0.7, once: true }}
      transition={{
        duration: reduced ? 0 : motionTokens.duration.expressive,
        ease: motionTokens.easeOut,
      }}
    />
  );
}

export function TeamAvatar({
  children,
  className = "",
  index,
}: PropsWithChildren<{ className?: string; index: number }>) {
  const reduced = useReducedMotion();
  return (
    <motion.div
      className={`person ${className}`}
      initial={{ opacity: 0.84, y: reduced ? 0 : 14 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ amount: 0.8, once: true }}
      transition={{
        delay: reduced ? 0 : index * motionTokens.staggerTight,
        duration: reduced ? 0 : motionTokens.duration.standard,
        ease: motionTokens.easeOut,
      }}
    >
      {children}
    </motion.div>
  );
}

export function FinalSequence({ children }: PropsWithChildren) {
  const reduced = useReducedMotion();
  return (
    <motion.div
      className="landing-container"
      initial="hidden"
      whileInView="visible"
      viewport={{ amount: 0.45, once: true }}
      variants={{
        hidden: {},
        visible: {
          transition: {
            staggerChildren: reduced ? 0 : motionTokens.staggerStandard,
          },
        },
      }}
    >
      {children}
    </motion.div>
  );
}

export function FinalItem({ children }: PropsWithChildren) {
  const reduced = useReducedMotion();
  return (
    <motion.div
      variants={{
        hidden: { opacity: 0.82, y: reduced ? 0 : 20 },
        visible: { opacity: 1, y: 0 },
      }}
      transition={{
        duration: reduced ? 0 : motionTokens.duration.expressive,
        ease: motionTokens.easeOut,
      }}
    >
      {children}
    </motion.div>
  );
}
