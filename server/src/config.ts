import { z } from 'zod';

const configSchema = z.object({
  JWT_SECRET: z.string().min(32),
  PORT: z.coerce.number().int().min(1).max(65_535).default(3000),
  DATABASE_PATH: z.string().min(1).default('./kaquiz.sqlite'),
  CORS_ORIGIN: z.string().min(1).default('http://localhost:8081'),
});

export function loadConfig(environment: NodeJS.ProcessEnv = process.env) {
  return configSchema.parse(environment);
}
