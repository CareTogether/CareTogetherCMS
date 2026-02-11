import type { Meta, StoryObj } from '@storybook/react';
import { Box, Stack, Typography } from '@mui/material';
import { FamilyMemberChip } from './FamilyMemberChip';
import { ArrangementTypeChip } from './ArrangementTypeChip';
import { FamilyStatusChip } from './FamilyStatusChip';
import { FamilyTypeChip } from './FamilyTypeChip';
import { LocationStatusChip } from './LocationStatusChip';
import { ReferralStatusChip } from './ReferralStatusChip';
import { ProjectStatusChip } from './ProjectStatusChip';
import {
  FamilyMemberType,
  ArrangementType,
  FamilyStatus,
  FamilyType,
  LocationStatus,
  ReferralStatus,
  ProjectStatus,
} from './chipTypes';

const meta: Meta = {
  title: 'Components/Chips/All Chips',
  parameters: {
    layout: 'padded',
  },
};

export default meta;
type Story = StoryObj;

const ChipSection = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <Box mb={4}>
    <Typography variant="h6" gutterBottom>
      {title}
    </Typography>
    <Stack direction="row" spacing={1} flexWrap="wrap" gap={1}>
      {children}
    </Stack>
  </Box>
);

export const AllChips: Story = {
  render: () => (
    <Box>
      <ChipSection title="Family Member Labels">
        <FamilyMemberChip memberType={FamilyMemberType.Mother} />
        <FamilyMemberChip memberType={FamilyMemberType.Father} />
        <FamilyMemberChip memberType={FamilyMemberType.Daughter} />
        <FamilyMemberChip memberType={FamilyMemberType.Son} />
      </ChipSection>

      <ChipSection title="Arrangement Types">
        <ArrangementTypeChip arrangementType={ArrangementType.Hosting} />
        <ArrangementTypeChip arrangementType={ArrangementType.Friending} />
        <ArrangementTypeChip arrangementType={ArrangementType.Mentoring} />
      </ChipSection>

      <ChipSection title="Family Status">
        <FamilyStatusChip status={FamilyStatus.Completed} />
        <FamilyStatusChip status={FamilyStatus.Warning} />
        <FamilyStatusChip status={FamilyStatus.Incomplete} />
      </ChipSection>

      <ChipSection title="Family Types">
        <FamilyTypeChip familyType={FamilyType.PartneringFamily} />
        <FamilyTypeChip familyType={FamilyType.BehavioralNeeds} />
        <FamilyTypeChip familyType={FamilyType.SupportLineVolunteer} />
        <FamilyTypeChip familyType={FamilyType.StaffFamily} />
      </ChipSection>

      <ChipSection title="Location Status">
        <LocationStatusChip locationStatus={LocationStatus.LocationSpecified} />
        <LocationStatusChip locationStatus={LocationStatus.Family} />
        <LocationStatusChip locationStatus={LocationStatus.LocationUnspecified} />
      </ChipSection>

      <ChipSection title="New Referral Status">
        <ReferralStatusChip status={ReferralStatus.Pending} />
        <ReferralStatusChip status={ReferralStatus.InProgress} />
        <ReferralStatusChip status={ReferralStatus.Completed} />
        <ReferralStatusChip status={ReferralStatus.Hosting} />
      </ChipSection>

      <ChipSection title="Project Status">
        <ProjectStatusChip status={ProjectStatus.CompletingIntake} />
        <ProjectStatusChip status={ProjectStatus.IntakeInProgress} />
        <ProjectStatusChip status={ProjectStatus.CompletedIntake} />
        <ProjectStatusChip status={ProjectStatus.Optional} />
        <ProjectStatusChip status={ProjectStatus.Exempted} />
        <ProjectStatusChip status={ProjectStatus.Completed} />
        <ProjectStatusChip status={ProjectStatus.InProgress} />
        <ProjectStatusChip status={ProjectStatus.DaysRemaining} />
        <ProjectStatusChip status={ProjectStatus.Incomplete} />
      </ChipSection>
    </Box>
  ),
};

