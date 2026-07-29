import { 
  LandingHeader, 
  HeroSection, 
  PlatformFeaturesSection, 
  CustomSolutionsSection, 
  EnterpriseBannerSection, 
  LandingFooter 
} from '@/features/landing';

export function LandingPage() {
  return (
    <div className="min-h-screen bg-white text-gray-900 selection:bg-black selection:text-white font-sans antialiased">
      <LandingHeader />
      <main>
        <HeroSection />
        <PlatformFeaturesSection />
        <CustomSolutionsSection />
        <EnterpriseBannerSection />
      </main>
      <LandingFooter />
    </div>
  );
}
