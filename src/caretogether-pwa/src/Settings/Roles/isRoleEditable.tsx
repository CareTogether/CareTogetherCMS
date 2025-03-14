import { RoleDefinition } from '../../GeneratedClient';

export function isRoleEditable(workingRole: RoleDefinition | undefined) {
  return workingRole?.roleName !== 'OrganizationAdministrator';
}
