import React, { useEffect } from 'react';
import { NotFound } from './components/NotFound';
import { Dashboard } from './components/Dashboard';
import { LogsPage } from './components/LogsPage';
import { BlogPost } from './components/BlogPost';
import { MagicalBugSwarm } from './components/MagicalBugSwarm';
import { HomePage } from './home/HomePage';
import { CaseStudiesList } from './components/casestudy/CaseStudiesList';
import { CaseStudyDetail } from './components/casestudy/CaseStudyDetail';
import { AutomationFrameworkLanding } from './components/AutomationFrameworkLanding';
import { SentinelAILanding } from './components/SentinelAILanding';
import { UnifiedAutomationAILanding } from './components/UnifiedAutomationAILanding';
import { StrykerComplianceTemplate } from './components/StrykerComplianceTemplate';
import { BeebomSEOLanding } from './components/BeebomSEOLanding';
import { DynoTestLanding } from './components/DynoTestLanding';
import { getCaseStudyBySlug } from './data/casestudies';
import { BrowserRouter as Router, Routes, Route, Navigate, useParams, useLocation } from 'react-router-dom';
import { ScrollToTop } from './components/ScrollToTop';

function App() {

  useEffect(() => {
    document.documentElement.classList.add('dark');

    // DevTools Easter Egg
    console.log("%cReading the source? Good — that's the job. adityadeoli@gmail.com", "color: #c6ff3d; font-size: 14px; font-family: monospace;");

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
      // The home page is a calm, editorial design — no dev-tools shake there.
      if (window.location.pathname === '/') {
        document.body.classList.remove('glitch-effect');
        return;
      }
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
  }, []);

  return (
    <Router>
      <ScrollToTop />
      <div className="min-h-screen bg-cyber-black">
        <BugSwarmOffHome />
        <Routes>
          <Route path="/" element={<HomePage />} />
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

// The bug swarm belongs to the playful inner pages, not the home page.
const BugSwarmOffHome: React.FC = () => {
  const { pathname } = useLocation();
  return pathname === '/' ? null : <MagicalBugSwarm />;
};

const CaseStudyDetailWrapper: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const caseStudy = slug ? getCaseStudyBySlug(slug) : null;

  if (!caseStudy) {
    return <Navigate to="/404" replace />;
  }

  return <CaseStudyDetail caseStudy={caseStudy} />;
};

export default App;
