export type SessionId = string;

export type CreateSessionRequest = {
  tenant_id: string;
  user_id: string;
  agent_id: string;
  objective: string;
  target_scope: string[];
  policy_id: string;
};

export type SessionEvent = {
  event_id?: string;
  event_type: string; // "note" | "command" | "http" | ...
  payload: any;
  timestamp?: string;
};

export type AddEventsRequest = {
  events: SessionEvent[];
};

export type SuggestRequest = {
  user_message?: string;
  memory_mode: string;
  history_window: number;
  phase_override?: string;
  persist_phase_override?: boolean;
  rag_focus?: string;
};

export type Session = {
  id: SessionId;

  tenant_id?: string;
  user_id?: string;
  agent_id?: string;
  objective?: string;
  policy_id?: string;
  target_scope?: string[];

  phase?: string;
  missing_artifacts?: string[];
  episode_summary?: string;

  // Some deployments may include latest events here (optional).
  events?: SessionEvent[];
};

export type SuggestResponse = any;
