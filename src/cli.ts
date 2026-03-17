#!/usr/bin/env node
import { Command } from 'commander';
import {
  buildPresetExamples,
  buildRecurringBlueprint,
  buildReminderBlueprint,
} from './builders.js';

const program = new Command();

program
  .name('ocb')
  .description('OpenClaw Cron Blueprints CLI')
  .version('0.1.0');

program
  .command('reminder')
  .description('Generate one-shot reminder templates for OpenClaw cron payloads')
  .requiredOption('--text <text>', 'Reminder text')
  .requiredOption('--at <datetime>', 'Datetime in yyyy-MM-dd HH:mm format')
  .option('--tz <timezone>', 'IANA timezone, e.g. Atlantic/Canary (defaults to process.env.OCB_DEFAULT_TZ)')
  .action((opts) => {
    const tz = opts.tz || process.env.OCB_DEFAULT_TZ;
    if (!tz) {
      console.error('Error: --tz is required when OCB_DEFAULT_TZ is not set.');
      process.exit(1);
    }
    const out = buildReminderBlueprint({ text: opts.text, at: opts.at, tz });
    console.log(JSON.stringify(out, null, 2));
  });

program
  .command('recurring')
  .description('Generate recurring cron payload and equivalent openclaw cron add command')
  .requiredOption('--name <name>', 'Cron job name')
  .requiredOption('--cron <expr>', 'Cron expression (5-field)')
  .requiredOption('--tz <timezone>', 'IANA timezone, e.g. Atlantic/Canary')
  .requiredOption('--kind <kind>', 'agentTurn or systemEvent')
  .requiredOption('--message <message>', 'Message text for the event')
  .action((opts) => {
    const out = buildRecurringBlueprint({
      name: opts.name,
      cron: opts.cron,
      tz: opts.tz,
      kind: opts.kind,
      message: opts.message,
    });
    console.log(JSON.stringify(out, null, 2));
  });

program
  .command('presets')
  .description('Show built-in OpenClaw cron preset examples')
  .action(() => {
    console.log(JSON.stringify({ presets: buildPresetExamples() }, null, 2));
  });

try {
  program.parse(process.argv);
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`Error: ${message}`);
  process.exit(1);
}
