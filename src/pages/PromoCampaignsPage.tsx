import { Megaphone } from "lucide-react";
import { DocsHelpButton } from "@/components/DocsHelpButton";
import { PromoCampaignsPanel } from "@/components/whatsapp/PromoCampaignsPanel";

export function PromoCampaignsPage() {
  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-semibold tracking-tight">
            <Megaphone className="size-7" />
            Promoções WhatsApp
          </h1>
          <p className="text-muted-foreground">
            Campanhas em massa com template Meta de marketing — fora da janela de 24h.
          </p>
        </div>
        <DocsHelpButton />
      </div>
      <PromoCampaignsPanel />
    </div>
  );
}
