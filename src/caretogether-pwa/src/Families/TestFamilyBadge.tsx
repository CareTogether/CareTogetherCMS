import { Chip } from '@mui/material';
import { CombinedFamilyInfo } from '../GeneratedClient';

type Props = { family: CombinedFamilyInfo; size?: 'small' | 'medium' };

export function TestFamilyBadge({ family, size = 'small' }: Props) {
  const isTest = family?.family?.isTestFamily === true;
  if (!isTest) return null;
  return (
    <Chip
      size={size}
      label="Test Family"
      color="warning"
      sx={{ ml: 1, height: 22 }}
    />
  );
}
