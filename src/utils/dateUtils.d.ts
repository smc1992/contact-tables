export function formatDate(date: Date | string | null): string;
export function formatDateTime(date: Date | string | null): string;
export function isPast(date: Date | string): boolean;
export function isFuture(date: Date | string): boolean;
export function addDays(date: Date | string, days: number): Date;
export function timeAgo(date: Date | string): string;
