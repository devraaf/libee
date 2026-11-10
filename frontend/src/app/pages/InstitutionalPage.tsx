import { Header } from '../layout/Header';
import { Footer } from '../layout/Footer';
import { HeroSection } from '../../features/institutional/components/HeroSection';
import { AboutSection } from '../../features/institutional/components/AboutSection';
import { FeaturesSection } from '../../features/institutional/components/FeaturesSection';
import { HowItWorksSection } from '../../features/institutional/components/HowItWorksSection';

export function InstitutionalPage() {
  return (
    <div className="flex min-h-screen flex-col bg-bg">
      {/* Header configurado para visitantes não autenticados */}
      <Header profile="public" />

      <main className="flex-1">
        <HeroSection />
        <AboutSection />
        <FeaturesSection />
        <HowItWorksSection />
      </main>

      <Footer />
    </div>
  );
}