import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * ScrollToTop — Production-grade scroll restoration for React Router v6.
 *
 * Handles all navigation types:
 *  - Link clicks (navbar, buttons, cards)
 *  - Programmatic navigation (useNavigate, navigate())
 *  - Browser back / forward
 *
 * Special behaviour:
 *  - Hash links (#section) → scrolls to the target element instead of top
 *  - Query-only changes (?tab=2) → does NOT reset scroll (same page)
 *  - Instant scroll (no flicker, no layout shift)
 *
 * Usage:
 *   Place once inside <BrowserRouter>, before <Routes>:
 *
 *   <Router>
 *     <ScrollToTop />
 *     <Routes> ... </Routes>
 *   </Router>
 */
export const ScrollToTop: React.FC = () => {
  const { pathname, hash } = useLocation();
  const prevPathname = useRef(pathname);

  // Disable browser's built-in scroll restoration so we control it entirely.
  useEffect(() => {
    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual';
    }
    return () => {
      // Restore default when component unmounts (unlikely for root-level usage)
      if ('scrollRestoration' in window.history) {
        window.history.scrollRestoration = 'auto';
      }
    };
  }, []);

  useEffect(() => {
    // Skip scroll reset if only query params changed (same pathname)
    if (pathname === prevPathname.current && !hash) {
      return;
    }
    prevPathname.current = pathname;

    // If URL contains a hash (#section), scroll to that element
    if (hash) {
      // Small delay to let the DOM render the target element
      const timer = setTimeout(() => {
        const id = hash.replace('#', '');
        const el = document.getElementById(id);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 80);
      return () => clearTimeout(timer);
    }

    // Default: scroll to top instantly (no flicker)
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' as ScrollBehavior });
  }, [pathname, hash]);

  return null; // Render nothing — this is a behaviour-only component
};
