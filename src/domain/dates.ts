const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

// timeZone "UTC" on both sides: "2026-11-07" is parsed as UTC midnight and
// formatted in UTC, so the browser's own timezone can never shift the day.
const weekdayFormat = new Intl.DateTimeFormat("en-US", {
  weekday: "short",
  timeZone: "UTC",
});

/** "2026-11-07" → "Sat". Returns the input unchanged if it isn't a valid date. */
export function formatDayName(isoDate: string): string {
  if (!ISO_DATE.test(isoDate)) return isoDate;
  const date = new Date(`${isoDate}T00:00:00Z`);
  if (Number.isNaN(date.getTime())) return isoDate;
  return weekdayFormat.format(date);
}

/** Label for a forecast row. The first day of the forecast is today in the city's timezone. */
export function forecastDayLabel(isoDate: string, index: number): string {
  return index === 0 ? "Today" : formatDayName(isoDate);
}
