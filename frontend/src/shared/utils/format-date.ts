const DEFAULT_OPTIONS: Intl.DateTimeFormatOptions = {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
};

export function formatLibraryDate(
  value: string | null,
  options: Intl.DateTimeFormatOptions = DEFAULT_OPTIONS,
  fallback = '—',
): string {
  if (!value) return fallback;
  if (/^\d{4}$/.test(value)) return value;

  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return fallback;

  const [, year, month, day] = match;
  const date = new Date(Number(year), Number(month) - 1, Number(day), 12);
  if (
    date.getFullYear() !== Number(year) ||
    date.getMonth() !== Number(month) - 1 ||
    date.getDate() !== Number(day)
  ) {
    return fallback;
  }

  return new Intl.DateTimeFormat('pt-BR', options).format(date);
}
