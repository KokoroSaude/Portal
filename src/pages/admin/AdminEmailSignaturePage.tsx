import { useRef, useState } from "react";
import html2canvas from "html2canvas";
import { Download } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";

const LOGO_SRC = "/brand/logo-signature.png";

export function EmailSignaturePreview({
  name,
  role,
  email,
  phone,
  website,
  captureRef,
}: {
  name: string;
  role: string;
  email: string;
  phone: string;
  website: string;
  captureRef?: React.RefObject<HTMLTableElement | null>;
}) {
  const siteUrl = website.startsWith("http") ? website : `https://${website}`;

  return (
    <table
      ref={captureRef}
      id="kokoro-signature"
      cellPadding={0}
      cellSpacing={0}
      role="presentation"
      style={{
        borderCollapse: "collapse",
        width: 640,
        maxWidth: 640,
        borderRadius: 10,
        overflow: "hidden",
      }}
    >
      <tbody>
        <tr>
          <td
            valign="middle"
            style={{
              width: 200,
              padding: "18px 24px 18px 28px",
              backgroundColor: "#ffffff",
            }}
          >
            <img
              src={LOGO_SRC}
              alt="Kokoro Saúde"
              width={160}
              crossOrigin="anonymous"
              style={{ display: "block", border: 0 }}
            />
          </td>
          <td
            valign="middle"
            style={{
              padding: "18px 32px 18px 24px",
              backgroundColor: "#F57170",
              fontFamily: "Arial, Helvetica, sans-serif",
              color: "#ffffff",
            }}
          >
            <p
              style={{
                margin: "0 0 4px 0",
                fontSize: 18,
                fontWeight: "bold",
                fontFamily: "Georgia, serif",
                lineHeight: 1.3,
              }}
            >
              {name || "Seu Nome"}
            </p>
            <p style={{ margin: "0 0 12px 0", fontSize: 13, lineHeight: 1.3 }}>
              {role || "Seu cargo"}
            </p>
            <p style={{ margin: "0 0 4px 0", fontSize: 14, lineHeight: 1.5 }}>
              <span style={{ color: "#ffffff", textDecoration: "none" }}>{email || "email@kokorosaude.com.br"}</span>
            </p>
            <p style={{ margin: "0 0 4px 0", fontSize: 14, lineHeight: 1.5 }}>
              <span style={{ color: "#ffffff", textDecoration: "none" }}>{phone || "+55 11 99999-9999"}</span>
            </p>
            <p style={{ margin: 0, fontSize: 14, lineHeight: 1.5 }}>
              <span style={{ color: "#ffffff", textDecoration: "none" }}>{siteUrl.replace(/^https?:\/\//, "")}</span>
            </p>
          </td>
        </tr>
      </tbody>
    </table>
  );
}

export function AdminEmailSignaturePage() {
  const { auth } = useAuth();
  const captureRef = useRef<HTMLTableElement>(null);
  const [exporting, setExporting] = useState(false);

  const [form, setForm] = useState({
    name: auth?.platformUser?.name ?? "",
    role: "",
    email: auth?.platformUser?.email ?? "",
    phone: "",
    website: "kokorosaude.com.br",
  });

  async function handleExport() {
    if (!captureRef.current) return;
    setExporting(true);
    try {
      if (document.fonts?.ready) await document.fonts.ready;
      const canvas = await html2canvas(captureRef.current, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: null,
        logging: false,
      });
      const link = document.createElement("a");
      link.download = "kokoro-assinatura.jpg";
      link.href = canvas.toDataURL("image/jpeg", 0.95);
      link.click();
      toast.success("Assinatura exportada em JPG");
    } catch {
      toast.error("Não foi possível exportar. Tente novamente.");
    } finally {
      setExporting(false);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Assinatura de e-mail"
        description="Gere a assinatura horizontal Kokoro e exporte em JPG para Gmail ou Outlook."
      />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,340px)_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Seus dados</CardTitle>
            <CardDescription>Preencha e veja o preview ao lado.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="sig-name">Nome</Label>
              <Input
                id="sig-name"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sig-role">Cargo</Label>
              <Input
                id="sig-role"
                placeholder="Co-fundador"
                value={form.role}
                onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sig-email">E-mail</Label>
              <Input
                id="sig-email"
                type="email"
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sig-phone">Telefone</Label>
              <Input
                id="sig-phone"
                placeholder="+55 11 99999-9999"
                value={form.phone}
                onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sig-site">Site</Label>
              <Input
                id="sig-site"
                value={form.website}
                onChange={(e) => setForm((f) => ({ ...f, website: e.target.value }))}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-4 space-y-0">
            <div>
              <CardTitle>Preview</CardTitle>
              <CardDescription>640px · logo transparente · fundo coral</CardDescription>
            </div>
            <Button onClick={handleExport} disabled={exporting}>
              <Download className="size-4" />
              {exporting ? "Exportando…" : "Exportar JPG"}
            </Button>
          </CardHeader>
          <CardContent className="overflow-x-auto rounded-lg bg-muted/40 p-6">
            <EmailSignaturePreview {...form} captureRef={captureRef} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
