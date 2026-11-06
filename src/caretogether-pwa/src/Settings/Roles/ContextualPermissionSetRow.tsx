import { useId, useState } from 'react';
import {
  TableRow,
  TableCell,
  IconButton,
  List,
  ListItem,
  ListItemText,
  Menu,
  MenuItem,
  Divider,
} from '@mui/material';
import { Add as AddIcon, Delete as DeleteIcon } from '@mui/icons-material';
import {
  ContextualPermissionSet,
  IContextualPermissionSet,
  Permission,
  PermissionContext,
} from '../../GeneratedClient';
import { PermissionContextCell } from './PermissionContextCell';
import { formatPermissionName } from './formatPermissionName';

interface ContextualPermissionSetRowProps {
  editable: boolean;
  permissionSet: ContextualPermissionSet;
  onDelete: () => void;
  onUpdate: (newValue: IContextualPermissionSet) => void;
}

export function ContextualPermissionSetRow({
  editable,
  permissionSet,
  onDelete,
  onUpdate,
}: ContextualPermissionSetRowProps) {
  const rowId = useId();
  const contextId = `${rowId}-context`;
  const [addPermissionMenuAnchorEl, setAddPermissionMenuAnchorEl] =
    useState<null | HTMLElement>(null);
  const [currentPermissionSet, setCurrentPermissionSet] =
    useState<null | ContextualPermissionSet>(null);
  function openAddPermissionMenu(
    permissionSet: ContextualPermissionSet,
    anchorElement: HTMLElement
  ) {
    setAddPermissionMenuAnchorEl(anchorElement);
    setCurrentPermissionSet(permissionSet);
  }

  function closeAddPermissionMenu() {
    setAddPermissionMenuAnchorEl(null);
    setCurrentPermissionSet(null);
  }

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

  function addPermission(permission: Permission) {
    closeAddPermissionMenu();
    onUpdate({
      context: permissionSet.context,
      permissions: permissionSet
        .permissions!.concat(permission)
        .sort((a, b) => (a < b ? -1 : a > b ? 1 : 0)),
    });
  }

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
          {editable && (
            <ListItem disablePadding>
              <IconButton
                id={`${rowId}-add`}
                aria-label="Add permission to permission set"
                aria-labelledby={`${rowId}-add ${contextId}`}
                sx={{
                  minWidth: { xs: 44, sm: 0 },
                  minHeight: { xs: 44, sm: 0 },
                }}
                edge="start"
                onClick={(event) =>
                  openAddPermissionMenu(permissionSet, event.currentTarget)
                }
              >
                <AddIcon />
              </IconButton>
            </ListItem>
          )}
        </List>
        <Menu
          open={Boolean(addPermissionMenuAnchorEl)}
          anchorEl={addPermissionMenuAnchorEl}
          onClose={closeAddPermissionMenu}
        >
          {Object.entries(Permission)
            .filter(
              (permission) =>
                typeof permission[1] !== 'string' &&
                !currentPermissionSet?.permissions?.some(
                  (p) => p === permission[1]
                )
            )
            .map((permission, i, all) => {
              const permissionMenuItem = (
                <MenuItem
                  key={permission[0]}
                  dense
                  onClick={() => addPermission(permission[1] as Permission)}
                >
                  {formatPermissionName(permission[0])}
                </MenuItem>
              );
              // Group similar permission items
              return i > 0 &&
                Math.floor((all[i - 1][1] as number) / 100) <
                  Math.floor((permission[1] as number) / 100)
                ? [<Divider />, permissionMenuItem]
                : permissionMenuItem;
            })}
        </Menu>
      </TableCell>
    </TableRow>
  );
}
