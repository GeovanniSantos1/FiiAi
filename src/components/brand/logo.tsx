"use client";

import * as React from "react";
import Image from "next/image";
import { useTheme } from "@/components/theme-provider";
import { cn } from "@/lib/utils";

type LogoVariant = "full" | "icon";
type LogoSize = "sm" | "md" | "lg" | "xl";

type LogoProps = {
  variant?: LogoVariant;
  size?: LogoSize;
  className?: string;
  priority?: boolean;
};

const sizeMap: Record<LogoSize, { width: number; height: number }> = {
  sm: { width: 120, height: 40 },
  md: { width: 160, height: 50 },
  lg: { width: 200, height: 60 },
  xl: { width: 240, height: 70 },
};

const iconSizeMap: Record<LogoSize, { width: number; height: number }> = {
  sm: { width: 32, height: 32 },
  md: { width: 40, height: 40 },
  lg: { width: 48, height: 48 },
  xl: { width: 56, height: 56 },
};

export function Logo({
  variant = "full",
  size = "md",
  className,
  priority = false,
}: LogoProps) {
  const { resolvedTheme } = useTheme();

  const logoSrc = React.useMemo(() => {
    if (variant === "icon") {
      return resolvedTheme === "dark"
        ? "/img/FIIS.IA - SIMBOLO.png"
        : "/img/FIIS.IA - SIMBOLO - BRANCO.png";
    }
    return resolvedTheme === "dark"
      ? "/img/FIIS.IA sem fundo.png"
      : "/img/FIIS.IA - BRANCO.png";
  }, [variant, resolvedTheme]);

  const dimensions = variant === "icon" ? iconSizeMap[size] : sizeMap[size];

  return (
    <Image
      src={logoSrc}
      alt="FiiAI - Análise Inteligente de Fundos Imobiliários"
      width={dimensions.width}
      height={dimensions.height}
      priority={priority}
      className={cn("object-contain", className)}
      quality={95}
    />
  );
}
