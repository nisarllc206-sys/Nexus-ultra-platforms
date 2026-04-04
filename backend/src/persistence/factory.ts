import { config } from '../config';
import { IStore } from './IStore';
import { MemoryStore } from './MemoryStore';
import { SupabaseStore } from './SupabaseStore';

export function createStore(): IStore {
  switch (config.storeAdapter) {
    case 'supabase':
      return new SupabaseStore(config.supabaseUrl, config.supabaseKey);
    case 'mongo':
      // TODO: implement MongoStore similar to SupabaseStore
      throw new Error('MongoStore not yet implemented. Set STORE_ADAPTER=memory.');
    case 'memory':
    default:
      return new MemoryStore();
  }
}
