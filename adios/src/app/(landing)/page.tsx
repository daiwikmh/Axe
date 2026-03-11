import { HeroSection } from "@/components/landing/hero-section"
import { SignalsSection } from "@/components/landing/signals-section"
import { WorkSection } from "@/components/landing/work-section"
import { PrinciplesSection } from "@/components/landing/principles-section"
import { ColophonSection } from "@/components/landing/colophon-section"
import { SideNav } from "@/components/landing/side-nav"

export default function Page() {
  return (
    <main className="relative min-h-screen">
      <SideNav />
      <div className="grid-bg fixed inset-0 opacity-30" aria-hidden="true" />

      <div className="relative z-10">
        <HeroSection />
        <SignalsSection />
        <WorkSection />
        <PrinciplesSection />
        <ColophonSection />
      </div>
    </main>
  )
}
