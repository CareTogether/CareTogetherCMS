export function formatUtcDateOnly(input: Date) {
  // format date only to en-US date format, without time zone offsetting
  // 2025-11-22T00:00:00.000Z will output 11/22/2025, independently of browser's time zone
  return new Intl.DateTimeFormat('en-US', {
    timeZone: 'UTC',
  }).format(input);
}
