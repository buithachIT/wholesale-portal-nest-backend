/// <reference types="node" />
import 'dotenv/config';
import { defineConfig } from 'prisma/config';
import { databaseUrl } from './src/prisma/database-url';

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    seed: 'npx tsx -r tsconfig-paths/register prisma/seed.ts',
    path: 'prisma/migrations',
  },

  datasource: {
    url: databaseUrl(),
  },
});
