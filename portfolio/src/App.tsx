import React, { useState, useEffect, useCallback } from 'react';
import { SpiralAnimation } from './components/ui/spiral-animation';
import { ThemeToggle } from './components/ThemeToggle';
import { Hero } from './components/Hero';
import { ImpactStrip } from './components/ImpactStrip';
import { WhyHireMe } from './components/WhyHireMe';
import { Projects } from './components/Projects';
import { FeaturedProjects } from './components/FeaturedProjects';
import { EngineeringThinking } from './components/EngineeringThinking';
import { OperatingInChaos } from './components/OperatingInChaos';
import { Web3Security } from './components/Web3Security';
import { AIMLTesting } from './components/AIMLTesting';
import { CTASection } from './components/CTASection';
import { RecruiterShortcut } from './components/RecruiterShortcut';
import { Contact } from './components/Contact';
import { Footer } from './components/Footer';
import { NotFound } from './components/NotFound';
import { Dashboard } from './components/Dashboard';
import { LaserPointerCat } from './components/LaserPointerCat';
import { LogsPage } from './components/LogsPage';
import { BlogPost } from './components/BlogPost';
import { MagicalBugSwarm } from './components/MagicalBugSwarm';
import { CaseStudiesList } from './components/casestudy/CaseStudiesList';
import { CaseStudyDetail } from './components/casestudy/CaseStudyDetail';
import { AutomationFrameworkLanding } from './components/AutomationFrameworkLanding';
import { SentinelAILanding } from './components/SentinelAILanding';
import { UnifiedAutomationAILanding } from './components/UnifiedAutomationAILanding';
import { StrykerComplianceTemplate } from './components/StrykerComplianceTemplate';
import { BeebomSEOLanding } from './components/BeebomSEOLanding';
import { DynoTestLanding } from './components/DynoTestLanding';
import { getCaseStudyBySlug } from './data/casestudies';
import { BrowserRouter as Router, Routes, Route, Navigate, useParams } from 'react-router-dom';
import { ScrollToTop } from './components/ScrollToTop';
import { useScrollHaptics } from './hooks/useScrollHaptics';

