import React, { useEffect, useRef, useState, useMemo } from 'react';

interface LazyRenderProps {
  children: React.ReactNode;
  placeholderHeight?: number;
  root?: React.RefObject<Element | null>;
  rootMargin?: string;
  once?: boolean;
  forceVisible?: boolean;
}

const LazyRender: React.FC<LazyRenderProps> = ({ children, placeholderHeight = 48, root, rootMargin = '200px', once = true, forceVisible = false }) => {
  const [isVisible, setIsVisible] = useState<boolean>(() => !!forceVisible);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const placeholderStyle = useMemo(
    () => ({
      minHeight: placeholderHeight,
      width: '100%',
    }),
    [placeholderHeight],
  );

  useEffect(() => {
    if (forceVisible) {
      setIsVisible(true);
      return;
    }
    if (isVisible && once) return;
    const node = containerRef.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (!entry) return;

        if (entry.isIntersecting || entry.intersectionRatio > 0) {
          setIsVisible(true);
          if (once) observer.disconnect();
        } else if (!once) {
          setIsVisible(false);
        }
      },
      {
        root: root?.current || null,
        rootMargin,
      },
    );

    observer.observe(node);

    return () => {
      observer.disconnect();
    };
  }, [root, rootMargin, once, isVisible, forceVisible]);

  return <div ref={containerRef}>{isVisible ? children : <div style={placeholderStyle} />}</div>;
};

LazyRender.displayName = 'LazyRender';

export default LazyRender;

