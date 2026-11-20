// Jordan's working week is Sunday–Thursday; Friday and Saturday are the weekend.

export function isBusinessDay(d: Date): boolean {
  const day = d.getUTCDay(); // 0 Sun … 5 Fri, 6 Sat
  return day !== 5 && day !== 6;
}

export function toDate(iso: string): Date {
  return new Date(iso.slice(0, 10) + 'T00:00:00Z');
}

export function toIso(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export function addBusinessDays(iso: string, n: number): string {
  const d = toDate(iso);
  let added = 0;
  while (added < n) {
    d.setUTCDate(d.getUTCDate() + 1);
    if (isBusinessDay(d)) added++;
  }
  return toIso(d);
}

/** Business days from `from` (exclusive) to `to` (inclusive). Negative when `to` is earlier. */
export function businessDaysBetween(from: string, to: string): number {
  if (to === from) return 0;
  const sign = to > from ? 1 : -1;
  const [a, b] = sign > 0 ? [from, to] : [to, from];
  const d = toDate(a);
  const end = toDate(b);
  let count = 0;
  while (d < end) {
    d.setUTCDate(d.getUTCDate() + 1);
    if (isBusinessDay(d)) count++;
  }
  return count * sign;
}

export function addDays(iso: string, n: number): string {
  const d = toDate(iso);
  d.setUTCDate(d.getUTCDate() + n);
  return toIso(d);
}
