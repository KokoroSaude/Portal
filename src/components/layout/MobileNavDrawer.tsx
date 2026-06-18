import * as Dialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

type MobileNavDrawerProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
};

export function MobileNavDrawer({ open, onOpenChange, children }: MobileNavDrawerProps) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay
          className={cn(
            "fixed inset-0 z-50 bg-foreground/30 backdrop-blur-[2px]",
            "data-[state=open]:animate-in data-[state=closed]:animate-out",
            "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
          )}
        />
        <Dialog.Content
          className={cn(
            "fixed inset-y-0 left-0 z-50 flex min-h-0 w-[min(100vw,18rem)] flex-col overflow-hidden shadow-soft-lg outline-none",
            "data-[state=open]:animate-in data-[state=closed]:animate-out",
            "data-[state=closed]:slide-out-to-left data-[state=open]:slide-in-from-left",
            "duration-200",
          )}
        >
          <Dialog.Title className="sr-only">Menu de navegação</Dialog.Title>
          <Dialog.Description className="sr-only">
            Links do portal Kokoro
          </Dialog.Description>
          {children}
          <Dialog.Close
            className="absolute right-3 top-3 z-20 rounded-lg p-2 text-primary-foreground/80 transition-colors hover:bg-white/10 hover:text-primary-foreground focus:outline-none focus:ring-2 focus:ring-white/30"
            aria-label="Fechar menu"
          >
            <X className="size-5" />
          </Dialog.Close>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
