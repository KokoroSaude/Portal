import { BehavioralProfileCard } from "@/components/patients/BehavioralProfileCard";
import { StrategicAssessmentForm } from "@/components/patients/StrategicAssessmentForm";
import type { PatientBehavioralProfile, PatientTpbRisk } from "@/types/api";

type PatientBehavioralTabProps = {
  token: string;
  patientId: string;
  canWrite: boolean;
  profile: PatientBehavioralProfile | undefined;
  profileLoading: boolean;
  tpbRisk: PatientTpbRisk | undefined;
  tpbRiskLoading: boolean;
};

export function PatientBehavioralTab({
  token,
  patientId,
  canWrite,
  profile,
  profileLoading,
  tpbRisk,
  tpbRiskLoading,
}: PatientBehavioralTabProps) {
  return (
    <div className="space-y-6">
      <BehavioralProfileCard
        profile={profile}
        tpbRisk={tpbRisk}
        isLoading={profileLoading}
        riskLoading={tpbRiskLoading}
      />
      <StrategicAssessmentForm token={token} patientId={patientId} canWrite={canWrite} />
    </div>
  );
}
