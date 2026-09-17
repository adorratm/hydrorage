export const REDIS = Symbol('REDIS');

export const THREATS_QUEUE = 'threats';
export const ROUTINES_QUEUE = 'routines';

export const QUEUE_TOKENS = {
  THREATS: Symbol('THREATS_QUEUE'),
  ROUTINES: Symbol('ROUTINES_QUEUE'),
} as const;
