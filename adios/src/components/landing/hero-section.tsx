"use client"

import { useEffect, useRef } from "react"
import Image from "next/image"
import { ScrambleTextOnHover } from "@/components/landing/scramble-text"
import { SplitFlapText, SplitFlapMuteToggle, SplitFlapAudioProvider } from "@/components/landing/split-flap-text"
import { AnimatedNoise } from "@/components/landing/animated-noise"
import { BitmapChevron } from "@/components/landing/bitmap-chevron"
import gsap from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"

gsap.registerPlugin(ScrollTrigger)

export function HeroSection() {
  const sectionRef = useRef<HTMLElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!sectionRef.current || !contentRef.current) return

    const ctx = gsap.context(() => {
      gsap.to(contentRef.current, {
        y: -100,
        opacity: 0,
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top top",
          end: "bottom top",
          scrub: 1,
        },
      })
    }, sectionRef)

    return () => ctx.revert()
  }, [])

  return (
    <section ref={sectionRef} id="hero" className="relative min-h-screen flex items-center pl-6 md:pl-28 pr-6 md:pr-12">
      <AnimatedNoise opacity={0.03} />

      <div className="absolute left-4 md:left-6 top-1/2 -translate-y-1/2">
        <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-muted-foreground -rotate-90 origin-left block whitespace-nowrap">
          YIELD AGENT
        </span>
      </div>

      <div ref={contentRef} className="flex-1 w-full">
        <div className="mb-6 flex items-center gap-4">
          <Image src="/pin.jpg" alt="Brahma logo" width={48} height={48} className="rounded-sm" />
        </div>

        <SplitFlapAudioProvider>
          <div className="relative">
            <SplitFlapText text="BRAHMA" speed={80} />
            <div className="mt-4">
              <SplitFlapMuteToggle />
            </div>
          </div>
        </SplitFlapAudioProvider>

        <h2 className="font-[var(--font-display)] text-muted-foreground/60 text-[clamp(1rem,3vw,2rem)] mt-4 tracking-wide">
          AUTONOMOUS CROSS-CHAIN YIELD AGENT
        </h2>

        <p className="mt-12 max-w-md font-mono text-sm text-muted-foreground leading-relaxed">
          brahma scans USDC yields across Base, Arbitrum, Optimism, and Polygon — then moves your capital to the highest-earning Aave V3 pool automatically via LI.FI.
        </p>

        <div className="mt-16 flex items-center gap-8">
          <a
            href="/dashboard"
            className="group inline-flex items-center gap-3 border border-foreground/20 px-6 py-3 font-mono text-xs uppercase tracking-widest text-foreground hover:border-accent hover:text-accent transition-all duration-200"
          >
            <ScrambleTextOnHover text="Launch App" as="span" duration={0.6} />
            <BitmapChevron className="transition-transform duration-[400ms] ease-in-out group-hover:rotate-45" />
          </a>
        </div>
      </div>
    </section>
  )
}
