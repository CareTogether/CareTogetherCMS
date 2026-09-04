import {
  Box,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Tab,
  Tabs,
} from '@mui/material';
import type { SelectChangeEvent } from '@mui/material/Select';
import type { ReactNode } from 'react';

export type ResponsiveScreenTab<TValue extends string> = {
  value: TValue;
  desktopLabel: ReactNode;
  mobileLabel: string;
};

type ResponsiveScreenTabsProps<TValue extends string> = {
  ariaLabel: string;
  idPrefix: string;
  tabs: ResponsiveScreenTab<TValue>[];
  selectedTab: TValue;
  isDesktop: boolean;
  onChange: (nextTab: TValue) => void;
};

export function ResponsiveScreenTabs<TValue extends string>({
  ariaLabel,
  idPrefix,
  tabs,
  selectedTab,
  isDesktop,
  onChange,
}: ResponsiveScreenTabsProps<TValue>) {
  function handleSelectedTabChange(event: SelectChangeEvent) {
    onChange(event.target.value as TValue);
  }

  if (isDesktop) {
    return (
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 1.5 }}>
        <Tabs
          value={selectedTab}
          onChange={(_, nextTab: TValue) => onChange(nextTab)}
          aria-label={ariaLabel}
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

  const labelId = `${idPrefix}-section-label`;
  return (
    <FormControl fullWidth size="small" sx={{ mb: 1.5 }}>
      <InputLabel className="ph-unmask" id={labelId}>
        Section
      </InputLabel>
      <Select
        className="ph-unmask"
        labelId={labelId}
        id={`${idPrefix}-section-select`}
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
