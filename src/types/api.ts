export interface TenantFeature {
  key: string;
  name: string;
  category: string;
  enabled: boolean;
  limitValue: string | null;
}

export interface UserInfo {
  userId: string;
  tenantId: string;
  name: string;
  email: string;
  role: string;
  avatarUrl?: string | null;
}

export interface PlatformUserInfo {
  userId: string;
  name: string;
  email: string;
  role: string;
  avatarUrl?: string | null;
}

export interface UserProfile {
  userId: string;
  scope: "tenant" | "platform";
  name: string;
  email: string;
  role: string;
  avatarUrl: string | null;
  tenantId?: string | null;
}

export interface LoginResponse {
  token: string;
  scope: "tenant" | "platform";
  user: UserInfo | null;
  platformUser: PlatformUserInfo | null;
  features: TenantFeature[];
  expiresIn: number;
}

export interface Patient {
  id: string;
  name: string | null;
  phone: string;
  status: string;
  medication: string | null;
  lastCheckinAt: string | null;
  createdAt: string;
}

export interface CreatePatientResponse {
  id: string;
  name: string | null;
  phone: string;
  status: string;
  created: boolean;
  welcomeSent: boolean;
}

export interface SimulatorMessage {
  id: string;
  direction: "inbound" | "outbound";
  content: string;
  messageType: string | null;
  createdAt: string;
}

export interface SimulatorStatus {
  enabled: boolean;
  stubOutbound: boolean;
}

export interface SimulatorSession {
  patientId: string;
  tenantId: string;
  phone: string;
  name: string;
  voiceTone: string;
  medication: string;
  scheduledTimes: string;
  patientStatus: string;
  welcomeSent?: boolean;
}

export interface SimulatorPatient {
  id: string;
  name: string | null;
  phone: string;
  medication: string | null;
  status: string;
}

export interface PagedResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

export interface TimelineEvent {
  eventKind: string;
  occurredAt: string;
  summary: string;
  status: string | null;
  meta: Record<string, unknown> | null;
}

export interface AdherenceReport {
  tenantId: string;
  from: string;
  to: string;
  totalCheckins: number;
  takenCount: number;
  missedCount: number;
  unknownCount: number;
  adherenceRate: number;
  activePatients: number;
  checkinsByHour: { hour: number; taken: number; missed: number; rate: number }[];
  avgResponseByDay: { dayOfWeek: string; avgResponseSeconds: number }[];
}

export interface ReportInsight {
  summary: string;
  highlights: string[];
  actions: string[];
  source: "rules" | "ai";
  generatedAt: string;
}

export interface MessageEngagement {
  groupKey: string;
  groupLabel: string;
  sent: number;
  responded: number;
  responseRate: number;
  avgResponseSeconds: number | null;
  takenCount: number;
  missedCount: number;
  adherenceRate: number | null;
}

export interface EngagementReport {
  tenantId: string;
  from: string;
  to: string;
  patientId: string | null;
  byMessageKind: MessageEngagement[];
  byTemplate: MessageEngagement[];
  bestByResponseRate: MessageEngagement | null;
  fastestAvgResponse: MessageEngagement | null;
}

export interface AdherenceTrendPoint {
  date: string;
  taken: number;
  missed: number;
  total: number;
  rate: number;
}

export interface PatientFunnelSegment {
  status: string;
  label: string;
  count: number;
  share: number;
}

export interface PatientFunnel {
  tenantId: string;
  total: number;
  segments: PatientFunnelSegment[];
}

export interface PatientAdherenceRank {
  patientId: string;
  name: string | null;
  status: string;
  totalCheckins: number;
  taken: number;
  missed: number;
  adherenceRate: number;
  lastCheckinAt: string | null;
}

export interface OperationsReport {
  tenantId: string;
  from: string;
  to: string;
  reminders: {
    sent: number;
    failed: number;
    pending: number;
    skipped: number;
    followupsSent: number;
    failureRate: number;
  };
  reengagements: {
    sent: number;
    reactivated: number;
    ignored: number;
    optedOut: number;
    pending: number;
    reactivationRate: number;
  };
}

export interface SenderPerformance {
  senderId: string;
  displayName: string;
  phoneNumber: string;
  activePatients: number;
  checkinsTotal: number;
  checkinsTaken: number;
  adherenceRate: number;
}

