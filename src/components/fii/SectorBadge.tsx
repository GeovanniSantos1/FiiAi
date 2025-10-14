"use client";

import { Badge } from '@/components/ui/badge';
import { FiiSector, getSectorLabel, getSectorDescription } from '@/types/fii-sectors';
import { cn } from '@/lib/utils';

interface SectorBadgeProps {
  sector: FiiSector;
  className?: string;
  showTooltip?: boolean;
}

/**
 * Cores específicas para cada segmento de FII
 * Usando cores do Tailwind com transparência para dark mode
 */
const SECTOR_COLORS: Record<FiiSector, string> = {
  LAJES: 'bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20 hover:bg-blue-500/20',
  LOGISTICA: 'bg-orange-500/10 text-orange-700 dark:text-orange-400 border-orange-500/20 hover:bg-orange-500/20',
  SHOPPING: 'bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-500/20 hover:bg-purple-500/20',
  VAREJO_RENDA_URBANA: 'bg-pink-500/10 text-pink-700 dark:text-pink-400 border-pink-500/20 hover:bg-pink-500/20',
  PAPEL: 'bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20 hover:bg-green-500/20',
  HEDGE_FUNDS: 'bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 border-indigo-500/20 hover:bg-indigo-500/20',
  EDUCACIONAL: 'bg-cyan-500/10 text-cyan-700 dark:text-cyan-400 border-cyan-500/20 hover:bg-cyan-500/20',
  HIBRIDOS: 'bg-violet-500/10 text-violet-700 dark:text-violet-400 border-violet-500/20 hover:bg-violet-500/20',
  AGRO: 'bg-lime-500/10 text-lime-700 dark:text-lime-400 border-lime-500/20 hover:bg-lime-500/20',
  INFRA: 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20 hover:bg-amber-500/20',
  DESENVOLVIMENTO: 'bg-teal-500/10 text-teal-700 dark:text-teal-400 border-teal-500/20 hover:bg-teal-500/20',
  HOSPITAIS: 'bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20 hover:bg-red-500/20',
  HOTEIS: 'bg-fuchsia-500/10 text-fuchsia-700 dark:text-fuchsia-400 border-fuchsia-500/20 hover:bg-fuchsia-500/20',
  AGENCIAS: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20',
  RESIDENCIAL: 'bg-sky-500/10 text-sky-700 dark:text-sky-400 border-sky-500/20 hover:bg-sky-500/20',
  OUTROS: 'bg-gray-500/10 text-gray-700 dark:text-gray-400 border-gray-500/20 hover:bg-gray-500/20',
};

/**
 * Componente Badge para exibir segmento de FII com cores específicas
 * @param sector - Segmento do FII
 * @param className - Classes CSS adicionais
 * @param showTooltip - Se deve exibir tooltip com descrição (padrão: true)
 */
export function SectorBadge({ sector, className, showTooltip = true }: SectorBadgeProps) {
  const label = getSectorLabel(sector);
  const description = getSectorDescription(sector);
  const colorClass = SECTOR_COLORS[sector] || SECTOR_COLORS.OUTROS;

  return (
    <Badge
      variant="outline"
      className={cn(
        colorClass,
        'font-medium transition-colors',
        className
      )}
      title={showTooltip ? description : undefined}
    >
      {label}
    </Badge>
  );
}
