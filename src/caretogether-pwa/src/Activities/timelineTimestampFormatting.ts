import { format } from 'date-fns';

import { Activity, ChildLocationChanged } from '../GeneratedClient';

type TimelineTimestampItem = {
  activity?: Activity;
  kind: string;
  timestamp: Date;
};

export function shouldShowTimelineTime(item: TimelineTimestampItem) {
  if (item.kind !== 'family-activity') return false;

  return item.activity instanceof ChildLocationChanged;
}

export function formatTimelineTimestamp(
  item: TimelineTimestampItem,
  formats = {
    date: 'M/d/yy',
    dateTime: 'M/d/yy h:mm a',
  }
) {
  if (shouldShowTimelineTime(item)) {
    return format(item.timestamp, formats.dateTime);
  }

  return format(item.timestamp, formats.date);
}
