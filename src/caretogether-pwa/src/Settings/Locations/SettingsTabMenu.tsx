import { Stack, Typography } from '@mui/material';

type Props = {
  activeTab: 'basic' | 'actions' | 'policies';
  onTabChange: (tab: 'basic' | 'actions' | 'policies') => void;
  showActionsTab: boolean;
  showPoliciesTab: boolean;
};

const tabs = [
  { key: 'basic', label: 'Basic configuration' },
  { key: 'actions', label: 'Action definitions' },
  { key: 'policies', label: 'Approval policies' },
];

export default function SettingsTabMenu({
  activeTab,
  onTabChange,
  showActionsTab,
  showPoliciesTab,
}: Props) {
  const filteredTabs = tabs.filter((tab) => {
    if (tab.key === 'actions' && !showActionsTab) return false;
    if (tab.key === 'policies' && !showPoliciesTab) return false;
    return true;
  });

  return (
    <Stack spacing={2} sx={{ minWidth: 200 }}>
      {filteredTabs.map((tab) => (
        <Typography
          key={tab.key}
          variant="body1"
          sx={{
            cursor: 'pointer',
            fontWeight: activeTab === tab.key ? 'bold' : 'normal',
            color: activeTab === tab.key ? 'primary.main' : 'text.primary',
            borderLeft:
              activeTab === tab.key
                ? '3px solid #1976d2'
                : '3px solid transparent',
            pl: 2,
          }}
          onClick={() => onTabChange(tab.key as Props['activeTab'])}
        >
          {tab.label}
        </Typography>
      ))}
    </Stack>
  );
}
