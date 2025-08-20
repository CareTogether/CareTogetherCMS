import { Stack, Typography } from '@mui/material';

type Props<T> = {
  tabs: {
    id: T;
    label: string;
    shouldShow?: boolean;
  }[];
  activeTab: T;
  onTabChange: (tab: T) => void;
};

export default function SettingsTabMenu<T>({
  tabs,
  activeTab,
  onTabChange,
}: Props<T>) {
  const filteredTabs = tabs.filter((tab) => tab.shouldShow);

  return (
    <Stack spacing={2} sx={{ minWidth: 200 }}>
      {filteredTabs.map((tab) => (
        <Typography
          key={String(tab.id)}
          variant="body1"
          sx={{
            cursor: 'pointer',
            fontWeight: activeTab === tab.id ? 'bold' : 'normal',
            color: activeTab === tab.id ? 'primary.main' : 'text.primary',
            borderLeft:
              activeTab === tab.id
                ? '3px solid #1976d2'
                : '3px solid transparent',
            pl: 2,
          }}
          onClick={() => onTabChange(tab.id)}
        >
          {tab.label}
        </Typography>
      ))}
    </Stack>
  );
}
