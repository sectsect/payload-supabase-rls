import type { ClassValue } from 'clsx';
import clsx from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * The `tailwindClass` function in TypeScript merges multiple Tailwind CSS class names into a single
 * string.
 * @param classNames - The `classNames` parameter is a rest parameter in TypeScript that
 * allows the function `tailwindClass` to accept an arbitrary number of arguments of type `ClassValue`.
 * These arguments are then collected into an array called `classNames` within the function body.
 */
export const tailwindClass = (...classNames: ClassValue[]) =>
  twMerge(clsx(...classNames));
