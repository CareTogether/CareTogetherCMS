import { CasePoliciesMatrix } from './CasePoliciesMatrix';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Alert,
  Box,
  Button,
  Stack,
  Typography,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { useEffect, useMemo, useRef, useState } from 'react';
import { PolicyAdministrationDrawer } from './PolicyAdministrationDrawer';
import { useAdministrationSidePanel } from './usePolicyAdministrationPanels';
import { usePolicyTransitionGuard } from '../../../../Hooks/useUnsavedPolicyNavigation';
import {
  ArrangementPolicy,
  EffectiveLocationPolicy,
  FunctionAssignmentPolicy,
  V1CasePolicy,
} from '../../../../GeneratedClient';

import { useVisibleFamilies } from '../../../../Model/Data';
import {
  ArrangementPolicySidePanel,
  FunctionAssignmentPolicySidePanel,
} from './sidePanels';
import { FunctionAssignmentPoliciesTable } from './tables';
import {
  clonePolicyWithCasePolicy,
  nextCopyName,
  personOptionsFromFamilies,
  removeByName,
  upsertByName,
} from './policyUtils';
import {
  DeleteRowAction,
  DuplicateRowAction,
  EditableActions,
  SectionHeader,
} from './sharedUi';
import { ArrangementPolicyDetails } from './ArrangementPolicyDetails';

type CasePolicyProps = {
  policy: EffectiveLocationPolicy;
  locationRoles: string[];

  onPolicyChange: (policy: EffectiveLocationPolicy) => Promise<boolean>;
};

