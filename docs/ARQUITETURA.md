# Arquitetura — Igreja Amor & Cuidado

> Última atualização: 2026-11-13  
> Versão do projeto: 0.1.0

---

## 1. Visão Geral

O site da **Igreja Amor & Cuidado** é uma aplicação web full-stack construída com **Next.js 16 (App Router)**, **React 19**, **TypeScript** e **Firebase Firestore** como banco de dados. A aplicação é hospedada na **Vercel** e utiliza **Vercel Blob** para armazenamento de uploads (imagens de eventos, células, avisos, galeria).

O sistema possui duas áreas principais:

- **Site público** (`/`) — páginas acessíveis a qualquer visitante sem autenticação.
- **Painel administrativo** (`/admin`) — área protegida por sessão administrativa para gestão de conteúdo.

A arquitetura segue o padrão **Server Components + Client Components** do Next.js App Router, onde a maioria das páginas são Server Components que consultam o Firestore no servidor e passam dados serializados (DTOs) para Client Components interativos.

---

## 2. Stack Tecnológica

| Camada | Tecnologia | Versão | Finalidade |
|--------|-----------|--------|------------|
| Framework | Next.js (App Router) | 16.3.0 | SSR, SSG, rotas, middleware |
| UI | React | 19.2.8 | Componentes, hooks, estado |
| Linguagem | TypeScript | 5.x | Tipagem estática |
| Banco de Dados | Firebase Firestore | Admin SDK 13.6.0 | Documentos NoSQL, tempo real |
| Autenticação | Firebase Auth | Identity Toolkit | Sessão administrativa via cookie |
| Uploads | Vercel Blob | 2.8.0 | Armazenamento de imagens |
| Estilização | Tailwind CSS | 4.x | Utility-first CSS |
| Animações | Framer Motion | 13.1.0 | Transições e reveals |
| Mapas | Leaflet + React-Leaflet | 1.9.4 / 5.0.0 | Mapa interativo de células |
| Validação | Zod | 4.4.3 | Schemas de formulários e dados |
| Ícones | Lucide React | 1.31.0 | Ícones SVG |
| PDF | pdf-lib + @pdf-lib/fontkit | — | Geração de PDFs reais no servidor |
| QR Code | qrcode | 1.5.4 | Geração de QR codes para formulários |
| Testes | Vitest | 3.2.4 | Testes unitários |
| Lint | ESLint | 9.x | Qualidade de código |
| Deploy | Vercel | — | Hospedagem serverless |

---

## 3. Estrutura de Diretórios

