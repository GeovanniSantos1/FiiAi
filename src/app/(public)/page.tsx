import { FiiHero } from "@/components/fii/hero"
import { FiiFeatures } from "@/components/fii/features"
import { FiiAgents } from "@/components/fii/agent-card"
import { Pricing } from "@/components/marketing/pricing"
import { getActivePlansSorted } from '@/lib/queries/plans'

export default async function LandingPage() {
  const plans = await getActivePlansSorted()
  return (
    <div className="min-h-screen">
      <FiiHero />
      <FiiFeatures />
      <FiiAgents />
      <Pricing
        plans={plans.map((p) => ({
          id: p.id,
          clerkId: p.clerkId ?? null,
          name: p.name,
          credits: p.credits,
          currency: p.currency ?? null,
          priceMonthlyCents: p.priceMonthlyCents ?? null,
          priceYearlyCents: p.priceYearlyCents ?? null,
          description: p.description ?? null,
          features: Array.isArray(p.features) ? p.features.map((f: unknown) => ({
            name: (f as { name?: string }).name || '',
            description: (f as { description?: string }).description || null,
            included: (f as { included?: boolean }).included ?? true
          })) : null,
          badge: p.badge ?? null,
          highlight: p.highlight ?? false,
          ctaType: (p.ctaType === 'checkout' || p.ctaType === 'contact') ? p.ctaType : null,
          ctaLabel: p.ctaLabel ?? null,
          ctaUrl: p.ctaUrl ?? null,
          billingSource: p.billingSource as 'clerk' | 'manual' | null,
        }))}
      />
    </div>
  )
}
