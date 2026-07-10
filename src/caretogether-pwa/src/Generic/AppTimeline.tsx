import {
  Timeline,
  TimelineConnector,
  TimelineContent,
  TimelineDot,
  TimelineItem,
  TimelineOppositeContent,
  TimelineSeparator,
} from '@mui/lab';

function AppTimeline(props: React.ComponentProps<typeof Timeline>) {
  return <Timeline {...props} />;
}

const AppTimelineConnector = TimelineConnector;
const AppTimelineContent = TimelineContent;
const AppTimelineDot = TimelineDot;
const AppTimelineItem = TimelineItem;
const AppTimelineOppositeContent = TimelineOppositeContent;
const AppTimelineSeparator = TimelineSeparator;

export {
  AppTimeline,
  AppTimelineConnector,
  AppTimelineContent,
  AppTimelineDot,
  AppTimelineItem,
  AppTimelineOppositeContent,
  AppTimelineSeparator,
};