export function CasePolicyTab(props: CasePolicyProps) {
  const canLeaveAdministration = usePolicyTransitionGuard();
  const [management, setManagement] = useState<'manage' | 'create'>();
  const [matrixState, setMatrixState] = useState({
    dirty: false,
    editing: false,
    saving: false,
  });
  const [managementError, setManagementError] = useState<string>();
  function openManagement(mode: 'manage' | 'create') {
    if (matrixState.saving) {
      void canLeaveAdministration();
      return;
    }
    if (matrixState.dirty || matrixState.editing) {
      setManagementError(
        'Save or Cancel matrix changes and finish the active cell edit before opening administration.'
      );
      return;
    }
    setManagementError(undefined);
    setManagement(mode);
  }
  return (
    <Stack spacing={2} sx={{ minWidth: 0 }}>
      <Stack
        direction="row"
        spacing={1}
        sx={{ justifyContent: 'flex-end', flexWrap: 'wrap', gap: 1 }}
      >
        <Button
          variant="contained"
          color="primary"
          onClick={() => openManagement('create')}
        >
          Add Arrangement
        </Button>
        <Button
          variant="contained"
          color="primary"
          onClick={() => openManagement('manage')}
        >
          Manage Arrangements &amp; Functions
        </Button>
      </Stack>
      {managementError && (matrixState.dirty || matrixState.editing) && (
        <Alert severity="info">{managementError}</Alert>
      )}
      <CasePoliciesMatrix
        policy={props.policy}
        onPolicyChange={props.onPolicyChange}
        onEditingStateChange={setMatrixState}
      />
      {management && (
        <PolicyAdministrationDrawer
          open
          direct={management === 'create'}
          onClose={() => setManagement(undefined)}
        >
          <CasePolicyDetailsEditor
            {...props}
            createArrangement={management === 'create'}
          />
        </PolicyAdministrationDrawer>
      )}
    </Stack>
  );
}
function CasePolicyDetailsEditor({
  policy,
  locationRoles,
  onPolicyChange,
  createArrangement = false,
}: CasePolicyProps & {
  createArrangement?: boolean;
}) {
  const casePolicy = policy.referralPolicy;
  const arrangementPolicies = casePolicy?.arrangementPolicies ?? [];
  const volunteerRoles = Object.keys(
    policy.volunteerPolicy?.volunteerRoles ?? {}
  );
  const volunteerFamilyRoles = Object.keys(
    policy.volunteerPolicy?.volunteerFamilyRoles ?? {}
  );
  const visibleFamilies = useVisibleFamilies();
  const personOptions = useMemo(
    () => personOptionsFromFamilies(visibleFamilies),
    [visibleFamilies]
  );
  const {
    SidePanel: FunctionAssignmentPanel,
    openSidePanel: openFunctionAssignmentPanel,
    closeSidePanel: closeFunctionAssignmentPanel,
    requestCloseSidePanel: requestCloseFunctionAssignmentPanel,
  } = useAdministrationSidePanel({
    className: 'ph-unmask',
    protectNavigation: true,
  });
  const {
    SidePanel: ArrangementPolicyPanel,
    openSidePanel: openArrangementPolicyPanel,
    closeSidePanel: closeArrangementPolicyPanel,
    requestCloseSidePanel: requestCloseArrangementPolicyPanel,
  } = useAdministrationSidePanel({
    className: 'ph-unmask',
    protectNavigation: true,
  });
  const creationOpened = useRef(false);
  useEffect(() => {
    if (!createArrangement || creationOpened.current) return;
    creationOpened.current = true;
    openArrangementPolicyPanel();
  }, [createArrangement, openArrangementPolicyPanel]);
  const [workingFunctionAssignmentPolicy, setWorkingFunctionAssignmentPolicy] =
    useState<FunctionAssignmentPolicy | undefined>();
  const [workingArrangementPolicy, setWorkingArrangementPolicy] = useState<
    ArrangementPolicy | undefined
  >();
  function updateCasePolicy(update: Partial<V1CasePolicy>) {
    return onPolicyChange(
      clonePolicyWithCasePolicy(
        policy,
        new V1CasePolicy({
          ...casePolicy,
          ...update,
        })
      )
    );
  }

  async function updateCasePolicyAndClose(
    update: Partial<V1CasePolicy>,
    closePanel: () => void
  ) {
    const saved = await updateCasePolicy(update);
    if (saved) closePanel();
    return saved;
  }

  function duplicateCaseFunctionAssignmentPolicy(
    assignmentPolicy: FunctionAssignmentPolicy
  ) {
    const existingRoles =
      casePolicy?.functionAssignmentPolicies?.map(
        (item) => item.assignmentRole
      ) ?? [];
    updateCasePolicy({
      functionAssignmentPolicies: upsertByName(
        casePolicy?.functionAssignmentPolicies ?? [],
        undefined,
        new FunctionAssignmentPolicy({
          ...assignmentPolicy,
          assignmentRole: nextCopyName(
            assignmentPolicy.assignmentRole,
            existingRoles
          ),
        }),
        (item) => item.assignmentRole
      ),
    });
  }

  function deleteCaseFunctionAssignmentPolicy(
    assignmentPolicy: FunctionAssignmentPolicy
  ) {
    updateCasePolicy({
      functionAssignmentPolicies: removeByName(
        casePolicy?.functionAssignmentPolicies,
        assignmentPolicy.assignmentRole,
        (item) => item.assignmentRole
      ),
    });
  }

  function duplicateArrangementPolicy(arrangement: ArrangementPolicy) {
    updateCasePolicy({
      arrangementPolicies: upsertByName(
        arrangementPolicies,
        undefined,
        new ArrangementPolicy({
          ...arrangement,
          arrangementType: nextCopyName(
            arrangement.arrangementType,
            arrangementPolicies.map((item) => item.arrangementType)
          ),
        }),
        (item) => item.arrangementType
      ),
    });
  }

  function deleteArrangementPolicy(arrangement: ArrangementPolicy) {
    updateCasePolicy({
      arrangementPolicies: removeByName(
        arrangementPolicies,
        arrangement.arrangementType,
        (item) => item.arrangementType
      ),
    });
  }

  return (
    <Box>
      <SectionHeader title="Case Policies" />

      <Stack spacing={2}>
        <Accordion defaultExpanded variant="outlined">
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography>Functions</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Stack spacing={2}>
              <EditableActions
                onAdd={() => {
                  setWorkingFunctionAssignmentPolicy(undefined);
                  openFunctionAssignmentPanel();
                }}
              />
              <FunctionAssignmentPoliciesTable
                policies={casePolicy?.functionAssignmentPolicies}
                emptyLabel="No case function assignment policies configured."
                onEdit={(assignmentPolicy) => {
                  setWorkingFunctionAssignmentPolicy(assignmentPolicy);
                  openFunctionAssignmentPanel();
                }}
                onDuplicate={duplicateCaseFunctionAssignmentPolicy}
                onDelete={deleteCaseFunctionAssignmentPolicy}
              />
            </Stack>
          </AccordionDetails>
        </Accordion>
        <Accordion variant="outlined">
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography>Arrangements</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Stack spacing={2}>
              <EditableActions
                onAdd={() => {
                  setWorkingArrangementPolicy(undefined);
                  openArrangementPolicyPanel();
                }}
              />
              {arrangementPolicies.length === 0 ? (
                <Typography variant="body2" color="text.secondary">
                  No arrangement policies configured.
                </Typography>
              ) : (
                arrangementPolicies.map((arrangement) => (
                  <Accordion
                    key={arrangement.arrangementType}
                    variant="outlined"
                  >
                    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                      <Stack
                        direction={{ xs: 'column', sm: 'row' }}
                        spacing={1}
                        sx={{
                          alignItems: { xs: 'flex-start', sm: 'center' },
                        }}
                      >
                        <Typography>{arrangement.arrangementType}</Typography>
                        <Typography variant="body2" color="text.secondary">
                          {arrangement.supersededAtUtc
                            ? 'Superseded'
                            : 'Current'}
                        </Typography>
                        <Button
                          size="small"
                          variant="outlined"
                          onClick={(event) => {
                            event.stopPropagation();
                            setWorkingArrangementPolicy(arrangement);
                            openArrangementPolicyPanel();
                          }}
                        >
                          Edit
                        </Button>
                        <DuplicateRowAction
                          label={arrangement.arrangementType}
                          onClick={() =>
                            duplicateArrangementPolicy(arrangement)
                          }
                        />
                        <DeleteRowAction
                          label={arrangement.arrangementType}
                          onClick={() => deleteArrangementPolicy(arrangement)}
                        />
                      </Stack>
                    </AccordionSummary>
                    <AccordionDetails>
                      <ArrangementPolicyDetails
                        arrangement={arrangement}
                        volunteerRoles={volunteerRoles}
                        volunteerFamilyRoles={volunteerFamilyRoles}
                        personOptions={personOptions}
                        onArrangementChange={(updatedArrangement) =>
                          updateCasePolicy({
                            arrangementPolicies: upsertByName(
                              arrangementPolicies,
                              arrangement.arrangementType,
                              updatedArrangement,
                              (item) => item.arrangementType
                            ),
                          })
                        }
                      />
                    </AccordionDetails>
                  </Accordion>
                ))
              )}
            </Stack>
          </AccordionDetails>
        </Accordion>
      </Stack>

      <FunctionAssignmentPanel>
        <FunctionAssignmentPolicySidePanel
          key={
            workingFunctionAssignmentPolicy?.assignmentRole ??
            'new-case-assignment-policy'
          }
          title={
            workingFunctionAssignmentPolicy
              ? 'Edit Case Policies Function Assignment Policy'
              : 'Add Case Policies Function Assignment Policy'
          }
          policy={workingFunctionAssignmentPolicy}
          existingAssignmentRoles={
            casePolicy?.functionAssignmentPolicies?.map(
              (item) => item.assignmentRole
            ) ?? []
          }
          locationRoles={locationRoles}
          volunteerRoles={volunteerRoles}
          volunteerFamilyRoles={volunteerFamilyRoles}
          personOptions={personOptions}
          onClose={requestCloseFunctionAssignmentPanel}
          onSave={(previousRole, assignmentPolicy) =>
            updateCasePolicyAndClose(
              {
                functionAssignmentPolicies: upsertByName(
                  casePolicy?.functionAssignmentPolicies ?? [],
                  previousRole,
                  assignmentPolicy,
                  (item) => item.assignmentRole
                ),
              },
              closeFunctionAssignmentPanel
            )
          }
        />
      </FunctionAssignmentPanel>

      <ArrangementPolicyPanel>
        <ArrangementPolicySidePanel
          key={
            workingArrangementPolicy?.arrangementType ??
            'new-arrangement-policy'
          }
          arrangement={workingArrangementPolicy}
          existingArrangementTypes={arrangementPolicies.map(
            (item) => item.arrangementType
          )}
          onClose={requestCloseArrangementPolicyPanel}
          onSave={(previousType, arrangement) =>
            updateCasePolicyAndClose(
              {
                arrangementPolicies: upsertByName(
                  arrangementPolicies,
                  previousType,
                  arrangement,
                  (item) => item.arrangementType
                ),
              },
              closeArrangementPolicyPanel
            )
          }
        />
      </ArrangementPolicyPanel>
    </Box>
  );
}
