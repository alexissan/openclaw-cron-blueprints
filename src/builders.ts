import { DateTime } from 'luxon';
import { CronKind, RecurringBlueprint, ReminderBlueprint } from './types.js';
import {
  assertNonEmpty,
  parseAtDateTime,
  validateCronExpression,
  validateKind,
  validateTimeZone,
} from './validation.js';

function shellQuote(value: string): string {
  return `'${value.replace(/'/g, `'"'"'`)}'`;
}

export function buildReminderBlueprint(input: {
  text: string;
  at: string;
  tz: string;
}): ReminderBlueprint {
  assertNonEmpty(input.text, 'text');
  const isoAt = parseAtDateTime(input.at, input.tz);

  return {
    type: 'reminder',
    input,
    isoAt,
    templates: {
      mainSystemEvent: {
        sessionTarget: 'main',
        systemEvent: { text: input.text.trim() },
      },
      isolatedAgentTurn: {
        sessionTarget: 'isolated',
        agentTurn: {
          message: input.text.trim(),
          explanation: true,
        },
      },
    },
  };
}

export function buildRecurringBlueprint(input: {
  name: string;
  cron: string;
  tz: string;
  kind: string;
  message: string;
}): RecurringBlueprint {
  assertNonEmpty(input.name, 'name');
  assertNonEmpty(input.message, 'message');
  validateCronExpression(input.cron);
  validateTimeZone(input.tz);
  validateKind(input.kind);

  const kind = input.kind as CronKind;
  const payload =
    kind === 'systemEvent'
      ? {
          sessionTarget: 'main' as const,
          systemEvent: { text: input.message.trim() },
        }
      : {
          sessionTarget: 'isolated' as const,
          agentTurn: { message: input.message.trim(), explanation: true },
        };

  const command =
    kind === 'systemEvent'
      ? `openclaw cron add --name ${shellQuote(input.name)} --cron ${shellQuote(
          input.cron,
        )} --tz ${shellQuote(input.tz)} --session-target main --system-event ${shellQuote(
          input.message,
        )}`
      : `openclaw cron add --name ${shellQuote(input.name)} --cron ${shellQuote(
          input.cron,
        )} --tz ${shellQuote(input.tz)} --session-target isolated --agent-turn ${shellQuote(
          input.message,
        )} --explanation`;

  return {
    type: 'recurring',
    name: input.name,
    schedule: {
      cron: input.cron,
      tz: input.tz,
    },
    kind,
    payload,
    openclawCommand: command,
  };
}

export function buildPresetExamples(): Array<Record<string, unknown>> {
  const tomorrowAtNine = DateTime.now().plus({ days: 1 }).set({ hour: 9, minute: 0, second: 0 });

  return [
    {
      preset: 'daily-brief',
      command: `ocb recurring --name "Daily brief" --cron "0 8 * * *" --tz "Atlantic/Canary" --kind "systemEvent" --message "Prepare a concise daily briefing with calendar + urgent inbox + weather."`,
      useCase: 'Runs in main session and raises a system event for your daily plan.',
    },
    {
      preset: 'x-engagement',
      command: `ocb recurring --name "X engagement" --cron "30 13 * * 1-5" --tz "Atlantic/Canary" --kind "agentTurn" --message "Review X mentions and draft replies; explain rationale before posting."`,
      useCase: 'Runs in isolated mode to reduce cross-talk and include explanation output.',
    },
    {
      preset: 'reminder',
      command: `ocb reminder --text "Stretch and hydrate" --at "${tomorrowAtNine.toFormat(
        'yyyy-MM-dd HH:mm',
      )}" --tz "Atlantic/Canary"`,
      useCase: 'Creates one-shot reminder templates for both main/systemEvent and isolated/agentTurn.',
    },
  ];
}
