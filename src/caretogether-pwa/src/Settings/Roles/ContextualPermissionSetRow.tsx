import { useState } from 'react';
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
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import {
  ContextualPermissionSet,
  IContextualPermissionSet,
  Permission,
  PermissionContext,
} from '../../GeneratedClient';
import { PermissionContextCell } from './PermissionContextCell';

function spacesBeforeCapitalLetters(value: string) {
  let result = '';
  for (const c of value) {
    result += result.length > 0 && c.toUpperCase() === c ? ' ' + c : c;
    if (result === 'Add Edit') {
      result = 'Add/Edit';
    }
  }
  return result;
}

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
          {editable && (
            <ListItem disablePadding>
              <IconButton
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
                  {spacesBeforeCapitalLetters(permission[0])}
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
