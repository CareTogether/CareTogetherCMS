import {
  Checkbox,
  FormControlLabel,
  FormGroup,
  Skeleton,
  Stack,
  Switch,
  Typography,
} from '@mui/material';
import {
  AllPartneringFamiliesPermissionContext,
  AllVolunteerFamiliesPermissionContext,
  AssignedFunctionsInReferralCoAssigneeFamiliesPermissionContext,
  AssignedFunctionsInReferralPartneringFamilyPermissionContext,
  CommunityCoMemberFamiliesPermissionContext,
  CommunityMemberPermissionContext,
  GlobalPermissionContext,
  OwnFamilyPermissionContext,
  OwnReferralAssigneeFamiliesPermissionContext,
  PermissionContext,
} from '../../GeneratedClient';
import { useLoadable } from '../../Hooks/useLoadable';
import {
  allFunctionsInPolicyQuery,
  organizationConfigurationQuery,
} from '../../Model/ConfigurationModel';

interface ContextSelectorProps<T extends PermissionContext> {
  context: T;
  factory: () => T;
  onUpdate: (newValue: PermissionContext) => void;
}

function ReferralOpenSelector({
  context,
  factory,
  onUpdate,
}: ContextSelectorProps<
  | AssignedFunctionsInReferralPartneringFamilyPermissionContext
  | AssignedFunctionsInReferralCoAssigneeFamiliesPermissionContext
  | OwnReferralAssigneeFamiliesPermissionContext
>) {
  const hasValue =
    typeof context.whenReferralIsOpen !== 'undefined' &&
    context.whenReferralIsOpen !== null;

  return (
    <FormGroup>
      <FormControlLabel
        control={
          <Switch
            size="small"
            checked={hasValue}
            onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
              const newContext = factory();
              newContext.whenReferralIsOpen = event.target.checked
                ? true
                : undefined;
              onUpdate(newContext);
            }}
          />
        }
        label={
          hasValue ? 'Only matching referral status:' : 'Any referral status'
        }
      />
      {hasValue && (
        <FormControlLabel
          control={
            <Checkbox
              size="small"
              checked={context.whenReferralIsOpen || false}
              onChange={(event) => {
                const newContext = factory();
                newContext.whenReferralIsOpen = event.target.checked
                  ? true
                  : false;
                onUpdate(newContext);
              }}
            />
          }
          label={
            context.whenReferralIsOpen ? 'Open referral' : 'Closed referral'
          }
          sx={{ marginLeft: 3 }}
        />
      )}
    </FormGroup>
  );
}

function OwnFunctionSelector({
  context,
  factory,
  onUpdate,
}: ContextSelectorProps<
  | AssignedFunctionsInReferralPartneringFamilyPermissionContext
  | AssignedFunctionsInReferralCoAssigneeFamiliesPermissionContext
>) {
  const allFunctionsInPolicy = useLoadable(allFunctionsInPolicyQuery);
  const hasValue =
    typeof context.whenOwnFunctionIsIn !== 'undefined' &&
    context.whenOwnFunctionIsIn !== null;

  return (
    <FormGroup>
      {allFunctionsInPolicy === null ? (
        <Skeleton />
      ) : (
        <>
          <FormControlLabel
            control={
              <Switch
                size="small"
                checked={hasValue}
                onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
                  const newContext = factory();
                  newContext.whenOwnFunctionIsIn = event.target.checked
                    ? allFunctionsInPolicy
                    : undefined;
                  onUpdate(newContext);
                }}
              />
            }
            label={
              hasValue
                ? 'Only when own function is:'
                : 'When assigned any function'
            }
          />
          {hasValue && (
            <FormGroup>
              {allFunctionsInPolicy.map((f) => (
                <FormControlLabel
                  key={f}
                  control={
                    <Checkbox
                      size="small"
                      checked={context.whenOwnFunctionIsIn?.includes(f)}
                      onChange={(_, checked) => {
                        const newContext = factory();
                        if (checked) {
                          newContext.whenOwnFunctionIsIn?.push(f);
                        } else {
                          newContext.whenOwnFunctionIsIn =
                            newContext.whenOwnFunctionIsIn?.filter(
                              (x) => x !== f
                            );
                        }
                        onUpdate(newContext);
                      }}
                    />
                  }
                  label={f}
                  sx={{ marginLeft: 3 }}
                />
              ))}
            </FormGroup>
          )}
        </>
      )}
    </FormGroup>
  );
}

