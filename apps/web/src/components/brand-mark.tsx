import Link from "next/link";

type BrandMarkProps = {
  href?: string;
  inverted?: boolean;
};

export function BrandMark({ href = "/", inverted = false }: BrandMarkProps) {
  return (
    <Link
      className="brand-mark"
      data-inverted={inverted || undefined}
      href={href}
      aria-label="Rekko — página inicial"
    >
      <span className="brand-mark__segment" aria-hidden="true" />
      <span>rekko</span>
    </Link>
  );
}
