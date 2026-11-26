import { IconButton, Tooltip, type SxProps, type Theme } from '@mui/material';
import {
  Check as CheckIcon,
  ContentCopy as ContentCopyIcon,
} from '@mui/icons-material';
import { useState } from 'react';

type ContactInfoCopyButtonProps = {
  value: string;
  label: string;
  onCopied: (message: string) => void;
  sx?: SxProps<Theme>;
};

export function ContactInfoCopyButton({
  value,
  label,
  onCopied,
  sx = {
    p: 0.25,
    minWidth: { xs: 44, sm: 0 },
    minHeight: { xs: 44, sm: 0 },
  },
}: ContactInfoCopyButtonProps) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      onCopied(`${label} copied`);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      onCopied(`Unable to copy ${label.toLowerCase()}`);
    }
  }

  return (
    <Tooltip title={copied ? 'Copied' : `Copy ${label.toLowerCase()}`}>
      <IconButton
        size="small"
        aria-label={`copy ${label.toLowerCase()}`}
        onClick={() => void handleCopy()}
        sx={sx}
      >
        {copied ? (
          <CheckIcon color="success" fontSize="small" />
        ) : (
          <ContentCopyIcon fontSize="small" />
        )}
      </IconButton>
    </Tooltip>
  );
}
