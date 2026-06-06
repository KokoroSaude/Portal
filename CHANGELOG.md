# Changelog

Todas as mudanças relevantes do Portal Kokoro são documentadas neste arquivo.

O formato segue [Keep a Changelog](https://keepachangelog.com/pt-BR/1.1.0/) e o projeto adere ao [Semantic Versioning](https://semver.org/lang/pt-BR/).

## [Unreleased]

## [1.1.2] - 2026-06-04

### Added

- Menu lateral recolhível no desktop, com modo compacto (somente ícones) e preferência persistida

[Unreleased]: https://github.com/KokoroSaude/Portal/compare/v1.1.2...HEAD
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
- Área superadmin: planos, tenants, features, usuários
- Simulador WhatsApp para superadmin
- Assinatura de e-mail (export JPG)
- Mensagens padrão globais da plataforma (`/admin/mensagens`)
- Versão SemVer exibida no portal e injetada no build
