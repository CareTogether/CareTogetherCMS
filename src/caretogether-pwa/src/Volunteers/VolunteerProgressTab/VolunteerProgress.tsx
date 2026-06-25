import Grid from '../../Generic/GridLegacyCompat';
import {
  Table,
  TableContainer,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Button,
  ButtonGroup,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  SelectChangeEvent,
  useMediaQuery,
  useTheme,
  Stack,
  ToggleButton,
  ToggleButtonGroup,
} from '@mui/material';
import { volunteerFamiliesData } from '../../Model/VolunteersModel';
import { allApprovalAndOnboardingRequirementsData } from '../../Model/ConfigurationModel';
import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Add as AddIcon,
  UnfoldLess as UnfoldLessIcon,
  UnfoldMore as UnfoldMoreIcon,
} from '@mui/icons-material';
import { CreateVolunteerFamilyDialog } from '../CreateVolunteerFamilyDialog';
import { SearchBar } from '../../Shell/SearchBar';
import { useLocalStorage } from '../../Hooks/useLocalStorage';
import { useScrollMemory } from '../../Hooks/useScrollMemory';
import {
  FamilyNameSortMode,
  filterFamiliesByText,
  normalizeFamilyNameSortMode,
  sortFamiliesByName,
} from '../../Families/FamilyUtils';
import { useAllVolunteerFamiliesPermissions } from '../../Model/SessionModel';
import { Permission } from '../../GeneratedClient';
import { useScreenTitle } from '../../Shell/ShellScreenTitle';
import { useLoadable } from '../../Hooks/useLoadable';
import { ProgressBackdrop } from '../../Shell/ProgressBackdrop';
import { useAppNavigate } from '../../Hooks/useAppNavigate';
import { useFeatureFlagEnabled } from 'posthog-js/react';
import { forceCheck } from '../../Utilities/reactLazyLoadInterop';
import { VolunteerProgressTableItem } from './VolunteerProgressTableItem';
import { stickyHeaderTableSx } from '../../Utilities/stickyHeaderTableSx';

const VOLUNTEER_PROGRESS_SORT_STORAGE_KEY = 'volunteer-progress-sortMode';

