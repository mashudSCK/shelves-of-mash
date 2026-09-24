import { format, formatDistanceToNow } from 'date-fns';

export function formatPublishedDate(iso: string | null): string {
  if (!iso) return 'Undated';
  return format(new Date(iso), 'MMMM d, yyyy');
}

export function formatRelative(iso: string | null): string {
  if (!iso) return '';
  return formatDistanceToNow(new Date(iso), { addSuffix: true });
}

export function formatReadingTime(minutes: number): string {
  if (minutes < 1) return 'Under a minute';
  return `${Math.round(minutes)} min read`;
}