```
src/
├── app/                          # Rotas do Next.js App Router
│   ├── (site)/                   # Grupo de rotas públicas
│   │   ├── page.tsx              # Home
│   │   ├── celulas/page.tsx      # Listagem de células
│   │   ├── eventos/              # Eventos (lista + detalhe)
│   │   ├── formularios/[slug]/   # Formulário público
│   │   ├── avisos/page.tsx       # Avisos públicos
│   │   ├── galeria/page.tsx      # Galeria de fotos
│   │   ├── mensagens/page.tsx    # Mensagens/pregações
│   │   ├── ministerios/page.tsx  # Ministérios
│   │   ├── sobre/page.tsx        # Página Sobre
│   │   ├── contribua/page.tsx    # Doações
│   │   └── ...                   # Páginas legais (privacidade, termos)
│   ├── admin/                    # Painel administrativo
│   │   ├── login/page.tsx        # Login
│   │   └── (dashboard)/          # Rotas protegidas
│   │       ├── page.tsx          # Dashboard
│   │       ├── celulas/          # Gestão de células
│   │       ├── eventos/          # Gestão de eventos
│   │       ├── formularios/      # Gestão de formulários
│   │       ├── avisos/           # Gestão de avisos/pop-ups
│   │       ├── galeria/          # Gestão de galeria
│   │       ├── lideranca/        # Gestão de liderança
│   │       ├── mensagens/        # Gestão de mensagens
│   │       ├── ministerios/      # Gestão de ministérios
│   │       ├── horarios/         # Horários de culto
│   │       ├── redes-sociais/    # Links de redes sociais
│   │       ├── unidade/          # Dados da igreja
│   │       ├── contatos/         # Contatos recebidos
│   │       ├── configuracoes/    # Configurações do site
│   │       └── senha/            # Troca de senha
│   └── api/
│       └── export/pdf/route.ts   # Route Handler para exportação PDF
├── actions/                      # Server Actions (mutações)
│   ├── auth.ts                   # Login, logout
│   ├── cells.ts                  # CRUD de células
│   ├── events.ts                 # CRUD de eventos
│   ├── announcements.ts          # CRUD de avisos
│   ├── dynamicSubmissions.ts     # Submissões de formulários + exportações
│   ├── forms.ts                  # CRUD de formulários dinâmicos
│   ├── gallery.ts                # Upload/gestão de galeria
│   ├── settings.ts               # Configurações do site
│   └── ...                       # Outras ações (líderes, mensagens, etc.)
├── components/                   # Componentes React
│   ├── admin/                    # Componentes do painel admin
│   │   ├── cells/CellManager.tsx
│   │   ├── events/EventManager.tsx
│   │   ├── announcements/AnnouncementManager.tsx
│   │   ├── forms/                # FormBuilder, SubmissionsTable, etc.
│   │   └── ...
│   ├── celulas/                  # Componentes públicos de células
│   │   ├── CellLocator.tsx       # Mapa + filtros + listagem
│   │   ├── CellDetailModal.tsx   # Modal de detalhes
│   │   └── CellMap.tsx           # Mapa Leaflet
│   ├── home/                     # Seções da home
│   │   ├── Hero.tsx
│   │   ├── CellReach.tsx
│   │   ├── FeaturedEvents.tsx
│   │   └── ...
│   ├── layout/                   # Header, Footer, Pop-up, Cookie Banner
│   ├── forms/                    # Renderer público de formulários
│   ├── ui/                       # Componentes genéricos (Button, Modal, etc.)
│   └── seo/                      # JsonLd, metadata
├── lib/                          # Utilitários e serviços
│   ├── firebase/
│   │   ├── admin.ts              # Inicialização do Admin SDK
│   │   ├── collections.ts        # Conversores Firestore + tipos
│   │   └── identityToolkit.ts    # Verificação de senha via REST API
│   ├── auth/                     # Sessão, rate limit, password
│   ├── forms/                    # Tipos, schemas, availability
│   ├── validation/schemas.ts     # Schemas Zod compartilhados
│   ├── data.ts                   # Consultas públicas (server-only)
│   ├── adminData.ts              # Consultas administrativas (server-only)
│   ├── upload.ts                 # Upload para Vercel Blob
│   └── format.ts                 # Formatação de datas e textos
└── proxy.ts                      # Middleware de proteção de rotas admin
```

---

## 4. Fluxo de Dados

### 4.1 Leitura (Server → Client)

```
Firestore → Conversor (collections.ts) → Server Component (page.tsx)
    → Serialização (DTO) → Props → Client Component
```

1. **Server Component** (`page.tsx`) chama função de consulta em `data.ts` ou `adminData.ts`.
2. A função usa o **conversor Firestore** (`cellConverter`, `announcementConverter`, etc.) que transforma documentos brutos em objetos TypeScript com datas convertidas (`Timestamp → Date`).
3. O Server Component **serializa** os dados em um DTO seguro (sem classes, sem Timestamps brutos) antes de passar como props.
4. O **Client Component** recebe apenas dados serializáveis (strings, números, booleanos, objetos planos).

> ⚠️ **Regra crítica**: nunca passar instâncias de `Timestamp`, `DocumentReference` ou classes do Firebase Admin SDK diretamente para Client Components. Usar conversores centralizados em `collections.ts`.

### 4.2 Escrita (Client → Server → Firestore)

```
Client Component → Server Action → Validação (Zod) → Firestore → Revalidação
```

1. **Client Component** envia `FormData` via `<form action={serverAction}>`.
2. **Server Action** (`actions/*.ts`) verifica sessão administrativa (`requireAdminSession()`).
3. Dados são validados com **schema Zod** (`schemas.ts`).
4. Documento é criado/atualizado no Firestore via Admin SDK.
5. `revalidatePath()` invalida o cache das rotas afetadas.

### 4.3 Exportação de Formulários

```
Botão no admin → Route Handler (/api/export/pdf) → pdf-lib → Binário → Download
```

- **CSV/XML**: Server Actions retornam strings → blob download no client.
- **PDF**: Route Handler protegida gera binário com `pdf-lib` + fonte Geist → `Content-Disposition: attachment` → download direto.

---

## 5. Autenticação e Autorização

