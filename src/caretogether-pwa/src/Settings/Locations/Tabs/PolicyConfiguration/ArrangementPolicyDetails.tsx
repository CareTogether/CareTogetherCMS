import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Button,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import { Edit as EditIcon } from '@mui/icons-material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { useState } from 'react';
import {
  ArrangementFunction,
  ArrangementFunctionVariant,
  ArrangementPolicy,
  FunctionRequirement,
} from '../../../../GeneratedClient';
import { useSidePanel } from '../../../../Hooks/useSidePanel';
import type { PersonOption } from './types';
import {
  ArrangementFunctionSidePanel,
  ArrangementFunctionVariantSidePanel,
} from './sidePanels';
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
import { RequirementListsEditor } from './RequirementListsEditor';
import {
  arrangementRequirementLists,
  newVariant,
  variantRequirementLists,
  withArrangementRequirementLists,
  withVariantRequirementLists,
} from './requirementListsModel';

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
  onArrangementChange: (arrangement: ArrangementPolicy) => Promise<boolean>;
}) {
  const {
    SidePanel: ArrangementFunctionPanel,
    openSidePanel: openArrangementFunctionPanel,
    closeSidePanel: closeArrangementFunctionPanel,
  } = useSidePanel({ className: 'ph-unmask' });
  const {
    SidePanel: VariantPanel,
    openSidePanel: openVariantPanel,
    closeSidePanel: closeVariantPanel,
  } = useSidePanel({ className: 'ph-unmask' });
  const [workingArrangementFunction, setWorkingArrangementFunction] = useState<
    ArrangementFunction | undefined
  >();
  const [workingVariant, setWorkingVariant] = useState<
    | { arrangementFunction: ArrangementFunction; variantName?: string }
    | undefined
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

  function updateVariants(
    arrangementFunction: ArrangementFunction,
    variants: ArrangementFunctionVariant[]
  ) {
    return updateArrangement({
      arrangementFunctions: upsertByName(
        arrangementFunctions,
        arrangementFunction.functionName,
        new ArrangementFunction({ ...arrangementFunction, variants }),
        (item) => item.functionName
      ),
    });
  }

  function upsertVariant(
    arrangementFunction: ArrangementFunction,
    previousName: string | undefined,
    variant: ArrangementFunctionVariant
  ) {
    return updateVariants(
      arrangementFunction,
      upsertByName(
        arrangementFunction.variants,
        previousName,
        variant,
        (item) => item.variantName
      )
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

  const workingVariantFunction = workingVariant
    ? arrangementFunctions.find(
        (item) =>
          item.functionName === workingVariant.arrangementFunction.functionName
      )
    : undefined;

  return (
    <Stack spacing={2}>
      <RequirementListsEditor
        lists={arrangementRequirementLists(arrangement)}
        actionNames={actionNames}
        onChange={(lists) =>
          onArrangementChange(
            withArrangementRequirementLists(arrangement, lists)
          )
        }
      />

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

      <Accordion variant="outlined">
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography>Function Variants</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Stack spacing={3}>
            {arrangementFunctions.length === 0 && (
              <Typography variant="body2" color="text.secondary">
                Add an arrangement function to configure its variants.
              </Typography>
            )}
            {arrangementFunctions.map((arrangementFunction) => {
              const variants = arrangementFunction.variants ?? [];

              return (
                <Stack key={arrangementFunction.functionName} spacing={1.5}>
                  <Stack
                    direction="row"
                    spacing={1}
                    sx={{
                      alignItems: 'center',
                      justifyContent: 'space-between',
                    }}
                  >
                    <Typography variant="subtitle1">
                      {arrangementFunction.functionName}
                    </Typography>
                    <EditableActions
                      onAdd={() => {
                        setWorkingVariant({ arrangementFunction });
                        openVariantPanel();
                      }}
                    />
                  </Stack>
                  {variants.length === 0 && (
                    <Typography variant="body2" color="text.secondary">
                      No variants configured.
                    </Typography>
                  )}
                  {variants.map((variant) => (
                    <Accordion key={variant.variantName} variant="outlined">
                      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                        <Typography>{variant.variantName}</Typography>
                      </AccordionSummary>
                      <AccordionDetails>
                        <Stack spacing={2}>
                          <Stack
                            direction="row"
                            spacing={0.5}
                            sx={{ justifyContent: 'flex-end' }}
                          >
                            <Button
                              size="small"
                              startIcon={<EditIcon />}
                              onClick={() => {
                                setWorkingVariant({
                                  arrangementFunction,
                                  variantName: variant.variantName,
                                });
                                openVariantPanel();
                              }}
                            >
                              Rename
                            </Button>
                            <DeleteRowAction
                              label={variant.variantName}
                              onClick={() =>
                                updateVariants(
                                  arrangementFunction,
                                  removeByName(
                                    variants,
                                    variant.variantName,
                                    (item) => item.variantName
                                  )
                                )
                              }
                            />
                          </Stack>
                          <RequirementListsEditor
                            plain
                            lists={variantRequirementLists(variant)}
                            actionNames={actionNames}
                            onChange={(lists) =>
                              upsertVariant(
                                arrangementFunction,
                                variant.variantName,
                                withVariantRequirementLists(variant, lists)
                              )
                            }
                          />
                        </Stack>
                      </AccordionDetails>
                    </Accordion>
                  ))}
                </Stack>
              );
            })}
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
          onClose={closeArrangementFunctionPanel}
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
      <VariantPanel>
        {workingVariant && workingVariantFunction && (
          <ArrangementFunctionVariantSidePanel
            key={`${workingVariantFunction.functionName}/${
              workingVariant.variantName ?? 'new-variant'
            }`}
            variantName={workingVariant.variantName}
            existingVariantNames={(workingVariantFunction.variants ?? []).map(
              (item) => item.variantName
            )}
            onClose={closeVariantPanel}
            onSave={async (previousName, variantName) => {
              const existing = workingVariantFunction.variants?.find(
                (item) => item.variantName === previousName
              );
              const variant = existing
                ? new ArrangementFunctionVariant({ ...existing, variantName })
                : newVariant(variantName);
              const saved = await upsertVariant(
                workingVariantFunction,
                previousName,
                variant
              );
              if (saved) closeVariantPanel();
              return saved;
            }}
          />
        )}
      </VariantPanel>
    </Stack>
  );
}
