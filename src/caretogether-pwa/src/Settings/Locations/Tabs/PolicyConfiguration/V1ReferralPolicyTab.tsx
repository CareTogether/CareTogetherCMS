import { Accordion, AccordionDetails, AccordionSummary, Box, Stack, Typography } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { useMemo, useState } from 'react';
import { useRecoilValue } from 'recoil';
import { CustomField, EffectiveLocationPolicy, FunctionAssignmentPolicy, RequirementDefinition, V1CasePolicy, V1ReferralPolicy } from '../../../../GeneratedClient';
import { useSidePanel } from '../../../../Hooks/useSidePanel';
import { visibleFamiliesQuery } from '../../../../Model/Data';
import { CustomFieldSidePanel, FunctionAssignmentPolicySidePanel, RequirementSidePanel } from './sidePanels';
import { CustomFieldsTable } from './CustomFieldsTable';
import { FunctionAssignmentPoliciesTable, RequirementsTable } from './tables';
import { clonePolicyWithCasePolicy, clonePolicyWithV1ReferralPolicy, nextCopyName, personOptionsFromFamilies, removeByName, removeCustomField, upsertByName, upsertCustomField } from './policyUtils';
import { EditableActions, SectionHeader } from './sharedUi';

export function V1ReferralPolicyTab({
  policy,
  locationRoles,
  onPolicyChange,
}: {
  policy: EffectiveLocationPolicy;
  locationRoles: string[];
  onPolicyChange: (policy: EffectiveLocationPolicy) => void;
}) {
  const casePolicy = policy.referralPolicy;
  const intakeRequirements =
    casePolicy?.intakeRequirements ??
    casePolicy?.intakeRequirements_PRE_MIGRATION;
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
    SidePanel: RequirementPanel,
    openSidePanel: openRequirementPanel,
    closeSidePanel: closeRequirementPanel,
  } = useSidePanel();
  const {
    SidePanel: CustomFieldPanel,
    openSidePanel: openCustomFieldPanel,
    closeSidePanel: closeCustomFieldPanel,
  } = useSidePanel();
  const {
    SidePanel: FunctionAssignmentPanel,
    openSidePanel: openFunctionAssignmentPanel,
    closeSidePanel: closeFunctionAssignmentPanel,
  } = useSidePanel();
  const [workingRequirement, setWorkingRequirement] = useState<
    RequirementDefinition | undefined
  >();
  const [workingCustomField, setWorkingCustomField] = useState<
    CustomField | undefined
  >();
  const [workingFunctionAssignmentPolicy, setWorkingFunctionAssignmentPolicy] =
    useState<FunctionAssignmentPolicy | undefined>();
  const functionAssignmentPolicies =
    policy.v1ReferralPolicy?.functionAssignmentPolicies ?? [];

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

  function duplicateReferralCustomField(field: CustomField) {
    updateCasePolicy({
      customFields: upsertCustomField(
        casePolicy?.customFields,
        undefined,
        new CustomField({
          ...field,
          name: nextCopyName(
            field.name,
            casePolicy?.customFields?.map((item) => item.name) ?? []
          ),
        })
      ),
    });
  }

  function deleteReferralIntakeRequirement(requirement: RequirementDefinition) {
    updateCasePolicy({
      intakeRequirements: removeByName(
        casePolicy?.intakeRequirements,
        requirement.actionName,
        (item) => item.actionName
      ),
    });
  }

  function deleteReferralCustomField(field: CustomField) {
    updateCasePolicy({
      customFields: removeCustomField(casePolicy?.customFields, field.name),
    });
  }

  function duplicateReferralFunctionAssignmentPolicy(
    assignmentPolicy: FunctionAssignmentPolicy
  ) {
    const existingRoles = functionAssignmentPolicies.map(
      (item) => item.assignmentRole
    );
    onPolicyChange(
      clonePolicyWithV1ReferralPolicy(
        policy,
        new V1ReferralPolicy({
          ...policy.v1ReferralPolicy,
          functionAssignmentPolicies: upsertByName(
            functionAssignmentPolicies,
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
        })
      )
    );
  }

  function deleteReferralFunctionAssignmentPolicy(
    assignmentPolicy: FunctionAssignmentPolicy
  ) {
    onPolicyChange(
      clonePolicyWithV1ReferralPolicy(
        policy,
        new V1ReferralPolicy({
          ...policy.v1ReferralPolicy,
          functionAssignmentPolicies: removeByName(
            functionAssignmentPolicies,
            assignmentPolicy.assignmentRole,
            (item) => item.assignmentRole
          ),
        })
      )
    );
  }

  return (
    <Box>
      <SectionHeader title="Referral Policies" />

      <Stack spacing={2}>
        <Accordion defaultExpanded variant="outlined">
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography>Intake Requirements</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Stack spacing={2}>
              <EditableActions
                onAdd={() => {
                  setWorkingRequirement(undefined);
                  openRequirementPanel();
                }}
              />
              <RequirementsTable
                requirements={intakeRequirements}
                emptyLabel="No intake requirements configured."
                onEdit={(requirement) => {
                  setWorkingRequirement(requirement);
                  openRequirementPanel();
                }}
                onDelete={deleteReferralIntakeRequirement}
              />
            </Stack>
          </AccordionDetails>
        </Accordion>

        <Accordion variant="outlined">
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography>Custom Fields</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Stack spacing={2}>
              <EditableActions
                onAdd={() => {
                  setWorkingCustomField(undefined);
                  openCustomFieldPanel();
                }}
              />
              <CustomFieldsTable
                fields={casePolicy?.customFields}
                onEdit={(field) => {
                  setWorkingCustomField(field);
                  openCustomFieldPanel();
                }}
                onDuplicate={duplicateReferralCustomField}
                onDelete={deleteReferralCustomField}
              />
            </Stack>
          </AccordionDetails>
        </Accordion>

        <Accordion variant="outlined">
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
                policies={functionAssignmentPolicies}
                emptyLabel="No referral function assignment policies configured."
                onEdit={(assignmentPolicy) => {
                  setWorkingFunctionAssignmentPolicy(assignmentPolicy);
                  openFunctionAssignmentPanel();
                }}
                onDuplicate={duplicateReferralFunctionAssignmentPolicy}
                onDelete={deleteReferralFunctionAssignmentPolicy}
              />
            </Stack>
          </AccordionDetails>
        </Accordion>
      </Stack>

      <RequirementPanel>
        <RequirementSidePanel
          key={
            workingRequirement?.actionName ?? 'new-referral-intake-requirement'
          }
          title={
            workingRequirement
              ? 'Edit Referral Policies Intake Requirement'
              : 'Add Referral Policies Intake Requirement'
          }
          requirement={workingRequirement}
          actionNames={actionNames}
          existingActionNames={
            intakeRequirements?.map((requirement) => requirement.actionName) ??
            []
          }
          onClose={closeRequirementPanel}
          onSave={(previousName, requirement) => {
            updateCasePolicy({
              intakeRequirements: upsertByName(
                casePolicy?.intakeRequirements ?? [],
                previousName,
                requirement,
                (item) => item.actionName
              ),
            });
            closeRequirementPanel();
          }}
        />
      </RequirementPanel>

      <CustomFieldPanel>
        <CustomFieldSidePanel
          key={workingCustomField?.name ?? 'new-referral-custom-field'}
          title={
            workingCustomField
              ? 'Edit Referral Policies Custom Field'
              : 'Add Referral Policies Custom Field'
          }
          field={workingCustomField}
          existingNames={
            casePolicy?.customFields?.map((field) => field.name) ?? []
          }
          onClose={closeCustomFieldPanel}
          onSave={(previousName, field) => {
            updateCasePolicy({
              customFields: upsertCustomField(
                casePolicy?.customFields,
                previousName,
                field
              ),
            });
            closeCustomFieldPanel();
          }}
        />
      </CustomFieldPanel>

      <FunctionAssignmentPanel>
        <FunctionAssignmentPolicySidePanel
          key={
            workingFunctionAssignmentPolicy?.assignmentRole ??
            'new-referral-assignment-policy'
          }
          title={
            workingFunctionAssignmentPolicy
              ? 'Edit Referral Policies Function Assignment Policy'
              : 'Add Referral Policies Function Assignment Policy'
          }
          policy={workingFunctionAssignmentPolicy}
          existingAssignmentRoles={functionAssignmentPolicies.map(
            (item) => item.assignmentRole
          )}
          locationRoles={locationRoles}
          volunteerRoles={volunteerRoles}
          volunteerFamilyRoles={volunteerFamilyRoles}
          personOptions={personOptions}
          onClose={closeFunctionAssignmentPanel}
          onSave={(previousRole, assignmentPolicy) => {
            onPolicyChange(
              clonePolicyWithV1ReferralPolicy(
                policy,
                new V1ReferralPolicy({
                  ...policy.v1ReferralPolicy,
                  functionAssignmentPolicies: upsertByName(
                    functionAssignmentPolicies,
                    previousRole,
                    assignmentPolicy,
                    (item) => item.assignmentRole
                  ),
                })
              )
            );
            closeFunctionAssignmentPanel();
          }}
        />
      </FunctionAssignmentPanel>
    </Box>
  );
}

