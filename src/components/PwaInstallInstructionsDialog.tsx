import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { PWA_APP_NAME } from "@/lib/pwa";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

const STEPS = [
  {
    title: "Opção 1 — Menu do navegador",
    body: 'Clique no menu (⋮ ou ⋯) do seu navegador e procure por "Instalar aplicativo" ou "Adicionar à tela inicial".',
  },
  {
    title: "Opção 2 — Barra de endereço",
    body: "Alguns navegadores mostram um ícone de instalação na barra de endereço. Clique nele para instalar.",
  },
  {
    title: "Opção 3 — Banner do navegador",
    body: 'Alguns navegadores mostram um banner com a opção de instalar. Clique em "Instalar" ou "Adicionar".',
  },
] as const;

export function PwaInstallInstructionsDialog({ open, onOpenChange }: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Instalar {PWA_APP_NAME}</DialogTitle>
          <DialogDescription>Siga os passos abaixo para instalar o aplicativo.</DialogDescription>
        </DialogHeader>

        <ol className="space-y-4 text-sm">
          {STEPS.map((step, index) => (
            <li key={step.title} className="space-y-1">
              <p className="font-medium text-foreground">{step.title}</p>
              <p className="text-muted-foreground">{step.body}</p>
              {index < STEPS.length - 1 ? null : null}
            </li>
          ))}
        </ol>

        <p className="rounded-lg bg-muted/60 px-3 py-2 text-sm text-muted-foreground">
          ✓ Pronto! O aplicativo será instalado e aparecerá na sua tela inicial.
        </p>
      </DialogContent>
    </Dialog>
  );
}