export const SmallSize: Story = {
  render: () => (
    <Box>
      <ChipSection title="Family Member Labels (Small)">
        <FamilyMemberChip memberType={FamilyMemberType.Mother} size="small" />
        <FamilyMemberChip memberType={FamilyMemberType.Father} size="small" />
        <FamilyMemberChip memberType={FamilyMemberType.Daughter} size="small" />
        <FamilyMemberChip memberType={FamilyMemberType.Son} size="small" />
      </ChipSection>

      <ChipSection title="Arrangement Types (Small)">
        <ArrangementTypeChip arrangementType={ArrangementType.Hosting} size="small" />
        <ArrangementTypeChip arrangementType={ArrangementType.Friending} size="small" />
        <ArrangementTypeChip arrangementType={ArrangementType.Mentoring} size="small" />
      </ChipSection>

      <ChipSection title="Family Status (Small)">
        <FamilyStatusChip status={FamilyStatus.Completed} size="small" />
        <FamilyStatusChip status={FamilyStatus.Warning} size="small" />
        <FamilyStatusChip status={FamilyStatus.Incomplete} size="small" />
      </ChipSection>

      <ChipSection title="Family Types (Small)">
        <FamilyTypeChip familyType={FamilyType.PartneringFamily} size="small" />
        <FamilyTypeChip familyType={FamilyType.BehavioralNeeds} size="small" />
        <FamilyTypeChip familyType={FamilyType.SupportLineVolunteer} size="small" />
        <FamilyTypeChip familyType={FamilyType.StaffFamily} size="small" />
      </ChipSection>

      <ChipSection title="Location Status (Small)">
        <LocationStatusChip locationStatus={LocationStatus.LocationSpecified} size="small" />
        <LocationStatusChip locationStatus={LocationStatus.Family} size="small" />
        <LocationStatusChip locationStatus={LocationStatus.LocationUnspecified} size="small" />
      </ChipSection>

      <ChipSection title="New Referral Status (Small)">
        <ReferralStatusChip status={ReferralStatus.Pending} size="small" />
        <ReferralStatusChip status={ReferralStatus.InProgress} size="small" />
        <ReferralStatusChip status={ReferralStatus.Completed} size="small" />
      </ChipSection>

      <ChipSection title="Project Status (Small)">
        <ProjectStatusChip status={ProjectStatus.CompletingIntake} size="small" />
        <ProjectStatusChip status={ProjectStatus.IntakeInProgress} size="small" />
        <ProjectStatusChip status={ProjectStatus.CompletedIntake} size="small" />
        <ProjectStatusChip status={ProjectStatus.Optional} size="small" />
        <ProjectStatusChip status={ProjectStatus.Exempted} size="small" />
        <ProjectStatusChip status={ProjectStatus.Incomplete} size="small" />
      </ChipSection>
    </Box>
  ),
};

export const FamilyMembers: Story = {
  render: () => (
    <Box>
      <ChipSection title="Parents">
        <FamilyMemberChip memberType={FamilyMemberType.Mother} />
        <FamilyMemberChip memberType={FamilyMemberType.Father} />
      </ChipSection>
      <ChipSection title="Children">
        <FamilyMemberChip memberType={FamilyMemberType.Daughter} />
        <FamilyMemberChip memberType={FamilyMemberType.Son} />
      </ChipSection>
    </Box>
  ),
};

export const Arrangements: Story = {
  render: () => (
    <Stack direction="row" spacing={1} flexWrap="wrap">
      <ArrangementTypeChip arrangementType={ArrangementType.Hosting} />
      <ArrangementTypeChip arrangementType={ArrangementType.Friending} />
      <ArrangementTypeChip arrangementType={ArrangementType.Mentoring} />
    </Stack>
  ),
};

export const Statuses: Story = {
  render: () => (
    <Stack direction="row" spacing={1} flexWrap="wrap">
      <FamilyStatusChip status={FamilyStatus.Completed} />
      <FamilyStatusChip status={FamilyStatus.Warning} />
      <FamilyStatusChip status={FamilyStatus.Incomplete} />
    </Stack>
  ),
};
