export type UserId = string;
export type ProfileId = string;
export type AgentPromptId = string;
export type PromptVersionId = string;
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

export type PersonaSpec = {
  displayName: string;
  roleBoundary: string;
  toneRules: string[];
  supportMoves: string[];
  prohibitedMoves: string[];
  crisisBoundary: string;
};

export type PromptGenerationTrace = {
  toolNames: string[];
  sourceProfileId: ProfileId;
  generatedAt: string;
  safetyPolicyVersion: string;
};

export type ActivePromptDTO = {
  agentPromptId: AgentPromptId;
  promptVersionId: PromptVersionId;
  name: string;
  version: number;
  systemPrompt: string;
  personaSpec: PersonaSpec;
  safetyPolicyVersion: string;
};

export type SafetyLevel = "none" | "watch" | "crisis";

export type SafetyResult = {
  level: SafetyLevel;
  reasons: string[];
  matchedSignals: string[];
};
