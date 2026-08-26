import type { Metadata } from "next";

import { LandingPage } from "@/components/landing/landing-page";

export const metadata: Metadata = {
  title: "Reconstrua seu tempo",
  description:
    "Registre o que está fazendo, reconstrua o que ficou pelo caminho e entenda onde suas horas realmente foram usadas.",
};

export default function HomePage() {
  return <LandingPage />;
}
