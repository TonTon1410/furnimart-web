"use client"
import { HeroSection } from "@/components/about/hero-section"
import { StorySection } from "@/components/about/story-section"
import { ValuesSection } from "@/components/about/values-section"
import { TeamSection } from "@/components/about/team-section"
import { ServicesSection } from "@/components/about/services-section"
import { CtaSection } from "@/components/about/cta-section"

const AboutPage = () => {
  return (
    <div className="min-h-screen bg-white pb-24 sm:pb-20">
      <HeroSection />
      <StorySection />
      <ValuesSection />
      <TeamSection />
      <ServicesSection />
      <CtaSection />
    </div>
  )
}

export default AboutPage
