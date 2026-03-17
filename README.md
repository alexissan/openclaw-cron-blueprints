# openclaw-cron-blueprints

A TypeScript CLI that generates safe, timezone-aware cron blueprints for OpenClaw automations.

## Why this tool

`ocb` helps you avoid malformed cron payloads by validating:

- timezone (`--tz`) as IANA zone
- one-shot datetime (`--at`) in strict format
- recurring cron expression (`--cron`) basic 5-field syntax/ranges
- event kind (`--kind`) enum: `agentTurn | systemEvent`

It outputs JSON blueprints you can copy into `openclaw cron add` workflows, and for recurring jobs it also prints an equivalent command string.

## Install

```bash
npm install
npm run build
npm link
```

Then run:

```bash
ocb --help
```

## Commands

> Tip: set `OCB_DEFAULT_TZ=Atlantic/Canary` in your shell and `ocb` will use that timezone as a default when you omit `--tz`.

### 1) reminder

```bash
ocb reminder --text "Pay rent" --at "2026-03-11 17:00" --tz "Atlantic/Canary"
```

Output includes **both safe templates**:

- `main + systemEvent`
- `isolated + agentTurn` (`explanation: true`)

Useful when you want a one-shot reminder but still choose where/how OpenClaw should execute it.

### 2) recurring

```bash
ocb recurring \
  --name "Daily Brief" \
  --cron "0 8 * * *" \
  --tz "Atlantic/Canary" \
  --kind "systemEvent" \
  --message "Prepare daily brief with calendar, urgent inbox, weather."
```

Output includes:

- recurring payload JSON
- equivalent `openclaw cron add ...` command string

### 3) presets

```bash
ocb presets
```

Shows built-in practical examples:

- `daily-brief`
- `x-engagement`
- `reminder`

## Safety notes

- Prefer `systemEvent` on **main** for lightweight nudges/alerts.
- Prefer `agentTurn` on **isolated** for longer reasoning tasks or where explanation/auditability matters.
- Keep cron frequency reasonable (avoid aggressive polling loops).
- Validate timezone explicitly instead of relying on host defaults.
- Start with conservative schedules and observe behavior before increasing frequency.

## Development

```bash
npm test
npm run build
```

## License

MIT
