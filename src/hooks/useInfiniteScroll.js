'use client';

import { useEffect, useRef, useCallback } from 'react';

/**
 * Intersection Observer-based infinite scroll hook
 */
export function useInfiniteScroll(callback, options = {}) {
  const { threshold = 0.1, rootMargin = '100px' } = options;
  const observerRef = useRef(null);
  const targetRef = useRef(null);

  const handleIntersect = useCallback((entries) => {
    const [entry] = entries;
    if (entry.isIntersecting) {
      callback();
    }
  }, [callback]);

  useEffect(() => {
    const target = targetRef.current;
    if (!target) return;

    observerRef.current = new IntersectionObserver(handleIntersect, {
      threshold,
      rootMargin,
    });

    observerRef.current.observe(target);

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [handleIntersect, threshold, rootMargin]);

  return targetRef;
}
