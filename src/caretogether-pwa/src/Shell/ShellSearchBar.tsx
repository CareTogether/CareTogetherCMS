import { useRef } from 'react';
import { flushSync } from 'react-dom';
import { Autocomplete, Container, FilterOptionsState, IconButton, InputAdornment, Paper, TextField, useMediaQuery, useTheme } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import { useLoadable } from '../Hooks/useLoadable';
import { familyNameString } from '../Families/FamilyName';
import { Address, CombinedFamilyInfo, PhoneNumber } from '../GeneratedClient';
import { visibleFamiliesQuery } from '../Model/Data';
import { useAppNavigate } from '../Hooks/useAppNavigate';
import { personNameString } from '../Families/PersonName';
import { Email, Phone } from '@mui/icons-material';
import { AddressFormFields } from '../Families/AddressEditor';

interface ShellSearchBarProps {
  openMobileSearch: boolean;
  setOpenMobileSearch: (value: boolean) => void;
}
export function ShellSearchBar({ openMobileSearch, setOpenMobileSearch }: ShellSearchBarProps) {
  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up('md'));

  const families = useLoadable(visibleFamiliesQuery) || [];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const searchBoxRef = useRef<any | null>(null);

  const navigateTo = useAppNavigate()

  function openAndFocusSearch() {
    flushSync(() => {
      setOpenMobileSearch(true);
    });
    searchBoxRef.current.click();
  }

  function filterFamilies(families: CombinedFamilyInfo[], state: FilterOptionsState<CombinedFamilyInfo>) {
    const searchQueryLowercase = state.inputValue.toLowerCase();
    const searchQueryPhoneNumber = searchQueryLowercase.replace(/[^0-9]/g, '');
    return families.filter(family => {

      for (const adult of family.family?.adults ?? []) {
        if (personNameString(adult.item1).toLowerCase().includes(searchQueryLowercase))
          return true;

        if (adult?.item1?.emailAddresses?.some(email => email.address?.toLowerCase().includes(searchQueryLowercase))) {
          return true;
        }

        if (searchQueryPhoneNumber.length > 0 &&
          adult.item1?.phoneNumbers?.some(phone => phone.number?.replace(/[^0-9]/g, '').includes(searchQueryPhoneNumber)))
          return true;

        if (adult.item1?.addresses?.find(address => {
          const combinedAddress = `${address.line1} ${address.line2} ${address.city} ${address.state} ${address.county} ${address.postalCode}`;
          return combinedAddress.includes(searchQueryLowercase);
        }))
          return true;
      }

      for (const child of family.family?.children ?? []) {
        if (personNameString(child).toLowerCase().includes(searchQueryLowercase))
          return true;
      }

      return false
    });
  }

  function selectFamily(_event: React.SyntheticEvent, family: CombinedFamilyInfo | null) {

    navigateTo.family(family!.family!.id!)
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
        marginRight: 4,
        marginLeft: 0

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
