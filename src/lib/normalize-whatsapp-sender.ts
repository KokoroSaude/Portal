import type { WhatsAppSenderPurpose, WhatsappSender } from "@/types/api";

const PURPOSE_FROM_API: Record<string, WhatsAppSenderPurpose> = {
  General: 0,
  Adherence: 1,
  Promo: 2,
  AdherenceAndPromo: 3,
};

export const WHATSAPP_SENDER_PURPOSE_TO_API: Record<WhatsAppSenderPurpose, string> = {
  0: "General",
  1: "Adherence",
  2: "Promo",
  3: "AdherenceAndPromo",
};

export function normalizeWhatsAppSenderPurpose(raw: unknown): WhatsAppSenderPurpose {
  if (typeof raw === "number" && raw >= 0 && raw <= 3) {
    return raw as WhatsAppSenderPurpose;
  }
  if (typeof raw === "string" && raw in PURPOSE_FROM_API) {
    return PURPOSE_FROM_API[raw];
  }
  return 1;
}

type RawWhatsappSender = WhatsappSender & {
  Id?: string;
  PhoneNumber?: string;
  DisplayName?: string;
  WabaId?: string;
  PhoneId?: string;
  IsActive?: boolean;
  CreatedAt?: string;
  ConnectionSource?: WhatsappSender["connectionSource"];
  ConnectedAt?: string | null;
  HasEmbeddedToken?: boolean;
  Purpose?: unknown;
};

export function normalizeWhatsappSender(raw: RawWhatsappSender): WhatsappSender {
  return {
    id: raw.id ?? raw.Id ?? "",
    phoneNumber: raw.phoneNumber ?? raw.PhoneNumber ?? "",
    displayName: raw.displayName ?? raw.DisplayName ?? "",
    wabaId: raw.wabaId ?? raw.WabaId ?? "",
    phoneId: raw.phoneId ?? raw.PhoneId ?? "",
    isActive: raw.isActive ?? raw.IsActive ?? false,
    createdAt: raw.createdAt ?? raw.CreatedAt ?? "",
    connectionSource: raw.connectionSource ?? raw.ConnectionSource ?? "Manual",
    connectedAt: raw.connectedAt ?? raw.ConnectedAt ?? null,
    hasEmbeddedToken: raw.hasEmbeddedToken ?? raw.HasEmbeddedToken ?? false,
    purpose: normalizeWhatsAppSenderPurpose(raw.purpose ?? raw.Purpose),
  };
}
