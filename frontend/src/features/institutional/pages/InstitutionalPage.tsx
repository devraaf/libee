import { HeroSection } from '../components/HeroSection';
import { AboutSection } from '../components/AboutSection';
import { FeaturesSection } from '../components/FeaturesSection';
import { HowItWorksSection } from '../components/HowItWorksSection';

export function InstitutionalPage() {
  return (
    <div className="flex flex-col">
      <HeroSection />
      <AboutSection />
      <FeaturesSection />
      <HowItWorksSection />
    </div>
  );
}
