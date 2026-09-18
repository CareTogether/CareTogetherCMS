import { useCallback, useMemo, useRef } from 'react';
import { flushSync } from 'react-dom';
import { Search as SearchIcon } from '@mui/icons-material';
import {
  Autocomplete,
  Container,
  FilterOptionsState,
  IconButton,
  InputAdornment,
  Paper,
  TextField,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import { familyNameString } from '../Families/FamilyName';
import { CombinedFamilyInfo } from '../GeneratedClient';
import { useVisibleFamilies } from '../Model/Data';
import { useAppNavigate } from '../Hooks/useAppNavigate';
import { personNameString } from '../Families/PersonName';

const MAX_DISPLAYED_RESULTS = 100;

interface SearchIndex {
  text: string;
  phones: string[];
}

function buildSearchIndex(family: CombinedFamilyInfo): SearchIndex {
  const textParts: string[] = [];
  const phones: string[] = [];

  for (const adult of family.family?.adults ?? []) {
    const person = adult.item1;
    if (!person) continue;

    textParts.push(personNameString(person).toLowerCase());

    for (const email of person.emailAddresses ?? []) {
      if (email.address) textParts.push(email.address.toLowerCase());
    }

    for (const phone of person.phoneNumbers ?? []) {
      if (phone.number) phones.push(phone.number.replace(/[^0-9]/g, ''));
    }

    for (const address of person.addresses ?? []) {
      textParts.push(
        `${address.line1} ${address.line2} ${address.city} ${address.state} ${address.county} ${address.postalCode}`
      );
    }
  }

  for (const child of family.family?.children ?? []) {
    textParts.push(personNameString(child).toLowerCase());
  }

  return { text: textParts.join(' '), phones };
}

interface ShellSearchBarProps {
  openMobileSearch: boolean;
  setOpenMobileSearch: (value: boolean) => void;
}
export function ShellSearchBar({
  openMobileSearch,
  setOpenMobileSearch,
}: ShellSearchBarProps) {
  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up('md'));

  const families = useVisibleFamilies();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const searchBoxRef = useRef<any | null>(null);

  const navigateTo = useAppNavigate();

  const searchableIndex = useMemo(
    () => new Map(families.map((family) => [family, buildSearchIndex(family)])),
    [families]
  );

  const filterFamilies = useCallback(
    (
      families: CombinedFamilyInfo[],
      state: FilterOptionsState<CombinedFamilyInfo>
    ) => {
      const query = state.inputValue.toLowerCase().trim();
      if (!query) return families.slice(0, MAX_DISPLAYED_RESULTS);

      const queryDigits = query.replace(/[^0-9]/g, '');

      const results: CombinedFamilyInfo[] = [];
      for (const family of families) {
        const index = searchableIndex.get(family);
        if (!index) continue;

        if (
          index.text.includes(query) ||
          (queryDigits.length > 0 && index.phones.some((p) => p.includes(queryDigits)))
        ) {
          results.push(family);
          if (results.length >= MAX_DISPLAYED_RESULTS) break;
        }
      }
      return results;
    },
    [searchableIndex]
  );

  function openAndFocusSearch() {
    flushSync(() => {
      setOpenMobileSearch(true);
    });
    searchBoxRef.current.click();
  }

  const selectFamily = useCallback(
    (_event: React.SyntheticEvent, family: CombinedFamilyInfo | null) => {
      if (!family) return;
      navigateTo.family(family.family!.id!);
    },
    [navigateTo]
  );

  const getOptionLabel = useCallback(
    (family: CombinedFamilyInfo) =>
      familyNameString(family) || family.family!.id!,
    []
  );

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
      getOptionKey={(family) => family.family!.id!}
      getOptionLabel={getOptionLabel}
      onChange={selectFamily}
      slots={{ paper: Paper }}
      slotProps={{
        paper: {
          sx: {
            backgroundColor: theme.palette.primary.light,
            color: theme.palette.primary.contrastText,
          },
        },
      }}
      renderInput={(params) => (
        <TextField
          id={params.id}
          disabled={params.disabled}
          fullWidth={params.fullWidth}
          size={params.size}
          variant="outlined"
          placeholder="Search families and people"
          sx={{
            '.Mui-focused': {
              backgroundColor: theme.palette.primary.dark,
            },
            '& input, & .MuiInputAdornment-root': {
              color: theme.palette.primary.contrastText,
            },
            '& .MuiOutlinedInput-notchedOutline, .Mui-focused & .MuiOutlinedInput-notchedOutline':
              {
                borderColor: '#fff8',
              },
          }}
          slotProps={{
            ...params.slotProps,
            input: {
              ...params.slotProps.input,
              endAdornment: (
                <InputAdornment position="end">
                  <SearchIcon />
                </InputAdornment>
              ),
            },
            htmlInput: {
              ...params.slotProps.htmlInput,
              type: 'search',
            },
          }}
        />
      )}
    />
  );

  return (
    <Container
      maxWidth={isDesktop ? 'xs' : false}
      sx={{
        width: { xs: openMobileSearch ? '100%' : 6, md: '100%' },
        marginRight: 4,
        marginLeft: 0,
      }}
      style={{ paddingLeft: 0, paddingRight: isDesktop ? 0 : 3 }}
    >
      {isDesktop ? (
        <Container maxWidth="xs" style={{ padding: 0 }}>
          {searchInner}
        </Container>
      ) : openMobileSearch ? (
        searchInner
      ) : (
        <IconButton
          size="large"
          sx={{ color: theme.palette.primary.contrastText }}
          onClick={openAndFocusSearch}
        >
          <SearchIcon />
        </IconButton>
      )}
    </Container>
  );
}
