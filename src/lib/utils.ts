import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Returns a deduplicated, sorted list of sector names.
 * Sectors with the same name (case-insensitive) are merged,
 * keeping the Title Case version (first letter uppercase, rest lowercase).
 */
export function uniqueSectors(sectors: string[]): string[] {
  const seen = new Map<string, string>();
  for (const s of sectors) {
    const key = s.toLowerCase().trim();
    if (!seen.has(key)) {
      // Normalize to Title Case
      seen.set(key, s.charAt(0).toUpperCase() + s.slice(1).toLowerCase());
    }
  }
  return Array.from(seen.values()).sort();
}
