import {
  Check as CheckIcon,
  ContentCopy as ContentCopyIcon,
} from '@mui/icons-material';
import { IconButton, Tooltip } from '@mui/material';
import { useState } from 'react';

type ContactInfoCopyButtonProps = {
  value: string;
  label: string;
  onCopied: (message: string) => void;
};

export function ContactInfoCopyButton({
  value,
  label,
  onCopied,
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
        sx={{ p: 0.25 }}
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
