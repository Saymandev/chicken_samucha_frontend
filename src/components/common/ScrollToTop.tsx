import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

interface ScrollToTopProps {
  smooth?: boolean;
  excludePaths?: string[];
}

/**
 * ScrollToTop component that automatically scrolls to the top of the page
 * whenever the route changes. This ensures users start at the top of each new page
 * instead of maintaining the previous page's scroll position.
 */
const ScrollToTop: React.FC<ScrollToTopProps> = ({ 
  smooth = true, 
  excludePaths = [] 
}) => {
  const { pathname } = useLocation();

  useEffect(() => {
    // Skip scroll to top for excluded paths
    if (excludePaths.some(path => pathname.startsWith(path))) {
      return;
    }

    // Small delay to ensure the page has rendered
    const scrollToTop = () => {
      window.scrollTo({
        top: 0,
        left: 0,
        behavior: smooth ? 'smooth' : 'auto'
      });
    };

    // Use setTimeout to ensure this runs after React has updated the DOM
    setTimeout(scrollToTop, 0);
  }, [pathname, smooth, excludePaths]);

  // This component doesn't render anything
  return null;
};

export default ScrollToTop;
