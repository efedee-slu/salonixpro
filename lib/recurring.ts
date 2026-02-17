// lib/recurring.ts
// Date generation helper for recurring appointment series

export type RecurringFrequency = "WEEKLY" | "BIWEEKLY" | "MONTHLY";

/**
 * Generate an array of dates for a recurring appointment series.
 *
 * @param startDate  - First occurrence date
 * @param frequency  - WEEKLY, BIWEEKLY, or MONTHLY
 * @param timeOfDay  - "HH:mm" string (e.g. "09:00")
 * @param occurrences - Total number of dates to generate
 * @param dayOfWeek  - 0-6 (Sun-Sat) for WEEKLY/BIWEEKLY
 * @param dayOfMonth - 1-28 for MONTHLY
 * @returns Array of Date objects
 */
export function generateRecurringDates(
  startDate: Date,
  frequency: RecurringFrequency,
  timeOfDay: string,
  occurrences: number,
  dayOfWeek?: number | null,
  dayOfMonth?: number | null
): Date[] {
  const dates: Date[] = [];
  const [hours, minutes] = timeOfDay.split(":").map(Number);

  // Start from the given start date
  let current = new Date(startDate);
  current.setHours(hours, minutes, 0, 0);

  for (let i = 0; i < occurrences; i++) {
    if (i === 0) {
      dates.push(new Date(current));
      continue;
    }

    switch (frequency) {
      case "WEEKLY":
        current = new Date(current);
        current.setDate(current.getDate() + 7);
        break;

      case "BIWEEKLY":
        current = new Date(current);
        current.setDate(current.getDate() + 14);
        break;

      case "MONTHLY": {
        current = new Date(current);
        const targetDay = dayOfMonth ?? current.getDate();
        const nextMonth = current.getMonth() + 1;
        const nextYear = current.getFullYear() + (nextMonth > 11 ? 1 : 0);
        const adjustedMonth = nextMonth % 12;

        // Get last day of the target month
        const lastDay = new Date(nextYear, adjustedMonth + 1, 0).getDate();
        const clampedDay = Math.min(targetDay, lastDay);

        current = new Date(nextYear, adjustedMonth, clampedDay, hours, minutes, 0, 0);
        break;
      }
    }

    current.setHours(hours, minutes, 0, 0);
    dates.push(new Date(current));
  }

  return dates;
}
