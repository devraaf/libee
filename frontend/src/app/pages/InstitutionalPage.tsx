// src/app/pages/InstitutionalPage.tsx
import { HeroSection } from '../../features/institutional/components/HeroSection';
import { AboutSection } from '../../features/institutional/components/AboutSection';
import { FeaturesSection } from '../../features/institutional/components/FeaturesSection';
import { HowItWorksSection } from '../../features/institutional/components/HowItWorksSection';

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