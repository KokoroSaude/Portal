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
  tenantOperationMode?: TenantOperationMode;
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

export interface LoginTwoFactorChallengeResponse {
  requiresTwoFactor: true;
  challengeId: string;
  expiresInSeconds: number;
}

export type LoginApiResponse = LoginResponse | LoginTwoFactorChallengeResponse;

export interface TwoFactorStatus {
  enabled: boolean;
  recoveryCodesRemaining: number;
}

export interface BeginTwoFactorSetupResponse {
  secret: string;
  authenticatorUri: string;
}

export interface ConfirmTwoFactorSetupResponse {
  recoveryCodes: string[];
}

export interface Patient {
  id: string;
  name: string | null;
  phone: string;
  phoneLast4?: string | null;
  cpf?: string | null;
  clinicalPriorityTier?: ClinicalPriorityTier | null;
  status: string;
  medication: string | null;
  preferredMessageChannel?: "Text" | "Audio";
  consecutiveMissedCheckins?: number;
  lastCheckinAt: string | null;
  createdAt: string;
}

export interface CreatePatientResponse {
  id: string;
  name: string | null;
  phone: string;
  cpf?: string | null;
  status: string;
  created: boolean;
  welcomeSent: boolean;
  welcomeUsedMetaTemplate?: boolean;
  welcomeFailureReason?: string | null;
}

export interface PatientStatusChangeResponse {
  notificationSent: boolean;
  usedMetaTemplate?: boolean;
  notificationFailureReason?: string | null;
}

export interface PagedResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

export interface TimelineEvent {
  eventKind: TimelineEventKind;
  occurredAt: string;
  summary: string;
  status: string | null;
  meta: Record<string, unknown> | null;
}

export type TimelineEventKind =
  | "message_inbound"
  | "message_outbound"
  | "reminder_sent"
  | "reminder_scheduled"
  | "reminder_failed"
  | "followup_sent"
  | "checkin"
  | "reengagement";

