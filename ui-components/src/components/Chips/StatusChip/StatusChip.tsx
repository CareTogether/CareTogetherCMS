import { Chip, ChipProps } from "@mui/material";

type StatusChipBaseProps = Pick<ChipProps, "size" | "variant" | "sx">;

export type StatusType =
  | "active"
  | "inactive"
  | "pending"
  | "approved"
  | "rejected"
  | "completed"
  | "in-progress";

export interface StatusChipProps extends StatusChipBaseProps {
  /**
   * Status type that determines color and label
   */
  status: StatusType;
  /**
   * Optional custom label (overrides default status label)
   */
  label?: string;
}

const statusConfig: Record<
  StatusType,
  { label: string; color: "success" | "error" | "warning" | "info" | "default" }
> = {
  active: { label: "Active", color: "success" },
  inactive: { label: "Inactive", color: "default" },
  pending: { label: "Pending", color: "warning" },
  approved: { label: "Approved", color: "success" },
  rejected: { label: "Rejected", color: "error" },
  completed: { label: "Completed", color: "success" },
  "in-progress": { label: "In Progress", color: "info" },
};

/**
 * Status indicator chip component
 * @component
 * @example
 * <StatusChip status="approved" />
 * <StatusChip status="pending" label="Awaiting Review" />
 */
export const StatusChip = ({
  status,
  label,
  size = "small",
  ...rest
}: StatusChipProps) => {
  const config = statusConfig[status];
  const displayLabel = label || config.label;

  return (
    <Chip label={displayLabel} color={config.color} size={size} {...rest} />
  );
};
