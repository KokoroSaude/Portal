import { NavLink, Outlet, useOutletContext } from "react-router-dom";
import { cn } from "@/lib/utils";
import type { SettingsAiOutletContext } from "@/pages/settings/SettingsAiLayout";

const CONVERSATION_TABS = [
  { to: "/configuracoes/ia/conversacao/modos", label: "Modos inbound" },
  { to: "/configuracoes/ia/conversacao/handoff", label: "Handoff e timing" },
  { to: "/configuracoes/ia/conversacao/automacao", label: "Automação" },
] as const;

export function SettingsAiConversationLayout() {
  const context = useOutletContext<SettingsAiOutletContext>();

  return (
    <div className="space-y-4">
      <nav
        className="flex flex-wrap gap-1 rounded-lg border border-border bg-muted/30 p-1"
        aria-label="Seções de conversação"
      >
        {CONVERSATION_TABS.map((tab) => (
          <NavLink
            key={tab.to}
            to={tab.to}
            className={({ isActive }) =>
              cn(
                "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                isActive
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )
            }
          >
            {tab.label}
          </NavLink>
        ))}
      </nav>
      <Outlet context={context} />
    </div>
  );
}
