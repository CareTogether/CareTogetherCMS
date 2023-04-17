import { useRef } from 'react';
import { flushSync } from 'react-dom';
import { Autocomplete, Container, FilterOptionsState, IconButton, InputAdornment, Paper, TextField, useMediaQuery, useTheme } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import { useLoadable } from '../Hooks/useLoadable';
import { familyNameString } from '../Families/FamilyName';
import { CombinedFamilyInfo } from '../GeneratedClient';
import { visibleFamiliesQuery } from '../Model/Data';

interface ShellSearchBarProps {
  openMobileSearch: boolean;
  setOpenMobileSearch: (value: boolean) => void;
}
export function ShellSearchBar({ openMobileSearch, setOpenMobileSearch }: ShellSearchBarProps) {
  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up('md'));

  const families = useLoadable(visibleFamiliesQuery) || [];

  const searchBoxRef = useRef<any | null>(null);

  function openAndFocusSearch() {
    flushSync(() => {
      setOpenMobileSearch(true);
    });
    searchBoxRef.current.click();
  }

  function filterFamilies(families: CombinedFamilyInfo[], state: FilterOptionsState<CombinedFamilyInfo>) {
    const searchQueryLowercase = state.inputValue.toLowerCase();
    return families.filter(family => {
      const familyName = familyNameString(family);
      return familyName?.toLowerCase().includes(searchQueryLowercase);
    });
  }

  function selectFamily(event: React.SyntheticEvent, family: CombinedFamilyInfo | null) {
    console.log(family);
    //TODO: Navigate to the selected family
  }

  const searchInner = (
    <Autocomplete
      ref={searchBoxRef}
      size={isDesktop ? 'small' : 'medium'}
      fullWidth
      onBlur={() => setOpenMobileSearch(false)}
      autoHighlight
      options={families}
      openOnFocus
      filterOptions={filterFamilies}
      getOptionLabel={(family) => {
        return familyNameString(family) || family.family!.id!;
      }}
      onChange={selectFamily}
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
