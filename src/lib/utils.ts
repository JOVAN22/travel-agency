import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isValidUUID(id: string): boolean {
  return UUID_REGEX.test(id);
}

export function parsePagination(
  pageStr: string | null,
  limitStr: string | null
): { page: number; limit: number } | null {
  const page = parseInt(pageStr ?? '1');
  const limit = parseInt(limitStr ?? '20');
  if (!Number.isInteger(page) || page < 1) return null;
  if (!Number.isInteger(limit) || limit < 1 || limit > 100) return null;
  return { page, limit };
}

export function sanitizeSearch(input: string | null): string {
  return (input ?? '').trim().slice(0, 100);
}

export function sanitizeText(input: string): string {
  return input.trim().replace(/<[^>]+>/g, '');
}
