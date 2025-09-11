import { LandingHeader } from './landing-header';
import { HeroSection } from './hero-section';
import { FeaturesSection } from './features-section';
import { ComparisonSection } from './comparison-section';
import { ComingSoonSection } from './coming-soon-section';
import { ContactSection } from './contact-section';
import { LandingFooter } from './landing-footer';

export function LandingPage() {
  return (
    // Full viewport layout that overrides the root layout
    <div className="fixed inset-0 bg-white overflow-y-auto z-50">
      <LandingHeader />
      <main>
        <HeroSection />
        <FeaturesSection />
        <ComparisonSection />
        <ComingSoonSection />
        <ContactSection />
      </main>
      <LandingFooter />
    </div>
  );
}