function App() {
  const [isDark, setIsDark] = useState(true);

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }

    // DevTools Easter Egg
    console.log("%c👀 Nice try inspector. But you're not the bug hunter here.", "color: #8e44ec; font-size: 20px; font-weight: bold;");

    // Skip dev-tools detection on mobile/touch devices.
    // Mobile browsers fire `resize` when the URL bar hides or the keyboard
    // opens, which creates false positives and a spurious shake animation.
    const isTouchDevice =
      window.matchMedia('(pointer: coarse)').matches ||
      (navigator.maxTouchPoints || 0) > 0 ||
      window.innerWidth < 768;

    if (isTouchDevice) {
      // Ensure the class is never applied on mobile, even if set previously.
      document.body.classList.remove('glitch-effect');
      return;
    }

    const detectDevTools = () => {
      const threshold = 160;
      const widthThreshold = window.outerWidth - window.innerWidth > threshold;
      const heightThreshold = window.outerHeight - window.innerHeight > threshold;

      if (widthThreshold || heightThreshold) {
        document.body.classList.add('glitch-effect');
      } else {
        document.body.classList.remove('glitch-effect');
      }
    };

    window.addEventListener('resize', detectDevTools);
    return () => window.removeEventListener('resize', detectDevTools);
  }, [isDark]);

  const MainContent = () => {
    useScrollHaptics(['impact', 'cta']);

    // Skip the spiral intro entirely on mobile / touch devices —
    // the WebGL animation drops frames on low-end mobile GPUs and
    // the intro overlay is a poor first impression there.
    const isTouchDevice =
      typeof window !== 'undefined' &&
      (window.matchMedia('(pointer: coarse)').matches ||
        (navigator.maxTouchPoints || 0) > 0 ||
        window.innerWidth < 768);

    const [showIntro, setShowIntro] = useState(!isTouchDevice);
    const [introFading, setIntroFading] = useState(false);
    const [enterVisible, setEnterVisible] = useState(false);

    // Show "Enter" button after 2s
    useEffect(() => {
      const timer = setTimeout(() => setEnterVisible(true), 2000);
      return () => clearTimeout(timer);
    }, []);

    const handleEnter = useCallback(() => {
      setIntroFading(true);
      setTimeout(() => setShowIntro(false), 1200);
    }, []);

    // Also allow Enter key or scroll to dismiss
    useEffect(() => {
      if (!showIntro || introFading) return;
      const handleKey = (e: KeyboardEvent) => {
        if (e.key === 'Enter' || e.key === ' ') handleEnter();
      };
      const handleScroll = () => {
        if (enterVisible) handleEnter();
      };
      window.addEventListener('keydown', handleKey);
      window.addEventListener('wheel', handleScroll, { passive: true });
      window.addEventListener('touchmove', handleScroll, { passive: true });
      return () => {
        window.removeEventListener('keydown', handleKey);
        window.removeEventListener('wheel', handleScroll);
        window.removeEventListener('touchmove', handleScroll);
      };
    }, [showIntro, introFading, enterVisible, handleEnter]);

    return (
    <>
      {/* ── Spiral Intro ──────────────────────────────────── */}
      {showIntro && (
        <div
          className={`fixed inset-0 z-[100] bg-black transition-opacity duration-1000 ${
            introFading ? 'opacity-0 pointer-events-none' : 'opacity-100'
          }`}
        >
          <div className="absolute inset-0">
            <SpiralAnimation />
          </div>

          {/* Enter button */}
          <div
            className={`absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10 flex flex-col items-center gap-6 transition-all duration-1000 ease-out ${
              enterVisible && !introFading
                ? 'opacity-100 translate-y-0'
                : 'opacity-0 translate-y-4'
            }`}
          >
            <button
              onClick={handleEnter}
              className="text-white text-2xl tracking-[0.2em] uppercase font-extralight transition-all duration-700 hover:tracking-[0.3em] animate-pulse cursor-pointer"
            >
              Enter
            </button>
            <span className="text-white/30 text-[10px] tracking-widest uppercase font-mono">
              or press Enter / scroll
            </span>
          </div>
        </div>
      )}

      {/* ── Main Portfolio ────────────────────────────────── */}
      <div className="fixed inset-0 bg-[url('https://images.pexels.com/photos/8721318/pexels-photo-8721318.jpeg')] bg-cover bg-center opacity-20 pointer-events-none" />
      <div className="relative z-10">
        <ThemeToggle isDark={isDark} toggle={() => setIsDark(!isDark)} />
        <LaserPointerCat />
        <RecruiterShortcut />

        {/* ── Conversion Funnel ──────────────────────────────── */}
        <Hero />
        <ImpactStrip />
        <WhyHireMe />
        <FeaturedProjects />
        <Projects />
        <EngineeringThinking />
        <OperatingInChaos />
        <Web3Security />
        <AIMLTesting />
        <CTASection />

        <Contact />
        <Footer />
      </div>
    </>
    );
  };

  return (
    <Router>
      <ScrollToTop />
      <div className="min-h-screen bg-cyber-black">
        <MagicalBugSwarm />
        <Routes>
          <Route path="/" element={<MainContent />} />
          <Route path="/logs" element={<LogsPage />} />
          <Route path="/logs/:slug" element={<BlogPost />} />
          <Route path="/casestudies" element={<CaseStudiesList />} />
          <Route path="/casestudies/:slug" element={<CaseStudyDetailWrapper />} />
          <Route path="/projects/sentinelai" element={<SentinelAILanding />} />
          <Route path="/projects/automation-framework" element={<AutomationFrameworkLanding />} />
          <Route path="/projects/unified-automation-ai" element={<UnifiedAutomationAILanding />} />
          <Route path="/projects/stryker-compliance-template" element={<StrykerComplianceTemplate />} />
          <Route path="/projects/beebom-seo-framework" element={<BeebomSEOLanding />} />
          <Route path="/projects/dynotest" element={<DynoTestLanding />} />
          <Route path="/dashboard/*" element={<Dashboard />} />
          <Route path="/404" element={<NotFound />} />
          <Route path="*" element={<Navigate to="/404" replace />} />
        </Routes>
      </div>
    </Router>
  );
}

const CaseStudyDetailWrapper: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const caseStudy = slug ? getCaseStudyBySlug(slug) : null;

  if (!caseStudy) {
    return <Navigate to="/404" replace />;
  }

  return <CaseStudyDetail caseStudy={caseStudy} />;
};

export default App;
