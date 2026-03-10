import { describe, expect, it } from 'vitest';
import {
  buildPresetExamples,
  buildRecurringBlueprint,
  buildReminderBlueprint,
} from '../src/builders.js';
import {
  parseAtDateTime,
  validateCronExpression,
  validateKind,
  validateTimeZone,
} from '../src/validation.js';

describe('validation', () => {
  it('accepts valid timezone', () => {
    expect(() => validateTimeZone('Atlantic/Canary')).not.toThrow();
  });

  it('rejects invalid timezone', () => {
    expect(() => validateTimeZone('Mars/OlympusMons')).toThrow(/Invalid timezone/);
  });

  it('parses valid at datetime', () => {
    const iso = parseAtDateTime('2026-03-11 17:00', 'Atlantic/Canary');
    expect(iso).toContain('2026-03-11T17:00:00');
  });

  it('rejects malformed at datetime', () => {
    expect(() => parseAtDateTime('03/11/2026 17:00', 'Atlantic/Canary')).toThrow(/Expected format/);
  });

  it('accepts valid cron expression', () => {
    expect(() => validateCronExpression('30 13 * * 1-5')).not.toThrow();
  });

  it('rejects invalid cron expression', () => {
    expect(() => validateCronExpression('70 13 * * *')).toThrow(/Invalid cron minute field/);
  });

  it('rejects invalid kind enum', () => {
    expect(() => validateKind('event')).toThrow(/Allowed values/);
  });
});

describe('builders', () => {
  it('builds reminder blueprint with both template modes', () => {
    const bp = buildReminderBlueprint({
      text: 'Take meds',
      at: '2026-03-11 17:00',
      tz: 'Atlantic/Canary',
    });

    expect(bp.type).toBe('reminder');
    expect(bp.templates.mainSystemEvent.sessionTarget).toBe('main');
    expect(bp.templates.isolatedAgentTurn.sessionTarget).toBe('isolated');
    expect(bp.templates.isolatedAgentTurn.agentTurn.explanation).toBe(true);
  });

  it('builds recurring blueprint and openclaw command for systemEvent', () => {
    const bp = buildRecurringBlueprint({
      name: 'Daily Brief',
      cron: '0 8 * * *',
      tz: 'Atlantic/Canary',
      kind: 'systemEvent',
      message: 'Do daily brief',
    });

    expect(bp.payload.sessionTarget).toBe('main');
    expect(bp.payload.systemEvent?.text).toBe('Do daily brief');
    expect(bp.openclawCommand).toContain('--system-event');
  });

  it('builds recurring blueprint and openclaw command for agentTurn', () => {
    const bp = buildRecurringBlueprint({
      name: 'Engagement',
      cron: '30 13 * * 1-5',
      tz: 'Atlantic/Canary',
      kind: 'agentTurn',
      message: 'Review mentions',
    });

    expect(bp.payload.sessionTarget).toBe('isolated');
    expect(bp.payload.agentTurn?.message).toBe('Review mentions');
    expect(bp.openclawCommand).toContain('--agent-turn');
    expect(bp.openclawCommand).toContain('--explanation');
  });

  it('returns all built-in presets', () => {
    const presets = buildPresetExamples();
    expect(presets).toHaveLength(3);
  });
});
