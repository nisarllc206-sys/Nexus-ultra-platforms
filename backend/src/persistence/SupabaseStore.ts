import { IStore, TelemetryEvent, FeedbackEntry } from './IStore';

/**
 * Supabase persistence adapter — PLACEHOLDER.
 *
 * To activate:
 *  1. Set STORE_ADAPTER=supabase in your .env
 *  2. Set SUPABASE_URL and SUPABASE_KEY in your .env
 *  3. Install `@supabase/supabase-js` and replace the stubs below with real calls.
 *
 * No credentials are ever committed to the repository.
 */
export class SupabaseStore implements IStore {
  constructor(
    private readonly url: string,
    private readonly key: string,
  ) {
    if (!url || !key) {
      throw new Error('SupabaseStore requires SUPABASE_URL and SUPABASE_KEY env vars');
    }
    // TODO: const { createClient } = await import('@supabase/supabase-js');
    //       this.client = createClient(url, key);
  }

  async saveEvent(_event: TelemetryEvent): Promise<TelemetryEvent> {
    throw new Error('SupabaseStore.saveEvent not yet implemented — see comments in SupabaseStore.ts');
  }

  async getEvents(): Promise<TelemetryEvent[]> {
    throw new Error('SupabaseStore.getEvents not yet implemented — see comments in SupabaseStore.ts');
  }

  async saveFeedback(_entry: FeedbackEntry): Promise<FeedbackEntry> {
    throw new Error('SupabaseStore.saveFeedback not yet implemented — see comments in SupabaseStore.ts');
  }

  async getFeedback(): Promise<FeedbackEntry[]> {
    throw new Error('SupabaseStore.getFeedback not yet implemented — see comments in SupabaseStore.ts');
  }
}
