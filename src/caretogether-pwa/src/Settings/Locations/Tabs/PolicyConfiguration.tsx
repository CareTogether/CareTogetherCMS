import { Stack } from '@mui/material';
import { EffectiveLocationPolicy } from '../../../GeneratedClient';
import { ActionDefinitionsTab } from './PolicyConfiguration/ActionDefinitionsTab';
import { CasePolicyTab } from './PolicyConfiguration/CasePolicyTab';
import { CustomFamilyFieldsTab } from './PolicyConfiguration/CustomFamilyFieldsTab';
import { V1ReferralPolicyTab } from './PolicyConfiguration/V1ReferralPolicyTab';
import { VolunteerPolicyTab } from './PolicyConfiguration/VolunteerPolicyTab';

type PolicyConfigurationProps = {
  policy: EffectiveLocationPolicy;
  locationRoles: string[];
  onPolicyChange: (policy: EffectiveLocationPolicy) => void;
  section:
    | 'actionDefinitions'
    | 'customFamilyFields'
    | 'casePolicy'
    | 'v1ReferralPolicy'
    | 'volunteerPolicy';
};

export function PolicyConfiguration({
  policy,
  locationRoles,
  onPolicyChange,
  section,
}: PolicyConfigurationProps) {
  return (
    <Stack spacing={2} sx={{ maxWidth: 1200, pb: 4 }}>
      {section === 'actionDefinitions' && (
        <ActionDefinitionsTab policy={policy} onPolicyChange={onPolicyChange} />
      )}
      {section === 'customFamilyFields' && (
        <CustomFamilyFieldsTab
          policy={policy}
          onPolicyChange={onPolicyChange}
        />
      )}
      {section === 'casePolicy' && (
        <CasePolicyTab
          policy={policy}
          locationRoles={locationRoles}
          onPolicyChange={onPolicyChange}
        />
      )}
      {section === 'v1ReferralPolicy' && (
        <V1ReferralPolicyTab
          policy={policy}
          locationRoles={locationRoles}
          onPolicyChange={onPolicyChange}
        />
      )}
      {section === 'volunteerPolicy' && (
        <VolunteerPolicyTab policy={policy} onPolicyChange={onPolicyChange} />
      )}
    </Stack>
  );
}
