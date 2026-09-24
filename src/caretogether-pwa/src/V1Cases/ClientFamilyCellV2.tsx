import { Phone as PhoneIcon } from '@mui/icons-material';
import { Box, Stack, Typography } from '@mui/material';
import { v2Typography } from '../Families/v2Typography';

type ClientFamilyCellV2Props = {
  familyName: string;
  memberCount?: number;
  phoneNumber?: string;
};

export function ClientFamilyCellV2({
  familyName,
  memberCount,
  phoneNumber,
}: ClientFamilyCellV2Props) {
  return (
    <Stack
      component="span"
      spacing={0.5}
      sx={{ display: 'inline-flex', minWidth: 0 }}
    >
      <Box
        component="span"
        sx={{ alignItems: 'center', display: 'flex', gap: 0.75, minWidth: 0 }}
      >
        <Typography
          component="span"
          {...v2Typography.primaryValue}
          noWrap
          sx={{
            ...v2Typography.primaryValue.sx,
            flex: '0 1 auto',
            fontWeight: 700,
            minWidth: 0,
          }}
        >
          {familyName}
        </Typography>
        {phoneNumber && (
          <Box
            component="span"
            sx={{
              alignItems: 'center',
              display: 'inline-flex',
              flex: '0 0 auto',
              gap: 0.5,
              whiteSpace: 'nowrap',
            }}
          >
            <PhoneIcon color="action" fontSize="small" />
            <Typography component="span" {...v2Typography.browserSecondary}>
              {phoneNumber}
            </Typography>
          </Box>
        )}
      </Box>
      {memberCount !== undefined && (
        <Box component="span" sx={{ display: 'flex', minWidth: 0 }}>
          <Typography
            component="span"
            {...v2Typography.browserSecondary}
            noWrap
            sx={{ minWidth: 0 }}
          >
            {memberCount} {memberCount === 1 ? 'member' : 'members'}
          </Typography>
        </Box>
      )}
    </Stack>
  );
}
