# Kokoro Portal

Portal web para parceiros (farmácias/clínicas) e superadmin da plataforma Kokoro.

**Produção:** [https://portal.kokorosaude.com.br](https://portal.kokorosaude.com.br)

## Stack

- Vite + React 19 + TypeScript
- Tailwind CSS v4 + shadcn/ui
- TanStack Query + React Router 7

## Desenvolvimento local

```bash
npm install
cp .env.example .env

# Terminal 1 — API
cd ../api && dotnet run --project src/Kokoro.Api

# Terminal 2 — Portal
npm run dev
```

Abra [http://localhost:5173](http://localhost:5173).

## Deploy (Vercel)

1. **New Project** no Vercel → mesmo repositório do institucional
2. **Root Directory:** `portal`
3. **Environment Variables** (Production):

   ```bash
   VITE_API_URL=https://api.kokorosaude.com.br
   ```

4. **Domains:** `portal.kokorosaude.com.br` (CNAME → `cname.vercel-dns.com`)
5. Redeploy após salvar variáveis

Na API (Railway), confirme CORS — já em `appsettings.Production.json` ou via:

```bash
Cors__AllowedOrigins__0=https://portal.kokorosaude.com.br
```

## Autenticação

**Um login, um portal.** A tela `/login` serve tenant e superadmin — o JWT define o escopo:

| Escopo | Home (`/`) | Menu |
|--------|------------|------|
| `tenant` | Dashboard de adesão | Operação |
| `platform` | Visão geral | Plataforma (tenants, relatórios) |

## Credenciais (seed)

| Papel | E-mail | Senha |
|-------|--------|-------|
| Superadmin | `admin@kokorosaude.com.br` | `Super@123` |
| Tenant demonstração | `demonstracao@kokorosaude.com.br` | `Admin@123` |

> Troque as senhas após o primeiro deploy em produção.

## Rotas

### Operação (tenant)

| Rota | Descrição |
|------|-----------|
| `/` | Dashboard |
| `/pacientes` | Lista + busca |
| `/pacientes/:id` | Timeline + plano |
| `/relatorios` | Relatórios e gráficos |
| `/templates` | Mensagens automáticas |
| `/jornada` | Onboarding |
| `/whatsapp` | Números WhatsApp (Meta) |
| `/configuracoes` | Settings operacionais |

### Plataforma (superadmin)

| Rota | Descrição |
|------|-----------|
| `/admin/tenants` | Tenants |
| `/admin/usuarios` | Superadmins |
| `/admin/mensagens` | Mensagens padrão globais |
| `/admin/simulador` | Simulador WhatsApp |
| `/admin/assinatura` | Assinatura de e-mail |

### Público

| Rota | Descrição |
|------|-----------|
| `/login` | Login |
| `/cadastro` | Criar tenant |

## Variáveis

| Variável | Local | Produção |
|----------|-------|----------|
| `VITE_API_URL` | `http://localhost:5000` | `https://api.kokorosaude.com.br` |

## Versionamento (SemVer)

A versão oficial fica em `package.json` e aparece no rodapé do menu (`v1.0.0`).

| Tipo | Quando usar | Comando |
|------|-------------|---------|
| **PATCH** | Correções compatíveis | `npm run release:patch` |
| **MINOR** | Novas funcionalidades compatíveis | `npm run release:minor` |
| **MAJOR** | Mudanças incompatíveis | `npm run release:major` |

Fluxo de release:

1. Documente as mudanças em `CHANGELOG.md` (seção `[Unreleased]`)
2. Rode o script adequado (atualiza `package.json`, `package-lock.json` e cria tag `vX.Y.Z`)
3. `git push origin main --tags`
4. O GitHub Actions publica a release e o Vercel faz deploy da tag

Formato das tags: `v1.0.0`, `v1.1.0`, etc.
