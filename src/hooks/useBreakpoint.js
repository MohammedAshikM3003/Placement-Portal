import { useState, useEffect } from 'react';

const BREAKPOINTS = { mobile: 768, tablet: 1024, desktop: 1280 };

/**
 * useBreakpoint
 * Returns the current breakpoint name: 'mobile' | 'tablet' | 'desktop'
 * Also exposes boolean helpers: isMobile, isTablet, isDesktop
 *
 * Standard project breakpoints (from styles/BREAKPOINTS.md):
 *   mobile  <= 768px
 *   tablet  <= 1024px
 *   desktop  > 1024px
 */
export function useBreakpoint() {
  const [width, setWidth] = useState(
    typeof window !== 'undefined' ? window.innerWidth : 1280
  );

  useEffect(() => {
    function onResize() { setWidth(window.innerWidth); }
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const isMobile  = width <= BREAKPOINTS.mobile;
  const isTablet  = width <= BREAKPOINTS.tablet && !isMobile;
  const isDesktop = width > BREAKPOINTS.tablet;

  const breakpoint = isMobile ? 'mobile' : isTablet ? 'tablet' : 'desktop';

  return { breakpoint, isMobile, isTablet, isDesktop, width };
}

export default useBreakpoint;
