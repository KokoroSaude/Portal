import { RotateCcw, Save } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { adminTemplateToneLabel } from "@/lib/adminTemplateTones";
import { categoryLabel } from "@/lib/templateCatalog";
import type { AdminMessageTemplate } from "@/types/api";

type AdminTemplateEditorPanelProps = {
  tone: string;
  selected: AdminMessageTemplate | null;
  content: string;
  description: string;
  onContentChange: (value: string) => void;
  onDescriptionChange: (value: string) => void;
  onSave: () => void;
  onReset: () => void;
  savePending?: boolean;
  resetPending?: boolean;
  emptyTitle?: string;
  emptyDescription?: string;
};

export function AdminTemplateEditorPanel({
  tone,
  selected,
  content,
  description,
  onContentChange,
  onDescriptionChange,
  onSave,
  onReset,
  savePending,
  resetPending,
  emptyTitle = "Selecione uma mensagem",
  emptyDescription = "Escolha um item à esquerda para editar o texto.",
}: AdminTemplateEditorPanelProps) {
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="text-base">
          {selected ? selected.description ?? selected.baseKey : emptyTitle}
        </CardTitle>
        <CardDescription>
          Tom: {adminTemplateToneLabel(tone)}. Variáveis: {"{nome}"}, {"{medicamento}"}, {"{horario}"},{" "}
          {"{saudacao}"}.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {selected ? (
          <>
            <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
              <Badge variant="outline">{categoryLabel(selected.category)}</Badge>
              {selected.isCustomized && <Badge variant="secondary">Editado</Badge>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="template-desc">Descrição interna (opcional)</Label>
              <Input
                id="template-desc"
                value={description}
                onChange={(e) => onDescriptionChange(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="template-content">Texto enviado no WhatsApp</Label>
              <Textarea
                id="template-content"
                rows={12}
                value={content}
                onChange={(e) => onContentChange(e.target.value)}
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <Button onClick={onSave} disabled={savePending}>
                <Save className="size-4" />
                Salvar
              </Button>
              {selected.isCustomized && (
                <Button variant="outline" onClick={onReset} disabled={resetPending}>
                  <RotateCcw className="size-4" />
                  Restaurar padrão
                </Button>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Chave técnica: <span className="font-mono">{selected.templateKey}</span>
            </p>
          </>
        ) : (
          <p className="text-sm text-muted-foreground">{emptyDescription}</p>
        )}
      </CardContent>
    </Card>
  );
}
