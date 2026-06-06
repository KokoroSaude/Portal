import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/lib/api";
import { FEATURE_KEYS } from "@/lib/constants";
import {
  isChecklistStepMarked,
  markChecklistFromPath,
  type TenantChecklistKey,
} from "@/lib/tenantChecklist";

export type TenantChecklistItem = {
  key: TenantChecklistKey;
  title: string;
  description: string;
  to: string;
  done: boolean;
};

export function useTenantOnboardingChecklist() {
  const { token, isTenant, hasFeature } = useAuth();
  const location = useLocation();

  useEffect(() => {
    if (isTenant) markChecklistFromPath(location.pathname);
  }, [isTenant, location.pathname]);

  const sendersQuery = useQuery({
    queryKey: ["senders", "checklist"],
    queryFn: () => api.listSenders(token!),
    enabled: !!token && isTenant && hasFeature(FEATURE_KEYS.whatsappSendersManage),
    staleTime: 60_000,
  });

  const patientsQuery = useQuery({
    queryKey: ["patients", "checklist"],
    queryFn: () => api.getPatients(token!, { page: 1, pageSize: 1 }),
    enabled: !!token && isTenant,
    staleTime: 60_000,
  });

  const templatesQuery = useQuery({
    queryKey: ["templates", "checklist"],
    queryFn: () => api.getTemplates(token!),
    enabled: !!token && isTenant && hasFeature(FEATURE_KEYS.templatesCustomRead),
    staleTime: 60_000,
  });

  const whatsappDone =
    (sendersQuery.data?.some((s) => s.isActive && s.wabaId && s.phoneId) ?? false) ||
    isChecklistStepMarked("whatsapp");

  const messagesDone =
    (templatesQuery.data?.some((t) => t.isCustom) ?? false) || isChecklistStepMarked("messages");

  const patientDone = (patientsQuery.data?.total ?? 0) > 0 || isChecklistStepMarked("patient");

  const items: TenantChecklistItem[] = [
    {
      key: "whatsapp",
      title: "Conectar WhatsApp",
      description: "Cadastre WABA ID e Phone ID na Meta Business API.",
      to: "/whatsapp",
      done: whatsappDone,
    },
    {
      key: "messages",
      title: "Validar mensagens",
      description: "Revise templates e o preview antes de enviar aos pacientes.",
      to: hasFeature(FEATURE_KEYS.templatesCustomRead) ? "/templates" : "/jornada",
      done: messagesDone,
    },
    {
      key: "patient",
      title: "Primeiro paciente",
      description:
        "Cadastre pelo portal ou peça para o paciente enviar uma mensagem ao seu número WhatsApp.",
      to: "/pacientes",
      done: patientDone,
    },
  ];

  const completedCount = items.filter((i) => i.done).length;

  return {
    items,
    completedCount,
    totalCount: items.length,
    isLoading: sendersQuery.isLoading || patientsQuery.isLoading,
    enabled: isTenant,
  };
}
