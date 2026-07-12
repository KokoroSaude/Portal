# Changelog

Todas as mudanças relevantes do Portal Kokoro são documentadas neste arquivo.

O formato segue [Keep a Changelog](https://keepachangelog.com/pt-BR/1.1.0/) e o projeto adere ao [Semantic Versioning](https://semver.org/lang/pt-BR/).

## [Unreleased]

## [1.7.0] - 2026-07-12

### Changed

- **Menu lateral — Escalas:** MMAS-8, TCP e Referência científica agrupados em Configuração; página de configuração do TCP volta a ser acessível pelo menu (antes só "Base científica" aparecia)
- **Menu lateral — Farmácia:** Config. retirada e Unidades CNES movidos para um subgrupo "Ajustes", separados da operação
- **Menu lateral — WhatsApp:** item "Configuração" renomeado para "Conexão Meta"
- **Menu lateral — Programa:** "Programas terapêuticos" e "Programas PSP" movidos de Análise para a seção Programa
- **Menu lateral — Relatórios e IA:** itens subagrupados com cabeçalhos (Operação, Qualidade, Clínico, Populacional; Configuração, Conversação)
- **Configurações:** aba "Pesquisas" renomeada para "CSAT"

### Fixed

- Relatório de Escalas passa a aparecer para tenants com MMAS-8 **ou** TCP (antes exigia MMAS-8)

## [1.6.1] - 2026-07-12

### Fixed

- Build Vercel: imports duplicados em `PublicHealthDashboardPage.tsx`

## [1.6.0] - 2026-07-12

### Changed

- **SuperAdmin — organizações:** configuração somente por módulos; removido seletor de segmento GTM
- Lista de tenants e configurações da org exibem módulos habilitados em vez de segmento
- Todos os módulos disponíveis para qualquer organização, com descrição em cada checkbox

## [1.3.2] - 2026-06-22

### Added

- **WhatsApp — finalidade do número:** coluna Finalidade na tabela de remetentes; edição com três opções (adesão, promoções, ou ambos no mesmo número)
- **WhatsApp — promoções:** avisos de elegibilidade e remetente antes de criar campanha; mensagens de erro em português
- **IA — inbox WhatsApp:** card de resumo IA na conversa
- **Relatórios:** card de barreiras comportamentais (TCP)

### Changed

- Wizard de ativação WhatsApp exibe finalidade com descrição; opção combinada adesão + promoções ao cadastrar número
- Perfil comportamental: correção de crash quando a API retorna enums numéricos

## [1.3.1] - 2026-06-25

### Added

- **2FA para superadmin:** QR code e chave manual no perfil; countdown de expiração no login
- Componente reutilizável `QueryErrorState` com botão de retry
- Assistente WhatsApp com stepper e timeout de provisionamento
- Guia OTP vs Embedded Signup na configuração WhatsApp
- Farmácia: janela horária no reagendamento, representante na chegada, seletor de período nos relatórios
- Passos de farmácia no guia e tour do tenant
- Superadmin: desabilitar organização (excluída de relatórios e seletores)

### Changed

- README atualizado com rotas atuais, redirect de `/cadastro` e 2FA no perfil

### Removed

- Rota pública `/cadastro` (redireciona para login)

## [1.1.4] - 2026-06-04

### Added

- Página dedicada **Onboarding WhatsApp** separada das mensagens operacionais
- Simulador com modo onboarding 100% pela conversa (sem paciente fictício pré-preenchido)
- Modo **Paciente ativo** no simulador para testar lembretes

### Changed

- Mensagens operacionais admin focadas em lembretes, follow-up e textos custom.*
- Guia e tour atualizados para refletir a nova estrutura

[Unreleased]: https://github.com/KokoroSaude/Portal/compare/v1.3.2...HEAD
[1.3.2]: https://github.com/KokoroSaude/Portal/compare/v1.3.1...v1.3.2
[1.3.1]: https://github.com/KokoroSaude/Portal/compare/v1.1.4...v1.3.1
[1.1.4]: https://github.com/KokoroSaude/Portal/compare/v1.1.3...v1.1.4

## [1.1.3] - 2026-06-04

### Added

- Flyout estilizado ao passar o mouse nos itens do menu lateral recolhido (nome, seção e dados do usuário)

[1.1.3]: https://github.com/KokoroSaude/Portal/compare/v1.1.2...v1.1.3

## [1.1.2] - 2026-06-04

### Added

- Menu lateral recolhível no desktop, com modo compacto (somente ícones) e preferência persistida

[1.1.2]: https://github.com/KokoroSaude/Portal/compare/v1.1.1...v1.1.2

## [1.1.1] - 2026-06-04

### Added

- Barra de pesquisa funcional no topo de todos os grids do portal
- Componentes reutilizáveis `GridSearchBar`, `GridEmptyRow` e hook `useGridSearch`
- Filtro com debounce na listagem de pacientes (busca na API)

### Changed

- Grids de relatórios, jornada, mensagens, configurações e área admin passam a filtrar resultados localmente

[1.1.1]: https://github.com/KokoroSaude/Portal/compare/v1.1.0...v1.1.1

## [1.1.0] - 2026-06-06

### Added

- Tour interativo com spotlight (estilo passo a passo) para tenant e superadmin
- Guia escrito em `/guia` com timeline e links para cada área do portal
- Card “Guia passo a passo” na home (tenant e superadmin)
- Mensagens padrão admin: fluxo de onboarding, categorias, criação de novas chaves
- Auto-início do tour na primeira visita à home (com opção de pular e reiniciar)

### Changed

- Menu lateral com atributos `data-tour` para destacar itens no tour
- Página de guia com botão para reiniciar o tour interativo

[1.1.0]: https://github.com/KokoroSaude/Portal/compare/v1.0.0...v1.1.0
[1.0.0]: https://github.com/KokoroSaude/Portal/releases/tag/v1.0.0

## [1.0.0] - 2026-06-04

Primeira versão versionada (SemVer) do portal em produção.

### Added

- Dashboard, pacientes, timeline e plano de cuidado
- Relatórios com gráficos (adesão, engajamento, operação)
- Templates de mensagens por tenant (conforme plano)
- Jornada de onboarding configurável
- Integração WhatsApp (Meta)
- Configurações e assinatura do tenant
- Área superadmin: tenants, relatórios, usuários
- Simulador WhatsApp para superadmin
- Assinatura de e-mail (export JPG)
- Mensagens padrão globais da plataforma (`/admin/mensagens`)
- Versão SemVer exibida no portal e injetada no build
