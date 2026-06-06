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
}

export interface PlatformUserInfo {
  userId: string;
  name: string;
  email: string;
  role: string;
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

export interface TenantSettings {
  sendWindowStart: string;
  sendWindowEnd: string;
  followupAfterHours: number;
  maxReengagementAttempts: number;
  inactiveDaysBeforeReengagement: number;
  voiceTone: string;
  locale: string;
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

export interface AdminPlan {
  id: string;
  key: string;
  name: string;
  sortOrder: number;
  isActive: boolean;
  tenantCount: number;
}

export interface AdminFeature {
  id: string;
  key: string;
  name: string;
  category: string;
  valueType: string;
  isActive: boolean;
}

export interface AdminTenant {
  id: string;
  name: string;
  slug: string;
  isActive: boolean;
  planKey: string;
  planName: string;
}

export interface PublicPlan {
  id: string;
  key: string;
  name: string;
  sortOrder: number;
}

export interface PlanFeatureUpdate {
  featureKey: string;
  enabled: boolean;
  limitValue?: string | null;
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
