import { useState, useEffect } from 'react';

export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(window.matchMedia(query).matches);

  useEffect(() => {
    const media = window.matchMedia(query);
    const listener = () => setMatches(media.matches);
    
    // Support for modern browsers
    try {
      media.addEventListener('change', listener);
    } catch (e) {
      // Fallback for older browsers
      media.addListener(listener);
    }

    // Initial check
    if (media.matches !== matches) {
      setMatches(media.matches);
    }
    
    return () => {
      try {
        media.removeEventListener('change', listener);
      } catch (e) {
        media.removeListener(listener);
      }
    };
  }, [matches, query]);

  return matches;
}
