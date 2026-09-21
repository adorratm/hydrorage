export const RealtimeEvents = {
  INTAKE_CREATED: 'intake:created',
  INTAKE_UPDATED: 'intake:updated',
  INTAKE_DELETED: 'intake:deleted',
  THREAT_SCHEDULED: 'threat:scheduled',
  THREAT_DUE: 'threat:due',
  THREAT_PLAYED: 'threat:played',
  THREAT_COMPLETED: 'threat:completed',
  THREAT_SNOOZED: 'threat:snoozed',
  ROUTINE_MISSED: 'routine:missed',
  ROUTINE_COMPLETED: 'routine:completed',
  DASHBOARD_UPDATED: 'dashboard:updated',
} as const;

export type RealtimeEvent =
  (typeof RealtimeEvents)[keyof typeof RealtimeEvents];
