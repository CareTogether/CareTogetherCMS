import {
  Button,
  Grid,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import { partneringFamiliesData } from '../Model/V1CasesModel';
import React, { useState } from 'react';
import AddIcon from '@mui/icons-material/Add';
import {
  ArrangementPhase,
  Permission,
} from '../GeneratedClient';
import { CreatePartneringFamilyDialog } from './CreatePartneringFamilyDialog';
import { useScrollMemory } from '../Hooks/useScrollMemory';
import { useLocalStorage } from '../Hooks/useLocalStorage';
import { policyData } from '../Model/ConfigurationModel';
import { SearchBar } from '../Shell/SearchBar';
import {
  filterFamiliesByText,
  sortFamiliesByLastNameDesc,
} from '../Families/FamilyUtils';
import { useAllPartneringFamiliesPermissions } from '../Model/SessionModel';
import { useScreenTitle } from '../Shell/ShellScreenTitle';
import UnfoldLessIcon from '@mui/icons-material/UnfoldLess';
import UnfoldMoreIcon from '@mui/icons-material/UnfoldMore';
import { useLoadable } from '../Hooks/useLoadable';
import { ProgressBackdrop } from '../Shell/ProgressBackdrop';
import { useAppNavigate } from '../Hooks/useAppNavigate';
import { CustomFieldsFilter } from '../Generic/CustomFieldsFilter/CustomFieldsFilter';
import { useCustomFieldFilters } from '../Generic/CustomFieldsFilter/useCustomFieldFilters';
import { matchesCustomFieldFilters } from '../Generic/CustomFieldsFilter/matchesCustomFieldFilters';
import { useFeatureFlagEnabled } from 'posthog-js/react';
import { forceCheck } from 'react-lazyload';
import { PartneringFamilyTableItem } from './PartneringFamilies/PartneringFamilyTableItem';
import { arrangementStatusSummary } from './PartneringFamilies/arrangementStatusSummary';
import { ArrangementsFilter } from './PartneringFamilies/types';

function PartneringFamilies() {
  const appNavigate = useAppNavigate();

  // The array object returned by Recoil is read-only. We need to copy it before we can do an in-place sort.
  const partneringFamiliesLoadable = useLoadable(partneringFamiliesData);
  const partneringFamilies = sortFamiliesByLastNameDesc(
    partneringFamiliesLoadable || []
  );

  const arrangementTypes = useLoadable(
    policyData
  )?.referralPolicy?.arrangementPolicies?.map((a) => {
    return a.arrangementType!;
  });

  const loadablePolicy = useLoadable(policyData);

  const referralCustomFields = React.useMemo(() => {
    return loadablePolicy?.referralPolicy?.customFields || [];
  }, [loadablePolicy]);

  const [filterText, setFilterText] = useState('');
  const filteredPartneringFamilies = filterFamiliesByText(
    partneringFamilies,
    filterText
  );

  const {
    selectedValuesByField: selectedCustomFieldValuesByField,
    setSelectedValuesForField: setSelectedCustomFieldValuesForField,
    optionsByField: customFieldFilterOptionsByField,
  } = useCustomFieldFilters({
    customFields: referralCustomFields,
    items: partneringFamilies,
    isBlank: (family, fieldName) =>
      family.partneringFamilyInfo?.openV1Case?.missingCustomFields?.includes(
        fieldName
      ) ?? false,
    getValue: (family, fieldName) =>
      family.partneringFamilyInfo?.openV1Case?.completedCustomFields?.find(
        (f) => f.customFieldName === fieldName
      )?.value,
  });

  useScrollMemory();

  function openFamily(familyId: string) {
    appNavigate.family(familyId);
  }

  const [
    createPartneringFamilyDialogOpen,
    setCreatePartneringFamilyDialogOpen,
  ] = useState(false);
  const [expandedView, setExpandedView] = useLocalStorage(
    'partnering-families-expanded',
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

  const [arrangementsFilter, setArrangementsFilter] = useLocalStorage<ArrangementsFilter>(
    'partnering-families-arrangementsFilter',
    'All'
  );
  const filteredPartneringFamiliesWithActiveOrAllFilter =
    filteredPartneringFamilies
      .filter((family) =>
        matchesCustomFieldFilters({
          item: family,
          customFields: referralCustomFields,
          selectedValuesByField: selectedCustomFieldValuesByField,
          isBlank: (f, fieldName) =>
            f.partneringFamilyInfo?.openV1Case?.missingCustomFields?.includes(
              fieldName
            ) ?? false,
          getValue: (f, fieldName) =>
            f.partneringFamilyInfo?.openV1Case?.completedCustomFields?.find(
              (x) => x.customFieldName === fieldName
            )?.value,
        })
      )
      .filter((family) => {
        const openCase = family.partneringFamilyInfo?.openV1Case;
        const arrangements = openCase?.arrangements ?? [];

        switch (arrangementsFilter) {
          case 'All':
            return true;

          case 'Intake':
            return !!openCase && arrangements.length === 0;

          case 'Active':
            return arrangements.some(
              (arrangement) => arrangement.phase === ArrangementPhase.Started
            );

          case 'Setup':
            return arrangements.some(
              (arrangement) =>
                arrangement.phase === ArrangementPhase.SettingUp ||
                arrangement.phase === ArrangementPhase.ReadyToStart
            );

          case 'Active + Setup':
            return arrangements.some(
              (arrangement) =>
                arrangement.phase === ArrangementPhase.Started ||
                arrangement.phase === ArrangementPhase.SettingUp ||
                arrangement.phase === ArrangementPhase.ReadyToStart
            );

          default:
            return true;
        }
      });

  React.useEffect(() => {
    forceCheck();
  }, [arrangementsFilter, filterText, selectedCustomFieldValuesByField]);

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const updateTestFamilyFlagEnabled = useFeatureFlagEnabled(
    'updateTestFamilyFlag'
  );

  const permissions = useAllPartneringFamiliesPermissions();

  useScreenTitle('Cases');

  return !partneringFamiliesLoadable || !arrangementTypes ? (
    <ProgressBackdrop>
      <p>Loading families...</p>
    </ProgressBackdrop>
  ) : (
    <Grid container>
      <Grid item xs={12}>
        <Stack
          direction="row"
          sx={{
            marginTop: 2,
            marginBottom: 2,
            flexWrap: 'wrap',
            alignItems: 'center',
            gap: 1,
          }}
        >
          {permissions(Permission.EditFamilyInfo) &&
            permissions(Permission.CreateV1Case) && (
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => setCreatePartneringFamilyDialogOpen(true)}
                sx={{ marginRight: 'auto' }}
              >
                Add new client family
              </Button>
            )}

          <ToggleButtonGroup
            value={arrangementsFilter}
            exclusive
            onChange={(_, value) => setArrangementsFilter(value)}
            size={isMobile ? 'medium' : 'small'}
            aria-label="row expansion"
          >
            <Tooltip title="Shows all cases" arrow>
              <ToggleButton value={'All'} aria-label="expanded">
                All
              </ToggleButton>
            </Tooltip>
            <Tooltip title="Shows open cases with no arrangements yet" arrow>
              <ToggleButton value={'Intake'}>Intake</ToggleButton>
            </Tooltip>
            <Tooltip
              title="Shows cases with at least one active arrangement"
              arrow
            >
              <ToggleButton value={'Active'} aria-label="collapsed">
                Active
              </ToggleButton>
            </Tooltip>
            <Tooltip
              title="Shows cases with arrangements in the setup phase"
              arrow
            >
              <ToggleButton value={'Setup'} aria-label="collapsed">
                Setup
              </ToggleButton>
            </Tooltip>
            <Tooltip
              title="Shows cases with arrangements that are either active or in setup"
              arrow
            >
              <ToggleButton value={'Active + Setup'} aria-label="collapsed">
                Active + Setup
              </ToggleButton>
            </Tooltip>
          </ToggleButtonGroup>

          <CustomFieldsFilter
            customFields={referralCustomFields}
            optionsByField={customFieldFilterOptionsByField}
            selectedValuesByField={selectedCustomFieldValuesByField}
            onFieldChange={setSelectedCustomFieldValuesForField}
          />

          <SearchBar value={filterText} onChange={setFilterText} />

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
        </Stack>
      </Grid>
      <Grid item xs={12}>
        <TableContainer
          sx={{ borderBottom: '1px solid rgba(224, 224, 224, 1)' }}
        >
          <Table sx={{ minWidth: '700px' }} size="small">
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 600 }}>Client Family</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Case Status</TableCell>
                {referralCustomFields.map((field) => (
                  <TableCell
                    key={field.name}
                    sx={{
                      fontWeight: 600,
                      textAlign: 'center',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {field.name}
                  </TableCell>
                ))}

                {!expandedView &&
                  arrangementTypes?.map((arrangementType) => (
                    <TableCell
                      key={arrangementType}
                      sx={{
                        fontWeight: 600,
                        textAlign: 'center',
                      }}
                    >
                      {arrangementType}
                    </TableCell>
                  ))}
              </TableRow>
            </TableHead>

            <TableBody>
              {filteredPartneringFamiliesWithActiveOrAllFilter.map(
                (partneringFamily) => (
                  <PartneringFamilyTableItem
                    key={partneringFamily.family?.id}
                    partneringFamily={partneringFamily}
                    arrangementTypes={arrangementTypes}
                    arrangementsFilter={arrangementsFilter}
                    expandedView={expandedView}
                    openArrangement={(familyId, v1CaseId, arrangementId) =>
                      appNavigate.family(familyId, v1CaseId, arrangementId)
                    }
                    openFamily={openFamily}
                    referralCustomFields={referralCustomFields}
                    arrangementStatusSummary={arrangementStatusSummary}
                    updateTestFamilyFlagEnabled={updateTestFamilyFlagEnabled}
                  />
                )
              )}
            </TableBody>
          </Table>
        </TableContainer>

        {createPartneringFamilyDialogOpen && (
          <CreatePartneringFamilyDialog
            onClose={(partneringFamilyId) => {
              setCreatePartneringFamilyDialogOpen(false);
              partneringFamilyId && openFamily(partneringFamilyId);
            }}
          />
        )}
      </Grid>
    </Grid>
  );
}

export { PartneringFamilies };
