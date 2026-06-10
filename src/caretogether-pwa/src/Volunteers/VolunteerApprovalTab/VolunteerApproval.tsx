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
import {
  CombinedFamilyInfo,
  EmailAddress,
  Permission,
  VolunteerInfo,
} from '../../GeneratedClient';
import { useRecoilState, useRecoilValue } from 'recoil';
import { volunteerFamiliesData } from '../../Model/VolunteersModel';
import {
  organizationConfigurationQuery,
  policyData,
} from '../../Model/ConfigurationModel';
import React, { useEffect, useState } from 'react';
import {
  Add as AddIcon,
  Email as EmailIcon,
  FilterList as FilterListIcon,
  Sms as SmsIcon,
  UnfoldLess as UnfoldLessIcon,
  UnfoldMore as UnfoldMoreIcon,
} from '@mui/icons-material';
import { CreateVolunteerFamilyDialog } from '../CreateVolunteerFamilyDialog';
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
import { useLoadable } from '../../Hooks/useLoadable';
import { ProgressBackdrop } from '../../Shell/ProgressBackdrop';
import { selectedLocationContextState } from '../../Model/Data';
import { useAppNavigate } from '../../Hooks/useAppNavigate';
import { useGlobalSnackBar } from '../../Hooks/useGlobalSnackBar';
import { statusFiltersState } from './statusFiltersState';
import { checkStatusEquivalence } from './checkStatusEquivalence';
import { simplify } from './simplify';
import { filterType } from './filterType';
import { roleFiltersState } from './roleFiltersState';
import { VolunteerFilter } from './VolunteerFilter';
import { notAppliedLabel } from './catchAllLabel';
import { getOptionValueFromSelection } from './getOptionValueFromSelection';
import { getUpdatedFilters } from './getUpdatedFilters';
import { useCustomFieldFilters } from '../../Generic/CustomFieldsFilter/useCustomFieldFilters';
import { matchesCustomFieldFilters } from '../../Generic/CustomFieldsFilter/matchesCustomFieldFilters';
import { CustomFieldFilterValue } from '../../Generic/CustomFieldsFilter/types';
import { useFeatureFlagEnabled } from 'posthog-js/react';
import { forceCheck } from '../../Utilities/reactLazyLoadInterop';
import { VolunteerApprovalTableItem } from './VolunteerApprovalTableItem';
import { VolunteerCustomFieldFiltersSidePanel } from './VolunteerCustomFieldFiltersSidePanel';
import { useSidePanel } from '../../Hooks/useSidePanel';
import { containedStickyHeaderTableSx } from '../../Utilities/stickyHeaderTableSx';
import { WideTableContainer } from '../../Utilities/WideTableContainer';
import { wideTablePageSx } from '../../Utilities/wideTablePageSx';
import {
  FamilyNameSortMode,
  normalizeFamilyNameSortMode,
  sortFamiliesByName,
} from '../../Families/FamilyUtils';

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

  const policy = useRecoilValue(policyData);

  const customFieldNames =
    (policy.customFamilyFields?.map((field) => field.name) || []).concat(
      policy.volunteerPolicy?.customFields?.map((field) => field.name) || []
    );

  //#region Role/Status Selection Code
  const [roleFilters, setRoleFilters] = useRecoilState(roleFiltersState);
  const [statusFilters, setStatusFilters] = useRecoilState(statusFiltersState);

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
  //#endregion

  // The array object returned by Recoil is read-only. We need to copy it before we can do an in-place sort.
  const volunteerFamiliesLoadable = useLoadable(volunteerFamiliesData);
  const [storedSortMode, setStoredSortMode] =
    useLocalStorage<FamilyNameSortMode>(
      VOLUNTEER_APPROVAL_SORT_STORAGE_KEY,
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

  const {
    selectedValuesByField: customFieldFilters,
    setSelectedValuesForField: setCustomFieldFilter,
    optionsByField: customFieldFilterOptionsByField,
  } = useCustomFieldFilters({
    customFields: (policy.customFamilyFields ?? []).concat(policy.volunteerPolicy?.customFields ?? []),
    items: volunteerFamilies,
    isBlank: (family, fieldName) => {
      const familyField = family.family?.completedCustomFields?.find(
        (customField) => customField.customFieldName === fieldName
      );
      if (familyField && familyField.value !== undefined && familyField.value !== null) return false;
      const volunteerField = family.volunteerFamilyInfo?.completedCustomFields?.find(
        (customField) => customField.customFieldName === fieldName
      );
      return !volunteerField || volunteerField.value === undefined || volunteerField.value === null;
    },
    getValue: (family, fieldName) => {
      const familyField = family.family?.completedCustomFields?.find(
        (customField) => customField.customFieldName === fieldName
      );
      if (familyField?.value !== undefined && familyField?.value !== null) return familyField.value;
      const volunteerField = family.volunteerFamilyInfo?.completedCustomFields?.find(
        (customField) => customField.customFieldName === fieldName
      );
      return volunteerField?.value;
    },
  });
  const [filterText, setFilterText] = useState('');
  const customFieldCount = (policy.customFamilyFields || []).length + (policy.volunteerPolicy?.customFields || []).length;
  const activeCustomFieldFilterCount = Object.values(customFieldFilters).filter(
    (selectedValues) => selectedValues.length > 0
  ).length;

  //#region Family/Individual Filtering Code
  const selectedFamilyRoleKeys = roleFilters
    .filter(
      (filterOption) =>
        filterOption.selected && filterOption.type !== filterType.Individual
    )
    .map((filterOption) => filterOption.key);
  const selectedIndividualRoleKeys = roleFilters
    .filter(
      (filterOption) =>
        filterOption.selected && filterOption.type !== filterType.Family
    )
    .map((filterOption) => filterOption.key);
  const selectedStatusKeys = statusFilters
    .filter((filterOption) => filterOption.selected)
    .map((filterOption) => filterOption.value);

  //#region Family-Specific Methods
  function familyHasNotAppliedForAnyRoles(family: CombinedFamilyInfo) {
    const familyRoleApprovals =
      family.volunteerFamilyInfo?.familyRoleApprovals ?? {};

    const familyHasAppliedRole = Object.values(familyRoleApprovals).some(
      (roleApproval) => roleApproval.currentStatus != null
    );

    if (familyHasAppliedRole) {
      return false;
    }

    return getFamilyMembers(family).every(([, volunteer]) => {
      const individualRoleApprovals = volunteer.approvalStatusByRole ?? {};
      return Object.values(individualRoleApprovals).every(
        (roleApproval) => roleApproval.currentStatus == null
      );
    });
  }

  function familyHasNoValidStatuses(family: CombinedFamilyInfo) {
    return roleFilters
      .filter((filterOption) => filterOption.key !== notAppliedLabel)
      .every(
        (filterOption) =>
          family.volunteerFamilyInfo?.familyRoleApprovals?.[
            filterOption.key
          ] === undefined
      );
  }

  function familyHasSpecificRoleInValidStatus(
    family: CombinedFamilyInfo,
    roleName: string
  ) {
    return statusFilters
      .filter((filterOption) => filterOption.key !== notAppliedLabel)
      .some((status) =>
        checkStatusEquivalence(
          status.value,
          family.volunteerFamilyInfo?.familyRoleApprovals?.[roleName]
            ?.currentStatus
        )
      );
  }

  function familyMeetsFilterCriteria(family: CombinedFamilyInfo) {
    if (!selectedFamilyRoleKeys.length) {
      if (!selectedStatusKeys.length) {
        return selectedIndividualRoleKeys.length === 0;
      }
      return selectedStatusKeys.some((status) =>
        status === notAppliedLabel
          ? familyHasNoValidStatuses(family)
          : roleFilters.some((roleFilter) =>
              checkStatusEquivalence(
                status,
                family.volunteerFamilyInfo?.familyRoleApprovals?.[
                  roleFilter.key
                ]?.currentStatus
              )
            )
      );
    }
    return selectedFamilyRoleKeys.some((roleName) => {
      if (roleName === notAppliedLabel) {
        return familyHasNotAppliedForAnyRoles(family);
      }

      const familyHasRole =
        family.volunteerFamilyInfo?.familyRoleApprovals?.[roleName] !==
        undefined;
      if (!familyHasRole) {
        return familyHasRole;
      }
      if (selectedStatusKeys.length === 0) {
        return familyHasSpecificRoleInValidStatus(family, roleName);
      }
      return selectedStatusKeys.some((status) =>
        checkStatusEquivalence(
          status,
          family.volunteerFamilyInfo?.familyRoleApprovals?.[roleName]
            ?.currentStatus
        )
      );
    });
  }
  //#endregion

  //#region Family Member-Specific Methods
  function getFamilyMembers(family: CombinedFamilyInfo) {
    return (
      (family.volunteerFamilyInfo?.individualVolunteers &&
        Object.entries(family.volunteerFamilyInfo?.individualVolunteers)) ||
      []
    );
  }

  function familyMemberHasNoValidStatuses(volunteer: VolunteerInfo) {
    return roleFilters
      .filter((filterOption) => filterOption.key !== notAppliedLabel)
      .every((filterOption) =>
        checkStatusEquivalence(
          volunteer.approvalStatusByRole?.[filterOption.key]?.currentStatus,
          null
        )
      );
  }

  function familyMemberHasSpecificRoleInValidStatus(
    volunteer: VolunteerInfo,
    roleName: string
  ) {
    return statusFilters
      .filter((filterOption) => filterOption.key !== notAppliedLabel)
      .some((status) =>
        checkStatusEquivalence(
          status.value,
          volunteer.approvalStatusByRole?.[roleName]?.currentStatus
        )
      );
  }

  function familyMemberHasARoleInSelectedStatus(
    volunteer: VolunteerInfo,
    status: string
  ) {
    return status === notAppliedLabel
      ? familyMemberHasNoValidStatuses(volunteer)
      : roleFilters.some((roleFilter) =>
          checkStatusEquivalence(
            volunteer.approvalStatusByRole?.[roleFilter.key]?.currentStatus,
            status
          )
        );
  }

  function familyMembersMeetFilterCriteria(family: CombinedFamilyInfo) {
    const familyMembers = getFamilyMembers(family);
    if (!selectedIndividualRoleKeys.length) {
      if (!selectedStatusKeys.length) {
        return !selectedFamilyRoleKeys.length;
      }
      return selectedStatusKeys.some(
        (status) =>
          familyMembers.filter(([, volunteer]) =>
            familyMemberHasARoleInSelectedStatus(
              volunteer,
              status ? status : notAppliedLabel
            )
          ).length > 0
      );
    }
    return selectedIndividualRoleKeys.some((roleName) => {
      if (roleName === notAppliedLabel) {
        return familyHasNotAppliedForAnyRoles(family);
      }

      return familyMembers.some(([, volunteer]) => {
        if (!selectedStatusKeys.length) {
          return familyMemberHasSpecificRoleInValidStatus(volunteer, roleName);
        }
        return selectedStatusKeys.some((status) =>
          checkStatusEquivalence(
            status,
            volunteer.approvalStatusByRole?.[roleName]?.currentStatus
          )
        );
      });
    });
  }
  //#endregion

  function familyOrFamilyMembersMeetFilterCriteria(family: CombinedFamilyInfo) {
    const familyMeetsRoleCriteria = familyMeetsFilterCriteria(family);
    const familyMembersMeetRoleCriteria =
      familyMembersMeetFilterCriteria(family);
    const familyRolesSelected = selectedFamilyRoleKeys.length > 0;
    const individualRolesSelected = selectedIndividualRoleKeys.length > 0;
    const statusesSelected = selectedStatusKeys.length > 0;
    let result = true;
    if (familyRolesSelected && individualRolesSelected) {
      result = familyMeetsRoleCriteria || familyMembersMeetRoleCriteria;
    } else if (familyRolesSelected) {
      result = familyMeetsRoleCriteria;
    } else if (individualRolesSelected) {
      result = familyMembersMeetRoleCriteria;
    } else if (statusesSelected) {
      result = familyMeetsRoleCriteria || familyMembersMeetRoleCriteria;
    }
    return result;
  }
  //#endregion

  function familyMatchesCustomFieldFilters(family: CombinedFamilyInfo) {
    return matchesCustomFieldFilters({
      item: family,
      customFields: (policy.customFamilyFields ?? []).concat(policy.volunteerPolicy?.customFields ?? []),
      selectedValuesByField: customFieldFilters,
      isBlank: (f, fieldName) => {
        const familyField = f.family?.completedCustomFields?.find(
          (customField) => customField.customFieldName === fieldName
        );
        if (familyField && familyField.value !== undefined && familyField.value !== null) return false;
        const volunteerField = f.volunteerFamilyInfo?.completedCustomFields?.find(
          (customField) => customField.customFieldName === fieldName
        );
        return !volunteerField || volunteerField.value === undefined || volunteerField.value === null;
      },
      getValue: (f, fieldName) => {
        const familyField = f.family?.completedCustomFields?.find(
          (customField) => customField.customFieldName === fieldName
        );
        if (familyField?.value !== undefined && familyField?.value !== null) return familyField.value;
        const volunteerField = f.volunteerFamilyInfo?.completedCustomFields?.find(
          (customField) => customField.customFieldName === fieldName
        );
        return volunteerField?.value;
      },
    });
  }

  const filteredVolunteerFamilies = volunteerFamilies.filter(
    (family) =>
      /* Filter by name */ (filterText.length === 0 ||
        family.family?.adults?.some((adult) =>
          simplify(
            `${adult.item1?.firstName} ${adult.item1?.lastName}`
          ).includes(filterText.toLowerCase())
        ) ||
        family.family?.children?.some((child) =>
          simplify(`${child?.firstName} ${child?.lastName}`).includes(
            filterText.toLowerCase()
          )
        )) &&
      familyOrFamilyMembersMeetFilterCriteria(family) &&
      familyMatchesCustomFieldFilters(family)
  );

  useEffect(() => {
    forceCheck();
  }, [customFieldFilters, filterText, roleFilters, sortMode, statusFilters]);

  const selectedFamilies = filteredVolunteerFamilies.filter(
    (family) => !uncheckedFamilies.some((f) => f === family.family!.id!)
  );

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

  const { locationId } = useRecoilValue(selectedLocationContextState);
  const organizationConfiguration = useRecoilValue(
    organizationConfigurationQuery
  );
  const smsSourcePhoneNumbers = organizationConfiguration?.locations?.find(
    (loc) => loc.id === locationId
  )?.smsSourcePhoneNumbers;
  const [smsMode, setSmsMode] = useState(false);

  function getSelectedFamiliesContactEmails() {
    return selectedFamilies
      .map((family) => {
        const primaryContactPerson = family.family?.adults?.find(
          (adult) =>
            adult.item1?.id === family.family?.primaryFamilyContactPersonId
        );
        const preferredEmailAddress =
          primaryContactPerson?.item1?.emailAddresses?.find(
            (email) =>
              email.id === primaryContactPerson.item1?.preferredEmailAddressId
          );
        return preferredEmailAddress;
      })
      .filter((email) => typeof email !== 'undefined') as EmailAddress[];
  }

  const { setAndShowGlobalSnackBar } = useGlobalSnackBar();

  function copyEmailAddresses() {
    const emailAddresses = getSelectedFamiliesContactEmails();
    navigator.clipboard.writeText(
      emailAddresses.map((email) => email.address).join('; ')
    );
    setAndShowGlobalSnackBar(
      `Found and copied ${getSelectedFamiliesContactEmails().length} email addresses for ${selectedFamilies.length} selected families to clipboard`
    );
  }

  const windowSize = useWindowSize();

  const permissions = useAllVolunteerFamiliesPermissions();
  const tableColumnCount = 2 + customFieldNames.length + (smsMode ? 1 : 0);
  const tableMinWidth = Math.max(700, tableColumnCount * 160);
  const hasFeaturebaseChat = globalPermissions(Permission.AccessSupportScreen);
  const tablePageSx = wideTablePageSx(hasFeaturebaseChat);

  useScreenTitle('Volunteers');

  return !volunteerFamiliesLoadable ? (
    <ProgressBackdrop>
      <p>Loading families...</p>
    </ProgressBackdrop>
  ) : (
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
            my={2}
            direction="row"
            justifyContent="flex-end"
            alignItems="center"
            sx={{ gap: 1, flexWrap: 'wrap' }}
          >
            {permissions(Permission.EditFamilyInfo) &&
              permissions(Permission.ActivateVolunteerFamily) && (
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={() => setCreateVolunteerFamilyDialogOpen(true)}
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
                <MenuItem value="firstNameAsc">
                  First name (ascending)
                </MenuItem>
                <MenuItem value="firstNameDesc">
                  First name (descending)
                </MenuItem>
              </Select>
            </FormControl>
          </Stack>
          <CustomFieldFiltersSidePanel>
            <VolunteerCustomFieldFiltersSidePanel
              customFields={(policy.customFamilyFields || []).concat(policy.volunteerPolicy?.customFields || [])}
              optionsByField={customFieldFilterOptionsByField}
              selectedValuesByField={customFieldFilters}
              onFieldChange={changeCustomFieldFilter}
              onClose={closeCustomFieldFiltersSidePanel}
            />
          </CustomFieldFiltersSidePanel>

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
