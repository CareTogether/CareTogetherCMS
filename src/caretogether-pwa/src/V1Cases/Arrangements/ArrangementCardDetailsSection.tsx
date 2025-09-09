import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Badge,
  Divider,
  Grid,
  Table,
  TableBody,
  TableContainer,
  Typography,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { Arrangement } from '../../GeneratedClient';
import {
  CombinedFamilyInfo,
  ArrangementPolicy,
  ArrangementPhase,
  CompletedRequirementInfo,
  ExemptedRequirementInfo,
  MissingArrangementRequirement,
} from '../../GeneratedClient';
import { ArrangementReason } from './ArrangementReason';
import { ArrangementComments } from './ArrangementComments';
import { ArrangementFunctionRow } from './ArrangementFunctionRow';
import { CompletedRequirementRow } from '../../Requirements/CompletedRequirementRow';
import { ExemptedRequirementRow } from '../../Requirements/ExemptedRequirementRow';
import { MissingArrangementRequirementRow } from '../../Requirements/MissingArrangementRequirementRow';
import { useCollapsed } from '../../Hooks/useCollapsed';
import { RequirementContext } from '../../Requirements/RequirementContext';

export interface RequirementContextGroup {
  completedRequirementsWithContext: {
    completed: CompletedRequirementInfo;
    context: RequirementContext;
  }[];
  exemptedRequirementsWithContext: {
    exempted: ExemptedRequirementInfo;
    context: RequirementContext;
  }[];
  missingRequirementsWithContext: {
    missing: MissingArrangementRequirement;
    context: RequirementContext;
  }[];
  mergedArray: {
    missing: MissingArrangementRequirement;
    context: RequirementContext;
  }[];
  missingAssignmentFunctions: number;
  assignmentsMissingVariants: number;
  upcomingRequirementsCount: number;
}
interface ArrangementCardDetailsSectionProps {
  partneringFamily: CombinedFamilyInfo;
  v1CaseId: string;
  arrangement: Arrangement;
  arrangementPolicy?: ArrangementPolicy;
  requirementsData: RequirementContextGroup;
}

export function ArrangementCardDetailsSection({
  partneringFamily,
  v1CaseId,
  arrangement,
  arrangementPolicy,
  requirementsData,
}: ArrangementCardDetailsSectionProps) {
  const [collapsed, setCollapsed] = useCollapsed(
    `arrangement-${v1CaseId}-${arrangement.id}`,
    false
  );

  const {
    completedRequirementsWithContext,
    exemptedRequirementsWithContext,
    missingRequirementsWithContext,
    mergedArray,
    missingAssignmentFunctions,
    assignmentsMissingVariants,
    upcomingRequirementsCount,
  } = requirementsData;

  return (
    <>
      <ArrangementReason
        partneringFamily={partneringFamily}
        v1CaseId={v1CaseId}
        arrangement={arrangement}
      />
      <Divider />
      <ArrangementComments
        partneringFamily={partneringFamily}
        v1CaseId={v1CaseId}
        arrangement={arrangement}
      />
      <Accordion
        expanded={!collapsed}
        onChange={(_event, isExpanded) => setCollapsed(!isExpanded)}
        variant="outlined"
        square
        disableGutters
        sx={{ marginLeft: -2, marginRight: -2, border: 'none' }}
      >
        <AccordionSummary
          expandIcon={<ExpandMoreIcon />}
          sx={{
            marginTop: 1,
            paddingTop: 1,
            backgroundColor: '#0000000a',
          }}
        >
          <Grid container>
            <Grid item xs={3}>
              <Badge
                color="success"
                badgeContent={completedRequirementsWithContext.length}
              >
                ✅
              </Badge>
            </Grid>
            <Grid item xs={3}>
              <Badge
                color="warning"
                badgeContent={exemptedRequirementsWithContext.length}
              >
                🚫
              </Badge>
            </Grid>
            <Grid item xs={3}>
              <Badge
                color="error"
                badgeContent={
                  missingAssignmentFunctions +
                  assignmentsMissingVariants +
                  missingRequirementsWithContext.length -
                  upcomingRequirementsCount
                }
              >
                ❌
              </Badge>
            </Grid>
            <Grid item xs={3}>
              <Badge color="info" badgeContent={upcomingRequirementsCount}>
                📅
              </Badge>
            </Grid>
          </Grid>
        </AccordionSummary>
        <AccordionDetails>
          <TableContainer>
            <Table size="small">
              <TableBody>
                {arrangementPolicy?.arrangementFunctions?.map(
                  (functionPolicy) => (
                    <ArrangementFunctionRow
                      key={functionPolicy.functionName}
                      summaryOnly={false}
                      partneringFamilyId={partneringFamily.family!.id!}
                      v1CaseId={v1CaseId}
                      arrangement={arrangement}
                      arrangementPolicy={arrangementPolicy}
                      functionPolicy={functionPolicy}
                    />
                  )
                )}
              </TableBody>
            </Table>
          </TableContainer>
          {arrangement.phase !== ArrangementPhase.Cancelled && (
            <Typography className="ph-unmask" variant="body2" component="div">
              {completedRequirementsWithContext.map((x, i) => (
                <CompletedRequirementRow
                  key={`${x.completed.completedRequirementId}:${i}`}
                  requirement={x.completed}
                  context={x.context}
                />
              ))}
              {exemptedRequirementsWithContext.map((x, i) => (
                <ExemptedRequirementRow
                  key={`${x.exempted.requirementName}:${i}`}
                  requirement={x.exempted}
                  context={x.context}
                />
              ))}
              {mergedArray.map((x, i) => (
                <MissingArrangementRequirementRow
                  key={`${x.missing.action?.actionName}:${i}`}
                  requirement={x.missing}
                  context={x.context}
                />
              ))}
            </Typography>
          )}
        </AccordionDetails>
      </Accordion>
    </>
  );
}
