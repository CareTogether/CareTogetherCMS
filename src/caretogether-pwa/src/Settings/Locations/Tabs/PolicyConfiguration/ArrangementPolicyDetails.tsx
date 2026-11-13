import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { useState } from 'react';
import {
  ArrangementFunction,
  ArrangementPolicy,
  FunctionRequirement,
} from '../../../../GeneratedClient';
import { useAdministrationSidePanel } from './usePolicyAdministrationPanels';
import type { PersonOption } from './types';
import { ArrangementFunctionSidePanel } from './sidePanels';
import {
  enumName,
  nextCopyName,
  removeByName,
  summarizeCount,
  upsertByName,
} from './policyUtils';
import {
  DeleteRowAction,
  DuplicateRowAction,
  EditableActions,
  EmptyRow,
  ValuesText,
} from './sharedUi';
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

export function ArrangementPolicyDetails({
  arrangement,
  volunteerRoles,
  volunteerFamilyRoles,
  personOptions,
  onArrangementChange,
}: {
  arrangement: ArrangementPolicy;
  volunteerRoles: string[];
  volunteerFamilyRoles: string[];
  personOptions: PersonOption[];
  onArrangementChange: (arrangement: ArrangementPolicy) => Promise<boolean>;
}) {
  const {
    SidePanel: ArrangementFunctionPanel,
    openSidePanel: openArrangementFunctionPanel,
    closeSidePanel: closeArrangementFunctionPanel,
    requestCloseSidePanel: requestCloseArrangementFunctionPanel,
  } = useAdministrationSidePanel({
    className: 'ph-unmask',
    protectNavigation: true,
  });
  const [workingArrangementFunction, setWorkingArrangementFunction] = useState<
    ArrangementFunction | undefined
  >();
  const arrangementFunctions = arrangement.arrangementFunctions ?? [];
  function updateArrangement(update: Partial<ArrangementPolicy>) {
    return onArrangementChange(
      new ArrangementPolicy({ ...arrangement, ...update })
    );
  }
  async function updateArrangementAndClose(
    update: Partial<ArrangementPolicy>,
    closePanel: () => void
  ) {
    const saved = await updateArrangement(update);
    if (saved) closePanel();
    return saved;
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
          onClose={requestCloseArrangementFunctionPanel}
          onSave={(previousName, arrangementFunction) =>
            updateArrangementAndClose(
              {
                arrangementFunctions: upsertByName(
                  arrangementFunctions,
                  previousName,
                  arrangementFunction,
                  (item) => item.functionName
                ),
              },
              closeArrangementFunctionPanel
            )
          }
        />
      </ArrangementFunctionPanel>
    </Stack>
  );
}
