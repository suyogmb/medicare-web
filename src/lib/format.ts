export const formatNumber = (value: number): string => value.toLocaleString('en-US');

/** Zero-padded two-digit count used for critical metrics ("08"). */
export const padCount = (value: number): string => String(value).padStart(2, '0');

export function initials(name: string): string {
  return name
    .replace(/^Dr\.\s*/, '')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');
}
