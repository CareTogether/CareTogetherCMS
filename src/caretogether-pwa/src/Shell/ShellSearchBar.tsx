import { useCallback, useMemo, useRef, useState } from 'react';
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
import { normalizeShellSearchText } from './shellSearch';

const MAX_DISPLAYED_RESULTS = 100;

interface FamilySearchResult {
  id: string;
  label: string;
  searchText: string;
  phones: string[];
  isClient: boolean;
  isVolunteer: boolean;
}

function buildFamilySearchResult(
  family: CombinedFamilyInfo
): FamilySearchResult {
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

  return {
    id: family.family!.id!,
    label: familyNameString(family) || family.family!.id!,
    searchText: normalizeShellSearchText(textParts.join(' ')),
    phones,
    isClient: family.partneringFamilyInfo != null,
    isVolunteer: family.volunteerFamilyInfo != null,
  };
}

function familyTypeSuffix(result: FamilySearchResult): string {
  if (result.isClient && result.isVolunteer) return ' (client/volunteer)';
  if (result.isClient) return ' (client)';
  if (result.isVolunteer) return ' (volunteer)';
  return '';
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

  const [searchText, setSearchText] = useState('');

  const searchResults = useMemo(
    () => families.map(buildFamilySearchResult),
    [families]
  );

  const filterFamilies = useCallback(
    (
      results: FamilySearchResult[],
      state: FilterOptionsState<FamilySearchResult>
    ) => {
      const query = normalizeShellSearchText(state.inputValue);
      if (!query) return results.slice(0, MAX_DISPLAYED_RESULTS);

      const queryDigits = query.replace(/[^0-9]/g, '');

      const filtered: FamilySearchResult[] = [];
      for (const result of results) {
        if (
          result.searchText.includes(query) ||
          (queryDigits.length > 0 &&
            result.phones.some((p) => p.includes(queryDigits)))
        ) {
          filtered.push(result);
          if (filtered.length >= MAX_DISPLAYED_RESULTS) break;
        }
      }
      return filtered;
    },
    []
  );

  function openAndFocusSearch() {
    flushSync(() => {
      setOpenMobileSearch(true);
    });
    searchBoxRef.current.click();
  }

  const selectFamily = useCallback(
    (_event: React.SyntheticEvent, result: FamilySearchResult | null) => {
      if (!result) return;
      setSearchText('');
      navigateTo.family(result.id);
    },
    [navigateTo]
  );

  const getOptionLabel = useCallback(
    (result: FamilySearchResult) => result.label,
    []
  );

  const searchInner = (
    <Autocomplete
      ref={searchBoxRef}
      size={isDesktop ? 'small' : 'medium'}
      fullWidth
      onBlur={() => setOpenMobileSearch(false)}
      autoHighlight
      value={null}
      inputValue={searchText}
      onInputChange={(_event, value, reason) => {
        if (reason === 'selectOption' || reason === 'reset') return;
        setSearchText(value);
      }}
      options={searchResults}
      openOnFocus
      filterOptions={filterFamilies}
      getOptionKey={(result) => result.id}
      getOptionLabel={getOptionLabel}
      onChange={selectFamily}
      renderOption={(props, result) => (
        <li {...props}>
          <div
            style={{
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {result.label}
            <small className="ph-unmask" style={{ opacity: 0.7 }}>
              {familyTypeSuffix(result)}
            </small>
          </div>
        </li>
      )}
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
