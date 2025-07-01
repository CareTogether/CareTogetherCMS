import { ORGANIZATION_ADMINISTRATOR } from '../../constants';
import { RoleDefinition } from '../../GeneratedClient';

export function isRoleEditable(workingRole: RoleDefinition | undefined) {
  return workingRole?.roleName !== ORGANIZATION_ADMINISTRATOR;
}
