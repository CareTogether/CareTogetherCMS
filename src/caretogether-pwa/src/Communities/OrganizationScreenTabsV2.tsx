import {
  Box,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Tab,
  Tabs,
} from '@mui/material';
import { SelectChangeEvent } from '@mui/material/Select';
import { ReactNode } from 'react';

export type OrganizationScreenTabValue = 'overview' | 'approvals';

export type OrganizationScreenTab = {
  value: OrganizationScreenTabValue;
  desktopLabel: ReactNode;
  mobileLabel: string;
};

type OrganizationScreenTabsV2Props = {
  tabs: OrganizationScreenTab[];
  selectedTab: OrganizationScreenTabValue;
  isDesktop: boolean;
  onChange: (nextTab: OrganizationScreenTabValue) => void;
};

export function OrganizationScreenTabsV2({
  tabs,
  selectedTab,
  isDesktop,
  onChange,
}: OrganizationScreenTabsV2Props) {
  function handleSelectedTabChange(event: SelectChangeEvent) {
    onChange(event.target.value as OrganizationScreenTabValue);
  }

  if (isDesktop) {
    return (
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 1.5 }}>
        <Tabs
          value={selectedTab}
          onChange={(_, nextTab) => onChange(nextTab)}
          aria-label="Organization screen sections"
        >
          {tabs.map((tab) => (
            <Tab
              key={tab.value}
              className="ph-unmask"
              value={tab.value}
              label={tab.desktopLabel}
            />
          ))}
        </Tabs>
      </Box>
    );
  }

  return (
    <FormControl fullWidth size="small" sx={{ mb: 1.5 }}>
      <InputLabel className="ph-unmask" id="organization-screen-section-label">
        Section
      </InputLabel>
      <Select
        className="ph-unmask"
        labelId="organization-screen-section-label"
        id="organization-screen-section-select"
        value={selectedTab}
        label="Section"
        onChange={handleSelectedTabChange}
      >
        {tabs.map((tab) => (
          <MenuItem className="ph-unmask" key={tab.value} value={tab.value}>
            {tab.mobileLabel}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
}
