import { Box } from '@mui/material';
import { useEffect } from 'react';

function LazyLoadMountTrigger(props: {
  height: number;
  onVisible: () => void;
}) {
  const { height, onVisible } = props;

  useEffect(() => {
    onVisible();
  }, [onVisible]);

  return <Box sx={{ minHeight: `${height}px` }} />;
}

export { LazyLoadMountTrigger };
