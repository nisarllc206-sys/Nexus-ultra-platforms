export interface TelemetryEvent {
  id?: string;
  type: string;
  payload: Record<string, unknown>;
  timestamp?: string;
}

export interface FeedbackEntry {
  id?: string;
  userId?: string;
  message: string;
  rating?: number;
  timestamp?: string;
}

export interface IStore {
  /** Save a telemetry event; returns the stored record with an assigned id. */
  saveEvent(event: TelemetryEvent): Promise<TelemetryEvent>;

  /** Return all stored telemetry events. */
  getEvents(): Promise<TelemetryEvent[]>;

  /** Save a feedback entry; returns the stored record with an assigned id. */
  saveFeedback(entry: FeedbackEntry): Promise<FeedbackEntry>;

  /** Return all stored feedback entries. */
  getFeedback(): Promise<FeedbackEntry[]>;
}
