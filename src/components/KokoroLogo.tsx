import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

type KokoroLogoProps = {
  /**
   * full — lockup completo com tagline (fundos claros)
   * mark — só ícone + “kokoro” (sidebar, compacto)
   * onCoral — branco sobre fundo coral (painéis coloridos)
   */
  variant?: "full" | "mark" | "onCoral";
  className?: string;
  to?: string;
  height?: number;
};

const DEFAULT_HEIGHT = {
  onCoral: 40,
  mark: 40,
  full: 112,
} as const;

const ASSETS = {
  light: "/brand/logo-light.png",
  coralBase: "/brand/logo-coral-base.png",
} as const;

function LogoImage({
  src,
  alt,
  height,
  cropTop,
  invert,
  className,
}: {
  src: string;
  alt: string;
  height: number;
  cropTop?: boolean;
  invert?: boolean;
  className?: string;
}) {
  return (
    <span
      className={cn("inline-block leading-none", className)}
      style={{
        height,
        overflow: cropTop ? "hidden" : "visible",
      }}
    >
      <img
        src={src}
        alt={alt}
        draggable={false}
        className="block h-full w-auto max-w-none object-contain"
        style={{
          objectPosition: cropTop ? "top center" : "center",
          filter: invert ? "brightness(0) invert(1)" : undefined,
        }}
      />
    </span>
  );
}

export function KokoroLogo({ variant = "full", className, to, height }: KokoroLogoProps) {
  const content =
    variant === "onCoral" ? (
      <LogoImage
        src={ASSETS.coralBase}
        alt="Kokoro"
        height={height ?? DEFAULT_HEIGHT.onCoral}
        cropTop
        invert
        className={className}
      />
    ) : variant === "mark" ? (
      <LogoImage
        src={ASSETS.light}
        alt="Kokoro"
        height={height ?? DEFAULT_HEIGHT.mark}
        cropTop
        className={className}
      />
    ) : (
      <LogoImage
        src={ASSETS.light}
        alt="Kokoro — Porque saúde é mais que um lembrete"
        height={height ?? DEFAULT_HEIGHT.full}
        className={cn("max-w-[min(100%,280px)]", className)}
      />
    );

  if (to) {
    return (
      <Link to={to} className="inline-flex shrink-0" aria-label="Kokoro — início">
        {content}
      </Link>
    );
  }

  return content;
}
