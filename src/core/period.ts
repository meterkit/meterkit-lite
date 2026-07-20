/**
 * Start of the current usage period.
 * - No anchor: first instant of `now`'s calendar month, in UTC.
 * - With anchor (e.g. a Stripe subscription start): the most recent monthly
 *   anniversary of `anchor` that is at or before `now`. The anchor's day is
 *   clamped to each target month's length (Jan 31 -> Feb 28 -> Mar 31) and its
 *   time-of-day is preserved.
 * Pure: does not mutate its arguments.
 */
export const currentPeriodStart = (now: Date, anchor?: Date): Date => {
  if (!anchor) {
    return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  }
  const anniversary = (year: number, month: number): Date => {
    const lastDay = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
    const day = Math.min(anchor.getUTCDate(), lastDay);
    return new Date(Date.UTC(
      year, month, day,
      anchor.getUTCHours(), anchor.getUTCMinutes(),
      anchor.getUTCSeconds(), anchor.getUTCMilliseconds(),
    ));
  };
  let year = anchor.getUTCFullYear();
  let month = anchor.getUTCMonth();
  let start = anniversary(year, month);
  for (;;) {
    const nextMonthIndex = month + 1;
    const nextYear = year + Math.floor(nextMonthIndex / 12);
    const nextMonth = ((nextMonthIndex % 12) + 12) % 12;
    const next = anniversary(nextYear, nextMonth);
    if (next.getTime() > now.getTime()) break;
    year = nextYear;
    month = nextMonth;
    start = next;
  }
  return start;
};
