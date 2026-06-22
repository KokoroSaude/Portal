import { Button } from "@/components/ui/button";

export function SettingsSaveButton({
  onSave,
  pending,
  label = "Salvar alterações",
}: {
  onSave: () => void;
  pending: boolean;
  label?: string;
}) {
  return (
    <Button onClick={onSave} disabled={pending}>
      {pending ? "Salvando…" : label}
    </Button>
  );
}
