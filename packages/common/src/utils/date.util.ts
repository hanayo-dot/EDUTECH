/**
 * Date and timezone utilities for institutional operations.
 */
export class DateUtil {
  /**
   * Returns current timestamp in UTC ISO format.
   */
  static nowIso(): string {
    return new Date().toISOString();
  }

  /**
   * Validates if a date falls strictly within an active window [startDate, endDate].
   */
  static isWithinWindow(dateToCheck: Date | string, startDate: Date | string, endDate: Date | string): boolean {
    const target = new Date(dateToCheck).getTime();
    const start = new Date(startDate).getTime();
    const end = new Date(endDate).getTime();
    return target >= start && target <= end;
  }

  /**
   * Calculates difference in days between two dates.
   */
  static daysDifference(earlierDate: Date | string, laterDate: Date | string): number {
    const msPerDay = 1000 * 60 * 60 * 24;
    const diff = new Date(laterDate).getTime() - new Date(earlierDate).getTime();
    return Math.floor(diff / msPerDay);
  }
}
