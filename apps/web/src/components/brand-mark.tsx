import Link from "next/link";
import Image from "next/image";

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
      <Image
        alt=""
        aria-hidden="true"
        className="brand-mark__wordmark brand-mark__wordmark--purple"
        height={42}
        priority
        src="/brand/logo/rekko-wordmark-purple.svg"
        width={126}
      />
      <Image
        alt=""
        aria-hidden="true"
        className="brand-mark__wordmark brand-mark__wordmark--white"
        height={42}
        priority
        src="/brand/logo/rekko-wordmark-white.svg"
        width={126}
      />
    </Link>
  );
}
