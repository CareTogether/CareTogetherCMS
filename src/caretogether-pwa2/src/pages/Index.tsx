import { Box, Container, Typography, Stack, Divider } from '@mui/material';
import { ColoredChip, ContextHeader } from '@caretogether/ui-components';
import { PersonProfileCard } from '../components/PersonProfileCard';
import { ReferralCard } from '../components/ReferralCard';
import {
  FamilyMemberChip,
  ArrangementTypeChip,
  FamilyStatusChip,
  FamilyTypeChip,
  LocationStatusChip,
  ReferralStatusChip,
  ProjectStatusChip,
} from '../components/chips';
import {
  FamilyMemberType,
  ArrangementType,
  FamilyStatus,
  FamilyType,
  LocationStatus,
  ReferralStatus,
  ProjectStatus,
} from '../components/chips/chipTypes';
import { mockPersonProfileData } from '../components/PersonProfileCard/mockData';
import { mockReferralData } from '../components/ReferralCard/mockData';
import StarIcon from '@mui/icons-material/Star';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

const ChipShowcaseSection = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <Box sx={{ mb: 4 }}>
    <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
      {title}
    </Typography>
    <Stack direction="row" spacing={1} flexWrap="wrap" gap={1}>
      {children}
    </Stack>
  </Box>
);

export const Index = () => {
  return (
    <>
      <ContextHeader sx={{ py: 4 }}>
        <ContextHeader.Breadcrumbs
          items={[
            { label: 'Home', onClick: () => console.log('Home clicked') },
            { label: 'Component Showcase' },
          ]}
        />
        <ContextHeader.Title
          title="Component Showcase"
          chip={<ColoredChip label="Demo" color="info" />}
        />
        <ContextHeader.Content>
          <Typography variant="body2">
            Displaying chip components, person profile card, and referral card
          </Typography>
        </ContextHeader.Content>
      </ContextHeader>

      <Container maxWidth="lg" sx={{ py: 4 }}>
        {/* Chip Components Section */}
        <Typography variant="h5" sx={{ mb: 3, fontWeight: 600 }}>
          Chip Components
        </Typography>

        {/* Generic ColoredChip from ui-components */}
        <ChipShowcaseSection title="Generic ColoredChip (from ui-components)">
          <ColoredChip label="Default" />
          <ColoredChip label="Primary" color="primary" />
          <ColoredChip label="Secondary" color="secondary" />
          <ColoredChip label="Success" color="success" />
          <ColoredChip label="Info" color="info" />
          <ColoredChip label="Warning" color="warning" />
          <ColoredChip label="Error" color="error" />
          <ColoredChip label="With Icon" startIcon={<StarIcon />} color="primary" />
          <ColoredChip label="Custom Color" color="#FF9800" startIcon={<CheckCircleIcon />} />
        </ChipShowcaseSection>

        <Divider sx={{ my: 3 }} />

        {/* Family Member Chips */}
        <ChipShowcaseSection title="Family Member Chips">
          <FamilyMemberChip memberType={FamilyMemberType.Mother} />
          <FamilyMemberChip memberType={FamilyMemberType.Father} />
          <FamilyMemberChip memberType={FamilyMemberType.Daughter} />
          <FamilyMemberChip memberType={FamilyMemberType.Son} />
        </ChipShowcaseSection>

        <Divider sx={{ my: 3 }} />

        {/* Arrangement Type Chips */}
        <ChipShowcaseSection title="Arrangement Type Chips">
          <ArrangementTypeChip arrangementType={ArrangementType.Hosting} />
          <ArrangementTypeChip arrangementType={ArrangementType.Friending} />
          <ArrangementTypeChip arrangementType={ArrangementType.Mentoring} />
        </ChipShowcaseSection>

        <Divider sx={{ my: 3 }} />

        {/* Family Status Chips */}
        <ChipShowcaseSection title="Family Status Chips">
          <FamilyStatusChip status={FamilyStatus.Completed} />
          <FamilyStatusChip status={FamilyStatus.Warning} />
          <FamilyStatusChip status={FamilyStatus.Incomplete} />
        </ChipShowcaseSection>

        <Divider sx={{ my: 3 }} />

        {/* Family Type Chips */}
        <ChipShowcaseSection title="Family Type Chips">
          <FamilyTypeChip familyType={FamilyType.PartneringFamily} />
          <FamilyTypeChip familyType={FamilyType.BehavioralNeeds} />
          <FamilyTypeChip familyType={FamilyType.SupportLineVolunteer} />
          <FamilyTypeChip familyType={FamilyType.StaffFamily} />
        </ChipShowcaseSection>

        <Divider sx={{ my: 3 }} />

        {/* Location Status Chips */}
        <ChipShowcaseSection title="Location Status Chips">
          <LocationStatusChip locationStatus={LocationStatus.LocationSpecified} />
          <LocationStatusChip locationStatus={LocationStatus.Family} />
          <LocationStatusChip locationStatus={LocationStatus.LocationUnspecified} />
        </ChipShowcaseSection>

        <Divider sx={{ my: 3 }} />

        {/* Referral Status Chips */}
        <ChipShowcaseSection title="Referral Status Chips">
          <ReferralStatusChip status={ReferralStatus.Pending} />
          <ReferralStatusChip status={ReferralStatus.InProgress} />
          <ReferralStatusChip status={ReferralStatus.Completed} />
          <ReferralStatusChip status={ReferralStatus.Hosting} />
        </ChipShowcaseSection>

        <Divider sx={{ my: 3 }} />

        {/* Project Status Chips */}
        <ChipShowcaseSection title="Project Status Chips">
          <ProjectStatusChip status={ProjectStatus.CompletingIntake} />
          <ProjectStatusChip status={ProjectStatus.IntakeInProgress} />
          <ProjectStatusChip status={ProjectStatus.CompletedIntake} />
          <ProjectStatusChip status={ProjectStatus.Optional} />
          <ProjectStatusChip status={ProjectStatus.Exempted} />
          <ProjectStatusChip status={ProjectStatus.Completed} />
          <ProjectStatusChip status={ProjectStatus.InProgress} />
          <ProjectStatusChip status={ProjectStatus.DaysRemaining} />
          <ProjectStatusChip status={ProjectStatus.Incomplete} />
        </ChipShowcaseSection>

        {/* Person Profile Card Section */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h5" sx={{ mb: 2, fontWeight: 600 }}>
            Person Profile Card
          </Typography>
          <PersonProfileCard
            data={mockPersonProfileData}
            onMoreClick={() => console.log('More clicked')}
            onViewSchedule={() => console.log('View Schedule clicked')}
          />
        </Box>

        {/* Referral Card Section */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h5" sx={{ mb: 2, fontWeight: 600 }}>
            Referral Card
          </Typography>
          <ReferralCard
            data={mockReferralData}
            onAssignClient={() => console.log('Assign Client clicked')}
            onNewNote={() => console.log('New Note clicked')}
            onNavigateNext={() => console.log('Navigate Next clicked')}
          />
        </Box>
      </Container>
    </>
  );
};
