import { MutableRefObject, useRef, useEffect } from 'react';

export const useScrollToArrangement = (
  arrangementRefs: MutableRefObject<Record<string, HTMLDivElement | null>>,
  scrollToArrangementId?: string
) => {
  const hasScrolledRef = useRef(false);

  const searchParams = new URLSearchParams(location.search);

  const targetArrangementId =
    scrollToArrangementId ?? searchParams.get('arrangementId') ?? undefined;

  useEffect(() => {
    if (!targetArrangementId || hasScrolledRef.current) return;

    const ref = arrangementRefs.current[targetArrangementId];

    if (ref) {
      hasScrolledRef.current = true;

      setTimeout(() => {
        const top = ref.getBoundingClientRect().top + window.pageYOffset;
        const offset = 100;
        const scrollTo = top - offset;

        const maxScroll = document.body.scrollHeight - window.innerHeight;
        const finalScroll = Math.min(scrollTo, maxScroll);

        window.scrollTo({
          top: finalScroll,
          behavior: 'smooth',
        });
      }, 300);
    }
  }, [targetArrangementId, arrangementRefs]);
};
