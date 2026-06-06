import { useEffect, useRef, useState } from "react";
import html2canvas from "html2canvas";
import { Download } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

/** Mesmo asset usado em assets/email/assinatura-kokoro.html */
const SIGNATURE_LOGO_PATH = "/brand/logo-signature.png";

const EXAMPLE_PLACEHOLDERS = {
  name: "Ana Silva",
  role: "Coordenação de Produto",
  email: "contato@exemplo.com.br",
  phone: "+55 11 98765-4321",
  website: "kokorosaude.com.br",
};

async function waitForImages(root: ParentNode) {
  const images = Array.from(root.querySelectorAll("img"));
  await Promise.all(
    images.map(
      (img) =>
        new Promise<void>((resolve) => {
          if (img.complete) resolve();
          else {
            img.onload = () => resolve();
            img.onerror = () => resolve();
          }
        }),
    ),
  );
}

/** html2canvas não entende oklch (Tailwind v4) — captura em iframe limpo. */
async function captureSignatureToBlob(
  source: HTMLTableElement,
  logoDataUrl: string,
): Promise<Blob> {
  const iframe = document.createElement("iframe");
  iframe.setAttribute("aria-hidden", "true");
  iframe.style.cssText =
    "position:fixed;left:-10000px;top:0;width:640px;height:240px;border:0;visibility:hidden;";

  document.body.appendChild(iframe);

  const doc = iframe.contentDocument;
  if (!doc) {
    document.body.removeChild(iframe);
    throw new Error("Não foi possível preparar a exportação");
  }

  doc.open();
  doc.write(
    '<!DOCTYPE html><html><head><meta charset="utf-8"></head><body style="margin:0;padding:0;background:#ffffff;"></body></html>',
  );
  doc.close();

  const clone = source.cloneNode(true) as HTMLTableElement;
  const img = clone.querySelector("img");
  if (img instanceof HTMLImageElement) img.src = logoDataUrl;

  doc.body.appendChild(clone);

  if (doc.fonts?.ready) await doc.fonts.ready;
  await waitForImages(doc.body);

  try {
    const canvas = await html2canvas(clone, {
      scale: 2,
      backgroundColor: "#ffffff",
      logging: false,
    });

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob((b) => resolve(b), "image/jpeg", 0.95),
    );

    if (!blob) throw new Error("Não foi possível gerar o arquivo");
    return blob;
  } finally {
    document.body.removeChild(iframe);
  }
}

async function loadLogoAsDataUrl(): Promise<string> {
  const response = await fetch(SIGNATURE_LOGO_PATH);
  if (!response.ok) throw new Error("Logo não encontrado");
  const blob = await response.blob();
  return await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === "string") resolve(reader.result);
      else reject(new Error("Falha ao ler logo"));
    };
    reader.onerror = () => reject(new Error("Falha ao ler logo"));
    reader.readAsDataURL(blob);
  });
}

function SignatureLogo({ src }: { src: string }) {
  return (
    <img
      src={src}
      alt="Kokoro Saúde"
      width={160}
      draggable={false}
      style={{ display: "block", width: 160, height: "auto", border: 0 }}
    />
  );
}

export function EmailSignaturePreview({
  name,
  role,
  email,
  phone,
  website,
  logoSrc,
  captureRef,
}: {
  name: string;
  role: string;
  email: string;
  phone: string;
  website: string;
  logoSrc: string;
  captureRef?: React.RefObject<HTMLTableElement | null>;
}) {
  const displayName = name.trim();
  const displayRole = role.trim();
  const displayEmail = email.trim();
  const displayPhone = phone.trim();
  const displayWebsite = website.trim();
  const siteLabel = displayWebsite.replace(/^https?:\/\//, "");

  const contactLines = [displayEmail, displayPhone, siteLabel].filter(Boolean);

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
              verticalAlign: "middle",
            }}
          >
            <SignatureLogo src={logoSrc} />
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
            {displayName && (
              <p
                style={{
                  margin: contactLines.length > 0 || displayRole ? "0 0 4px 0" : 0,
                  fontSize: 18,
                  fontWeight: "bold",
                  fontFamily: "Georgia, serif",
                  lineHeight: 1.3,
                  color: "#ffffff",
                }}
              >
                {displayName}
              </p>
            )}
            {displayRole && (
              <p
                style={{
                  margin: contactLines.length > 0 ? "0 0 12px 0" : 0,
                  fontSize: 13,
                  lineHeight: 1.3,
                  color: "#ffffff",
                }}
              >
                {displayRole}
              </p>
            )}
            {contactLines.map((line, index) => (
              <p
                key={line}
                style={{
                  margin: index < contactLines.length - 1 ? "0 0 4px 0" : 0,
                  fontSize: 14,
                  lineHeight: 1.5,
                }}
              >
                <span style={{ color: "#ffffff", textDecoration: "none" }}>{line}</span>
              </p>
            ))}
          </td>
        </tr>
      </tbody>
    </table>
  );
}

export function AdminEmailSignaturePage() {
  const captureRef = useRef<HTMLTableElement>(null);
  const [exporting, setExporting] = useState(false);
  const [logoSrc, setLogoSrc] = useState(SIGNATURE_LOGO_PATH);

  const [form, setForm] = useState({
    name: "",
    role: "",
    email: "",
    phone: "",
    website: "",
  });

  useEffect(() => {
    loadLogoAsDataUrl()
      .then(setLogoSrc)
      .catch(() => {
        /* preview ainda funciona com path relativo */
      });
  }, []);

  async function handleExport() {
    if (!captureRef.current) return;
    setExporting(true);
    try {
      const exportLogo = logoSrc.startsWith("data:") ? logoSrc : await loadLogoAsDataUrl();
      const blob = await captureSignatureToBlob(captureRef.current, exportLogo);

      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.download = "kokoro-assinatura.jpg";
      link.href = url;
      link.click();
      URL.revokeObjectURL(url);
      toast.success("Assinatura exportada em JPG");
    } catch (err) {
      console.error(err);
      toast.error(err instanceof Error ? err.message : "Não foi possível exportar. Tente novamente.");
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
                placeholder={EXAMPLE_PLACEHOLDERS.name}
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sig-role">Cargo</Label>
              <Input
                id="sig-role"
                placeholder={EXAMPLE_PLACEHOLDERS.role}
                value={form.role}
                onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sig-email">E-mail</Label>
              <Input
                id="sig-email"
                type="email"
                placeholder={EXAMPLE_PLACEHOLDERS.email}
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sig-phone">Telefone</Label>
              <Input
                id="sig-phone"
                placeholder={EXAMPLE_PLACEHOLDERS.phone}
                value={form.phone}
                onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sig-site">Site</Label>
              <Input
                id="sig-site"
                placeholder={EXAMPLE_PLACEHOLDERS.website}
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
              <CardDescription>640px · logo Kokoro · fundo coral</CardDescription>
            </div>
            <Button onClick={handleExport} disabled={exporting}>
              <Download className="size-4" />
              {exporting ? "Exportando…" : "Exportar JPG"}
            </Button>
          </CardHeader>
          <CardContent className="overflow-x-auto rounded-lg bg-muted/40 p-6">
            <EmailSignaturePreview {...form} logoSrc={logoSrc} captureRef={captureRef} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
