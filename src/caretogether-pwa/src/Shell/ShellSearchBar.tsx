import { useRef } from 'react';
import { flushSync } from 'react-dom';
import { Autocomplete, Container, IconButton, InputAdornment, Paper, TextField, useMediaQuery, useTheme } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';

interface ShellSearchBarProps {
  openMobileSearch: boolean;
  setOpenMobileSearch: (value: boolean) => void;
}
export function ShellSearchBar({ openMobileSearch, setOpenMobileSearch }: ShellSearchBarProps) {
  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up('md'));

  const options = ["Test", "ABC", "DEF"];

  const searchBoxRef = useRef<any | null>(null);

  function openAndFocusSearch() {
    flushSync(() => {
      setOpenMobileSearch(true);
    });
    searchBoxRef.current.click();
  }

  const searchInner = (
    <Autocomplete
      ref={searchBoxRef}
      size={isDesktop ? 'small' : 'medium'}
      fullWidth
      onBlur={() => setOpenMobileSearch(false)}
      freeSolo
      autoHighlight
      options={options}
      openOnFocus
      PaperComponent={(params) => <Paper {...params}
        sx={{
          backgroundColor: theme.palette.primary.light,
          color: theme.palette.primary.contrastText
        }} />}
      renderInput={(params) => <TextField {...params}
        variant='outlined'
        placeholder="Search families and people"
        sx={{
          '.Mui-focused': {
            backgroundColor: theme.palette.primary.dark
          },
          '& input, & .MuiInputAdornment-root': {
            color: theme.palette.primary.contrastText
          },
          '& .MuiOutlinedInput-notchedOutline, .Mui-focused & .MuiOutlinedInput-notchedOutline': {
            borderColor: '#fff8'
          }
        }}
        InputProps={{
          ...params.InputProps,
          type: 'search',
          endAdornment: <InputAdornment position='end'><SearchIcon /></InputAdornment>
        }} />} />);

  return (
    <Container
      maxWidth={isDesktop ? 'xs' : false}
      sx={{
        width: { xs: openMobileSearch ? '100%' : 6, md: '100%' },
        marginRight: 4
      }}
      style={{ paddingLeft: 0, paddingRight: isDesktop ? 0 : 3 }}>
      {isDesktop
        ? <Container maxWidth='xs' style={{ padding: 0 }}>
          {searchInner}
        </Container>
        : openMobileSearch
          ? searchInner
          : <IconButton
            size='large' sx={{ color: theme.palette.primary.contrastText }}
            onClick={openAndFocusSearch}>
            <SearchIcon />
          </IconButton>}
    </Container>
  );
}
