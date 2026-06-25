import { TableContainer } from '@mui/material';
import { ReactNode } from 'react';

type WideTableContainerProps = {
  children: ReactNode;
};

function WideTableContainer(props: WideTableContainerProps) {
  const { children } = props;

  return (
    <TableContainer
      sx={{
        borderBottom: '1px solid rgba(224, 224, 224, 1)',
        flex: 1,
        maxWidth: '100%',
        minHeight: 0,
        overflow: 'auto',
        overflowX: 'auto',
        overflowY: 'auto',
        WebkitOverflowScrolling: 'touch',
      }}
    >
      {children}
    </TableContainer>
  );
}

export { WideTableContainer };
