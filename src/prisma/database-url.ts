import { env } from 'node:process';

function buildUrlFromParts(
  user: string,
  password: string,
  host: string,
  port: string,
  name: string,
): string {
  return `postgresql://${user}:${encodeURIComponent(password)}@${host}:${port}/${name}?schema=public`;
}

export function databaseUrl(): string {
  if (env.DATABASE_URL) {
    return env.DATABASE_URL;
  }

  const user = env.DB_USER ?? env.DEV_DB_USER;
  const password = env.DB_PASSWORD ?? env.DEV_DB_PASSWORD;
  const host = env.DB_HOST ?? env.DEV_DB_HOST;
  const port = env.DB_PORT ?? env.DEV_DB_PORT;
  const name = env.DB_NAME ?? env.DEV_DB_NAME;

  if (user && password && host && port && name) {
    return buildUrlFromParts(user, password, host, port, name);
  }

  throw new Error(
    'Set DATABASE_URL, or DB_USER/DB_PASSWORD/DB_HOST/DB_PORT/DB_NAME (DEV_DB_* also works for local).',
  );
}
