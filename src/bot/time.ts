const BUSINESS_DAYS = new Set([1, 2, 3, 4, 5]);

export function toTimeZoneParts(date: Date, timeZone: string): Intl.DateTimeFormatPart[] {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
    weekday: "short",
  }).formatToParts(date);
}

export function getLocalMinuteOfDay(date: Date, timeZone: string): number {
  const parts = asMap(toTimeZoneParts(date, timeZone));
  return Number(parts.hour) * 60 + Number(parts.minute);
}

export function isBusinessDay(date: Date, timeZone: string): boolean {
  const weekday = asMap(toTimeZoneParts(date, timeZone)).weekday;
  const value = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(weekday);
  return BUSINESS_DAYS.has(value);
}

export function isWithinLocalTimeWindow(date: Date, timeZone: string, targetHour: number, targetMinute: number, windowMinutes: number): boolean {
  const localMinute = getLocalMinuteOfDay(date, timeZone);
  const target = targetHour * 60 + targetMinute;
  return localMinute >= target && localMinute < target + windowMinutes;
}

export function getLocalDateKey(date: Date, timeZone: string): string {
  const parts = asMap(toTimeZoneParts(date, timeZone));
  return `${parts.year}-${parts.month}-${parts.day}`;
}

function asMap(parts: Intl.DateTimeFormatPart[]): Record<string, string> {
  return parts.reduce<Record<string, string>>((accumulator, part) => {
    if (part.type !== "literal") {
      accumulator[part.type] = part.value;
    }
    return accumulator;
  }, {});
}
