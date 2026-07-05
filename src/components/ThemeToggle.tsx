import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SidebarCollapsedFlyout } from "@/components/layout/SidebarCollapsedFlyout";
import { useTheme } from "@/contexts/ThemeContext";

export function ThemeToggle({
  collapsed = false,
  iconOnly = false,
}: {
  collapsed?: boolean;
  iconOnly?: boolean;
}) {
  const { resolvedTheme, toggleTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  const label = isDark ? "Tema claro" : "Tema escuro";
  const Icon = isDark ? Sun : Moon;

  const iconButton = (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      aria-label={label}
      onClick={toggleTheme}
      className="size-8 shrink-0 text-primary-foreground/80 hover:bg-white/10 hover:text-primary-foreground"
    >
      <Icon className="size-4" />
    </Button>
  );

  if (collapsed) {
    return (
      <SidebarCollapsedFlyout collapsed label={label}>
        {iconButton}
      </SidebarCollapsedFlyout>
    );
  }

  if (iconOnly) {
    return (
      <SidebarCollapsedFlyout forceTooltip placement="top" label={label}>
        {iconButton}
      </SidebarCollapsedFlyout>
    );
  }

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      onClick={toggleTheme}
      className="w-full justify-start text-primary-foreground/80 hover:bg-white/10 hover:text-primary-foreground"
    >
      <Icon className="size-4" />
      {label}
    </Button>
  );
}
