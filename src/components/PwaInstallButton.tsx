import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SidebarCollapsedFlyout } from "@/components/layout/SidebarCollapsedFlyout";
import { usePwaInstall } from "@/contexts/PwaInstallContext";
import { cn } from "@/lib/utils";
import { PwaInstallInstructionsDialog } from "@/components/PwaInstallInstructionsDialog";

type Props = {
  variant?: "sidebar" | "login";
  collapsed?: boolean;
  iconOnly?: boolean;
  className?: string;
};

const sidebarIconClass =
  "size-8 shrink-0 text-primary-foreground/80 hover:bg-white/10 hover:text-primary-foreground";

export function PwaInstallButton({
  variant = "sidebar",
  collapsed = false,
  iconOnly = false,
  className,
}: Props) {
  const { showInstallButton, instructionsOpen, setInstructionsOpen, promptInstall } = usePwaInstall();

  if (!showInstallButton) return null;

  if (variant === "sidebar" && (collapsed || iconOnly)) {
    const button = (
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className={cn(sidebarIconClass, className)}
        aria-label="Instalar aplicativo"
        onClick={() => void promptInstall()}
      >
        <Download className="size-4" />
      </Button>
    );

    return (
      <>
        {iconOnly ? (
          <SidebarCollapsedFlyout forceTooltip placement="top" label="Instalar aplicativo">
            {button}
          </SidebarCollapsedFlyout>
        ) : (
          button
        )}
        <PwaInstallInstructionsDialog open={instructionsOpen} onOpenChange={setInstructionsOpen} />
      </>
    );
  }

  if (variant === "sidebar") {
    return (
      <>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className={cn(
            "w-full justify-start text-primary-foreground/80 hover:bg-white/10 hover:text-primary-foreground",
            className,
          )}
          onClick={() => void promptInstall()}
        >
          <Download className="size-4" />
          Instalar aplicativo
        </Button>
        <PwaInstallInstructionsDialog open={instructionsOpen} onOpenChange={setInstructionsOpen} />
      </>
    );
  }

  return (
    <>
      <Button
        type="button"
        variant="outline"
        className={cn("w-full border-primary-foreground/30 bg-white/10 text-primary-foreground hover:bg-white/20", className)}
        onClick={() => void promptInstall()}
      >
        <Download className="size-4" />
        Instalar aplicativo
      </Button>
      <PwaInstallInstructionsDialog open={instructionsOpen} onOpenChange={setInstructionsOpen} />
    </>
  );
}