export interface TimelinePagedResult {
  items: TimelineEvent[];
  total: number;
  page: number;
  pageSize: number;
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

export interface NudgeEngagementRow {
  groupKey: string;
  groupLabel: string;
  sent: number;
  respondedWithin2h: number;
  respondedWithin24h: number;
  responseRate2h: number;
  responseRate24h: number;
}

export interface NudgeEngagementReport {
  tenantId: string;
  from: string;
  to: string;
  byNudgeType: NudgeEngagementRow[];
  byTemplate: NudgeEngagementRow[];
}

export interface NudgeLintIssue {
  code: string;
  message: string;
  severity: "Warning" | "Error";
}

export interface UpsertTemplateResponse {
  saved?: boolean;
  warnings?: NudgeLintIssue[];
}

export interface KnowledgeDocument {
  id: string;
  title: string;
  fileName: string;
  contentType: string;
  fileSizeBytes: number;
  createdAt: string;
  updatedAt: string;
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

export type InboundConversationalMode = "TemplateOnly" | "AiPersonalize" | "AiGuidance";

export interface ConversationQualityByAgeBand {
  ageBand: string;
  label: string;
  score: number;
  sampleSize: number;
}

export interface ConversationQualityReport {
  tenantId: string;
  from: string;
  to: string;
  score: number;
  grade: string;
  invalidTextRate: number;
  menuFreeTextHandledRate: number;
  scaleCompletionAfterDeviationRate: number;
  onboardingStepCompletionRate: number;
  handoffUnresolvedRate24h: number;
  retentionSaveRate: number;
  exitConfusedByBotRate: number;
  byAgeBand: ConversationQualityByAgeBand[];
}

export interface MessageContentSourceBreakdown {
  source: string;
  label: string;
  count: number;
  share: number;
}

export interface MessageContentSourceTemplateRow {
  templateKey: string;
  templateLabel: string;
  total: number;
  aiCount: number;
  rulesCount: number;
  templateCount: number;
  otherCount: number;
}

export interface MessageContentSourceReport {
  tenantId: string;
  from: string;
  to: string;
  patientId: string | null;
  totalOutbound: number;
  totalWithAi: number;
  bySource: MessageContentSourceBreakdown[];
  byTemplate: MessageContentSourceTemplateRow[];
}

export interface ExitReasonBreakdown {
  reason: string;
  label: string;
  count: number;
  share: number;
}

export interface ExitReasonTrendPoint {
  period: string;
  count: number;
}

export interface RetentionChurnReport {
  tenantId: string;
  from: string;
  to: string;
  interceptsStarted: number;
  savedPause: number;
  savedContinue: number;
  savedHandoff: number;
  optedOutAfterSurvey: number;
  saveRate: number;
  exitReasons: ExitReasonBreakdown[];
  trend: ExitReasonTrendPoint[];
}

export interface OnboardingStepFunnel {
  stepId: string;
  stepLabel: string;
  entered: number;
  completed: number;
  abandoned: number;
  dropOffRate: number;
  avgMinutesInStep: number;
}

export interface OnboardingStepFunnelReport {
  tenantId: string;
  from: string;
  to: string;
  steps: OnboardingStepFunnel[];
}

export interface HandoffQueueItem {
  patientId: string;
  patientName: string | null;
  requestedAt: string;
  eventType: string;
  minutesWaiting: number;
}

export interface HandoffReport {
  tenantId: string;
  from: string;
  to: string;
  requested: number;
  microCsatPositive: number;
  microCsatNegative: number;
  unresolvedOverSla: number;
  avgResolutionMinutes: number;
  pending: HandoffQueueItem[];
}

export interface ConversationIncident {
  patientId: string;
  patientName: string | null;
  at: string;
  incidentType: string;
  flowLabel: string | null;
  lastPatientMessage: string | null;
  resolution: string | null;
}

export interface ConversationIncidentsReport {
  tenantId: string;
  from: string;
  to: string;
  total: number;
  limit: number;
  offset: number;
  items: ConversationIncident[];
}

export interface ConversationSimulationResult {
  tier: string;
  mappedAction: string | null;
  confidence: number | null;
  guidancePreview: string | null;
  bubbleCount: number;
  estimatedDelaySeconds: number;
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

export interface MedicationSuggestion {
  label: string;
  medicationId: string | null;
}

export interface MedicationProgramAtRiskPatient {
  patientId: string;
  name: string | null;
  status: string;
  senderId: string | null;
  senderName: string | null;
  consecutiveMissedCheckins: number;
  periodMissed: number;
  periodTotal: number;
  periodAdherenceRate: number;
}

export interface MedicationProgramSenderRow {
  senderId: string;
  displayName: string;
  phoneNumber: string;
  activePatients: number;
  checkinsTotal: number;
  checkinsTaken: number;
  adherenceRate: number;
}

export interface MedicationProgramReport {
  medicationLabel: string;
  medicationId: string | null;
  activePatients: number;
  activeCarePlans: number;
  totalCheckins: number;
  taken: number;
  missed: number;
  adherenceRate: number;
  trend: AdherenceTrendPoint[];
  bySender: MedicationProgramSenderRow[];
  atRiskPatients: MedicationProgramAtRiskPatient[];
  ranking: PatientAdherenceRank[];
}

export interface MedicationCatalogItem {
  id: string;
  canonicalName: string;
  dcbCode: string | null;
  catmatCode?: string | null;
  clinicalPriorityBoost?: number;
  isActive: boolean;
  aliases: string[];
}

export interface MedicationProgramListItem {
  id: string;
  name: string;
  medicationId: string;
  medicationName: string;
  isActive: boolean;
  atRiskMissedThreshold: number;
  targetAdherenceRate: number | null;
  createdAt: string;
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

export interface MessageVolumeByDay {
  date: string;
  inbound: number;
  outbound: number;
}

export interface InboundByHour {
  hour: number;
  count: number;
}

export interface OperatorThroughput {
  userId: string;
  userName: string | null;
  date: string;
  replyCount: number;
}

export interface AdminMessageVolumeMetrics {
  from: string;
  to: string;
  tenantIds: string[];
  messagesByDay: MessageVolumeByDay[];
  peakHours: InboundByHour[];
  teamThroughput: OperatorThroughput[];
}

export interface SatisfactionDelayBucket {
  bucket: string;
  count: number;
  avgScore: number;
}

export interface AdminSatisfactionMetrics {
  from: string;
  to: string;
  tenantIds: string[];
  avgScore: number;
  responseRate: number;
  totalPrompts: number;
  totalResponses: number;
  byDelayBucket: SatisfactionDelayBucket[];
}

export interface LatencyByTenant {
  tenantId: string;
  tenantName: string;
  avgSeconds: number;
  p50Seconds: number;
  p95Seconds: number;
  sampleCount: number;
}

export interface LatencyByUser {
  userId: string;
  userName: string | null;
  avgSeconds: number;
  p50Seconds: number;
  p95Seconds: number;
  sampleCount: number;
}

export interface LatencyByDay {
  date: string;
  avgSeconds: number;
  p50Seconds: number;
  p95Seconds: number;
  sampleCount: number;
}

export interface AdminOperationalLatencyMetrics {
  from: string;
  to: string;
  tenantIds: string[];
  avgSeconds: number;
  p50Seconds: number;
  p95Seconds: number;
  sampleCount: number;
  byTenant: LatencyByTenant[];
  byUser: LatencyByUser[];
  byDay: LatencyByDay[];
}

export interface AuditLogEntry {
  id: string;
  tenantId: string;
  userId: string | null;
  patientId: string | null;
  action: string;
  entityName: string;
  entityId: string | null;
  oldValues: string | null;
  newValues: string | null;
  ipAddress: string | null;
  correlationId: string | null;
  createdAt: string;
}

export interface AdminAuditLogResult {
  items: AuditLogEntry[];
  total: number;
  limit: number;
  offset: number;
}

export interface InteractionEventEntry {
  id: string;
  eventType: string;
  tenantId: string;
  patientId: string | null;
  messageId: string | null;
  userId: string | null;
  aiProvider: string | null;
  aiModel: string | null;
  properties: string | null;
  occurredAt: string;
}

export interface AdminInteractionEventsResult {
  items: InteractionEventEntry[];
  total: number;
  limit: number;
  offset: number;
}

export interface AiPlatformFeatures {
  platformConfigured: boolean;
  insightsEnabled: boolean;
  outboundPersonalizationEnabled: boolean;
  milestonePersonalizationEnabled: boolean;
  interventionsEnabled: boolean;
  checkinFallbackEnabled: boolean;
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
  aiFeatures?: AiPlatformFeatures;
  dataRetentionDays?: number | null;
  voiceMessagesEnabled: boolean;
  prescriptionScanEnabled?: boolean;
  voiceGender?: "Feminine" | "Masculine";
  moriskyEnabled: boolean;
  moriskyOnOnboarding: boolean;
  moriskyPeriodicDays: number | null;
  moriskyTriggerAfterMisses: number | null;
  moriskyCooldownDays: number;
  tpbEnabled: boolean;
  tpbOnOnboarding: boolean;
  tpbPeriodicDays: number | null;
  tpbTriggerAfterMisses: number | null;
  tpbCooldownDays: number;
  csatPeriodicDays?: number | null;
  onboardingSurveyRandomPickEnabled?: boolean;
  scaleMinDaysBetweenTypes?: number;
  onboardingResumeEnabled: boolean;
  onboardingResumeAfterDays: number;
  onboardingResumeCooldownHours: number;
  nudgesEnabled?: boolean;
  socialNormNudgesEnabled?: boolean;
  positiveReinforcementPoolEnabled?: boolean;
  maxEmpathyBlocksPerWeek?: number;
  achievementsEnabled?: boolean;
  dailySummaryEnabled?: boolean;
  progressMenuEnabled?: boolean;
  requirePreRegisteredPatients?: boolean;
  defaultPromoMessage?: string | null;
  outboundContentMode?: "TemplateOnly" | "AiOnly" | "Alternate";
  outboundAlternateStrategy?: "PerPatient" | "PerMessageKind";
  tenantOperationMode?: TenantOperationMode;
  govPharmacyPickupEnabled?: boolean;
  pickupQueuePrefix?: string;
  pickupAutoNotifyOnStockArrival?: boolean;
  pickupNotificationLeadDays?: number;
  pickupMaxNotificationsPerDay?: number;
  pickupOrderExpiryDays?: number;
  pickupDefaultDailyDose?: number;
  pickupExpectedPickupDaysAfterNotify?: number;
  pickupNoShowReminderEnabled?: boolean;
  pickupMaxNoShowReminders?: number;
  pickupIntegrationApiKey?: string | null;
  pickupTvDisplayToken?: string | null;
  pickupCnesCode?: string | null;
  pickupSusRulesEnabled?: boolean;
  pickupQrCheckInEnabled?: boolean;
  pickupCheckInTokenTtlDays?: number;
  pickupNotificationRouting?: PickupNotificationRouting;
  adherenceNotificationRouting?: AdherenceNotificationRouting;
  pickupSmartPriorityEnabled?: boolean;
  pickupRunOutPriorityWeight?: number;
  pickupEmergencyReservePercent?: number;
  pickupCriticalWaitlistThreshold?: number;
  pickupBoostPriorityOnLowAdherence?: boolean;
  pickupCsatEnabled?: boolean;
  pickupDefaultWindowHours?: number;
  pickupMaxReschedulesPerOrder?: number;
  pickupArrivalOutsideWindowWarn?: boolean;
  pickupDuplicateDispenseAlertDays?: number;
  pickupDelegateHighVolumeDailyLimit?: number;
  pickupProcurementWebhookUrl?: string | null;
  pickupErpAllowedIps?: string | null;
  pickupErpSandboxMode?: boolean;
  pharmacyContactPhone?: string | null;
  activeInboundMode?: InboundConversationalMode;
  onboardingInboundMode?: InboundConversationalMode;
  checkinInboundMode?: InboundConversationalMode;
  moriskyInboundMode?: InboundConversationalMode;
  tpbInboundMode?: InboundConversationalMode;
  retentionInboundMode?: InboundConversationalMode;
  humanLatencyMinSeconds?: number;
  humanLatencyMaxSeconds?: number;
  selfServicePauseEnabled?: boolean;
  weeklyDigestEnabled?: boolean;
}

export interface ErpCredential {
  id: string;
  keyPrefix: string;
  isSandbox: boolean;
  lastUsedAt: string | null;
  createdAt: string;
}

export interface GenerateErpCredentialResult {
  id: string;
  apiKey: string;
  keyPrefix: string;
  isSandbox: boolean;
  createdAt: string;
}

export interface ErpConnectionTestResult {
  success: boolean;
  message?: string | null;
  latencyMs?: number;
}

export interface IntegrationAuditEntry {
  id: string;
  httpMethod: string;
  path: string;
  statusCode: number;
  credentialPrefix: string | null;
  clientIp: string | null;
  externalReference: string | null;
  errorCode: string | null;
  durationMs: number;
  createdAt: string;
}

export type TenantOperationMode = "AdherenceProgram" | "GovPharmacy";
export type ClinicalPriorityTier = "Normal" | "Elderly" | "Pregnant" | "ChronicCritical";
export type PickupNotificationRouting = "Patient" | "Delegate" | "Both";
export type AdherenceNotificationRouting = "Patient" | "Delegate" | "Both";
export type DelegateRelationship = "Filho" | "Cuidador" | "Conjuge" | "Irmao" | "Outro";

export interface PickupDashboardBatch {
  id: string;
  medicationName: string;
  quantityAvailable: number;
  quantityAllocated: number;
  emergencyReserveRemaining: number;
  status: string;
  batchExpiryDate: string | null;
  receivedAt: string;
}

export interface PickupDashboardOrder {
  id: string;
  patientId: string;
  patientName: string | null;
  medicationName: string;
  status: string;
  priorityRank: number;
  priorityScore: number;
  queuePassword: string | null;
  expectedPickupDate: string | null;
  expectedPickupWindowLabel: string | null;
  readyNotifiedAt: string | null;
  arrivedAt: string | null;
  completedAt: string | null;
}

export interface PickupDashboardWaitlistAlert {
  medicationId: string;
  medicationName: string;
  activeCount: number;
  isCritical: boolean;
}

export interface PickupDashboard {
  activeBatches: PickupDashboardBatch[];
  todayOrders: PickupDashboardOrder[];
  waitlistAlerts: PickupDashboardWaitlistAlert[];
  awaitingPickupCount: number;
  arrivedCount: number;
  openAnomalyCount: number;
}

export interface PickupAnomalyAlert {
  id: string;
  type: string;
  severity: number;
  isDismissed: boolean;
  createdAt: string;
  details: string | null;
  pickupOrderId: string | null;
  patientId: string | null;
  patientName: string | null;
}

export interface ProcurementSuggestion {
  medicationId: string;
  medicationName: string;
  catmatCode: string | null;
  forecastUnits: number;
  waitlistCount: number;
  confidence: string;
}

export interface ProcurementExportRecord {
  id: string;
  exportedAt: string;
  format: string;
  weeksHorizon: number;
  fileName: string | null;
  lineCount: number;
}

export interface PickupStockRiskItem {
  medicationId: string;
  medicationName: string;
  patientsAtRisk: number;
  earliestRunOut: string | null;
}

export interface PickupInsights {
  horizonDays: number;
  stockRisk: PickupStockRiskItem[];
  summary: string;
  aiGenerated: boolean;
}

export interface PickupTvDisplayEntry {
  queuePassword: string;
  patientName: string | null;
  medicationName: string;
  issuedAt: string;
}

export interface PickupTvDisplay {
  recentCalls: PickupTvDisplayEntry[];
  generatedAt: string;
}

export interface PickupAttendanceSlice {
  key: string;
  label: string;
  notified: number;
  arrived: number;
  completed: number;
  noShow: number;
  cancelled: number;
  attendanceRate: number;
}

export interface PickupAttendanceReport {
  from: string;
  to: string;
  groupBy: string;
  slices: PickupAttendanceSlice[];
}

export interface PickupOperationsFunnel {
  from: string;
  to: string;
  medianNotifyToArriveMinutes: number | null;
  medianArriveToCompleteMinutes: number | null;
  medianNotifyToCompleteMinutes: number | null;
  sampleSize: number;
}

export interface PickupDemandForecastItem {
  medicationId: string;
  medicationName: string;
  forecastUnits: number;
  confidence: string;
}

export interface PickupOperationsReport {
  from: string;
  to: string;
  batchesReceived: number;
  ordersAllocated: number;
  ordersNotified: number;
  ordersCompleted: number;
  ordersCancelled: number;
  ordersExpired: number;
  emergencyDispenses: number;
  activeWaitlistEntries: number;
}

export interface MedicationWaitlistEntry {
  id: string;
  tenantId: string;
  patientId: string;
  medicationId: string;
  enrolledAt: string;
  priorityScore: number;
  isActive: boolean;
}

export interface PatientCareDelegate {
  id: string;
  name: string;
  cpf: string | null;
  phone: string;
  relationship: string;
  canPickup: boolean;
  receivesPickupNotifications: boolean;
  receivesAdherenceMessages: boolean;
  canReportCheckin: boolean;
  householdLabel: string | null;
  isActive: boolean;
}

export interface UpsertPatientCareDelegatePayload {
  name: string;
  phone: string;
  cpf?: string;
  relationship?: string;
  canPickup?: boolean;
  receivesPickupNotifications?: boolean;
  receivesAdherenceMessages?: boolean;
  canReportCheckin?: boolean;
  householdLabel?: string;
  isActive?: boolean;
}

export interface ImportPatientsResult {
  created: number;
  skipped: number;
  failed: number;
  errors: Array<{ line: number; phone: string | null; error: string }>;
}

export interface PatientAchievementItem {
  key: string;
  displayName: string;
  description: string;
  unlocked: boolean;
  unlockedAt: string | null;
}

export interface PatientAchievements {
  patientId: string;
  items: PatientAchievementItem[];
}

export interface OnboardingBulkTriggerResult {
  requested: number;
  sent: number;
  skipped: number;
  skippedSamples: Array<{
    patientId: string;
    patientName: string | null;
    reason: string;
  }>;
}

export interface MoriskyQuestionDefinition {
  id: string;
  text: string;
  order: number;
  enabled: boolean;
  yesScoresPoint: boolean;
}

export interface MoriskyLevelThreshold {
  level: string;
  minScore: number;
  maxScore: number;
}

export interface MoriskyScaleDefinition {
  introText: string;
  thankYouText: string;
  invalidText: string;
  questions: MoriskyQuestionDefinition[];
  levels: MoriskyLevelThreshold[];
}

export interface MoriskyScaleViewResponse {
  scale: MoriskyScaleDefinition;
}

export interface MoriskyAssessment {
  id: string;
  trigger: string;
  score: number;
  maxScore: number;
  level: string;
  completedAt: string;
}

export interface MoriskyQuestionAnswer {
  questionId: string;
  order: number;
  text: string;
  answerYes: boolean;
  answerLabel: string;
  changedFromPrevious: boolean | null;
  previousAnswerLabel: string | null;
}

export interface MoriskyAssessmentDetail {
  id: string;
  trigger: string;
  score: number;
  maxScore: number;
  level: string;
  completedAt: string;
  scoreDeltaFromPrevious: number | null;
  previousLevel: string | null;
  levelChanged: boolean;
  answers: MoriskyQuestionAnswer[];
}

export interface PatientMoriskyHistory {
  assessments: MoriskyAssessmentDetail[];
}

export interface MoriskyManualTriggerResult {
  sent: boolean;
  reason: string;
  message: string;
}

export interface MoriskyBulkSkipItem {
  patientId: string;
  patientName: string | null;
  reason: string;
}

export interface MoriskyBulkTriggerResult {
  requested: number;
  sent: number;
  skipped: number;
  skippedSamples: MoriskyBulkSkipItem[];
}

export interface CsatManualTriggerResult {
  sent: boolean;
  reason: string;
  message: string;
}

export interface OnboardingManualTriggerResult {
  sent: boolean;
  reason: string;
  message: string;
}

export interface CsatBulkSkipItem {
  patientId: string;
  patientName: string | null;
  reason: string;
}

export interface CsatBulkTriggerResult {
  requested: number;
  sent: number;
  skipped: number;
  skippedSamples: CsatBulkSkipItem[];
}

export interface MoriskyLevelCount {
  level: string;
  count: number;
}

export interface MoriskyTrendPoint {
  date: string;
  avgNormalizedScore: number;
  count: number;
}

export interface MoriskyTriggerCount {
  trigger: string;
  count: number;
  avgNormalizedScore: number;
}

export interface MoriskyPatientRank {
  patientId: string;
  patientName: string | null;
  phone: string;
  phoneLast4?: string | null;
  score: number;
  maxScore: number;
  level: string;
  checkinAdherenceRate: number | null;
  completedAt: string;
}

export interface MoriskyReport {
  from: string;
  to: string;
  totalAssessments: number;
  avgScore: number;
  avgNormalizedScore: number;
  checkinAdherenceRate: number;
  byLevel: MoriskyLevelCount[];
  trend: MoriskyTrendPoint[];
  byTrigger: MoriskyTriggerCount[];
  patientRanking: MoriskyPatientRank[];
}

export interface AdminMoriskyTenantSlice {
  tenantId: string;
  tenantName: string;
  totalAssessments: number;
  avgNormalizedScore: number;
  lowCount: number;
}

export interface AdminMoriskyPatientRank extends MoriskyPatientRank {
  tenantId: string;
  tenantName: string;
}

export interface AdminMoriskyReport {
  from: string;
  to: string;
  totalAssessments: number;
  avgNormalizedScore: number;
  checkinAdherenceRate: number;
  byLevel: MoriskyLevelCount[];
  trend: MoriskyTrendPoint[];
  byTrigger: MoriskyTriggerCount[];
  byTenant: AdminMoriskyTenantSlice[];
  patientRanking: AdminMoriskyPatientRank[];
}

export interface TpbQuestionDefinition {
  id: string;
  order: number;
  construct: string;
  text: string;
  enabled: boolean;
  reverseScored: boolean;
}

export interface TpbScaleDefinition {
  introText: string;
  thankYouText: string;
  invalidText: string;
  questions: TpbQuestionDefinition[];
}

export interface TpbScaleViewResponse {
  scale: TpbScaleDefinition;
  hasTenantOverride: boolean;
}

export interface TpbQuestionAnswer {
  questionId: string;
  order: number;
  construct: string;
  text: string;
  score: number;
  scoreLabel: string;
  changedFromPrevious: number | null;
  previousScore: number | null;
}

export interface TpbAssessmentDetail {
  id: string;
  trigger: string;
  intentionScore: number;
  constructScores: Record<string, number>;
  completedAt: string;
  intentionDeltaFromPrevious: number | null;
  answers: TpbQuestionAnswer[];
}

export interface PatientTpbHistory {
  assessments: TpbAssessmentDetail[];
}

export interface TpbManualTriggerResult {
  sent: boolean;
  reason: string;
  message: string;
}

export interface TpbBulkSkipItem {
  patientId: string;
  patientName: string | null;
  reason: string;
}

export interface TpbBulkTriggerResult {
  requested: number;
  sent: number;
  skipped: number;
  skippedSamples: TpbBulkSkipItem[];
}

export interface PatientTpbRisk {
  riskScore: number;
  riskLabel: string;
  topFactors: string[];
  modelVersion: string;
  computedAt: string;
}

export interface PreviewTpbInterventionResult {
  text: string;
  source: string;
  weakestConstruct: string | null;
  constructScores: Record<string, number> | null;
}

export interface StrategicAssessmentQuestion {
  id: string;
  text: string;
  order: number;
  enabled: boolean;
  dimension: string | number;
}

export interface StrategicAssessmentScaleDefinition {
  introText: string;
  thankYouText: string;
  invalidText: string;
  minScore: number;
  maxScore: number;
  questions: StrategicAssessmentQuestion[];
}

export interface StrategicAssessmentScaleViewResponse {
  scale: StrategicAssessmentScaleDefinition;
}

export interface StrategicAssessmentAnswer {
  questionId: string;
  score: number;
}

export interface StrategicAssessmentDetail {
  id: string;
  completedAt: string;
  dimensionScores: Record<string, number>;
  primaryBarrier: string | null;
  answers: StrategicAssessmentAnswer[];
}

export interface SubmitStrategicAssessmentResult {
  assessmentId: string;
  dimensionScores: Record<string, number>;
  primaryBarrier: string | null;
  operatorSummary?: string | null;
}

export interface PatientBehavioralProfile {
  patientId: string;
  dimensionScores: Record<string, number>;
  primaryBarrier: string | null;
  sources: string[];
  computedAt: string;
}

export interface TpbConstructAvg {
  construct: string;
  avgScore: number;
}

export interface TpbTrendPoint {
  date: string;
  avgIntentionScore: number;
  count: number;
}

export interface TpbTriggerCount {
  trigger: string;
  count: number;
  avgIntentionScore: number;
}

export interface TpbPatientRank {
  patientId: string;
  patientName: string | null;
  phone: string;
  phoneLast4?: string | null;
  intentionScore: number;
  constructScores: Record<string, number>;
  checkinAdherenceRate: number | null;
  completedAt: string;
}

export interface TpbReport {
  from: string;
  to: string;
  totalAssessments: number;
  avgIntentionScore: number;
  checkinAdherenceRate: number;
  byConstruct: TpbConstructAvg[];
  trend: TpbTrendPoint[];
  byTrigger: TpbTriggerCount[];
  patientRanking: TpbPatientRank[];
}

export interface TpbRiskDistribution {
  label: string;
  count: number;
  percentage: number;
}

export interface TpbRiskReport {
  totalScored: number;
  avgRiskScore: number;
  distribution: TpbRiskDistribution[];
  lastComputedAt: string | null;
}

export interface PatientAiBriefRisk {
  riskScore: number;
  riskLabel: string;
  topFactors: string[];
  modelVersion: string;
}

export interface PatientAiBriefContext {
  adherenceRate30d: number;
  consecutiveMisses: number;
  tpbConstructScores: Record<string, number> | null;
  tpbIntentionScore: number | null;
  moriskyScore: number | null;
  moriskyLevel: string | null;
  risk: PatientAiBriefRisk | null;
  strategicDimensionScores?: Record<string, number> | null;
  primaryBarrier?: string | null;
  primaryBarrierLabel?: string | null;
  recommendedNudgeTypes?: string[] | null;
}

export interface PatientAiBrief {
  summary: string;
  highlights: string[];
  actions: string[];
  source: string;
  generatedAt: string;
  context: PatientAiBriefContext;
}

export interface AiSuggestion {
  id: string;
  title: string;
  description: string;
  actionType: string;
}

export interface PatientAiSuggestions {
  suggestions: AiSuggestion[];
  source: string;
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

export interface CarePlan {
  id: string;
  patientId: string;
  medication: string;
  medicationId?: string | null;
  dosage: string;
  scheduledTimes: string;
  isActive: boolean;
  startDate: string;
  endDate?: string | null;
  instructions?: string | null;
}

export interface CarePlanUpsert {
  medication: string;
  dosage: string;
  scheduledTimes: string;
  instructions?: string;
  endDate?: string;
}

/** @deprecated Use CarePlanUpsert */
export interface CarePlanUpdate extends CarePlanUpsert {}

export interface AdminTenant {
  id: string;
  name: string;
  slug: string;
  planId: string;
  planKey: string;
  tenantOperationMode: TenantOperationMode;
  govPharmacyPickupEnabled: boolean;
  isActive: boolean;
  aiEnabled: boolean;
  createdAt: string;
}

export interface AdminDeletedTenant {
  id: string;
  name: string;
  slug: string;
  deletedAt: string;
  permanentDeleteScheduledAt: string;
  daysRemaining: number;
}

export interface AdminProductMetrics {
  activeTenants: number;
  activePatients: number;
  onboardingsThisWeek: number;
}

export interface PlatformAiUseCaseRoute {
  key: string;
  provider: string | null;
  model: string | null;
}

export interface AdminPlatformAiSettings {
  provider: string;
  model: string;
  isConfigured: boolean;
  openAiConfigured: boolean;
  anthropicConfigured: boolean;
  geminiConfigured: boolean;
  groqConfigured: boolean;
  openAiKeyHint: string | null;
  anthropicKeyHint: string | null;
  geminiKeyHint: string | null;
  groqKeyHint: string | null;
  useCaseRoutes: PlatformAiUseCaseRoute[];
}

export interface PlatformAiTestResult {
  isConfigured: boolean;
  llmResponded: boolean;
  parsedOk: boolean;
  provider: string;
  model: string;
  message: string | null;
  error: string | null;
}

export interface AdminMetaTemplateVariable {
  name: string;
  example: string;
}

export interface AdminMetaTemplateItem {
  number: number;
  canonicalKey: string;
  defaultMetaName: string;
  priority: string;
  category?: string;
  body: string;
  customBody: string | null;
  effectiveBody: string;
  variables: AdminMetaTemplateVariable[];
  buttons: string[];
  mappedMetaName: string | null;
  metaTemplateId: string | null;
  syncStatus: string;
  rejectionReason: string | null;
  validationErrors: string[];
  canSubmit: boolean;
  isCustom?: boolean;
}

export interface AdminMetaTemplateList {
  wabaId: string;
  tenantId: string | null;
  tenantName: string | null;
  metaConfigured: boolean;
  templates: AdminMetaTemplateItem[];
}

export interface AdminMetaTemplateSubmitItemResult {
  canonicalKey: string;
  success: boolean;
  message: string | null;
  metaTemplateId: string | null;
}

export interface AdminMetaTemplateSubmitResult {
  submitted: number;
  skipped: number;
  failed: number;
  results: AdminMetaTemplateSubmitItemResult[];
}

export interface PatientInsightPromptPreview {
  feature: string;
  systemPrompt: string;
  userMessage: string;
  provider: string;
  model: string;
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
  connectionSource: "Manual" | "EmbeddedSignup" | "PlatformOnboarding";
  connectedAt: string | null;
  hasEmbeddedToken: boolean;
  purpose?: WhatsAppSenderPurpose;
}

/** Matches Kokoro.Domain.Enums.WhatsAppActivationStatus (JSON numeric). */
export type WhatsAppActivationStatus =
  | 0 // NoSender
  | 1 // AwaitingOtp
  | 2 // Provisioning
  | 3 // WaitingTemplates
  | 4 // Ready
  | 5 // TrialActive
  | 6; // TrialExpired

/** Matches Kokoro.Domain.Enums.TenantWhatsAppMode (JSON numeric). */
export type TenantWhatsAppMode = 0 | 1; // Trial | Production

/** Matches Kokoro.Domain.Enums.WhatsAppSenderPurpose (JSON numeric). */
export type WhatsAppSenderPurpose = 0 | 1 | 2 | 3; // General | Adherence | Promo | AdherenceAndPromo

export interface WhatsAppActivationStartResult {
  sessionId: string;
  phoneNumber: string;
  codeMethod: string;
  expiresAt: string;
}

export interface WhatsAppActivationVerifyResult {
  senderId: string;
  phoneId: string;
  phoneNumber: string;
  displayName: string;
  webhookConfigured: boolean;
  templatesReady: boolean;
  status: WhatsAppActivationStatus;
}

export interface WhatsAppActivationResendResult {
  codeMethod: string;
  expiresAt: string;
}

export interface WhatsAppActivationSenderDto {
  id: string;
  phoneNumber: string;
  displayName: string;
  purpose: WhatsAppSenderPurpose;
  isActive: boolean;
  connectedAt: string | null;
}

export interface WhatsAppActivationStatusDto {
  status: WhatsAppActivationStatus;
  whatsAppMode: TenantWhatsAppMode;
  trialExpiresAt: string | null;
  senders: WhatsAppActivationSenderDto[];
  activeSessionId: string | null;
  activeSessionPhone?: string | null;
  message: string | null;
}

export interface WhatsAppTrialStartResult {
  trialExpiresAt: string;
  platformPhoneId: string;
}

export interface MetaEmbeddedSignupConfig {
  enabled: boolean;
  appId: string | null;
  configId: string | null;
}

export interface MetaEmbeddedSignupCompleteResult {
  senderId: string;
  wabaId: string;
  phoneId: string;
  phoneNumber: string;
  displayName: string;
  webhookConfigured: boolean;
}

export interface MetaEmbeddedSignupPhoneOption {
  phoneId: string;
  displayPhoneNumber: string;
  verifiedName: string | null;
  isVerified: boolean;
  likelyTestNumber: boolean;
}

export interface MetaEmbeddedSignupFlowResult {
  status: "completed" | "select_phone";
  result: MetaEmbeddedSignupCompleteResult | null;
  sessionId: string | null;
  wabaId: string | null;
  phones: MetaEmbeddedSignupPhoneOption[] | null;
}

export interface WhatsAppBusinessProfile {
  phoneId: string;
  verifiedName: string | null;
  nameStatus: string | null;
  profilePictureUrl: string | null;
  about: string | null;
  description: string | null;
  address: string | null;
  email: string | null;
  vertical: string | null;
  websites: string[];
}

export interface UpdateWhatsAppBusinessProfilePayload {
  about?: string;
  description?: string;
  address?: string;
  email?: string;
  vertical?: string;
  websites?: string[];
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
    hasAppId?: boolean;
    hasEmbeddedSignupConfig?: boolean;
    apiVersion: string;
    simulatorMode: boolean;
    embeddedSignup?: {
      enabled: boolean;
      hasWebhookCallback: boolean;
    };
  };
  platformAi?: {
    provider: string;
    model: string;
    isConfigured: boolean;
    openAiConfigured: boolean;
    anthropicConfigured: boolean;
    geminiConfigured: boolean;
    groqConfigured: boolean;
    openAiKeyHint: string | null;
    anthropicKeyHint: string | null;
    geminiKeyHint: string | null;
    groqKeyHint: string | null;
  };
  senders: Array<{
    id: string;
    tenantSlug: string;
    displayName: string;
    phoneNumber: string;
    wabaId: string;
    phoneId: string;
    isActive: boolean;
    connectionSource?: string;
    connectedAt?: string | null;
    hasEmbeddedToken?: boolean;
  }>;
  events: WhatsappDiagnosticEvent[];
}

export interface PatientWhatsAppWindow {
  isOpen: boolean;
  lastInboundAtUtc: string | null;
  expiresAtUtc: string | null;
  reminderTemplateConfigured: boolean;
  canDeliverCheckinReminder: boolean;
  status: "open" | "closed" | string;
  bannerTitle: string;
  bannerMessage: string;
}

export interface PatientTenantSendWindow {
  sendWindowStart: string;
  sendWindowEnd: string;
  isWithinSendWindowNow: boolean;
  bannerTitle: string;
  bannerMessage: string;
}

export interface PatientScheduling {
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
    wamId?: string | null;
  }[];
  whatsAppWindow?: PatientWhatsAppWindow | null;
  tenantSendWindow?: PatientTenantSendWindow | null;
}

export interface BehavioralBarrierRow {
  barrier: string;
  barrierLabel: string;
  patientCount: number;
  lowAdherenceCount: number;
  lowAdherencePercent: number;
}

export interface BehavioralBarriersReport {
  barriers: BehavioralBarrierRow[];
  totalPatientsWithProfile: number;
  generatedAt: string;
}

export interface PromoDefaults {
  defaultMessage: string | null;
  promotionTemplateConfigured: boolean;
  templateBody: string | null;
  promoSenderConfigured: boolean;
  activePatientsCount: number;
  allEligibleCount: number;
}

export interface PromoCampaignListItem {
  id: string;
  message: string;
  purchaseUrlSuffix: string | null;
  couponCode: string | null;
  segment: string;
  status: string;
  totalRecipients: number;
  sentCount: number;
  failedCount: number;
  skippedCount: number;
  createdAt: string;
  scheduledAt: string | null;
  startedAt: string | null;
  completedAt: string | null;
}

export interface PromoCampaignRecipient {
  patientId: string;
  patientName: string | null;
  phone: string;
  status: string;
  errorMessage: string | null;
  sentAt: string | null;
}

export interface PromoCampaignDetail extends PromoCampaignListItem {
  recipients: PromoCampaignRecipient[];
}

export interface AdminVoiceCacheState {
  alias: string;
  voiceId: string;
  displayName: string;
  cached: boolean;
  cachedBytes: number | null;
}

export interface AdminVoiceCatalogEntry {
  id: string;
  templateKey: string | null;
  label: string;
  sampleText: string;
  preparedText: string;
  isBuiltIn: boolean;
  voices: AdminVoiceCacheState[];
}

export interface AdminVoiceCatalogResponse {
  synthesisSpeed: number;
  cacheTtlHours: number;
  warmCacheOnStartup: boolean;
  voices: { alias: string; voiceId: string; label: string }[];
  entries: AdminVoiceCatalogEntry[];
}

export interface AdminVoiceWarmResult {
  configured: boolean;
  warmed: number;
  cacheHits: number;
  failed: number;
  totalAttempts: number;
  voiceIds: string[];
}