function AssigneeFunctionSelector({
  context,
  factory,
  onUpdate,
}: ContextSelectorProps<
  | AssignedFunctionsInReferralCoAssigneeFamiliesPermissionContext
  | OwnReferralAssigneeFamiliesPermissionContext
>) {
  const allFunctionsInPolicy = useLoadable(allFunctionsInPolicyQuery);
  const hasValue =
    typeof context.whenAssigneeFunctionIsIn !== 'undefined' &&
    context.whenAssigneeFunctionIsIn !== null;

  return (
    <FormGroup>
      {allFunctionsInPolicy === null ? (
        <Skeleton />
      ) : (
        <>
          <FormControlLabel
            control={
              <Switch
                size="small"
                checked={hasValue}
                onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
                  const newContext = factory();
                  newContext.whenAssigneeFunctionIsIn = event.target.checked
                    ? allFunctionsInPolicy
                    : undefined;
                  onUpdate(newContext);
                }}
              />
            }
            label={
              hasValue
                ? "Only when assignee's function is:"
                : 'Any assignee function'
            }
          />
          {hasValue && (
            <FormGroup>
              {allFunctionsInPolicy.map((f) => (
                <FormControlLabel
                  key={f}
                  control={
                    <Checkbox
                      size="small"
                      checked={context.whenAssigneeFunctionIsIn?.includes(f)}
                      onChange={(_, checked) => {
                        const newContext = factory();
                        if (checked) {
                          newContext.whenAssigneeFunctionIsIn?.push(f);
                        } else {
                          newContext.whenAssigneeFunctionIsIn =
                            newContext.whenAssigneeFunctionIsIn?.filter(
                              (x) => x !== f
                            );
                        }
                        onUpdate(newContext);
                      }}
                    />
                  }
                  label={f}
                  sx={{ marginLeft: 3 }}
                />
              ))}
            </FormGroup>
          )}
        </>
      )}
    </FormGroup>
  );
}

function OwnCommunityRoleSelector({
  context,
  factory,
  onUpdate,
}: ContextSelectorProps<
  CommunityMemberPermissionContext | CommunityCoMemberFamiliesPermissionContext
>) {
  const communityRoles =
    useLoadable(organizationConfigurationQuery)?.communityRoles || null;
  const hasValue =
    typeof context.whenOwnCommunityRoleIsIn !== 'undefined' &&
    context.whenOwnCommunityRoleIsIn !== null;

  return (
    <FormGroup>
      {communityRoles === null ? (
        <Skeleton />
      ) : (
        <>
          <FormControlLabel
            control={
              <Switch
                size="small"
                checked={hasValue}
                onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
                  const newContext = factory();
                  newContext.whenOwnCommunityRoleIsIn = event.target.checked
                    ? communityRoles
                    : undefined;
                  onUpdate(newContext);
                }}
              />
            }
            label={
              hasValue
                ? 'Only when own community role is:'
                : 'Regardless of any assigned community role'
            }
          />
          {hasValue && (
            <FormGroup>
              {communityRoles.map((f) => (
                <FormControlLabel
                  key={f}
                  control={
                    <Checkbox
                      size="small"
                      checked={context.whenOwnCommunityRoleIsIn?.includes(f)}
                      onChange={(_, checked) => {
                        const newContext = factory();
                        if (checked) {
                          newContext.whenOwnCommunityRoleIsIn?.push(f);
                        } else {
                          newContext.whenOwnCommunityRoleIsIn =
                            newContext.whenOwnCommunityRoleIsIn?.filter(
                              (x) => x !== f
                            );
                        }
                        onUpdate(newContext);
                      }}
                    />
                  }
                  label={f}
                  sx={{ marginLeft: 3 }}
                />
              ))}
            </FormGroup>
          )}
        </>
      )}
    </FormGroup>
  );
}

