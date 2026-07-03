export type UserId = string;
export type ProfileId = string;
export type PersonaId = string;
export type PersonaSectionId = string;
export type PersonaResourceId = string;
export type PersonaProposalId = string;
export type SessionId = string;

export type ChatMessageRole = "user" | "assistant" | "system";

export type JsonPrimitive = string | number | boolean | null;
export type JsonValue =
  | JsonPrimitive
  | JsonValue[]
  | { [key: string]: JsonValue };

export type QuestionnaireSummary = {
  primaryConcerns: string[];
  currentStressors: string[];
  preferredSupport: string[];
  avoidances: string[];
  freeformSummary: string;
};

export type EmotionState = {
  moodLabel: string;
  stressLevel: number;
  energyLevel: number;
  confidence: number;
};

export type CommunicationPreferences = {
  nickname?: string;
  tone: "gentle" | "direct" | "warm" | "structured";
  responseLength: "short" | "medium" | "long";
  askBeforeAdvice: boolean;
  storeSessionHistory: boolean;
};

export type RiskFlags = {
  crisis: boolean;
  selfHarmSignals: string[];
  lastCheckedAt: string;
};

export type ProfileSnapshot = {
  profileId: ProfileId;
  userId: UserId;
  questionnaireSummary: QuestionnaireSummary;
  emotionState: EmotionState;
  communicationPreferences: CommunicationPreferences;
  riskFlags: RiskFlags;
  latestMemorySummary: string | null;
  updatedAt: string;
};

// Tier 1: always-mounted persona metadata + non-negotiable safety
// boundaries. No agent tool is ever given write access to roleBoundary /
// crisisBoundary / prohibitedMoves - see services/persona/tools.ts.
export type PersonaOverview = {
  personaId: PersonaId;
  name: string;
  description: string;
  roleBoundary: string;
  crisisBoundary: string;
  prohibitedMoves: string[];
  sectionTitles: Array<{ id: PersonaSectionId; key: string; title: string }>;
  updatedAt: string;
};

// Tier 2: persona content, fetched on demand rather than embedded in the
// system prompt every turn.
export type PersonaSection = {
  id: PersonaSectionId;
  personaId: PersonaId;
  key: string;
  title: string;
  content: string;
  createdBy: "ai" | "user";
  updatedAt: string;
};

// Tier 3: supplementary material referenced from section content.
export type PersonaResource = {
  id: PersonaResourceId;
  personaId: PersonaId;
  sectionId: PersonaSectionId | null;
  title: string;
  content: string;
  createdBy: "ai" | "user";
  updatedAt: string;
};

export type PersonaProposalOperation = "create" | "update" | "delete";
export type PersonaProposalTarget = "section" | "resource";
export type PersonaProposalStatus = "pending" | "approved" | "rejected";

export type PersonaChangeProposal = {
  id: PersonaProposalId;
  personaId: PersonaId;
  sessionId: SessionId | null;
  operation: PersonaProposalOperation;
  targetType: PersonaProposalTarget;
  targetId: string | null;
  proposedTitle: string | null;
  proposedContent: string | null;
  reason: string;
  status: PersonaProposalStatus;
  createdAt: string;
  resolvedAt: string | null;
};

export type SafetyLevel = "none" | "watch" | "crisis";

export type SafetyResult = {
  level: SafetyLevel;
  reasons: string[];
  matchedSignals: string[];
};
