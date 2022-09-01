import { Checkbox, FormControlLabel, FormGroup, Stack, Switch, Typography } from "@mui/material";
import { useRecoilValue } from "recoil";
import { AllPartneringFamiliesPermissionContext, AllVolunteerFamiliesPermissionContext, AssignedFunctionsInReferralCoAssigneeFamiliesPermissionContext, AssignedFunctionsInReferralPartneringFamilyPermissionContext, GlobalPermissionContext, IPermissionContext, OwnFamilyPermissionContext, OwnReferralAssigneeFamiliesPermissionContext, PermissionContext } from "../GeneratedClient"
import { allFunctionsInPolicyQuery } from "../Model/ConfigurationModel";

interface PermissionContextCellProps {
  context: PermissionContext
  editable: boolean
  onUpdate: (newValue: PermissionContext) => void
}
export function PermissionContextCell({ context, editable, onUpdate }: PermissionContextCellProps) {
  const contextLabel =
    context instanceof GlobalPermissionContext
    ? "Global"
    : context instanceof OwnFamilyPermissionContext
    ? "Own Family"
    : context instanceof AllVolunteerFamiliesPermissionContext
    ? "All Volunteer Families"
    : context instanceof AllPartneringFamiliesPermissionContext
    ? "All Partnering Families"
    : context instanceof AssignedFunctionsInReferralPartneringFamilyPermissionContext
    ? "Assigned Functions in Referral - Partnering Family"
    : context instanceof AssignedFunctionsInReferralCoAssigneeFamiliesPermissionContext
    ? "Assigned Functions in Referral - Co-Assigned Families"
    : context instanceof OwnReferralAssigneeFamiliesPermissionContext
    ? "Own Referral - Assigned Families"
    : JSON.stringify(context);
  
  const allFunctionsInPolicy = useRecoilValue(allFunctionsInPolicyQuery);
  
  return (
    <Stack>
      <Typography variant='h6'>{contextLabel}</Typography>
      <Stack dir='row'>
        {(context instanceof AssignedFunctionsInReferralPartneringFamilyPermissionContext)/* ||
          context instanceof AssignedFunctionsInReferralCoAssigneeFamiliesPermissionContext ||
          context instanceof OwnReferralAssigneeFamiliesPermissionContext)*/ &&
          <FormGroup>
            <FormControlLabel control={
              <Switch checked={typeof context.whenReferralIsOpen !== 'undefined'}
                onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
                  const newContext = new AssignedFunctionsInReferralPartneringFamilyPermissionContext();
                  newContext.whenReferralIsOpen = event.target.checked
                    ? true : undefined;
                  onUpdate(newContext);
                }} />}
              label={typeof context.whenReferralIsOpen !== 'undefined'
                ? "Only matching referral status" : "Any referral status"} />
            {typeof context.whenReferralIsOpen !== 'undefined' && <FormControlLabel control={
              <Checkbox checked={context.whenReferralIsOpen || false}
                onChange={(event) => {
                  const newContext = new AssignedFunctionsInReferralPartneringFamilyPermissionContext();
                  newContext.whenReferralIsOpen = event.target.checked
                    ? true : false;
                  onUpdate(newContext);
                }} />}
              label={context.whenReferralIsOpen ? "Open" : "Closed"} />}
          </FormGroup>}
        {(context instanceof AssignedFunctionsInReferralPartneringFamilyPermissionContext ||
          context instanceof AssignedFunctionsInReferralCoAssigneeFamiliesPermissionContext) &&
          <FormGroup>
            {context.whenOwnFunctionIsIn}
          </FormGroup>}
        {(context instanceof AssignedFunctionsInReferralCoAssigneeFamiliesPermissionContext ||
          context instanceof OwnReferralAssigneeFamiliesPermissionContext) &&
          <FormGroup>
            {context.whenAssigneeFunctionIsIn}
          </FormGroup>}
      </Stack>
    </Stack>
  );
}
