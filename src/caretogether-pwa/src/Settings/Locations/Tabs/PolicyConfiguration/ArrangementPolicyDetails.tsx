import { Accordion, AccordionDetails, AccordionSummary, Stack, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { useState } from 'react';
import { ArrangementFunction, ArrangementPolicy, FunctionRequirement, MonitoringRequirement, RequirementDefinition } from '../../../../GeneratedClient';
import { useSidePanel } from '../../../../Hooks/useSidePanel';
import type { PersonOption } from './types';
import { ArrangementFunctionSidePanel, MonitoringRequirementSidePanel, RequirementSidePanel } from './sidePanels';
import { enumName, nextCopyName, removeByName, summarizeCount, upsertByName } from './policyUtils';
import { DeleteRowAction, DuplicateRowAction, EditableActions, EmptyRow, ValuesText } from './sharedUi';
import { MonitoringRequirementsTable, RequirementsTable } from './tables';

function ArrangementFunctionSummary({
  arrangementFunction,
}: {
  arrangementFunction: ArrangementFunction;
}) {
  const inheritsEligibility =
    typeof arrangementFunction.eligibleIndividualVolunteerRoles ===
      'undefined' &&
    typeof arrangementFunction.eligibleVolunteerFamilyRoles === 'undefined' &&
    typeof arrangementFunction.eligiblePeople === 'undefined';

  return (
    <Stack spacing={0.5}>
      <Typography variant="body2">
        {arrangementFunction.functionName} -{' '}
        {enumName(FunctionRequirement, arrangementFunction.requirement)}
      </Typography>
      <Typography variant="body2" color="text.secondary">
        {inheritsEligibility ? 'Inherited eligibility' : 'Override eligibility'}{' '}
        - {summarizeCount(arrangementFunction.variants?.length ?? 0, 'variant')}
      </Typography>
    </Stack>
  );
}

function monitoringRequirementName(requirement: MonitoringRequirement) {
  return requirement.action?.actionName ?? '';
}

export function ArrangementPolicyDetails({
  arrangement,
  actionNames,
  volunteerRoles,
  volunteerFamilyRoles,
  personOptions,
  onArrangementChange,
}: {
  arrangement: ArrangementPolicy;
  actionNames: string[];
  volunteerRoles: string[];
  volunteerFamilyRoles: string[];
  personOptions: PersonOption[];
  onArrangementChange: (arrangement: ArrangementPolicy) => void;
}) {
  const {
    SidePanel: SetupRequirementPanel,
    openSidePanel: openSetupRequirementPanel,
    closeSidePanel: closeSetupRequirementPanel,
  } = useSidePanel();
  const {
    SidePanel: MonitoringRequirementPanel,
    openSidePanel: openMonitoringRequirementPanel,
    closeSidePanel: closeMonitoringRequirementPanel,
  } = useSidePanel();
  const {
    SidePanel: CloseoutRequirementPanel,
    openSidePanel: openCloseoutRequirementPanel,
    closeSidePanel: closeCloseoutRequirementPanel,
  } = useSidePanel();
  const {
    SidePanel: ArrangementFunctionPanel,
    openSidePanel: openArrangementFunctionPanel,
    closeSidePanel: closeArrangementFunctionPanel,
  } = useSidePanel();
  const [workingSetupRequirement, setWorkingSetupRequirement] = useState<
    RequirementDefinition | undefined
  >();
  const [workingMonitoringRequirement, setWorkingMonitoringRequirement] =
    useState<MonitoringRequirement | undefined>();
  const [workingCloseoutRequirement, setWorkingCloseoutRequirement] = useState<
    RequirementDefinition | undefined
  >();
  const [workingArrangementFunction, setWorkingArrangementFunction] = useState<
    ArrangementFunction | undefined
  >();
  const setupActions =
    arrangement.requiredSetupActions ??
    arrangement.requiredSetupActions_PRE_MIGRATION;
  const monitoringActions =
    arrangement.requiredMonitoringActionsNew ??
    arrangement.requiredMonitoringActions_PRE_MIGRATION;
  const closeoutActions =
    arrangement.requiredCloseoutActions ??
    arrangement.requiredCloseoutActionNames_PRE_MIGRATION;
  const arrangementFunctions = arrangement.arrangementFunctions ?? [];

  function updateArrangement(update: Partial<ArrangementPolicy>) {
    onArrangementChange(new ArrangementPolicy({ ...arrangement, ...update }));
  }

  function duplicateRequirement(
    requirements: RequirementDefinition[],
    requirement: RequirementDefinition
  ) {
    return upsertByName(
      requirements,
      undefined,
      new RequirementDefinition({
        ...requirement,
        actionName: nextCopyName(
          requirement.actionName,
          requirements.map((item) => item.actionName)
        ),
      }),
      (item) => item.actionName
    );
  }

  function duplicateMonitoringRequirement(
    requirements: MonitoringRequirement[],
    requirement: MonitoringRequirement
  ) {
    return upsertByName(
      requirements,
      undefined,
      new MonitoringRequirement({
        ...requirement,
        action: new RequirementDefinition({
          ...requirement.action,
          actionName: nextCopyName(
            monitoringRequirementName(requirement),
            requirements.map(monitoringRequirementName)
          ),
        }),
      }),
      monitoringRequirementName
    );
  }

  function duplicateArrangementFunction(
    arrangementFunction: ArrangementFunction
  ) {
    updateArrangement({
      arrangementFunctions: upsertByName(
        arrangementFunctions,
        undefined,
        new ArrangementFunction({
          ...arrangementFunction,
          functionName: nextCopyName(
            arrangementFunction.functionName,
            arrangementFunctions.map((item) => item.functionName)
          ),
        }),
        (item) => item.functionName
      ),
    });
  }

  return (
    <Stack spacing={2}>
      <Accordion variant="outlined">
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography>Required Setup Actions</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Stack spacing={2}>
            <EditableActions
              onAdd={() => {
                setWorkingSetupRequirement(undefined);
                openSetupRequirementPanel();
              }}
            />
            <RequirementsTable
              requirements={setupActions}
              emptyLabel="No setup requirements configured."
              onEdit={(requirement) => {
                setWorkingSetupRequirement(requirement);
                openSetupRequirementPanel();
              }}
              onDuplicate={(requirement) =>
                updateArrangement({
                  requiredSetupActions: duplicateRequirement(
                    setupActions,
                    requirement
                  ),
                })
              }
              onDelete={(requirement) =>
                updateArrangement({
                  requiredSetupActions: removeByName(
                    setupActions,
                    requirement.actionName,
                    (item) => item.actionName
                  ),
                })
              }
            />
          </Stack>
        </AccordionDetails>
      </Accordion>

      <Accordion variant="outlined">
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography>Required Monitoring Actions</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Stack spacing={2}>
            <EditableActions
              onAdd={() => {
                setWorkingMonitoringRequirement(undefined);
                openMonitoringRequirementPanel();
              }}
            />
            <MonitoringRequirementsTable
              requirements={monitoringActions}
              onEdit={(requirement) => {
                setWorkingMonitoringRequirement(requirement);
                openMonitoringRequirementPanel();
              }}
              onDuplicate={(requirement) =>
                updateArrangement({
                  requiredMonitoringActionsNew:
                    duplicateMonitoringRequirement(
                      monitoringActions,
                      requirement
                    ),
                })
              }
              onDelete={(requirement) =>
                updateArrangement({
                  requiredMonitoringActionsNew: removeByName(
                    monitoringActions,
                    monitoringRequirementName(requirement),
                    monitoringRequirementName
                  ),
                })
              }
            />
          </Stack>
        </AccordionDetails>
      </Accordion>

      <Accordion variant="outlined">
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography>Required Closeout Actions</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Stack spacing={2}>
            <EditableActions
              onAdd={() => {
                setWorkingCloseoutRequirement(undefined);
                openCloseoutRequirementPanel();
              }}
            />
            <RequirementsTable
              requirements={closeoutActions}
              emptyLabel="No closeout requirements configured."
              onEdit={(requirement) => {
                setWorkingCloseoutRequirement(requirement);
                openCloseoutRequirementPanel();
              }}
              onDuplicate={(requirement) =>
                updateArrangement({
                  requiredCloseoutActions: duplicateRequirement(
                    closeoutActions,
                    requirement
                  ),
                })
              }
              onDelete={(requirement) =>
                updateArrangement({
                  requiredCloseoutActions: removeByName(
                    closeoutActions,
                    requirement.actionName,
                    (item) => item.actionName
                  ),
                })
              }
            />
          </Stack>
        </AccordionDetails>
      </Accordion>

      <Accordion variant="outlined">
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography>Arrangement Functions</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Stack spacing={2}>
            <EditableActions
              onAdd={() => {
                setWorkingArrangementFunction(undefined);
                openArrangementFunctionPanel();
              }}
            />
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Function</TableCell>
                    <TableCell>Eligibility</TableCell>
                    <TableCell>Variants</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {arrangementFunctions.length === 0 ? (
                    <EmptyRow
                      colSpan={4}
                      label="No arrangement functions configured."
                    />
                  ) : (
                    arrangementFunctions.map((arrangementFunction) => (
                      <TableRow
                        key={arrangementFunction.functionName}
                        hover
                        sx={{ cursor: 'pointer' }}
                        onClick={() => {
                          setWorkingArrangementFunction(arrangementFunction);
                          openArrangementFunctionPanel();
                        }}
                      >
                        <TableCell>
                          <ArrangementFunctionSummary
                            arrangementFunction={arrangementFunction}
                          />
                        </TableCell>
                        <TableCell>
                          <ValuesText
                            values={[
                              ...(arrangementFunction.eligibleIndividualVolunteerRoles ??
                                []),
                              ...(arrangementFunction.eligibleVolunteerFamilyRoles ??
                                []),
                            ]}
                          />
                        </TableCell>
                        <TableCell>
                          <ValuesText
                            values={arrangementFunction.variants?.map(
                              (variant) => variant.variantName
                            )}
                          />
                        </TableCell>
                        <TableCell align="right">
                          <Stack
                            direction="row"
                            spacing={0.5}
                            sx={{ justifyContent: 'flex-end' }}
                          >
                            <DuplicateRowAction
                              label={arrangementFunction.functionName}
                              onClick={() =>
                                duplicateArrangementFunction(
                                  arrangementFunction
                                )
                              }
                            />
                            <DeleteRowAction
                              label={arrangementFunction.functionName}
                              onClick={() =>
                                updateArrangement({
                                  arrangementFunctions: removeByName(
                                    arrangementFunctions,
                                    arrangementFunction.functionName,
                                    (item) => item.functionName
                                  ),
                                })
                              }
                            />
                          </Stack>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Stack>
        </AccordionDetails>
      </Accordion>

      <SetupRequirementPanel>
        <RequirementSidePanel
          key={workingSetupRequirement?.actionName ?? 'new-setup-requirement'}
          title={
            workingSetupRequirement
              ? 'Edit Required Setup Action'
              : 'Add Required Setup Action'
          }
          requirement={workingSetupRequirement}
          actionNames={actionNames}
          existingActionNames={setupActions.map((item) => item.actionName)}
          onClose={closeSetupRequirementPanel}
          onSave={(previousName, requirement) => {
            updateArrangement({
              requiredSetupActions: upsertByName(
                setupActions,
                previousName,
                requirement,
                (item) => item.actionName
              ),
            });
            closeSetupRequirementPanel();
          }}
        />
      </SetupRequirementPanel>

      <MonitoringRequirementPanel>
        <MonitoringRequirementSidePanel
          key={
            workingMonitoringRequirement?.action?.actionName ??
            'new-monitoring-requirement'
          }
          title={
            workingMonitoringRequirement
              ? 'Edit Required Monitoring Action'
              : 'Add Required Monitoring Action'
          }
          requirement={workingMonitoringRequirement}
          actionNames={actionNames}
          existingActionNames={monitoringActions.map(monitoringRequirementName)}
          onClose={closeMonitoringRequirementPanel}
          onSave={(previousName, requirement) => {
            updateArrangement({
              requiredMonitoringActionsNew: upsertByName(
                monitoringActions,
                previousName,
                requirement,
                monitoringRequirementName
              ),
            });
            closeMonitoringRequirementPanel();
          }}
        />
      </MonitoringRequirementPanel>

      <CloseoutRequirementPanel>
        <RequirementSidePanel
          key={
            workingCloseoutRequirement?.actionName ?? 'new-closeout-requirement'
          }
          title={
            workingCloseoutRequirement
              ? 'Edit Required Closeout Action'
              : 'Add Required Closeout Action'
          }
          requirement={workingCloseoutRequirement}
          actionNames={actionNames}
          existingActionNames={closeoutActions.map((item) => item.actionName)}
          onClose={closeCloseoutRequirementPanel}
          onSave={(previousName, requirement) => {
            updateArrangement({
              requiredCloseoutActions: upsertByName(
                closeoutActions,
                previousName,
                requirement,
                (item) => item.actionName
              ),
            });
            closeCloseoutRequirementPanel();
          }}
        />
      </CloseoutRequirementPanel>

      <ArrangementFunctionPanel>
        <ArrangementFunctionSidePanel
          key={
            workingArrangementFunction?.functionName ??
            'new-arrangement-function'
          }
          arrangementFunction={workingArrangementFunction}
          existingFunctionNames={arrangementFunctions.map(
            (item) => item.functionName
          )}
          volunteerRoles={volunteerRoles}
          volunteerFamilyRoles={volunteerFamilyRoles}
          personOptions={personOptions}
          onClose={closeArrangementFunctionPanel}
          onSave={(previousName, arrangementFunction) => {
            updateArrangement({
              arrangementFunctions: upsertByName(
                arrangementFunctions,
                previousName,
                arrangementFunction,
                (item) => item.functionName
              ),
            });
            closeArrangementFunctionPanel();
          }}
        />
      </ArrangementFunctionPanel>
    </Stack>
  );
}
