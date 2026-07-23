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

export type FamilyScreenTabValue =
  | 'overview'
  | 'caseHistory'
  | 'approvals'
  | 'arrangementsOrAssignments'
  | 'documents'
  | 'timelineAndNotes';

export type FamilyScreenTab = {
  value: FamilyScreenTabValue;
  label: string;
  desktopLabel: ReactNode;
  mobileLabel: string;
};

type FamilyScreenTabsV2Props = {
  tabs: FamilyScreenTab[];
  selectedTab: FamilyScreenTabValue;
  isDesktop: boolean;
  onChange: (nextTab: FamilyScreenTabValue) => void;
};

export function FamilyScreenTabsV2({
  tabs,
  selectedTab,
  isDesktop,
  onChange,
}: FamilyScreenTabsV2Props) {
  function handleSelectedTabChange(event: SelectChangeEvent) {
    onChange(event.target.value as FamilyScreenTabValue);
  }

  if (isDesktop) {
    return (
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 1.5 }}>
        <Tabs
          value={selectedTab}
          onChange={(_, nextTab) => onChange(nextTab)}
          aria-label="Family screen sections"
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
      <InputLabel className="ph-unmask" id="family-screen-section-label">
        Section
      </InputLabel>
      <Select
        className="ph-unmask"
        labelId="family-screen-section-label"
        id="family-screen-section-select"
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
