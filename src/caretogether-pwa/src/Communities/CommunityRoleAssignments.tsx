import { IconButton, List, ListItem, ListItemText } from '@mui/material';
import { CommunityInfo, Permission, RemoveCommunityRoleAssignment } from '../GeneratedClient';
import { useCommunityCommand, usePersonAndFamilyLookup } from '../Model/DirectoryModel';
import { useCommunityPermissions } from '../Model/SessionModel';
import DeleteIcon from '@mui/icons-material/Delete';
import { useBackdrop } from '../Hooks/useBackdrop';
import { personNameString } from '../Families/PersonName';

interface CommunityRoleAssignmentsProps {
  communityInfo: CommunityInfo;
}
export function CommunityRoleAssignments({ communityInfo }: CommunityRoleAssignmentsProps) {
  interface RoleAssignment {
    personId: string
    communityRole: string
    personDisplayName: string
  }
  const permissions = useCommunityPermissions(communityInfo);
  const community = communityInfo.community!;

  const personLookup = usePersonAndFamilyLookup();
  const assignments = (community?.communityRoleAssignments || []).map(assignee => ({
    personId: assignee.personId,
    communityRole: assignee.communityRole,
    personDisplayName: personNameString(personLookup(assignee.personId).person)
  } as RoleAssignment));

  const removeRoleAssignment = useCommunityCommand((communityId, personId: string, role: string) => {
    const command = new RemoveCommunityRoleAssignment();
    command.communityId = communityId;
    command.personId = personId;
    command.communityRole = role;
    return command;
  });

  const withBackdrop = useBackdrop();
  async function remove(assignment: RoleAssignment) {
    //TODO: Use the DeleteDocumentDialog approach - potentially making it reusable?
    if (window.confirm("Are you sure you want to remove this role assignment?\n\n" +
      assignment.personDisplayName + ": " + assignment.communityRole)) {
      await withBackdrop(async () => {
        await removeRoleAssignment(community.id!, assignment.personId, assignment.communityRole);
      });
    }
  }

  return <List sx={{ '& .MuiListItemIcon-root': { minWidth: 36 } }}>
    {assignments.map(assignment =>
      <ListItem key={`${assignment.personId}-${assignment.communityRole}`} disablePadding
        secondaryAction={permissions(Permission.EditCommunityRoleAssignments)
          ? <IconButton edge="end" aria-label="delete"
            color='primary'
            onClick={() => remove(assignment)}>
            <DeleteIcon />
          </IconButton>
          : null}>
        <ListItemText
          primary={assignment.personDisplayName}
          secondary={assignment.communityRole} />
      </ListItem>)}
  </List>;
}
