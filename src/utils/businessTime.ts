export function getDateKey(date: Date, timeZone: string): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

export function addBusinessDays(date: Date, count: number, timeZone: string): Date {
  const result = new Date(date);
  let remaining = count;

  while (remaining > 0) {
    result.setUTCDate(result.getUTCDate() + 1);
    if (isBusinessDay(result, timeZone)) {
      remaining -= 1;
    }
  }

  return result;
}

export function businessDaysBetween(start: Date, end: Date, timeZone: string): number {
  if (end <= start) {
    return 0;
  }

  const cursor = new Date(start);
  let days = 0;
  while (cursor < end) {
    cursor.setUTCDate(cursor.getUTCDate() + 1);
    if (cursor <= end && isBusinessDay(cursor, timeZone)) {
      days += 1;
    }
  }

  return days;
}

export function isBusinessDay(date: Date, timeZone: string): boolean {
  const weekday = new Intl.DateTimeFormat("en-US", {
    timeZone,
    weekday: "short",
  }).format(date);

  return !["Sat", "Sun"].includes(weekday);
}

export function isWithinBusinessDays(date: Date, days: number, now: Date, timeZone: string): boolean {
  return businessDaysBetween(now, date, timeZone) <= days;
}
