export const DEFAULT_TIME_ZONE = "America/Toronto";

export type DateInput = Date | string | number;

export interface LocalDateParts {
  year: number;
  month: number;
  day: number;
}

const formatterCache = new Map<string, Intl.DateTimeFormat>();

function getFormatter(timeZone: string): Intl.DateTimeFormat {
  let formatter = formatterCache.get(timeZone);

  if (!formatter) {
    formatter = new Intl.DateTimeFormat("en-CA", {
      timeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
    formatterCache.set(timeZone, formatter);
  }

  return formatter;
}

export function toDate(input: DateInput): Date {
  const date = input instanceof Date ? new Date(input.getTime()) : new Date(input);

  if (Number.isNaN(date.getTime())) {
    throw new Error(`Invalid date input: ${String(input)}`);
  }

  return date;
}

export function getLocalDateParts(
  input: DateInput,
  timeZone: string = DEFAULT_TIME_ZONE,
): LocalDateParts {
  const parts = getFormatter(timeZone).formatToParts(toDate(input));
  const year = Number(parts.find((part) => part.type === "year")?.value);
  const month = Number(parts.find((part) => part.type === "month")?.value);
  const day = Number(parts.find((part) => part.type === "day")?.value);

  return { year, month, day };
}

export function toLocalDateString(
  input: DateInput | LocalDateParts,
  timeZone: string = DEFAULT_TIME_ZONE,
): string {
  const parts = isLocalDateParts(input) ? input : getLocalDateParts(input, timeZone);
  const year = String(parts.year).padStart(4, "0");
  const month = String(parts.month).padStart(2, "0");
  const day = String(parts.day).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export function compareLocalDates(
  left: DateInput | LocalDateParts,
  right: DateInput | LocalDateParts,
  timeZone: string = DEFAULT_TIME_ZONE,
): number {
  const leftKey = toLocalDateString(left, timeZone);
  const rightKey = toLocalDateString(right, timeZone);

  return leftKey.localeCompare(rightKey);
}

export function isBusinessDay(
  input: DateInput | LocalDateParts,
  timeZone: string = DEFAULT_TIME_ZONE,
): boolean {
  const parts = isLocalDateParts(input) ? input : getLocalDateParts(input, timeZone);
  const weekday = new Date(Date.UTC(parts.year, parts.month - 1, parts.day)).getUTCDay();

  return weekday !== 0 && weekday !== 6;
}

export function addCalendarDays(
  input: DateInput | LocalDateParts,
  calendarDays: number,
  timeZone: string = DEFAULT_TIME_ZONE,
): LocalDateParts {
  const parts = isLocalDateParts(input) ? input : getLocalDateParts(input, timeZone);
  const date = new Date(Date.UTC(parts.year, parts.month - 1, parts.day));

  date.setUTCDate(date.getUTCDate() + calendarDays);

  return {
    year: date.getUTCFullYear(),
    month: date.getUTCMonth() + 1,
    day: date.getUTCDate(),
  };
}

export function addBusinessDays(
  input: DateInput | LocalDateParts,
  businessDays: number,
  timeZone: string = DEFAULT_TIME_ZONE,
): string {
  if (businessDays === 0) {
    return toLocalDateString(input, timeZone);
  }

  const step = businessDays > 0 ? 1 : -1;
  let remaining = Math.abs(businessDays);
  let cursor = isLocalDateParts(input) ? input : getLocalDateParts(input, timeZone);

  while (remaining > 0) {
    cursor = addCalendarDays(cursor, step, timeZone);

    if (isBusinessDay(cursor, timeZone)) {
      remaining -= 1;
    }
  }

  return toLocalDateString(cursor, timeZone);
}

export function differenceInBusinessDays(
  start: DateInput | LocalDateParts,
  end: DateInput | LocalDateParts,
  timeZone: string = DEFAULT_TIME_ZONE,
): number {
  const comparison = compareLocalDates(start, end, timeZone);

  if (comparison === 0) {
    return 0;
  }

  if (comparison > 0) {
    return -differenceInBusinessDays(end, start, timeZone);
  }

  let cursor = isLocalDateParts(start) ? start : getLocalDateParts(start, timeZone);
  const target = isLocalDateParts(end) ? end : getLocalDateParts(end, timeZone);
  let businessDays = 0;

  while (compareLocalDates(cursor, target, timeZone) < 0) {
    cursor = addCalendarDays(cursor, 1, timeZone);

    if (isBusinessDay(cursor, timeZone)) {
      businessDays += 1;
    }
  }

  return businessDays;
}

export function maxLocalDate(
  dates: readonly (DateInput | LocalDateParts)[],
  timeZone: string = DEFAULT_TIME_ZONE,
): string | null {
  if (dates.length === 0) {
    return null;
  }

  return dates
    .map((date) => toLocalDateString(date, timeZone))
    .sort((left, right) => right.localeCompare(left))[0];
}

function isLocalDateParts(input: unknown): input is LocalDateParts {
  if (typeof input !== "object" || input === null) {
    return false;
  }

  return "year" in input && "month" in input && "day" in input;
}
