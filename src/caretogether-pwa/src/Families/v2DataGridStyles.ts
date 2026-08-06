import type { Theme } from '@mui/material/styles';

type V2DataGridStylesOptions = {
  height?: number | string;
  highlightedRowClassName?: string;
  highlightedRowColor?: string;
};

export function v2DataGridStyles(
  theme: Theme,
  {
    height,
    highlightedRowClassName,
    highlightedRowColor,
  }: V2DataGridStylesOptions = {}
) {
  return {
    height,
    width: '100%',
    border: 1,
    borderColor: 'divider',
    borderRadius: 1,
    bgcolor: 'background.paper',
    overflow: 'hidden',
    '& .MuiDataGrid-row': {
      cursor: 'pointer',
      minHeight: 56,
      transition: theme.transitions.create(['background-color', 'box-shadow'], {
        duration: theme.transitions.duration.shortest,
      }),
      '&:hover': {
        backgroundColor: theme.palette.action.hover,
      },
      '&:hover .MuiDataGrid-cell': {
        backgroundColor: theme.palette.action.hover,
      },
      '&:hover .MuiSvgIcon-root': {
        opacity: 1,
      },
      ...(highlightedRowClassName && highlightedRowColor
        ? {
            [`&.${highlightedRowClassName}`]: {
              boxShadow: `inset 3px 0 0 ${highlightedRowColor}`,
            },
          }
        : {}),
    },
    '& .MuiDataGrid-cell': {
      alignItems: 'center',
      cursor: 'inherit',
      display: 'flex',
      py: 1,
    },
    '& .MuiDataGrid-root': {
      border: 0,
    },
    '& .MuiDataGrid-columnHeaders': {
      backgroundColor: theme.palette.action.hover,
      borderBottomColor: theme.palette.divider,
    },
    '& .MuiDataGrid-root .MuiDataGrid-cell:focus, & .MuiDataGrid-root .MuiDataGrid-cell:focus-within':
      {
        outline: 'none',
      },
    '& .MuiDataGrid-root .MuiDataGrid-columnHeader:focus, & .MuiDataGrid-root .MuiDataGrid-columnHeader:focus-within':
      {
        outline: 'none',
      },
  };
}
