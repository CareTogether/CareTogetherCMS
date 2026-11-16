import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Stack,
  Typography,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { ReactNode, useState } from 'react';
import {
  MonitoringRequirement,
  RequirementDefinition,
} from '../../../../GeneratedClient';
import { useSidePanel } from '../../../../Hooks/useSidePanel';
import {
  MonitoringRequirementSidePanel,
  RequirementSidePanel,
} from './sidePanels';
import { nextCopyName, removeByName, upsertByName } from './policyUtils';
import { EditableActions } from './sharedUi';
import { MonitoringRequirementsTable, RequirementsTable } from './tables';
import type { RequirementLists } from './requirementListsModel';

function monitoringRequirementName(requirement: MonitoringRequirement) {
  return requirement.action?.actionName ?? '';
}

function requirementName(requirement: RequirementDefinition) {
  return requirement.actionName;
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
        requirements.map(requirementName)
      ),
    }),
    requirementName
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

// Plain sections are used when the editor sits inside another accordion
// (function variants), accordions when it is at the top of a policy.
function RequirementSection({
  title,
  plain,
  children,
}: {
  title: string;
  plain: boolean;
  children: ReactNode;
}) {
  if (plain) {
    return (
      <Stack spacing={1}>
        <Typography variant="subtitle2">{title}</Typography>
        {children}
      </Stack>
    );
  }

  return (
    <Accordion variant="outlined">
      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
        <Typography>{title}</Typography>
      </AccordionSummary>
      <AccordionDetails>{children}</AccordionDetails>
    </Accordion>
  );
}

export function RequirementListsEditor({
  lists,
  actionNames,
  plain = false,
  onChange,
}: {
  lists: RequirementLists;
  actionNames: string[];
  plain?: boolean;
  onChange: (lists: RequirementLists) => Promise<boolean>;
}) {
  const {
    SidePanel: SetupRequirementPanel,
    openSidePanel: openSetupRequirementPanel,
    closeSidePanel: closeSetupRequirementPanel,
  } = useSidePanel({ className: 'ph-unmask' });
  const {
    SidePanel: MonitoringRequirementPanel,
    openSidePanel: openMonitoringRequirementPanel,
    closeSidePanel: closeMonitoringRequirementPanel,
  } = useSidePanel({ className: 'ph-unmask' });
  const {
    SidePanel: CloseoutRequirementPanel,
    openSidePanel: openCloseoutRequirementPanel,
    closeSidePanel: closeCloseoutRequirementPanel,
  } = useSidePanel({ className: 'ph-unmask' });
  const [workingSetupRequirement, setWorkingSetupRequirement] = useState<
    RequirementDefinition | undefined
  >();
  const [workingMonitoringRequirement, setWorkingMonitoringRequirement] =
    useState<MonitoringRequirement | undefined>();
  const [workingCloseoutRequirement, setWorkingCloseoutRequirement] = useState<
    RequirementDefinition | undefined
  >();

  function update(change: Partial<RequirementLists>) {
    return onChange({ ...lists, ...change });
  }

  async function updateAndClose(
    change: Partial<RequirementLists>,
    closePanel: () => void
  ) {
    const saved = await update(change);
    if (saved) closePanel();
    return saved;
  }

  return (
    <Stack spacing={2}>
      <RequirementSection title="Required Setup Actions" plain={plain}>
        <Stack spacing={2}>
          <EditableActions
            onAdd={() => {
              setWorkingSetupRequirement(undefined);
              openSetupRequirementPanel();
            }}
          />
          <RequirementsTable
            requirements={lists.setup}
            emptyLabel="No setup requirements configured."
            onEdit={(requirement) => {
              setWorkingSetupRequirement(requirement);
              openSetupRequirementPanel();
            }}
            onDuplicate={(requirement) =>
              update({ setup: duplicateRequirement(lists.setup, requirement) })
            }
            onDelete={(requirement) =>
              update({
                setup: removeByName(
                  lists.setup,
                  requirement.actionName,
                  requirementName
                ),
              })
            }
          />
        </Stack>
      </RequirementSection>

      <RequirementSection title="Required Monitoring Actions" plain={plain}>
        <Stack spacing={2}>
          <EditableActions
            onAdd={() => {
              setWorkingMonitoringRequirement(undefined);
              openMonitoringRequirementPanel();
            }}
          />
          <MonitoringRequirementsTable
            requirements={lists.monitoring}
            onEdit={(requirement) => {
              setWorkingMonitoringRequirement(requirement);
              openMonitoringRequirementPanel();
            }}
            onDuplicate={(requirement) =>
              update({
                monitoring: duplicateMonitoringRequirement(
                  lists.monitoring,
                  requirement
                ),
              })
            }
            onDelete={(requirement) =>
              update({
                monitoring: removeByName(
                  lists.monitoring,
                  monitoringRequirementName(requirement),
                  monitoringRequirementName
                ),
              })
            }
          />
        </Stack>
      </RequirementSection>

      <RequirementSection title="Required Closeout Actions" plain={plain}>
        <Stack spacing={2}>
          <EditableActions
            onAdd={() => {
              setWorkingCloseoutRequirement(undefined);
              openCloseoutRequirementPanel();
            }}
          />
          <RequirementsTable
            requirements={lists.closeout}
            emptyLabel="No closeout requirements configured."
            onEdit={(requirement) => {
              setWorkingCloseoutRequirement(requirement);
              openCloseoutRequirementPanel();
            }}
            onDuplicate={(requirement) =>
              update({
                closeout: duplicateRequirement(lists.closeout, requirement),
              })
            }
            onDelete={(requirement) =>
              update({
                closeout: removeByName(
                  lists.closeout,
                  requirement.actionName,
                  requirementName
                ),
              })
            }
          />
        </Stack>
      </RequirementSection>

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
          existingActionNames={lists.setup.map(requirementName)}
          onClose={closeSetupRequirementPanel}
          onSave={(previousName, requirement) =>
            updateAndClose(
              {
                setup: upsertByName(
                  lists.setup,
                  previousName,
                  requirement,
                  requirementName
                ),
              },
              closeSetupRequirementPanel
            )
          }
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
          existingActionNames={lists.monitoring.map(monitoringRequirementName)}
          onClose={closeMonitoringRequirementPanel}
          onSave={(previousName, requirement) =>
            updateAndClose(
              {
                monitoring: upsertByName(
                  lists.monitoring,
                  previousName,
                  requirement,
                  monitoringRequirementName
                ),
              },
              closeMonitoringRequirementPanel
            )
          }
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
          existingActionNames={lists.closeout.map(requirementName)}
          onClose={closeCloseoutRequirementPanel}
          onSave={(previousName, requirement) =>
            updateAndClose(
              {
                closeout: upsertByName(
                  lists.closeout,
                  previousName,
                  requirement,
                  requirementName
                ),
              },
              closeCloseoutRequirementPanel
            )
          }
        />
      </CloseoutRequirementPanel>
    </Stack>
  );
}
