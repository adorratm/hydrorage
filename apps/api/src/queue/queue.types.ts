export type ThreatDueJob = {
  threatId: string;
  userId: string;
  locale?: 'tr' | 'en';
};

export type RoutineSweepJob = {
  reason: 'interval';
};
