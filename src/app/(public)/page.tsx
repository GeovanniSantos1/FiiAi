import { FiiHero } from "@/components/fii/hero"
import { FiiFeatures } from "@/components/fii/features"
import { FiiAgents } from "@/components/fii/agent-card"
import { AccessInfo } from "@/components/marketing/access-info"

export default async function LandingPage() {
  return (
    <div className="min-h-screen">
      <FiiHero />
      <FiiFeatures />
      <FiiAgents />
      <AccessInfo />
    </div>
  )
}
