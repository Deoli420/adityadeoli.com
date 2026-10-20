/** Join class names, skipping falsy values (stand-in for clsx/tailwind-merge's `cn`). */
export function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(' ');
}
