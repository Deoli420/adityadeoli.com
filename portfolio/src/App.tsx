import React, { useState, useEffect } from 'react';
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
import { SystemSimulations } from './components/SystemSimulations';
import { Testimonials } from './components/Testimonials';
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
import { getCaseStudyBySlug } from './data/casestudies';
import { BrowserRouter as Router, Routes, Route, Navigate, useParams } from 'react-router-dom';

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

  const MainContent = () => (
    <>
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
        <SystemSimulations />
        <Testimonials />
        <CTASection />

        <Contact />
        <Footer />
      </div>
    </>
  );

  return (
    <Router>
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
