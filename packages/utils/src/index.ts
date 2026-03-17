import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * A utility to merge tailwind classes with clsx logic.
 * This is a standard pattern in modern React monorepos for high-quality UI development.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
