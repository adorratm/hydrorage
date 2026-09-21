import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { parseLocale, type AppLocale } from '@hydrorage/shared';

export function localeFromRequest(req: {
  headers?: Record<string, string | string[] | undefined>;
  query?: Record<string, unknown>;
}): AppLocale {
  const header = req.headers?.['x-locale'] ?? req.headers?.['accept-language'];
  const raw = Array.isArray(header) ? header[0] : header;
  if (typeof req.query?.lang === 'string') {
    return parseLocale(req.query.lang, parseLocale(raw, 'tr'));
  }
  return parseLocale(raw, 'tr');
}

/** Nest param: @Locale() locale: AppLocale */
export const Locale = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): AppLocale => {
    const req = ctx.switchToHttp().getRequest();
    return localeFromRequest(req);
  },
);