function VolunteerProgress(props: { onOpen: () => void }) {
  const { onOpen } = props;
  useEffect(onOpen);

  const appNavigate = useAppNavigate();

  // The array object returned by Recoil is read-only. We need to copy it before we can do an in-place sort.
  const volunteerFamiliesLoadable = useLoadable(volunteerFamiliesData);
  const [storedSortMode, setStoredSortMode] =
    useLocalStorage<FamilyNameSortMode>(
      VOLUNTEER_PROGRESS_SORT_STORAGE_KEY,
      'lastNameAsc'
    );
  const sortMode = normalizeFamilyNameSortMode(storedSortMode);

  function setSortMode(value: FamilyNameSortMode) {
    setStoredSortMode(value);
  }

  const volunteerFamilies = sortFamiliesByName(
    volunteerFamiliesLoadable || [],
    sortMode
  );
  const allApprovalAndOnboardingRequirements = useLoadable(
    allApprovalAndOnboardingRequirementsData
  );

  const [filterText, setFilterText] = useState('');
  const filteredVolunteerFamilies = filterFamiliesByText(
    volunteerFamilies,
    filterText
  );

  useEffect(() => {
    forceCheck();
  }, [filterText, sortMode]);

  useScrollMemory();

  function openFamily(familyId: string) {
    appNavigate.family(familyId);
  }
  const [createVolunteerFamilyDialogOpen, setCreateVolunteerFamilyDialogOpen] =
    useState(false);

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const location = useLocation();

  const updateTestFamilyFlagEnabled = useFeatureFlagEnabled(
    'updateTestFamilyFlag'
  );

  const [expandedView, setExpandedView] = useLocalStorage(
    'volunteer-progress-expanded',
    true
  );
  const handleExpandCollapse = (
    _: React.MouseEvent<HTMLElement>,
    newExpandedView: boolean | null
  ) => {
    if (newExpandedView !== null) {
      setExpandedView(newExpandedView);
    }
  };

  const permissions = useAllVolunteerFamiliesPermissions();

  useScreenTitle('Volunteers');

  return !volunteerFamiliesLoadable || !allApprovalAndOnboardingRequirements ? (
    <ProgressBackdrop>
      <p>Loading families...</p>
    </ProgressBackdrop>
  ) : (
    <Grid container>
      <Grid item xs={12}>
        <Stack direction="row-reverse" sx={{ marginTop: 1 }}>
          <ToggleButtonGroup
            value={expandedView}
            exclusive
            onChange={handleExpandCollapse}
            size={isMobile ? 'medium' : 'small'}
            aria-label="row expansion"
          >
            <ToggleButton value={true} aria-label="expanded">
              <UnfoldMoreIcon />
            </ToggleButton>
            <ToggleButton value={false} aria-label="collapsed">
              <UnfoldLessIcon />
            </ToggleButton>
          </ToggleButtonGroup>
          <SearchBar value={filterText} onChange={setFilterText} />
          <ButtonGroup
            variant="text"
            color="inherit"
            aria-label="text inherit button group"
            style={{ flexGrow: 1 }}
          >
            <Button
              color={
                location.pathname.endsWith('/volunteers/approval')
                  ? 'secondary'
                  : 'inherit'
              }
              component={Link}
              to={'../approval'}
            >
              Approvals
            </Button>
            <Button
              color={
                location.pathname.endsWith('/volunteers/progress')
                  ? 'secondary'
                  : 'inherit'
              }
              component={Link}
              to={'../progress'}
            >
              Progress
            </Button>
          </ButtonGroup>
        </Stack>
        <Stack
          direction="row"
          sx={{
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 1,
            justifyContent: 'flex-end',
            my: 2,
          }}
        >
          {permissions(Permission.EditFamilyInfo) &&
            permissions(Permission.ActivateVolunteerFamily) && (
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => setCreateVolunteerFamilyDialogOpen(true)}
                sx={{ marginRight: 'auto', width: { xs: '100%', sm: 'auto' } }}
              >
                Add new volunteer family
              </Button>
            )}
          <FormControl
            size="small"
            sx={{ minWidth: 180, width: { xs: '100%', sm: 'auto' } }}
          >
            <InputLabel id="volunteer-progress-sort-label">Sort by</InputLabel>
            <Select
              labelId="volunteer-progress-sort-label"
              value={sortMode}
              label="Sort by"
              onChange={(event: SelectChangeEvent) =>
                setSortMode(event.target.value as FamilyNameSortMode)
              }
            >
              <MenuItem value="lastNameAsc">Last name (ascending)</MenuItem>
              <MenuItem value="lastNameDesc">Last name (descending)</MenuItem>
              <MenuItem value="firstNameAsc">First name (ascending)</MenuItem>
              <MenuItem value="firstNameDesc">First name (descending)</MenuItem>
            </Select>
          </FormControl>
        </Stack>
      </Grid>
      <Grid item xs={12}>
        <TableContainer
          sx={{
            borderBottom: '1px solid rgba(224, 224, 224, 1)',
            overflow: 'visible',
          }}
        >
          <Table
            stickyHeader
            sx={{ ...stickyHeaderTableSx, minWidth: '700px' }}
            size="small"
          >
            <TableHead>
              <TableRow>
                {expandedView ? (
                  <>
                    <TableCell>Last Name, First Name</TableCell>
                  </>
                ) : (
                  <TableCell>Family</TableCell>
                )}
                {allApprovalAndOnboardingRequirements.map((actionName) => (
                  <TableCell key={actionName}>{actionName}</TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredVolunteerFamilies.map((volunteerFamily) => (
                <VolunteerProgressTableItem
                  key={volunteerFamily.family!.id!}
                  volunteerFamily={volunteerFamily}
                  allApprovalAndOnboardingRequirements={
                    allApprovalAndOnboardingRequirements
                  }
                  expandedView={expandedView}
                  openFamily={openFamily}
                  updateTestFamilyFlagEnabled={updateTestFamilyFlagEnabled}
                />
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        {createVolunteerFamilyDialogOpen && (
          <CreateVolunteerFamilyDialog
            onClose={(volunteerFamilyId) => {
              setCreateVolunteerFamilyDialogOpen(false);

              if (!volunteerFamilyId) {
                return;
              }

              openFamily(volunteerFamilyId);
            }}
          />
        )}
      </Grid>
    </Grid>
  );
}

export { VolunteerProgress };