interface PermissionContextCellProps {
  context: PermissionContext;
  editable: boolean;
  onUpdate: (newValue: PermissionContext) => void;
}
export function PermissionContextCell({
  context,
  onUpdate,
}: PermissionContextCellProps) {
  const contextLabel =
    context instanceof GlobalPermissionContext
      ? 'Global'
      : context instanceof OwnFamilyPermissionContext
        ? 'Own Family'
        : context instanceof AllVolunteerFamiliesPermissionContext
          ? 'All Volunteer Families'
          : context instanceof AllPartneringFamiliesPermissionContext
            ? 'All Partnering Families'
            : context instanceof
                AssignedFunctionsInReferralPartneringFamilyPermissionContext
              ? 'Assigned Functions in Referral - Partnering Family'
              : context instanceof
                  AssignedFunctionsInReferralCoAssigneeFamiliesPermissionContext
                ? 'Assigned Functions in Referral - Co-Assigned Families'
                : context instanceof
                    OwnReferralAssigneeFamiliesPermissionContext
                  ? 'Own Referral - Assigned Families'
                  : context instanceof CommunityMemberPermissionContext
                    ? 'Community Member - Community'
                    : context instanceof
                        CommunityCoMemberFamiliesPermissionContext
                      ? 'Community Member - Co-Member Families'
                      : JSON.stringify(context);

  function assignedFunctionsInReferralPartneringFamilyPermissionContextFactory(
    context: AssignedFunctionsInReferralPartneringFamilyPermissionContext
  ) {
    const result =
      new AssignedFunctionsInReferralPartneringFamilyPermissionContext();
    result.whenReferralIsOpen = context.whenReferralIsOpen;
    result.whenOwnFunctionIsIn = context.whenOwnFunctionIsIn?.slice();
    return result;
  }

  function assignedFunctionsInReferralCoAssigneeFamiliesPermissionContextFactory(
    context: AssignedFunctionsInReferralCoAssigneeFamiliesPermissionContext
  ) {
    const result =
      new AssignedFunctionsInReferralCoAssigneeFamiliesPermissionContext();
    result.whenReferralIsOpen = context.whenReferralIsOpen;
    result.whenOwnFunctionIsIn = context.whenOwnFunctionIsIn?.slice();
    result.whenAssigneeFunctionIsIn = context.whenAssigneeFunctionIsIn?.slice();
    return result;
  }

  function ownReferralAssigneeFamiliesPermissionContextFactory(
    context: OwnReferralAssigneeFamiliesPermissionContext
  ) {
    const result = new OwnReferralAssigneeFamiliesPermissionContext();
    result.whenReferralIsOpen = context.whenReferralIsOpen;
    result.whenAssigneeFunctionIsIn = context.whenAssigneeFunctionIsIn?.slice();
    return result;
  }

  function communityMemberPermissionContextFactory(
    context: CommunityMemberPermissionContext
  ) {
    const result = new CommunityMemberPermissionContext();
    result.whenOwnCommunityRoleIsIn = context.whenOwnCommunityRoleIsIn?.slice();
    return result;
  }

  function communityCoMemberFamiliesPermissionContextFactory(
    context: CommunityCoMemberFamiliesPermissionContext
  ) {
    const result = new CommunityCoMemberFamiliesPermissionContext();
    result.whenOwnCommunityRoleIsIn = context.whenOwnCommunityRoleIsIn?.slice();
    return result;
  }

  return (
    <Stack>
      <Typography variant="h6">{contextLabel}</Typography>
      <Stack dir="row">
        {context instanceof
          AssignedFunctionsInReferralPartneringFamilyPermissionContext && (
          <>
            <ReferralOpenSelector
              context={context}
              onUpdate={onUpdate}
              factory={() =>
                assignedFunctionsInReferralPartneringFamilyPermissionContextFactory(
                  context
                )
              }
            />
            <OwnFunctionSelector
              context={context}
              onUpdate={onUpdate}
              factory={() =>
                assignedFunctionsInReferralPartneringFamilyPermissionContextFactory(
                  context
                )
              }
            />
          </>
        )}
        {context instanceof
          AssignedFunctionsInReferralCoAssigneeFamiliesPermissionContext && (
          <>
            <ReferralOpenSelector
              context={context}
              onUpdate={onUpdate}
              factory={() =>
                assignedFunctionsInReferralCoAssigneeFamiliesPermissionContextFactory(
                  context
                )
              }
            />
            <OwnFunctionSelector
              context={context}
              onUpdate={onUpdate}
              factory={() =>
                assignedFunctionsInReferralCoAssigneeFamiliesPermissionContextFactory(
                  context
                )
              }
            />
            <AssigneeFunctionSelector
              context={context}
              onUpdate={onUpdate}
              factory={() =>
                assignedFunctionsInReferralCoAssigneeFamiliesPermissionContextFactory(
                  context
                )
              }
            />
          </>
        )}
        {context instanceof OwnReferralAssigneeFamiliesPermissionContext && (
          <>
            <ReferralOpenSelector
              context={context}
              onUpdate={onUpdate}
              factory={() =>
                ownReferralAssigneeFamiliesPermissionContextFactory(context)
              }
            />
            <AssigneeFunctionSelector
              context={context}
              onUpdate={onUpdate}
              factory={() =>
                ownReferralAssigneeFamiliesPermissionContextFactory(context)
              }
            />
          </>
        )}
        {context instanceof CommunityMemberPermissionContext && (
          <>
            <OwnCommunityRoleSelector
              context={context}
              onUpdate={onUpdate}
              factory={() => communityMemberPermissionContextFactory(context)}
            />
          </>
        )}
        {context instanceof CommunityCoMemberFamiliesPermissionContext && (
          <>
            <OwnCommunityRoleSelector
              context={context}
              onUpdate={onUpdate}
              factory={() =>
                communityCoMemberFamiliesPermissionContextFactory(context)
              }
            />
          </>
        )}
      </Stack>
    </Stack>
  );
}
