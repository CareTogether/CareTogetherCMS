import { useLayoutEffect, useMemo } from "react";
import { useLocation } from "react-router-dom";
import { atomFamily, useRecoilState } from "recoil";

type ScrollPosition = {
  x: number,
  y: number
}

const pageScrollPositions = atomFamily({
  key: 'pageScrollPositions',
  default: { x: 0, y: 0 } as ScrollPosition
});

export function useScrollMemory() {
  const { pathname } = useLocation();

  const [pagePosition, setPagePosition] = useRecoilState(pageScrollPositions(pathname));

  const mainElement = useMemo(() => {
    const mainElement = document.querySelector('#root > div > main') as HTMLElement;
    return mainElement;
  }, []);

  useLayoutEffect(() => {
    // Restore the scroll position for the current page when mounting it.
    // If none was prevoiusly saved, the default is simply to scroll to (0, 0).
    mainElement.scrollTo(pagePosition.x, pagePosition.y);

    return () => {
      // Save the scroll position for the current page when unmounting it.
      const positionToSave = { x: mainElement.scrollLeft, y: mainElement.scrollTop } as ScrollPosition;
      setPagePosition(positionToSave);
    };
  }, [mainElement, pagePosition.x, pagePosition.y, setPagePosition]);
}
