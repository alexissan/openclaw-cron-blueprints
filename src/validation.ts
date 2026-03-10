import { DateTime, IANAZone } from 'luxon';
import { CronKind } from './types.js';

export function assertNonEmpty(value: string, label: string): void {
  if (!value || value.trim().length === 0) {
    throw new Error(`${label} is required and cannot be empty.`);
  }
}

export function validateKind(kind: string): asserts kind is CronKind {
  if (kind !== 'agentTurn' && kind !== 'systemEvent') {
    throw new Error(`Invalid --kind "${kind}". Allowed values: agentTurn, systemEvent.`);
  }
}

export function validateTimeZone(tz: string): void {
  if (!IANAZone.isValidZone(tz)) {
    throw new Error(`Invalid timezone "${tz}". Use a valid IANA zone, e.g. Atlantic/Canary.`);
  }
}

export function parseAtDateTime(at: string, tz: string): string {
  assertNonEmpty(at, 'at');
  validateTimeZone(tz);

  const dt = DateTime.fromFormat(at, 'yyyy-MM-dd HH:mm', {
    zone: tz,
    setZone: true,
    locale: 'en',
  });

  if (!dt.isValid) {
    throw new Error(
      `Invalid --at "${at}". Expected format: yyyy-MM-dd HH:mm in timezone ${tz}.`,
    );
  }

  return dt.toISO({ suppressMilliseconds: true }) as string;
}

function isInt(value: string): boolean {
  return /^\d+$/.test(value);
}

function validateFieldToken(token: string, min: number, max: number): boolean {
  if (token === '*') return true;

  if (token.includes('/')) {
    const [base, step] = token.split('/');
    if (!step || !isInt(step) || Number(step) <= 0) return false;
    return validateFieldToken(base, min, max);
  }

  if (token.includes(',')) {
    return token.split(',').every((part) => validateFieldToken(part, min, max));
  }

  if (token.includes('-')) {
    const [start, end] = token.split('-');
    if (!isInt(start) || !isInt(end)) return false;
    const s = Number(start);
    const e = Number(end);
    return s >= min && e <= max && s <= e;
  }

  if (!isInt(token)) return false;
  const n = Number(token);
  return n >= min && n <= max;
}

export function validateCronExpression(cron: string): void {
  assertNonEmpty(cron, 'cron');
  const parts = cron.trim().split(/\s+/);
  if (parts.length !== 5) {
    throw new Error('Invalid cron expression. Expected 5 fields: "m h dom mon dow".');
  }

  const [m, h, dom, mon, dow] = parts;
  const rules: Array<[string, number, number, string]> = [
    [m, 0, 59, 'minute'],
    [h, 0, 23, 'hour'],
    [dom, 1, 31, 'day-of-month'],
    [mon, 1, 12, 'month'],
    [dow, 0, 7, 'day-of-week'],
  ];

  for (const [field, min, max, label] of rules) {
    if (!validateFieldToken(field, min, max)) {
      throw new Error(`Invalid cron ${label} field: "${field}".`);
    }
  }
}
