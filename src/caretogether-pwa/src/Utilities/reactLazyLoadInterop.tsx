import { ReactNode, useEffect, useRef, useState } from 'react';

type LazyLoadProps = {
  children: ReactNode;
  height?: number;
  offset?: number;
  once?: boolean;
  overflow?: boolean;
  placeholder?: ReactNode;
};

const visibilityChecks = new Set<() => void>();

function isVisible(element: HTMLElement, offset: number) {
  const bounds = element.getBoundingClientRect();
  const viewportHeight =
    window.innerHeight || document.documentElement.clientHeight;

  return bounds.top <= viewportHeight + offset && bounds.bottom >= -offset;
}

function forceCheck() {
  visibilityChecks.forEach((checkVisibility) => checkVisibility());
}

function LazyLoad({
  children,
  height = 0,
  offset = 0,
  once = false,
  overflow: _overflow = false,
  placeholder,
}: LazyLoadProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const [hasRendered, setHasRendered] = useState(false);

  useEffect(() => {
    const root = rootRef.current;

    if (!root || (once && hasRendered)) {
      return;
    }

    const checkVisibility = () => {
      if (isVisible(root, offset)) {
        setHasRendered(true);
      } else if (!once) {
        setHasRendered(false);
      }
    };

    visibilityChecks.add(checkVisibility);
    checkVisibility();

    if (typeof IntersectionObserver === 'undefined') {
      window.addEventListener('scroll', checkVisibility, { passive: true });
      window.addEventListener('resize', checkVisibility);

      return () => {
        visibilityChecks.delete(checkVisibility);
        window.removeEventListener('scroll', checkVisibility);
        window.removeEventListener('resize', checkVisibility);
      };
    }

    const observer = new IntersectionObserver(checkVisibility, {
      rootMargin: `${offset}px 0px`,
    });

    observer.observe(root);

    return () => {
      visibilityChecks.delete(checkVisibility);
      observer.disconnect();
    };
  }, [hasRendered, offset, once]);

  return (
    <div ref={rootRef}>
      {hasRendered
        ? children
        : (placeholder ?? <div style={{ minHeight: height }} />)}
    </div>
  );
}

export { forceCheck, LazyLoad };
