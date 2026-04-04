import { IStore, TelemetryEvent, FeedbackEntry } from './IStore';

let idCounter = 0;
const nextId = () => String(++idCounter);

/**
 * In-memory persistence adapter.
 * Suitable for local development and unit tests.
 * Data is lost when the process restarts.
 */
export class MemoryStore implements IStore {
  private events: TelemetryEvent[] = [];
  private feedback: FeedbackEntry[] = [];

  async saveEvent(event: TelemetryEvent): Promise<TelemetryEvent> {
    const record: TelemetryEvent = {
      ...event,
      id: nextId(),
      timestamp: event.timestamp ?? new Date().toISOString(),
    };
    this.events.push(record);
    return record;
  }

  async getEvents(): Promise<TelemetryEvent[]> {
    return [...this.events];
  }

  async saveFeedback(entry: FeedbackEntry): Promise<FeedbackEntry> {
    const record: FeedbackEntry = {
      ...entry,
      id: nextId(),
      timestamp: entry.timestamp ?? new Date().toISOString(),
    };
    this.feedback.push(record);
    return record;
  }

  async getFeedback(): Promise<FeedbackEntry[]> {
    return [...this.feedback];
  }
}
