"use client";

import { Badge } from '@/components/ui/badge';
import { FundRecommendation, getRecommendationLabel, getRecommendationColor } from '@/lib/validations/carteiras';

interface RecommendationBadgeProps {
  recommendation: FundRecommendation;
  className?: string;
}

export function RecommendationBadge({ recommendation, className }: RecommendationBadgeProps) {
  const label = getRecommendationLabel(recommendation);
  const color = getRecommendationColor(recommendation);

  return (
    <Badge
      variant={color as any}
      className={className}
    >
      {label}
    </Badge>
  );
}