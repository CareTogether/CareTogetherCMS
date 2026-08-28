import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  useMediaQuery,
  useTheme,
  Button,
  ButtonGroup,
  Checkbox,
  IconButton,
  FormControl,
  InputBase,
  InputLabel,
  MenuItem,
  Select,
  SelectChangeEvent,
  Stack,
  ToggleButton,
  ToggleButtonGroup,
  Box,
} from '@mui/material';
import { Permission } from '../../GeneratedClient';
import { useOrganizationConfiguration } from '../../Model/ConfigurationModel';
import React, { useEffect, useState } from 'react';
import {
  Add as AddIcon,
  Email as EmailIcon,
  FilterList as FilterListIcon,
  Sms as SmsIcon,
  UnfoldLess as UnfoldLessIcon,
  UnfoldMore as UnfoldMoreIcon,
} from '@mui/icons-material';
import { CreateVolunteerFamilyDrawer } from '../CreateVolunteerFamilyDrawer';
import { Link, useLocation } from 'react-router-dom';
import { SearchBar } from '../../Shell/SearchBar';
import { useLocalStorage } from '../../Hooks/useLocalStorage';
import { useScrollMemory } from '../../Hooks/useScrollMemory';
import {
  useAllVolunteerFamiliesPermissions,
  useGlobalPermissions,
} from '../../Model/SessionModel';
import { BulkSmsSideSheet } from '../BulkSmsSideSheet';
import { useWindowSize } from '../../Hooks/useWindowSize';
import { useScreenTitle } from '../../Shell/ShellScreenTitle';
import { useRequiredSelectedLocationContext } from '../../Model/Data';
import { useAppNavigate } from '../../Hooks/useAppNavigate';
import { useGlobalSnackBar } from '../../Hooks/useGlobalSnackBar';
import { VolunteerFilter } from './VolunteerFilter';
import { getOptionValueFromSelection } from './getOptionValueFromSelection';
import { getUpdatedFilters } from './getUpdatedFilters';
import { CustomFieldFilterValue } from '../../Generic/CustomFieldsFilter/types';
import { useFeatureFlagEnabled } from 'posthog-js/react';
import { forceCheck } from '../../Utilities/reactLazyLoadInterop';
import { VolunteerApprovalTableItem } from './VolunteerApprovalTableItem';
import { VolunteerCustomFieldFiltersSidePanel } from './VolunteerCustomFieldFiltersSidePanel';
import { VolunteerAssignmentFiltersSidePanel } from './VolunteerAssignmentFiltersSidePanel';
import { useSidePanel } from '../../Hooks/useSidePanel';
import { containedStickyHeaderTableSx } from '../../Utilities/stickyHeaderTableSx';
import { WideTableContainer } from '../../Utilities/WideTableContainer';
import { wideTablePageSx } from '../../Utilities/wideTablePageSx';
import {
  FamilyNameSortMode,
  normalizeFamilyNameSortMode,
} from '../../Families/FamilyUtils';
import {
  AssignmentFilterSelectionsByArrangementType,
  AssignmentFilterValue,
} from './assignmentFilters';
import { useVolunteerApprovalViewModel } from './useVolunteerApprovalViewModel';
import { UPDATE_TEST_FAMILY_FEATURE_FLAG } from '../../featureFlags';

const VOLUNTEER_APPROVAL_SORT_STORAGE_KEY = 'volunteer-approval-sortMode';

