import { alpha, InputBase, useTheme, Box } from "@mui/material";
import SearchIcon from '@mui/icons-material/Search';

interface SearchBarProps {
  value: string;
  onChange: (newValue: string) => void;
}

export function SearchBar(props: SearchBarProps) {
  const { value, onChange } = props;
  const theme = useTheme();

  return (
    <Box sx={{
      position: 'relative',
      borderRadius: theme.shape.borderRadius,
      backgroundColor: alpha(theme.palette.common.white, 0.15),
      '&:hover': {
        backgroundColor: alpha(theme.palette.common.white, 0.25),
      },
      marginLeft: 0,
      width: '100%',
      [theme.breakpoints.up('sm')]: {
        marginLeft: theme.spacing(1),
        width: 'auto',
      },
    }}>
      <Box sx={{
        padding: theme.spacing(0, 2),
        height: '100%',
        position: 'absolute',
        pointerEvents: 'none',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        <SearchIcon />
      </Box>
      <InputBase
        sx={{
          root: {color: 'inherit'},
          input: {
            padding: theme.spacing(1, 1, 1, 0),
            // vertical padding + font size from searchIcon
            paddingLeft: `calc(1em + ${theme.spacing(4)})`,
            transition: theme.transitions.create('width'),
            width: '100%',
            [theme.breakpoints.up('sm')]: {
              width: '0ch',
                '&:focus': {
                 width: '20ch',
               },
            },
          }
        }}
        inputProps={{ 'aria-label': 'search' }}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </Box>
  );
}
