import Link from "next/link";
import Image from "next/image";

type BrandMarkProps = {
  href?: string;
  inverted?: boolean;
  variant?: "wordmark" | "mark";
};

export function BrandMark({
  href = "/",
  inverted = false,
  variant = "wordmark",
}: BrandMarkProps) {
  if (variant === "mark") {
    return (
      <Link
        className="brand-mark brand-mark--symbol"
        data-inverted={inverted || undefined}
        href={href}
        aria-label="Rekko"
      >
        <Image
          alt=""
          aria-hidden="true"
          className="brand-mark__mark brand-mark__mark--purple"
          height={28}
          src="/brand/logo/rekko-logo-purple.svg"
          width={28}
        />
        <Image
          alt=""
          aria-hidden="true"
          className="brand-mark__mark brand-mark__mark--white"
          height={28}
          src="/brand/logo/rekko-logo-white.svg"
          width={28}
        />
      </Link>
    );
  }
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