export interface PeriodMetrics {
  from: string;
  to: string;
  adherenceRate: number;
  totalCheckins: number;
  takenCount: number;
  activePatients: number;
}

export interface PeriodComparison {
  current: PeriodMetrics;
  previous: PeriodMetrics;
  delta: {
    adherenceRatePoints: number;
    totalCheckins: number;
    takenCount: number;
  };
}

export interface AdminTenantMetricSlice {
  tenantId: string;
  tenantName: string;
  tenantSlug: string;
  totalCheckins: number;
  takenCount: number;
  missedCount: number;
  adherenceRate: number;
  activePatients: number;
}

export interface AdminAdherenceReport {
  from: string;
  to: string;
  tenantIds: string[];
  totalCheckins: number;
  takenCount: number;
  missedCount: number;
  unknownCount: number;
  adherenceRate: number;
  activePatients: number;
  checkinsByHour: AdherenceReport["checkinsByHour"];
  avgResponseByDay: AdherenceReport["avgResponseByDay"];
  byTenant: AdminTenantMetricSlice[];
}

export interface AdminEngagementReport {
  from: string;
  to: string;
  tenantIds: string[];
  byMessageKind: MessageEngagement[];
  byTemplate: MessageEngagement[];
  bestByResponseRate: MessageEngagement | null;
  fastestAvgResponse: MessageEngagement | null;
}

export interface AdminTenantFunnelSlice {
  tenantId: string;
  tenantName: string;
  total: number;
  segments: PatientFunnelSegment[];
}

export interface AdminPatientFunnel {
  total: number;
  segments: PatientFunnelSegment[];
  byTenant: AdminTenantFunnelSlice[];
}

export interface AdminPatientAdherenceRank extends PatientAdherenceRank {
  tenantId: string;
  tenantName: string;
}

export interface AdminTenantOpsSlice {
  tenantId: string;
  tenantName: string;
  remindersSent: number;
  remindersFailed: number;
  reengagementsSent: number;
  reactivated: number;
}

export interface AdminOperationsReport {
  from: string;
  to: string;
  tenantIds: string[];
  reminders: OperationsReport["reminders"];
  reengagements: OperationsReport["reengagements"];
  byTenant: AdminTenantOpsSlice[];
}

export interface AdminSenderPerformance extends SenderPerformance {
  tenantId: string;
  tenantName: string;
}

export interface AdminPeriodComparison {
  from: string;
  to: string;
  tenantIds: string[];
  current: PeriodMetrics;
  previous: PeriodMetrics;
  delta: PeriodComparison["delta"];
}

export interface TenantSettings {
  sendWindowStart: string;
  sendWindowEnd: string;
  followupAfterHours: number;
  maxReengagementAttempts: number;
  inactiveDaysBeforeReengagement: number;
  voiceTone: string | number;
  locale: string;
  aiEnabled: boolean;
  voiceMessagesEnabled: boolean;
}

export interface TenantSubscription {
  planId: string;
  planKey: string;
  planName: string;
  features: TenantFeature[];
}

export interface CreateTenantResponse {
  tenantId: string;
  adminUserId: string;
}

export interface MessageTemplate {
  templateKey: string;
  content: string;
  description: string | null;
  isCustom: boolean;
  isActive: boolean;
}

export interface AdminMessageTemplate {
  templateKey: string;
  baseKey: string;
  tone: string;
  locale: string;
  content: string;
  description: string | null;
  isCustomized: boolean;
  isActive: boolean;
  category: string;
  isCatalog: boolean;
  onboardingStepId: string | null;
}

export interface AdminOnboardingFlowStep {
  id: string;
  type: string;
  description: string;
  templateKey: string;
}

export interface AdminOnboardingSystemMessage {
  templateKey: string;
  description: string;
}

export interface AdminOnboardingFlow {
  steps: AdminOnboardingFlowStep[];
  systemMessages: AdminOnboardingSystemMessage[];
}

export interface JourneyStep {
  id: string;
  type: string;
  templateKey: string | null;
  description: string | null;
  isBuiltIn: boolean;
  enabled: boolean;
}

export interface OnboardingJourney {
  isCustomized: boolean;
  defaultSteps: JourneyStep[];
  tenantSteps: JourneyStep[] | null;
  effectiveSteps: JourneyStep[];
}

