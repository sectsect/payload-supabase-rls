import dayjs from 'dayjs';

/**
 * Formats a date string into a specific format.
 * @param date - The date string to format.
 * @returns A formatted date string in the format 'YYYY.MM.DD HH:mm'.
 */
export const formatDate = (date: string) =>
  dayjs(date).format('YYYY.MM.DD HH:mm');

/**
 * Get current date and time
 *
 * @returns string
 */
export const getCurrenrDatetime = (): string => new Date().toLocaleString();

/**
 * Get currrent year.
 *
 * @returns number
 */
export const getCurrentYear = (): number => new Date().getFullYear();

/**
 * Get currrent month.
 *
 * @returns number
 */
export const getCurrentMonth = (): number => new Date().getMonth() + 1;

/**
 * Get currrent day.
 *
 * @returns number
 */
export const getCurrentDay = (): number => new Date().getDate();
