export type ClassValue = string | false | null | undefined;

/** Tiny className joiner — filters out falsy values and joins with spaces. */
export function cn(...classes: ClassValue[]): string {
  return classes.filter(Boolean).join(' ');
}
