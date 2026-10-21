import { useId } from 'react';
import {
  TableRow,
  TableCell,
  IconButton,
  List,
  ListItem,
  ListItemText,
  Divider,
} from '@mui/material';
import { Delete as DeleteIcon } from '@mui/icons-material';
import {
  ContextualPermissionSet,
  IContextualPermissionSet,
  Permission,
  PermissionContext,
} from '../../GeneratedClient';
import { PermissionContextCell } from './PermissionContextCell';
import { PermissionsSelect } from './PermissionsSelect';
import { formatPermissionName } from './formatPermissionName';

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
  const rowId = useId();
  const contextId = `${rowId}-context`;
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
          <IconButton
            id={`${rowId}-remove-set`}
            aria-label="Remove permission set"
            aria-labelledby={`${rowId}-remove-set ${contextId}`}
            onClick={onDelete}
            sx={{ minWidth: { xs: 44, sm: 0 }, minHeight: { xs: 44, sm: 0 } }}
          >
            <DeleteIcon />
          </IconButton>
        ) : (
          <></>
        )}
      </TableCell>
      <TableCell id={contextId}>
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
                    id={`${rowId}-remove-${permission}`}
                    aria-label={`Remove ${formatPermissionName(Permission[permission])} from permission set`}
                    aria-labelledby={`${rowId}-remove-${permission} ${contextId}`}
                    sx={{
                      minWidth: { xs: 44, sm: 0 },
                      minHeight: { xs: 44, sm: 0 },
                    }}
                    edge="start"
                    onClick={() => removePermission(permission)}
                  >
                    <DeleteIcon />
                  </IconButton>
                )}
                <ListItemText>
                  {formatPermissionName(Permission[permission])}
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
