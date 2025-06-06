import {
  TableRow,
  TableCell,
  IconButton,
  List,
  ListItem,
  ListItemText,
  Divider,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import {
  ContextualPermissionSet,
  IContextualPermissionSet,
  Permission,
  PermissionContext,
} from '../../GeneratedClient';
import { PermissionContextCell } from './PermissionContextCell';
import { PermissionsSelect } from './PermissionsSelect';
import { spacesBeforeCapitalLetters } from './spacesBeforeCapitalLetters';

interface ContextualPermissionSetRowProps {
  editable: boolean;
  permissionSet: ContextualPermissionSet;
  onDelete: () => void;
  onUpdate: (newValue: IContextualPermissionSet) => void;
}

export function ContextualPermissionSetRowAutocomplete({
  editable,
  permissionSet,
  onDelete,
  onUpdate,
}: ContextualPermissionSetRowProps) {
  function updateContext(newContext: PermissionContext) {
    onUpdate({
      context: newContext,
      permissions: permissionSet.permissions,
    });
  }

  function removePermission(permission: Permission) {
    onUpdate({
      context: permissionSet.context,
      permissions: permissionSet.permissions!.filter((p) => p !== permission),
    });
  }

  function addPermission(permission: Permission | Permission[]) {
    onUpdate({
      context: permissionSet.context,
      permissions: permissionSet
        .permissions!.concat(permission)
        .sort((a, b) => (a < b ? -1 : a > b ? 1 : 0)),
    });
  }

  const availablePermissions = Object.entries(Permission).filter(
    ([, permission]) =>
      typeof permission !== 'string' &&
      !permissionSet?.permissions?.some((p) => p === permission)
  );

  return (
    <TableRow>
      <TableCell>
        {editable ? (
          <IconButton onClick={onDelete}>
            <DeleteIcon />
          </IconButton>
        ) : (
          <></>
        )}
      </TableCell>
      <TableCell>
        <PermissionContextCell
          context={permissionSet.context!}
          editable={editable}
          onUpdate={(newValue) => updateContext(newValue)}
        />
      </TableCell>
      <TableCell>
        <List dense>
          {permissionSet.permissions?.map((permission, i, all) => {
            const permissionListItem = (
              <ListItem key={permission.toString()} disablePadding>
                {editable && (
                  <IconButton
                    edge="start"
                    onClick={() => removePermission(permission)}
                  >
                    <DeleteIcon />
                  </IconButton>
                )}
                <ListItemText>
                  {spacesBeforeCapitalLetters(Permission[permission])}
                </ListItemText>
              </ListItem>
            );
            // Group similar permission items
            return i > 0 &&
              Math.floor((all[i - 1] as number) / 100) <
                Math.floor((permission as number) / 100)
              ? [<Divider key={i} />, permissionListItem]
              : permissionListItem;
          })}

          <PermissionsSelect
            availablePermissions={availablePermissions}
            onAdd={(permissions) => {
              addPermission(permissions);
            }}
          />
        </List>
      </TableCell>
    </TableRow>
  );
}