export interface CarePlanUpdate {
  medication: string;
  dosage: string;
  scheduledTimes: string;
  instructions?: string;
  endDate?: string;
}

export interface AdminTenant {
  id: string;
  name: string;
  slug: string;
  isActive: boolean;
  aiEnabled: boolean;
  createdAt: string;
}

export interface AdminProductMetrics {
  activeTenants: number;
  activePatients: number;
  onboardingsThisWeek: number;
}

export interface AdminPlatformAiSettings {
  provider: string;
  model: string;
  isConfigured: boolean;
  openAiConfigured: boolean;
  anthropicConfigured: boolean;
  openAiKeyHint: string | null;
  anthropicKeyHint: string | null;
}

export interface AdminPlatformUser {
  id: string;
  name: string;
  email: string;
  role: string;
  isActive: boolean;
  createdAt: string;
  lastLoginAt: string | null;
}

export interface SimulatorSessionListItem {
  patientId: string;
  phone: string;
  name: string | null;
  patientStatus: string;
  createdAt: string;
}

export interface TenantUser {
  id: string;
  name: string;
  email: string;
  role: string;
  isActive: boolean;
  lastLoginAt: string | null;
  createdAt: string;
}

export interface WhatsappSender {
  id: string;
  phoneNumber: string;
  displayName: string;
  wabaId: string;
  phoneId: string;
  isActive: boolean;
  createdAt: string;
}

export interface WhatsappDiagnosticEvent {
  at: string;
  eventType: string;
  correlationId?: string | null;
  phoneId?: string | null;
  from?: string | null;
  wamId?: string | null;
  tenantSlug?: string | null;
  detail?: string | null;
  error?: string | null;
}

export interface WhatsappDiagnosticMessage {
  id: string;
  tenantId: string;
  patientId: string;
  direction: string;
  status: string;
  content: string;
  wamId: string | null;
  messageType: string | null;
  createdAt: string;
}

export interface WhatsappDiagnostics {
  generatedAt: string;
  scope: string;
  note: string;
  meta: {
    hasAppSecret: boolean;
    hasAccessToken: boolean;
    hasPhoneId: boolean;
    hasVerifyToken: boolean;
    apiVersion: string;
    simulatorMode: boolean;
  };
  platformAi?: {
    provider: string;
    model: string;
    isConfigured: boolean;
    openAiConfigured: boolean;
    anthropicConfigured: boolean;
    openAiKeyHint: string | null;
    anthropicKeyHint: string | null;
  };
  senders: Array<{
    id: string;
    tenantSlug: string;
    displayName: string;
    phoneNumber: string;
    wabaId: string;
    phoneId: string;
    isActive: boolean;
  }>;
  events: WhatsappDiagnosticEvent[];
}

export interface WhatsappConversation {
  patientId: string;
  name: string | null;
  phone: string;
  status: string | null;
  messageCount: number;
  lastMessageAt: string;
  lastPreview: string;
  lastDirection: string;
}

export interface WhatsappConversationMessage {
  id: string;
  direction: string;
  status: string;
  content: string;
  wamId: string | null;
  messageType: string | null;
  contentSource: string | null;
  templateKey: string | null;
  contextJson: string | null;
  createdAt: string;
}

export interface WhatsappConversationScheduling {
  carePlan: {
    medication: string;
    dosage: string;
    scheduledTimes: string;
    startDate: string;
  } | null;
  carePlans?: {
    medication: string;
    dosage: string;
    scheduledTimes: string;
    startDate: string;
  }[];
  patientStatus: string;
  activatedAt: string | null;
  pausedUntil?: string | null;
  consecutiveMissedCheckins?: number;
  conversationStep: string | null;
  openReengagementAttempt?: number | null;
  openReengagementSentAt?: string | null;
  lastReengagementAttempt?: number | null;
  reminders: {
    id: string;
    scheduledFor: string;
    status: string;
    sentAt: string | null;
    failureReason: string | null;
  }[];
}

export interface WhatsappConversationThread {
  patient: {
    id: string;
    name: string | null;
    phone: string;
    status: string;
    activatedAt?: string | null;
    pausedUntil?: string | null;
    consecutiveMissedCheckins?: number;
  };
  messages: WhatsappConversationMessage[];
  scheduling?: WhatsappConversationScheduling;
}
