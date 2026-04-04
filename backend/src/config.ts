import dotenv from 'dotenv';

dotenv.config();

export const config = {
  port: parseInt(process.env.PORT ?? '3000', 10),
  apiKey: process.env.API_KEY ?? 'changeme',
  storeAdapter: (process.env.STORE_ADAPTER ?? 'memory') as 'memory' | 'supabase' | 'mongo',
  supabaseUrl: process.env.SUPABASE_URL ?? '',
  supabaseKey: process.env.SUPABASE_KEY ?? '',
  mongoUri: process.env.MONGO_URI ?? '',
  logLevel: process.env.LOG_LEVEL ?? 'info',
} as const;
