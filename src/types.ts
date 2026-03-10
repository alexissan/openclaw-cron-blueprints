export type CronKind = 'agentTurn' | 'systemEvent';

export type SessionTarget = 'main' | 'isolated';

export interface ReminderBlueprint {
  type: 'reminder';
  input: {
    text: string;
    at: string;
    tz: string;
  };
  isoAt: string;
  templates: {
    mainSystemEvent: {
      sessionTarget: 'main';
      systemEvent: { text: string };
    };
    isolatedAgentTurn: {
      sessionTarget: 'isolated';
      agentTurn: { message: string; explanation: boolean };
    };
  };
}

export interface RecurringBlueprint {
  type: 'recurring';
  name: string;
  schedule: {
    cron: string;
    tz: string;
  };
  kind: CronKind;
  payload: {
    sessionTarget: SessionTarget;
    systemEvent?: { text: string };
    agentTurn?: { message: string; explanation: boolean };
  };
  openclawCommand: string;
}
