/**
 * Utility function to conditionally join class names
 * @param classes list of class names or falsy values
 */
export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ');
}
