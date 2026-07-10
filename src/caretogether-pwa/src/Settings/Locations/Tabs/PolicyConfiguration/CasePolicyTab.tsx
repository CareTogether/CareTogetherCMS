import { Accordion, AccordionDetails, AccordionSummary, Box, Button, Stack, Typography } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { useMemo, useState } from 'react';
import { useRecoilValue } from 'recoil';
import { ArrangementPolicy, EffectiveLocationPolicy, FunctionAssignmentPolicy, V1CasePolicy } from '../../../../GeneratedClient';
import { useSidePanel } from '../../../../Hooks/useSidePanel';
import { visibleFamiliesQuery } from '../../../../Model/Data';
import { ArrangementPolicySidePanel, FunctionAssignmentPolicySidePanel } from './sidePanels';
import { FunctionAssignmentPoliciesTable } from './tables';
import { clonePolicyWithCasePolicy, nextCopyName, personOptionsFromFamilies, removeByName, upsertByName } from './policyUtils';
import { DeleteRowAction, DuplicateRowAction, EditableActions, SectionHeader } from './sharedUi';
import { ArrangementPolicyDetails } from './ArrangementPolicyDetails';

export function CasePolicyTab({
  policy,
  locationRoles,
  onPolicyChange,
}: {
  policy: EffectiveLocationPolicy;
  locationRoles: string[];
  onPolicyChange: (policy: EffectiveLocationPolicy) => void;
}) {
  const casePolicy = policy.referralPolicy;
  const arrangementPolicies = casePolicy?.arrangementPolicies ?? [];
  const actionNames = Object.keys(policy.actionDefinitions ?? {});
  const volunteerRoles = Object.keys(
    policy.volunteerPolicy?.volunteerRoles ?? {}
  );
  const volunteerFamilyRoles = Object.keys(
    policy.volunteerPolicy?.volunteerFamilyRoles ?? {}
  );
  const visibleFamilies = useRecoilValue(visibleFamiliesQuery);
  const personOptions = useMemo(
    () => personOptionsFromFamilies(visibleFamilies),
    [visibleFamilies]
  );
  const {
    SidePanel: FunctionAssignmentPanel,
    openSidePanel: openFunctionAssignmentPanel,
    closeSidePanel: closeFunctionAssignmentPanel,
  } = useSidePanel();
  const {
    SidePanel: ArrangementPolicyPanel,
    openSidePanel: openArrangementPolicyPanel,
    closeSidePanel: closeArrangementPolicyPanel,
  } = useSidePanel();
  const [workingFunctionAssignmentPolicy, setWorkingFunctionAssignmentPolicy] =
    useState<FunctionAssignmentPolicy | undefined>();
  const [workingArrangementPolicy, setWorkingArrangementPolicy] = useState<
    ArrangementPolicy | undefined
  >();

  function updateCasePolicy(update: Partial<V1CasePolicy>) {
    onPolicyChange(
      clonePolicyWithCasePolicy(
        policy,
        new V1CasePolicy({
          ...casePolicy,
          ...update,
        })
      )
    );
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
                        actionNames={actionNames}
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
          onClose={closeFunctionAssignmentPanel}
          onSave={(previousRole, assignmentPolicy) => {
            updateCasePolicy({
              functionAssignmentPolicies: upsertByName(
                casePolicy?.functionAssignmentPolicies ?? [],
                previousRole,
                assignmentPolicy,
                (item) => item.assignmentRole
              ),
            });
            closeFunctionAssignmentPanel();
          }}
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
          onClose={closeArrangementPolicyPanel}
          onSave={(previousType, arrangement) => {
            updateCasePolicy({
              arrangementPolicies: upsertByName(
                arrangementPolicies,
                previousType,
                arrangement,
                (item) => item.arrangementType
              ),
            });
            closeArrangementPolicyPanel();
          }}
        />
      </ArrangementPolicyPanel>
    </Box>
  );
}
