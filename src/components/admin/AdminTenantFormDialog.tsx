import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { TENANT_PLAN_OPTIONS, TENANT_MODULE_LABELS, TENANT_SEGMENT_LABELS, TENANT_SEGMENT_DESCRIPTIONS } from "@/lib/constants";
import { ALL_TENANT_MODULES, SEGMENT_DEFAULT_MODULES } from "@/lib/tenant-modules";
import type { AdminTenant, TenantModule, TenantSegment } from "@/types/api";

function slugify(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export type AdminTenantCreateForm = {
  name: string;
  slug: string;
  planId: string;
  tenantSegment: TenantSegment;
  enabledModules: TenantModule[];
  adminName: string;
  adminEmail: string;
  adminPassword: string;
  isActive: boolean;
  aiEnabled: boolean;
};

export type AdminTenantEditForm = {
  name: string;
  slug: string;
  planId: string;
  tenantSegment: TenantSegment;
  enabledModules: TenantModule[];
  isActive: boolean;
  aiEnabled: boolean;
};

const defaultPlanId = TENANT_PLAN_OPTIONS[2].id;

const emptyCreate: AdminTenantCreateForm = {
  name: "",
  slug: "",
  planId: defaultPlanId,
  tenantSegment: "RetailPharmacy",
  enabledModules: SEGMENT_DEFAULT_MODULES.RetailPharmacy,
  adminName: "",
  adminEmail: "",
  adminPassword: "",
  isActive: true,
  aiEnabled: false,
};

function toEditForm(tenant: AdminTenant): AdminTenantEditForm {
  return {
    name: tenant.name,
    slug: tenant.slug,
    planId: tenant.planId,
    tenantSegment: tenant.tenantSegment ?? "RetailPharmacy",
    enabledModules:
      tenant.enabledModules?.length > 0
        ? tenant.enabledModules
        : SEGMENT_DEFAULT_MODULES[tenant.tenantSegment ?? "RetailPharmacy"],
    isActive: tenant.isActive,
    aiEnabled: tenant.aiEnabled,
  };
}

const ALL_MODULES = ALL_TENANT_MODULES;

function applySegmentChange<T extends AdminTenantCreateForm | AdminTenantEditForm>(
  form: T,
  segment: TenantSegment,
): T {
  return {
    ...form,
    tenantSegment: segment,
    enabledModules: SEGMENT_DEFAULT_MODULES[segment],
  };
}

type Props =
  | {
      mode: "create";
      open: boolean;
      onOpenChange: (open: boolean) => void;
      loading?: boolean;
      onSubmit: (form: AdminTenantCreateForm) => void;
      tenant?: never;
    }
  | {
      mode: "edit";
      open: boolean;
      onOpenChange: (open: boolean) => void;
      loading?: boolean;
      tenant: AdminTenant | null;
      onSubmit: (form: AdminTenantEditForm) => void;
    };

export function AdminTenantFormDialog(props: Props) {
  const { mode, open, onOpenChange, loading } = props;
  const [slugTouched, setSlugTouched] = useState(false);
  const [createForm, setCreateForm] = useState<AdminTenantCreateForm>(emptyCreate);
  const [editForm, setEditForm] = useState<AdminTenantEditForm | null>(null);

  useEffect(() => {
    if (mode === "edit" && props.tenant && open) {
      setEditForm(toEditForm(props.tenant));
      setSlugTouched(true);
    }
    if (mode === "create" && open) {
      setCreateForm(emptyCreate);
      setSlugTouched(false);
    }
  }, [mode, open, props.tenant]);

  function updateCreate<K extends keyof AdminTenantCreateForm>(field: K, value: AdminTenantCreateForm[K]) {
    setCreateForm((prev) => {
      const next = { ...prev, [field]: value };
      if (field === "name" && !slugTouched) {
        next.slug = slugify(String(value));
      }
      return next;
    });
  }

  function updateEdit<K extends keyof AdminTenantEditForm>(field: K, value: AdminTenantEditForm[K]) {
    setEditForm((prev) => (prev ? { ...prev, [field]: value } : prev));
  }

  const form = mode === "create" ? createForm : editForm;
  if (!form) return null;

  const title = mode === "create" ? "Nova organização" : "Editar organização";
  const description =
    mode === "create"
      ? "Cria a farmácia/clínica e o primeiro usuário administrador."
      : "Atualiza nome, slug, plano, tipo de operação e status da organização.";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[min(90vh,720px)] max-w-lg flex-col gap-0 overflow-hidden p-0">
        <DialogHeader className="shrink-0 px-6 pt-6">
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-2">
          <div className="grid gap-4">
          <div className="space-y-2">
            <Label htmlFor="tenant-name">Nome</Label>
            <Input
              id="tenant-name"
              value={form.name}
              onChange={(e) =>
                mode === "create"
                  ? updateCreate("name", e.target.value)
                  : updateEdit("name", e.target.value)
              }
              placeholder="Farmácia Municipal Centro"
              required
            />
          </div>

          <div className="space-y-2">
            <Label>Segmento GTM</Label>
            <Select
              value={form.tenantSegment}
              onValueChange={(value) => {
                const segment = value as TenantSegment;
                if (mode === "create") {
                  setCreateForm((prev) => applySegmentChange(prev, segment));
                } else {
                  setEditForm((prev) => (prev ? applySegmentChange(prev, segment) : prev));
                }
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione o segmento" />
              </SelectTrigger>
              <SelectContent position="popper" className="z-[100]">
                {Object.entries(TENANT_SEGMENT_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              {TENANT_SEGMENT_DESCRIPTIONS[form.tenantSegment]}
            </p>
          </div>

          <div className="space-y-2">
            <Label>Módulos habilitados</Label>
            <p className="text-xs text-muted-foreground">
              Qualquer combinação é permitida — o segmento só sugere o pacote inicial ao trocar o
              perfil.
            </p>
            <div className="grid gap-2 rounded-lg border p-3">
              {ALL_MODULES.map((module) => {
                const checked = form.enabledModules.includes(module);
                const locked = module === "Adherence";
                return (
                  <label key={module} className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      className="size-4 rounded border"
                      checked={checked}
                      disabled={locked}
                      onChange={(e) => {
                        const next = e.target.checked
                          ? [...form.enabledModules, module]
                          : form.enabledModules.filter((m) => m !== module);
                        if (mode === "create") {
                          updateCreate("enabledModules", next);
                        } else {
                          updateEdit("enabledModules", next);
                        }
                      }}
                    />
                    <span>{TENANT_MODULE_LABELS[module] ?? module}</span>
                  </label>
                );
              })}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="tenant-slug">Slug</Label>
            <Input
              id="tenant-slug"
              value={form.slug}
              onChange={(e) => {
                setSlugTouched(true);
                const slug = slugify(e.target.value);
                mode === "create" ? updateCreate("slug", slug) : updateEdit("slug", slug);
              }}
              placeholder="farmacia-municipal-centro"
              required
            />
            <p className="text-xs text-muted-foreground">Identificador único (letras minúsculas e hífens).</p>
          </div>

          <div className="space-y-2">
            <Label>Plano</Label>
            <Select
              value={form.planId}
              onValueChange={(value) =>
                mode === "create" ? updateCreate("planId", value) : updateEdit("planId", value)
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione o plano" />
              </SelectTrigger>
              <SelectContent>
                {TENANT_PLAN_OPTIONS.map((plan) => (
                  <SelectItem key={plan.id} value={plan.id}>
                    {plan.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {mode === "create" && (
            <>
              <div className="space-y-2">
                <Label htmlFor="admin-name">Nome do administrador</Label>
                <Input
                  id="admin-name"
                  value={createForm.adminName}
                  onChange={(e) => updateCreate("adminName", e.target.value)}
                  required
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="admin-email">E-mail admin</Label>
                  <Input
                    id="admin-email"
                    type="email"
                    value={createForm.adminEmail}
                    onChange={(e) => updateCreate("adminEmail", e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="admin-password">Senha inicial</Label>
                  <Input
                    id="admin-password"
                    type="password"
                    minLength={8}
                    value={createForm.adminPassword}
                    onChange={(e) => updateCreate("adminPassword", e.target.value)}
                    required
                  />
                </div>
              </div>
            </>
          )}

          <div className="flex items-center justify-between rounded-lg border p-3">
            <div>
              <p className="text-sm font-medium">Organização ativa</p>
              <p className="text-xs text-muted-foreground">Inativa bloqueia acesso da equipe.</p>
            </div>
            <Switch
              checked={form.isActive}
              onCheckedChange={(checked) =>
                mode === "create" ? updateCreate("isActive", checked) : updateEdit("isActive", checked)
              }
            />
          </div>

          <div className="flex items-center justify-between rounded-lg border p-3">
            <div>
              <p className="text-sm font-medium">IA habilitada</p>
              <p className="text-xs text-muted-foreground">Copilot e personalização por organização.</p>
            </div>
            <Switch
              checked={form.aiEnabled}
              onCheckedChange={(checked) =>
                mode === "create" ? updateCreate("aiEnabled", checked) : updateEdit("aiEnabled", checked)
              }
            />
          </div>
          </div>
        </div>

        <DialogFooter className="shrink-0 border-t px-6 py-4">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            type="button"
            disabled={loading || !form.name.trim() || !form.slug.trim()}
            onClick={() => {
              if (mode === "create") {
                props.onSubmit(createForm);
              } else if (editForm) {
                props.onSubmit(editForm);
              }
            }}
          >
            {loading ? "Salvando…" : mode === "create" ? "Criar organização" : "Salvar alterações"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