- **Login**: formulário em `/admin/login` verifica credenciais via Firebase Identity Toolkit REST API (`identityToolkit.ts`).
- **Sessão**: cookie de sessão Firebase Auth (`sessionCookie.ts`) com verificação em cada requisição ao painel.
- **Middleware** (`proxy.ts`): protege todas as rotas `/admin/*` exceto `/admin/login`, redirecionando para login se não houver sessão válida.
- **Server Actions**: todas chamam `requireAdminSession()` como primeira linha, garantindo dupla camada de proteção (middleware + ação).
- **Dados públicos**: consultas em `data.ts` não exigem autenticação; filtros de `published` e `active` controlam visibilidade.

---

## 6. Uploads

- **Serviço**: Vercel Blob (`@vercel/blob`).
- **Função centralizada**: `saveImageUpload()` em `upload.ts`.
- **Validação**: tipo MIME (JPEG, PNG, WebP), tamanho máximo (8MB), dimensões.
- **Processamento**: `sharp` para redimensionamento e otimização antes do upload.
- **URLs**: retornadas como strings absolutas (`https://...blob.vercel-storage.com/...`).

---

## 7. Separação de Módulos na Coleção `announcements`

Eventos e avisos compartilham a coleção `announcements` no Firestore, diferenciados pelo campo `type`:

| Campo | Valor | Módulo |
|-------|-------|--------|
| `type` | `"event"` | Eventos |
| `type` | ausente ou outro | Avisos comuns |
| `showAsPopup` | `true` | Pop-ups (subconjunto de avisos) |

Consultas públicas filtram por `type` para evitar mistura:
- `getPublishedEvents()` → `where("type", "==", "event")`
- `getEligiblePopups()` → `where("showAsPopup", "==", true)`

---

## 8. Diagrama de Arquitetura

```mermaid
graph TB
    subgraph "Navegador"
        Browser[Visitante / Admin]
    end

    subgraph "Vercel (Serverless)"
        MW[Middleware proxy.ts]
        SC[Server Components page.tsx]
        CC[Client Components]
        SA[Server Actions]
        RH[Route Handler /api/export/pdf]
    end

    subgraph "Serviços Externos"
        FS[(Firestore)]
        BLOB[(Vercel Blob)]
        AUTH[Firebase Auth]
    end

    Browser -->|HTTPS| MW
    MW -->|rotas /admin| AUTH
    MW -->|autorizado| SC
    MW -->|não autorizado| Login[/admin/login]

    SC -->|consulta| FS
    SC -->|props serializadas| CC
    CC -->|FormData| SA
    SA -->|validação Zod + escrita| FS
    SA -->|revalidatePath| SC

    CC -->|window.open| RH
    RH -->|auth + pdf-lib| FS
    RH -->|binário PDF| Browser

    SA -->|upload| BLOB
    SC -->|leitura imagens| BLOB
```

---

## 9. Decisões Técnicas Importantes

| Decisão | Motivo |
|---------|--------|
| Firebase Admin SDK (não client SDK) | Segurança: navegador nunca fala diretamente com Firestore; tudo passa pelo servidor Next.js |
| Server Components como padrão | Performance: HTML gerado no servidor, zero JS desnecessário no client |
| Conversores centralizados em `collections.ts` | Evita vazamento de Timestamps/classes para Client Components (erro de serialização) |
| Vercel Blob para uploads | Disco local não sobrevive em serverless; Blob é nativo da Vercel |
| `pdf-lib` para PDFs | Leve, sem binários nativos, funciona em Edge/Node, suporta embedding de fontes |
| Coleção única `announcements` para eventos e avisos | Simplifica queries cruzadas; separação por campo `type` |
| `force-dynamic` em páginas públicas | Conteúdo editável no admin precisa refletir alterações recentes sem rebuild |
| Zod para validação | Type-safe, composável, funciona em server e client |

---

## 10. Variáveis de Ambiente

Ver [INSTALACAO_E_MANUTENCAO.md](./INSTALACAO_E_MANUTENCAO.md) para lista completa e instruções de configuração.

---

## 11. Referências Cruzadas

- [BANCO_DE_DADOS.md](./BANCO_DE_DADOS.md) — Estrutura detalhada das coleções Firestore
- [INSTALACAO_E_MANUTENCAO.md](./INSTALACAO_E_MANUTENCAO.md) — Setup, deploy e troubleshooting
- [MANUAL_DO_ADMINISTRADOR.md](./MANUAL_DO_ADMINISTRADOR.md) — Guia operacional para equipe da igreja
- [GUIA_RAPIDO.md](./GUIA_RAPIDO.md) — Treinamento rápido para novos administradores