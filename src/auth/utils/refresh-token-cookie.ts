import type { CookieOptions, Request, Response } from 'express';
import { parseDurationMs } from './parse-duration';

export const REFRESH_TOKEN_COOKIE = 'refreshToken';

export function refreshTokenCookieOptions(): CookieOptions {
  const ttl =
    parseDurationMs(process.env.JWT_REFRESH_EXPIRES_IN ?? '7d') ??
    7 * 86_400_000;
  const isProd = process.env.NODE_ENV === 'production';
  const sameSiteEnv = process.env.COOKIE_SAMESITE?.toLowerCase();
  const sameSite: CookieOptions['sameSite'] =
    sameSiteEnv === 'none' || sameSiteEnv === 'strict' || sameSiteEnv === 'lax'
      ? sameSiteEnv
      : isProd
        ? 'none'
        : 'lax';

  return {
    httpOnly: true,
    secure: isProd || sameSite === 'none',
    sameSite,
    path: '/auth',
    maxAge: ttl,
  };
}

export function setRefreshTokenCookie(res: Response, refreshToken: string) {
  res.cookie(REFRESH_TOKEN_COOKIE, refreshToken, refreshTokenCookieOptions());
}

export function clearRefreshTokenCookie(res: Response) {
  res.clearCookie(REFRESH_TOKEN_COOKIE, {
    ...refreshTokenCookieOptions(),
    maxAge: 0,
  });
}

export function readRefreshTokenCookie(req: Request): string | undefined {
  const cookies = req.cookies as Record<string, string> | undefined;
  const token = cookies?.[REFRESH_TOKEN_COOKIE];
  return typeof token === 'string' && token.length > 0 ? token : undefined;
}