function VolunteerApproval(props: { onOpen: () => void }) {
  const { onOpen } = props;
  useEffect(onOpen);
  const appNavigate = useAppNavigate();
  const globalPermissions = useGlobalPermissions();
  const [uncheckedFamilies, setUncheckedFamilies] = useState<string[]>([]);
  const {
    SidePanel: CustomFieldFiltersSidePanel,
    openSidePanel: openCustomFieldFiltersSidePanel,
    closeSidePanel: closeCustomFieldFiltersSidePanel,
  } = useSidePanel();
  const {
    SidePanel: AssignmentFiltersSidePanel,
    openSidePanel: openAssignmentFiltersSidePanel,
    closeSidePanel: closeAssignmentFiltersSidePanel,
  } = useSidePanel();

  const [storedSortMode, setStoredSortMode] =
    useLocalStorage<FamilyNameSortMode>(
      VOLUNTEER_APPROVAL_SORT_STORAGE_KEY,
      'lastNameAsc'
    );
  const sortMode = normalizeFamilyNameSortMode(storedSortMode);

  function setSortMode(value: FamilyNameSortMode) {
    setStoredSortMode(value);
  }

  const [filterText, setFilterText] = useState('');
  const [assignmentFilters, setAssignmentFilters] =
    useState<AssignmentFilterSelectionsByArrangementType>({});
  const {
    activeAssignmentFilterCount,
    activeCustomFieldFilterCount,
    arrangementTypes,
    customFieldCount,
    customFields,
    customFieldFilters,
    customFieldNames,
    filteredVolunteerFamilies,
    getCustomFieldFilterOptionsForField,
    roleFilters,
    selectedFamilies,
    selectedFamilyContactEmails,
    setCustomFieldFilter,
    setRoleFilters,
    setStatusFilters,
    statusFilters,
  } = useVolunteerApprovalViewModel({
    assignmentFilters,
    filterText,
    sortMode,
    uncheckedFamilies,
  });

  function changeRoleFilterSelection(selection: string | string[]) {
    setUncheckedFamilies([]);
    const filterOptionToUpdate = roleFilters.find(
      (filter) => filter.value === getOptionValueFromSelection(selection)
    );
    setRoleFilters(getUpdatedFilters(roleFilters, filterOptionToUpdate!));
  }

  function changeStatusFilterSelection(selection: string | string[]) {
    setUncheckedFamilies([]);
    const filterOptionToUpdate = statusFilters.find(
      (filter) => filter.value === getOptionValueFromSelection(selection)
    );
    setStatusFilters(getUpdatedFilters(statusFilters, filterOptionToUpdate!));
  }

  function changeCustomFieldFilter(
    fieldName: string,
    value: CustomFieldFilterValue[]
  ) {
    setUncheckedFamilies([]);
    setCustomFieldFilter(fieldName, value);
  }

  function changeAssignmentFilter(
    arrangementType: string,
    selectedValues: AssignmentFilterValue[]
  ) {
    setUncheckedFamilies([]);
    setAssignmentFilters((previous) => ({
      ...previous,
      [arrangementType]: selectedValues,
    }));
  }
  useEffect(() => {
    setAssignmentFilters((currentFilters) => {
      const validFilters = Object.fromEntries(
        Object.entries(currentFilters).filter(([arrangementType]) =>
          arrangementTypes.includes(arrangementType)
        )
      );

      return Object.keys(validFilters).length ===
        Object.keys(currentFilters).length
        ? currentFilters
        : validFilters;
    });
  }, [arrangementTypes]);

  useEffect(() => {
    forceCheck();
  }, [
    customFieldFilters,
    filterText,
    assignmentFilters,
    roleFilters,
    sortMode,
    statusFilters,
  ]);

  useScrollMemory();

  function openFamily(familyId: string) {
    appNavigate.family(familyId);
  }
  const [createVolunteerFamilyDrawerOpen, setCreateVolunteerFamilyDrawerOpen] =
    useState(false);

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const location = useLocation();

  const updateTestFamilyFlagEnabled = useFeatureFlagEnabled(
    UPDATE_TEST_FAMILY_FEATURE_FLAG
  );

  const [expandedView, setExpandedView] = useLocalStorage(
    'volunteer-approval-expanded',
    true
  );
  const handleExpandCollapse = (
    _event: React.MouseEvent<HTMLElement>,
    newExpandedView: boolean | null
  ) => {
    if (newExpandedView !== null) {
      setExpandedView(newExpandedView);
    }
  };

  const { locationId } = useRequiredSelectedLocationContext();
  const organizationConfiguration = useOrganizationConfiguration();
  const smsSourcePhoneNumbers = organizationConfiguration?.locations?.find(
    (loc) => loc.id === locationId
  )?.smsSourcePhoneNumbers;
  const [smsMode, setSmsMode] = useState(false);

  const { setAndShowGlobalSnackBar } = useGlobalSnackBar();

  function copyEmailAddresses() {
    navigator.clipboard.writeText(
      selectedFamilyContactEmails.map((email) => email.address).join('; ')
    );
    setAndShowGlobalSnackBar(
      `Found and copied ${selectedFamilyContactEmails.length} email addresses for ${selectedFamilies.length} selected families to clipboard`
    );
  }

  const windowSize = useWindowSize();

  const permissions = useAllVolunteerFamiliesPermissions();
  const tableColumnCount = 2 + customFieldNames.length + (smsMode ? 1 : 0);
  const tableMinWidth = Math.max(700, tableColumnCount * 160);
  const hasFeaturebaseChat = globalPermissions(Permission.AccessSupportScreen);
  const tablePageSx = wideTablePageSx(hasFeaturebaseChat);

  useScreenTitle('Volunteers');

  return (
    <>
      <Box
        sx={{
          ...tablePageSx,
          ...(smsMode && !isMobile ? { paddingRight: '400px' } : {}),
          height:
            smsMode && isMobile
              ? `${windowSize.height - 500 - 24}px`
              : tablePageSx.height,
        }}
      >
        <Box sx={{ flex: '0 0 auto' }}>
          <Stack
            direction={{ xs: 'column', md: 'row' }}
            sx={{
              marginTop: 1,
              gap: 1.5,
              alignItems: { xs: 'stretch', md: 'center' },
            }}
          >
            <ButtonGroup
              variant="text"
              color="inherit"
              aria-label="text inherit button group"
              sx={{ width: { xs: '100%', md: 'auto' } }}
            >
              <Button
                color={
                  location.pathname.endsWith('/volunteers/approval')
                    ? 'secondary'
                    : 'inherit'
                }
                component={Link}
                to={'../approval'}
                sx={{ flex: { xs: 1, md: 'initial' } }}
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
                sx={{ flex: { xs: 1, md: 'initial' } }}
              >
                Progress
              </Button>
            </ButtonGroup>

            <Stack
              direction={{ xs: 'column', md: 'row' }}
              sx={{
                gap: 1,
                width: { xs: '100%', md: 'auto' },
                marginLeft: { md: 'auto' },
                alignItems: { xs: 'stretch', md: 'center' },
              }}
            >
              <Box
                sx={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: 1,
                  alignItems: 'center',
                  width: { xs: '100%', md: 'auto' },
                }}
              >
                <VolunteerFilter
                  label="Roles"
                  options={roleFilters}
                  setSelected={changeRoleFilterSelection}
                />
                <VolunteerFilter
                  label="Statuses"
                  options={statusFilters}
                  setSelected={changeStatusFilterSelection}
                />
                {arrangementTypes.length > 0 && (
                  <FormControl
                    sx={{
                      position: 'relative',
                      minWidth: { xs: '100%', sm: 0 },
                      maxWidth: { xs: '100%', sm: '16rem' },
                    }}
                  >
                    <Select
                      labelId="volunteerAssignmentsFilter"
                      displayEmpty
                      value=""
                      open={false}
                      variant="standard"
                      onClick={() => openAssignmentFiltersSidePanel()}
                      sx={{
                        minWidth: { xs: '100%', sm: 0 },
                        maxWidth: '100%',
                        '& .MuiSelect-iconOpen': { transform: 'none' },
                        '& .MuiSelect-select': {
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          cursor: 'pointer',
                        },
                      }}
                      input={<InputBase />}
                      IconComponent={FilterListIcon}
                      SelectDisplayProps={{
                        title: `Assignments (${activeAssignmentFilterCount}/${arrangementTypes.length})`,
                      }}
                      renderValue={() =>
                        `Assignments (${activeAssignmentFilterCount}/${arrangementTypes.length})`
                      }
                    >
                      <MenuItem value="" sx={{ display: 'none' }} />
                    </Select>
                  </FormControl>
                )}
                {customFieldCount > 0 && (
                  <FormControl
                    sx={{
                      position: 'relative',
                      minWidth: { xs: '100%', sm: 0 },
                      maxWidth: { xs: '100%', sm: '16rem' },
                    }}
                  >
                    <Select
                      labelId="volunteerCustomFieldsFilter"
                      displayEmpty
                      value=""
                      open={false}
                      variant="standard"
                      onClick={() => openCustomFieldFiltersSidePanel()}
                      sx={{
                        minWidth: { xs: '100%', sm: 0 },
                        maxWidth: '100%',
                        '& .MuiSelect-iconOpen': { transform: 'none' },
                        '& .MuiSelect-select': {
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          cursor: 'pointer',
                        },
                      }}
                      input={<InputBase />}
                      IconComponent={FilterListIcon}
                      SelectDisplayProps={{
                        title: `Custom fields (${activeCustomFieldFilterCount}/${customFieldCount})`,
                      }}
                      renderValue={() =>
                        `Custom fields (${activeCustomFieldFilterCount}/${customFieldCount})`
                      }
                    >
                      <MenuItem value="" sx={{ display: 'none' }} />
                    </Select>
                  </FormControl>
                )}
              </Box>

              <Stack
                direction={{ xs: 'column', sm: 'row' }}
                sx={{
                  gap: 1,
                  width: { xs: '100%', md: 'auto' },
                  alignItems: { xs: 'stretch', sm: 'center' },
                }}
              >
                <Box sx={{ width: { xs: '100%', sm: 'auto' } }}>
                  <SearchBar
                    value={filterText}
                    onChange={(value) => {
                      setUncheckedFamilies([]);
                      setFilterText(value);
                    }}
                  />
                </Box>
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: { xs: 'flex-end', sm: 'flex-start' },
                    alignItems: 'center',
                    gap: 1,
                  }}
                >
                  {permissions(Permission.SendBulkSms) && (
                    <IconButton
                      color="inherit"
                      aria-label="copy email addresses"
                      onClick={() => copyEmailAddresses()}
                    >
                      <EmailIcon />
                    </IconButton>
                  )}
                  {permissions(Permission.SendBulkSms) &&
                    smsSourcePhoneNumbers &&
                    smsSourcePhoneNumbers.length > 0 && (
                      <IconButton
                        color={smsMode ? 'secondary' : 'inherit'}
                        aria-label="send bulk sms"
                        onClick={() => setSmsMode(!smsMode)}
                      >
                        <SmsIcon sx={{ position: 'relative', top: 1 }} />
                      </IconButton>
                    )}
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
                </Box>
              </Stack>
            </Stack>
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
                  onClick={() => setCreateVolunteerFamilyDrawerOpen(true)}
                  sx={{
                    marginRight: 'auto',
                    width: { xs: '100%', sm: 'auto' },
                  }}
                >
                  Add new volunteer family
                </Button>
              )}
            <FormControl
              size="small"
              sx={{ minWidth: 180, width: { xs: '100%', sm: 'auto' } }}
            >
              <InputLabel id="volunteer-approval-sort-label">
                Sort by
              </InputLabel>
              <Select
                labelId="volunteer-approval-sort-label"
                value={sortMode}
                label="Sort by"
                onChange={(event: SelectChangeEvent) =>
                  setSortMode(event.target.value as FamilyNameSortMode)
                }
              >
                <MenuItem value="lastNameAsc">Last name (ascending)</MenuItem>
                <MenuItem value="lastNameDesc">Last name (descending)</MenuItem>
                <MenuItem value="firstNameAsc">First name (ascending)</MenuItem>
                <MenuItem value="firstNameDesc">
                  First name (descending)
                </MenuItem>
              </Select>
            </FormControl>
          </Stack>
          <CustomFieldFiltersSidePanel>
            <VolunteerCustomFieldFiltersSidePanel
              customFields={customFields}
              getOptionsForField={getCustomFieldFilterOptionsForField}
              selectedValuesByField={customFieldFilters}
              onFieldChange={changeCustomFieldFilter}
              onClose={closeCustomFieldFiltersSidePanel}
            />
          </CustomFieldFiltersSidePanel>
          <AssignmentFiltersSidePanel>
            <VolunteerAssignmentFiltersSidePanel
              arrangementTypes={arrangementTypes}
              selectedValuesByArrangementType={assignmentFilters}
              onArrangementTypeChange={changeAssignmentFilter}
              onClose={closeAssignmentFiltersSidePanel}
            />
          </AssignmentFiltersSidePanel>
        </Box>
        <Box
          sx={{
            display: 'flex',
            flex: 1,
            flexDirection: 'column',
            minHeight: 0,
          }}
        >
          <WideTableContainer>
            <Table
              stickyHeader
              sx={{
                ...containedStickyHeaderTableSx,
                minWidth: tableMinWidth,
              }}
              size="small"
            >
              <TableHead>
                <TableRow sx={{ height: '40px' }}>
                  {smsMode && (
                    <TableCell sx={{ padding: 0, width: '36px' }}>
                      <Checkbox
                        size="small"
                        checked={uncheckedFamilies.length === 0}
                        onChange={(e) =>
                          e.target.checked
                            ? setUncheckedFamilies([])
                            : setUncheckedFamilies(
                                filteredVolunteerFamilies.map(
                                  (f) => f.family!.id!
                                )
                              )
                        }
                      />
                    </TableCell>
                  )}
                  {expandedView ? (
                    <TableCell>Last Name, First Name</TableCell>
                  ) : (
                    <TableCell>Family</TableCell>
                  )}
                  <TableCell>Roles</TableCell>

                  {customFieldNames.map((fieldName) => (
                    <TableCell key={fieldName}>{fieldName}</TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredVolunteerFamilies.map((volunteerFamily) => (
                  <VolunteerApprovalTableItem
                    key={volunteerFamily.family?.id}
                    volunteerFamily={volunteerFamily}
                    customFieldNames={customFieldNames}
                    expandedView={expandedView}
                    smsMode={smsMode}
                    uncheckedFamilies={uncheckedFamilies}
                    setUncheckedFamilies={setUncheckedFamilies}
                    openFamily={openFamily}
                    roleFilters={roleFilters}
                    updateTestFamilyFlagEnabled={updateTestFamilyFlagEnabled}
                  />
                ))}
              </TableBody>
            </Table>
          </WideTableContainer>

          {createVolunteerFamilyDrawerOpen && (
            <CreateVolunteerFamilyDrawer
              onClose={(volunteerFamilyId) => {
                setCreateVolunteerFamilyDrawerOpen(false);
                if (!volunteerFamilyId) return;
                openFamily(volunteerFamilyId);
              }}
            />
          )}
        </Box>
      </Box>
      {smsMode && (
        <BulkSmsSideSheet
          selectedFamilies={selectedFamilies}
          onClose={() => setSmsMode(false)}
        />
      )}
    </>
  );
}

export { VolunteerApproval };
