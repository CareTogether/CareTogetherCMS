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
  AssignedFunctionsInReferralCoAssigneeFamiliesPermissionContext as AssignedFunctionsInV1CaseCoAssigneeFamiliesPermissionContext,
  AssignedFunctionsInReferralPartneringFamilyPermissionContext as AssignedFunctionsInV1CasePartneringFamilyPermissionContext,
  CommunityCoMemberFamiliesAssignedFunctionsInReferralCoAssignedFamiliesPermissionContext as CommunityCoMemberFamiliesAssignedFunctionsInV1CaseCoAssignedFamiliesPermissionContext,
  CommunityCoMemberFamiliesAssignedFunctionsInReferralPartneringFamilyPermissionContext as CommunityCoMemberFamiliesAssignedFunctionsInV1CasePartneringFamilyPermissionContext,
  CommunityCoMemberFamiliesPermissionContext,
  CommunityMemberPermissionContext,
  GlobalPermissionContext,
  OwnFamilyPermissionContext,
  OwnReferralAssigneeFamiliesPermissionContext as OwnV1CaseAssigneeFamiliesPermissionContext,
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

function V1CaseOpenSelector({
  context,
  factory,
  onUpdate,
}: ContextSelectorProps<
  | AssignedFunctionsInV1CasePartneringFamilyPermissionContext
  | AssignedFunctionsInV1CaseCoAssigneeFamiliesPermissionContext
  | OwnV1CaseAssigneeFamiliesPermissionContext
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
        label={hasValue ? 'Only matching Case status:' : 'Any Case status'}
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
          label={context.whenReferralIsOpen ? 'Open Case' : 'Closed Case'}
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
  | AssignedFunctionsInV1CasePartneringFamilyPermissionContext
  | AssignedFunctionsInV1CaseCoAssigneeFamiliesPermissionContext
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
  | AssignedFunctionsInV1CaseCoAssigneeFamiliesPermissionContext
  | OwnV1CaseAssigneeFamiliesPermissionContext
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
                AssignedFunctionsInV1CasePartneringFamilyPermissionContext
              ? 'Assigned Functions in Case - Partnering Family'
              : context instanceof
                  AssignedFunctionsInV1CaseCoAssigneeFamiliesPermissionContext
                ? 'Assigned Functions in Case - Co-Assigned Families'
                : context instanceof OwnV1CaseAssigneeFamiliesPermissionContext
                  ? 'Own Case - Assigned Families'
                  : context instanceof CommunityMemberPermissionContext
                    ? 'Community Member - Community'
                    : context instanceof
                        CommunityCoMemberFamiliesPermissionContext
                      ? 'Community Member - Co-Member Families'
                      : context instanceof
                          CommunityCoMemberFamiliesAssignedFunctionsInV1CasePartneringFamilyPermissionContext
                        ? 'Community Member - Co-Member Families - Assigned Functions in Case - Partnering Family'
                        : CommunityCoMemberFamiliesAssignedFunctionsInV1CaseCoAssignedFamiliesPermissionContext
                          ? 'Community Member - Co-Member Families - Assigned Functions in Case - Co-Assigned Families'
                          : JSON.stringify(context);

  function assignedFunctionsInV1CasePartneringFamilyPermissionContextFactory(
    context: AssignedFunctionsInV1CasePartneringFamilyPermissionContext
  ) {
    const result =
      new AssignedFunctionsInV1CasePartneringFamilyPermissionContext();
    result.whenReferralIsOpen = context.whenReferralIsOpen;
    result.whenOwnFunctionIsIn = context.whenOwnFunctionIsIn?.slice();
    return result;
  }

  function assignedFunctionsInV1CaseCoAssigneeFamiliesPermissionContextFactory(
    context: AssignedFunctionsInV1CaseCoAssigneeFamiliesPermissionContext
  ) {
    const result =
      new AssignedFunctionsInV1CaseCoAssigneeFamiliesPermissionContext();
    result.whenReferralIsOpen = context.whenReferralIsOpen;
    result.whenOwnFunctionIsIn = context.whenOwnFunctionIsIn?.slice();
    result.whenAssigneeFunctionIsIn = context.whenAssigneeFunctionIsIn?.slice();
    return result;
  }

  function ownV1CaseAssigneeFamiliesPermissionContextFactory(
    context: OwnV1CaseAssigneeFamiliesPermissionContext
  ) {
    const result = new OwnV1CaseAssigneeFamiliesPermissionContext();
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

  function communityCoMemberFamiliesAssignedFunctionsInV1CasePartneringFamilyPermissionContextFactory(
    context: CommunityCoMemberFamiliesAssignedFunctionsInV1CasePartneringFamilyPermissionContext
  ) {
    const result =
      new CommunityCoMemberFamiliesAssignedFunctionsInV1CasePartneringFamilyPermissionContext();
    result.whenOwnCommunityRoleIsIn = context.whenOwnCommunityRoleIsIn?.slice();
    return result;
  }

  function communityCoMemberFamiliesAssignedFunctionsInV1CaseCoAssignedFamiliesPermissionContext(
    context: CommunityCoMemberFamiliesAssignedFunctionsInV1CaseCoAssignedFamiliesPermissionContext
  ) {
    const result =
      new CommunityCoMemberFamiliesAssignedFunctionsInV1CaseCoAssignedFamiliesPermissionContext();
    result.whenOwnCommunityRoleIsIn = context.whenOwnCommunityRoleIsIn?.slice();
    return result;
  }

  return (
    <Stack>
      <Typography variant="h6">{contextLabel}</Typography>
      <Stack dir="row">
        {context instanceof
          AssignedFunctionsInV1CasePartneringFamilyPermissionContext && (
          <>
            <V1CaseOpenSelector
              context={context}
              onUpdate={onUpdate}
              factory={() =>
                assignedFunctionsInV1CasePartneringFamilyPermissionContextFactory(
                  context
                )
              }
            />
            <OwnFunctionSelector
              context={context}
              onUpdate={onUpdate}
              factory={() =>
                assignedFunctionsInV1CasePartneringFamilyPermissionContextFactory(
                  context
                )
              }
            />
          </>
        )}
        {context instanceof
          AssignedFunctionsInV1CaseCoAssigneeFamiliesPermissionContext && (
          <>
            <V1CaseOpenSelector
              context={context}
              onUpdate={onUpdate}
              factory={() =>
                assignedFunctionsInV1CaseCoAssigneeFamiliesPermissionContextFactory(
                  context
                )
              }
            />
            <OwnFunctionSelector
              context={context}
              onUpdate={onUpdate}
              factory={() =>
                assignedFunctionsInV1CaseCoAssigneeFamiliesPermissionContextFactory(
                  context
                )
              }
            />
            <AssigneeFunctionSelector
              context={context}
              onUpdate={onUpdate}
              factory={() =>
                assignedFunctionsInV1CaseCoAssigneeFamiliesPermissionContextFactory(
                  context
                )
              }
            />
          </>
        )}
        {context instanceof OwnV1CaseAssigneeFamiliesPermissionContext && (
          <>
            <V1CaseOpenSelector
              context={context}
              onUpdate={onUpdate}
              factory={() =>
                ownV1CaseAssigneeFamiliesPermissionContextFactory(context)
              }
            />
            <AssigneeFunctionSelector
              context={context}
              onUpdate={onUpdate}
              factory={() =>
                ownV1CaseAssigneeFamiliesPermissionContextFactory(context)
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
        {context instanceof
          CommunityCoMemberFamiliesAssignedFunctionsInV1CasePartneringFamilyPermissionContext && (
          <>
            <OwnCommunityRoleSelector
              context={context}
              onUpdate={onUpdate}
              factory={() =>
                communityCoMemberFamiliesAssignedFunctionsInV1CasePartneringFamilyPermissionContextFactory(
                  context
                )
              }
            />
          </>
        )}
        {context instanceof
          CommunityCoMemberFamiliesAssignedFunctionsInV1CaseCoAssignedFamiliesPermissionContext && (
          <>
            <OwnCommunityRoleSelector
              context={context}
              onUpdate={onUpdate}
              factory={() =>
                communityCoMemberFamiliesAssignedFunctionsInV1CaseCoAssignedFamiliesPermissionContext(
                  context
                )
              }
            />
          </>
        )}
      </Stack>
    </Stack>
  );
}
