'use client';

import { useEffect, useRef, useState, type RefObject } from 'react';

/**
 * Hook that triggers a CSS class when element enters viewport.
 * Similar to the scroll-reveal effect on chain.link/hackathon.
 */
export function useScrollReveal<T extends HTMLElement = HTMLDivElement>(
  threshold = 0.15,
): [RefObject<T | null>, boolean] {
  const ref = useRef<T | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.unobserve(el); // once revealed, stop observing
        }
      },
      { threshold },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [threshold]);

  return [ref, isVisible];
}

/**
 * Convenience wrapper — returns className-ready string
 */
export function useRevealClass<T extends HTMLElement = HTMLDivElement>(
  baseClass = '',
  visibleClass = 'scroll-revealed',
  hiddenClass = 'scroll-hidden',
  threshold = 0.15,
): [RefObject<T | null>, string] {
  const [ref, isVisible] = useScrollReveal<T>(threshold);
  const className = `${baseClass} ${isVisible ? visibleClass : hiddenClass}`.trim();
  return [ref, className];
}
