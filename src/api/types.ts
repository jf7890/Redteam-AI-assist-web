// Types mirrored from backend: src/redteam_ai_assist/core/models.py

export type EventType = "command" | "http" | "scan" | "note" | "system";
export type PhaseName = "recon" | "enumeration" | "hypothesis" | "attempt" | "post_check" | "report";
export type MemoryMode = "summary" | "window" | "full";
export type RagFocus = "auto" | "recon" | "report";

export type ActivityEvent = {
  event_id?: string;
  event_type: EventType;
  timestamp?: string; // ISO string
  payload: Record<string, any>;
};

export type SessionStartRequest = {
  tenant_id: string;
  user_id: string;
  agent_id: string;
  objective: string;
  target_scope: string[];
  policy_id: string;
};

export type EventIngestRequest = {
  events: ActivityEvent[];
};

export type ActionItem = {
  title: string;
  rationale: string;
  done_criteria: string;
  command?: string | null;
};

export type RetrievedContext = {
  source: string;
  score: number;
  content: string;
};

export type SuggestRequest = {
  user_message?: string | null;
  memory_mode?: MemoryMode;
  history_window?: number;
  phase_override?: PhaseName | null;
  persist_phase_override?: boolean;
  rag_focus?: RagFocus;
};

export type SuggestResponse = {
  session_id: string;
  phase: PhaseName;
  phase_confidence: number;
  missing_artifacts: string[];
  reasoning: string;
  actions: ActionItem[];
  retrieved_context: RetrievedContext[];
  episode_summary: string;
};

export type CachedSuggest = {
  fingerprint: string;
  payload: Record<string, any>;
  created_at: string;
};

export type SessionRecord = {
  session_id: string;
  tenant_id: string;
  user_id: string;
  agent_id: string;
  objective: string;
  target_scope: string[];
  policy_id: string;
  created_at: string;
  updated_at: string;
  current_phase: PhaseName;
  events: ActivityEvent[];
  notes: string[];
  last_reasoning?: string | null;
  cached_suggest?: CachedSuggest | null;
};

export type SessionSummary = {
  session_id: string;
  tenant_id: string;
  user_id: string;
  agent_id: string;
  current_phase: PhaseName;
  updated_at: string;
};
