import { Phone as PhoneIcon } from '@mui/icons-material';
import { Box, Stack, Typography } from '@mui/material';
import { v2Typography } from '../Families/v2Typography';

type ClientFamilyCellV2Props = {
  familyName: string;
  phoneNumber?: string;
  primaryContactName?: string;
};

export function ClientFamilyCellV2({
  familyName,
  phoneNumber,
  primaryContactName,
}: ClientFamilyCellV2Props) {
  return (
    <Stack spacing={0.5} sx={{ minWidth: 0 }}>
      <Typography
        {...v2Typography.primaryValue}
        noWrap
        sx={{ ...v2Typography.primaryValue.sx, fontWeight: 700, minWidth: 0 }}
      >
        {familyName}
      </Typography>
      {(primaryContactName || phoneNumber) && (
        <Box
          sx={{
            alignItems: 'center',
            display: 'flex',
            flexWrap: 'wrap',
            gap: 0.75,
            minWidth: 0,
          }}
        >
          {primaryContactName && (
            <Typography
              {...v2Typography.browserSecondary}
              noWrap
              sx={{ minWidth: 0 }}
            >
              {primaryContactName}
            </Typography>
          )}
          {phoneNumber && (
            <Box
              sx={{
                alignItems: 'center',
                display: 'inline-flex',
                gap: 0.5,
                minWidth: 0,
                whiteSpace: 'nowrap',
              }}
            >
              <PhoneIcon color="action" fontSize="small" />
              <Typography
                {...v2Typography.browserSecondary}
                noWrap
                sx={{ minWidth: 0 }}
              >
                {phoneNumber}
              </Typography>
            </Box>
          )}
        </Box>
      )}
    </Stack>
  );
}
