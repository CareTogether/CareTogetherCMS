import { useState, useEffect } from "react";

// Credit: https://typeofnan.dev/writing-a-custom-usewindowsize-react-hook/
export function useWindowSize() {
  const [size, setSize] = useState({ height: window.innerHeight, width: window.innerWidth });

  useEffect(() => {
    const handleResize = () => {
      setSize({ height: window.innerHeight, width: window.innerWidth });
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return size;
}
