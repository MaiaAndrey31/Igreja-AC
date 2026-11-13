# Banco de Dados — Igreja Amor & Cuidado

> Última atualização: 2026-11-13
> Banco: Firebase Firestore (NoSQL)
> SDK: firebase-admin 13.6.0 (server-only)

---

## 1. Visão Geral

O sistema utiliza **Firebase Firestore** como banco de dados principal. Todas as operações de leitura e escrita são realizadas exclusivamente pelo servidor Next.js via **Firebase Admin SDK** — o navegador nunca acessa o Firestore diretamente.

Os documentos são convertidos entre o formato Firestore (com `Timestamp`) e objetos TypeScript (com `Date`) através de **conversores centralizados** em `src/lib/firebase/collections.ts`. Essa camada garante que nenhum objeto não serializável vaze para Client Components.

---

## 2. Coleções

### 2.1 `ministries` — Ministérios

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| `name` | string | ✅ | Nome do ministério |
| `description` | string | ✅ | Descrição curta |
| `icon` | string | ✅ | Nome do ícone (Lucide) |
| `order` | number | ✅ | Ordem de exibição |
| `published` | boolean | ✅ | Visível no site público |
| `createdAt` | Timestamp | ✅ | Data de criação |
| `updatedAt` | Timestamp | ✅ | Última atualização |

**Consulta pública:** `getPublishedMinistries()` → filtra por `published == true`, ordena por `order asc`.

---

### 2.2 `cells` — Células

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| `name` | string | ✅ | Nome interno (pode conter nome do líder) |
| `leaderName` | string | ✅ | Nome do líder (NÃO enviado ao público) |
| `neighborhood` | string | ✅ | Bairro |
| `address` | string | ✅ | Endereço completo (rua e número) |
| `dayTime` | string | ✅ | Dia e horário legível |
| `whatsapp` | string | ❌ | WhatsApp do líder (opcional, NÃO enviado ao público) |
| `logoUrl` | string \| null | ❌ | URL do logotipo no Vercel Blob |
| `active` | boolean | ✅ | Célula ativa internamente |
| `published` | boolean | ✅ | Publicada no site público |
| `addressPublic` | boolean | ✅ | Legado (não mais usado para visibilidade textual) |
| `locationPublic` | boolean | ✅ | Exibir coordenadas no mapa |
| `order` | number | ✅ | Ordem de exibição |
| `region` | string \| null | ❌ | Região da célula (vermelha, azul, etc.) |
| `profile` | string \| null | ❌ | Perfil (jovens, casais, etc.) |
| `city` | string \| null | ❌ | Cidade |
| `citySlug` | string \| null | ❌ | Slug da cidade para filtro por URL |
| `meetingDay` | string \| null | ❌ | Dia da reunião |
| `meetingTime` | string \| null | ❌ | Horário da reunião |
| `latitude` | number \| null | ❌ | Latitude verificada |
| `longitude` | number \| null | ❌ | Longitude verificada |
| `createdAt` | Timestamp | ✅ | Data de criação |
| `updatedAt` | Timestamp | ✅ | Última atualização |

**Regra de visibilidade do endereço:** toda célula com `active == true` tem seu endereço textual (`address`, `city`, `neighborhood`) enviado ao DTO público. A publicação (`published`) controla se a célula aparece na listagem. Coordenadas no mapa dependem de `locationPublic`.

**Consulta pública:** `getActiveCells()` → filtra por `active == true`, ordena por `neighborhood asc, order asc`.

**Segurança:** `leaderName`, `whatsapp` e `logoUrl` NUNCA são enviados ao navegador. O DTO público (`CellLocatorData`) contém apenas campos seguros.

---

### 2.3 `announcements` — Avisos e Eventos

Esta coleção armazena **avisos comuns**, **eventos** e **pop-ups**, diferenciados pelo campo `type`.

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| `title` | string | ✅ | Título |
| `description` | string | ✅ | Descrição |
| `imageUrl` | string \| null | ❌ | URL da imagem/banner |
| `instagramUrl` | string \| null | ❌ | Link do Instagram |
| `category` | string | ✅ | Categoria (Aviso, Culto especial, Conferência, Retiro, Workshop, Outro) |
| `startDate` | Timestamp | ✅ | Data de início |
| `endDate` | Timestamp \| null | ❌ | Data de término |
| `published` | boolean | ✅ | Publicado no site |
| `type` | string \| undefined | ❌ | `"event"` para eventos; ausente para avisos |
| `slug` | string \| null | ❌ | Slug da URL (eventos) |
| `address` | string \| null | ❌ | Endereço/local (eventos) |
| `formId` | string \| null | ❌ | ID do formulário vinculado (eventos) |
| `maxSubmissions` | number \| null | ❌ | Limite de inscrições (eventos) |
| `submissionCount` | number | ✅ | Contador de inscrições (eventos) |
| `featured` | boolean | ✅ | Destacar na home (eventos) |
| `visualId` | string \| null | ❌ | ID visual interno |
| `groupUrl` | string \| null | ❌ | Link do grupo WhatsApp/Telegram |
| `confirmationMessage` | string \| null | ❌ | Mensagem pós-inscrição |
| `showAsPopup` | boolean | ✅ | Exibir como pop-up (avisos) |
| `popupButtonText` | string \| null | ❌ | Texto do botão do pop-up |
| `popupButtonUrl` | string \| null | ❌ | URL do botão do pop-up |
| `popupPriority` | number | ✅ | Prioridade do pop-up (maior = mais prioritário) |
| `popupFrequency` | string | ✅ | `"session"`, `"lifetime"` ou `"visit"` |
| `scheduledMessages` | array | ✅ | Mensagens programadas (eventos) |
| `createdAt` | Timestamp | ✅ | Data de criação |
| `updatedAt` | Timestamp | ✅ | Última atualização |

**Separação por tipo:**
- **Eventos:** `type == "event"` → consultas filtram por este campo
- **Avisos:** `type` ausente ou diferente de `"event"`
- **Pop-ups:** `showAsPopup == true` (subconjunto de avisos)

**Consultas públicas:**
- `getPublishedEvents()` → `type == "event" AND published == true`, ordena por `startDate asc`
- `getPublishedFeaturedEvents()` → `type == "event" AND featured == true AND published == true`
- `getEligiblePopups()` → `published == true AND showAsPopup == true`, ordena por `popupPriority desc`; filtra vigência no código

---

### 2.4 `gallery` — Galeria de Fotos

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| `photoUrl` | string | ✅ | URL da foto no Vercel Blob |
| `caption` | string | ❌ | Legenda opcional |
| `active` | boolean | ✅ | Visível no site |
| `order` | number | ✅ | Ordem de exibição |
| `createdAt` | Timestamp | ✅ | Data de upload |

**Consulta pública:** `getPublishedGalleryImages()` → filtra por `active == true`, ordena por `order asc`.

---

### 2.5 `settings/site` — Configurações do Site (documento único)

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| `heroPhotoUrl` | string \| null | ❌ | Foto do hero (carousel) |
| `heroPhotos` | array | ❌ | Múltiplas fotos do hero |
| `verseReference` | string | ❌ | Versículo bíblico de referência |
| `updatedAt` | Timestamp | ✅ | Última atualização |

**Acesso:** documento único em `settings/site`.

---

### 2.6 `leaders` — Liderança

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| `name` | string | ✅ | Nome do líder |
| `role` | string | ✅ | Cargo/função |
| `bio` | string | ❌ | Biografia curta |
| `photoUrl` | string \| null | ❌ | Foto no Vercel Blob |
| `active` | boolean | ✅ | Ativo |
| `order` | number | ✅ | Ordem de exibição |
| `createdAt` | Timestamp | ✅ | Data de criação |
| `updatedAt` | Timestamp | ✅ | Última atualização |

**Consulta pública:** `getPublishedLeaders()` → filtra por `active == true`, ordena por `order asc`.

---

### 2.7 `messages` — Mensagens/Pregações

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| `title` | string | ✅ | Título da mensagem |
| `preacher` | string | ✅ | Pregador |
| `youtubeId` | string | ✅ | ID do vídeo no YouTube |
| `published` | boolean | ✅ | Publicado no site |
| `order` | number | ✅ | Ordem de exibição |
| `date` | Timestamp | ✅ | Data da pregação |
| `createdAt` | Timestamp | ✅ | Data de criação |
| `updatedAt` | Timestamp | ✅ | Última atualização |

**Consulta pública:** `getPublishedMessages(limit?)` → filtra por `published == true`, ordena por `date desc`.

---

### 2.8 `socialLinks` — Redes Sociais

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| `platform` | string | ✅ | Plataforma (instagram, facebook, whatsapp, email, youtube, other) |
| `label` | string | ✅ | Rótulo de exibição |
| `handle` | string | ✅ | Como o canal é divulgado |
| `href` | string | ✅ | URL completa |
| `external` | boolean | ✅ | Link externo (para schema.org sameAs) |
| `order` | number | ✅ | Ordem de exibição |
| `active` | boolean | ✅ | Ativo |
| `createdAt` | Timestamp | ✅ | Data de criação |
| `updatedAt` | Timestamp | ✅ | Última atualização |

**Consulta pública:** `getSocialLinks()` → filtra por `active == true`, ordena por `order asc`.

---

### 2.9 `services` — Horários de Culto

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| `weekday` | string | ✅ | Dia da semana (Sunday–Saturday) |
| `time` | string | ✅ | Horário (HH:mm) |
| `label` | string \| null | ❌ | Rótulo opcional |
| `active` | boolean | ✅ | Ativo |
| `order` | number | ✅ | Ordem de exibição |
| `createdAt` | Timestamp | ✅ | Data de criação |
| `updatedAt` | Timestamp | ✅ | Última atualização |

**Consulta pública:** `getServices()` → filtra por `active == true`, ordena por `order asc`.

---

### 2.10 `settings/unit` — Dados da Unidade (documento único)

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| `name` | string | ✅ | Nome completo da igreja |
| `shortName` | string | ✅ | Nome curto |
| `tagline` | string | ❌ | Slogan |
| `foundedYear` | number | ✅ | Ano de fundação |
| `city` | string | ✅ | Cidade |
| `state` | string | ✅ | Estado (UF) |
| `address` | string | ✅ | Endereço completo |
| `contactEmail` | string | ✅ | E-mail de contato |
| `contactPhoneE164` | string | ✅ | Telefone em formato E.164 |
| `pixKey` | string \| null | ❌ | Chave PIX para doações |
| `bankDetails` | object \| null | ❌ | Dados bancários |
| `updatedAt` | Timestamp | ✅ | Última atualização |

**Acesso:** documento único em `settings/unit`. Usado em schema.org, footer, doações e metadata.

---

### 2.11 `forms` — Formulários Dinâmicos

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| `title` | string | ✅ | Título do formulário |
| `description` | string | ❌ | Descrição |
| `slug` | string | ✅ | Slug da URL pública |
| `purpose` | string | ✅ | Finalidade (evento, cadastro, pesquisa, inscricao, solicitacao, outros) |
| `fields` | array | ✅ | Campos dinâmicos configurados |
| `schemaVersion` | number | ✅ | Versão do schema de campos |
| `publishedFieldsSnapshot` | array \| null | ❌ | Snapshot imutável dos campos na versão publicada |
| `availability` | object | ✅ | Configuração de disponibilidade |
| `availability.mode` | string | ✅ | `"manual"`, `"scheduled"` ou `"duration"` |
| `availability.opensAt` | Timestamp \| null | ❌ | Abertura agendada |
| `availability.closesAt` | Timestamp \| null | ❌ | Encerramento agendado |
| `availability.durationHours` | number \| null | ❌ | Duração em horas (modo duration) |
| `availability.activatedAt` | Timestamp \| null | ❌ | Momento da ativação manual |
| `adminStatus` | string | ✅ | `"draft"`, `"published"` ou `"archived"` |
| `maxSubmissions` | number \| null | ❌ | Limite de submissões |
| `submissionCount` | number | ✅ | Contador de submissões |
| `showRemainingSlots` | boolean | ✅ | Mostrar vagas restantes |
| `eventRef` | string \| null | ❌ | Referência ao evento vinculado |
| `createdAt` | Timestamp | ✅ | Data de criação |
| `updatedAt` | Timestamp | ✅ | Última atualização |

> ⚠️ **Atenção:** os campos dentro de `availability` são Timestamps que DEVEM ser convertidos pela função `serializeAvailability()` no conversor. Sem essa conversão, o Next.js lança erro de serialização ao passar o objeto para Client Components.

**Consulta pública:** `getPublishedFormBySlug(slug)` → busca por slug, verifica `adminStatus == "published"`.

---

### 2.12 `forms/{formId}/submissions` — Respostas de Formulários (subcoleção)

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| `schemaVersion` | number | ✅ | Versão do schema respondido |
| `answers` | object | ✅ | Respostas indexadas por fieldId |
| `files` | object | ✅ | URLs de arquivos anexados por fieldId |
| `status` | string | ✅ | `"confirmed"` ou `"cancelled"` |
| `createdAt` | Timestamp | ✅ | Data de envio |

**Controle de vagas:** transação atômica em `submitDynamicFormAction()` verifica `maxSubmissions` antes de incrementar `submissionCount`, prevenindo ultrapassagem em envios simultâneos.

---

### 2.13 `formRateLimit` — Rate Limit de Formulários

Documento por chave `{formId}:{ipHash}`.

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `count` | number | Quantidade de envios na janela |
| `windowStartsAt` | Timestamp | Início da janela de rate limit |

---

### 2.14 `adminSecurity` — Segurança Administrativa

Documento por e-mail do administrador.

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `failedAttempts` | number | Tentativas de login falhas |
| `lockedUntil` | Timestamp \| null | Bloqueio temporário |
| `lastFailedAt` | Timestamp \| null | Última falha |

---

### 2.15 `dynamicFormRateLimit` — Rate Limit de Formulários Dinâmicos

Coleção separada para rate limit específico de formulários dinâmicos, evitando conflito com o namespace legado.

---

## 3. Índices Compostos do Firestore

Definidos em `firestore.indexes.json`:

| Coleção | Campos | Finalidade |
|---------|--------|------------|
| `announcements` | `published ASC + startDate ASC` | Avisos públicos ordenados |
| `announcements` | `featured ASC + published ASC + startDate ASC` | Eventos destacados na home |
| `announcements` | `type ASC + startDate DESC` | Listagem admin de eventos |
| `announcements` | `type ASC + published ASC + startDate ASC` | Eventos públicos |
| `announcements` | `type ASC + featured ASC + published ASC + startDate ASC` | Eventos destacados filtrados |
| `announcements` | `published ASC + showAsPopup ASC + popupPriority DESC` | Pop-ups elegíveis |
| `announcements` | `showAsPopup ASC + published ASC + popupPriority DESC` | Pop-ups (ordem alternativa) |

> ⚠️ Após adicionar novos índices, execute `firebase deploy --only firestore:indexes` antes do deploy da aplicação.

---

## 4. Conversores Centralizados

Todos os conversores estão em `src/lib/firebase/collections.ts`:

| Conversor | Coleção | Função especial |
|-----------|---------|-----------------|
| `ministryConverter` | `ministries` | — |
| `cellConverter` | `cells` | — |
| `announcementConverter` | `announcements` | Converte `scheduledMessages` |
| `galleryImageConverter` | `gallery` | — |
| `siteSettingsConverter` | `settings/site` | Documento único |
| `leaderConverter` | `leaders` | — |
| `messageConverter` | `messages` | — |
| `socialLinkConverter` | `socialLinks` | — |
| `serviceConverter` | `services` | — |
| `unitInfoConverter` | `settings/unit` | Documento único |
| `dynamicFormConverter` | `forms` | **`serializeAvailability()`** converte Timestamps aninhados |
| `formSubmissionConverter` | `formSubmissions` | Subcoleção legada |
| `formRateLimitConverter` | `formRateLimit` | — |
| `adminSecurityConverter` | `adminSecurity` | — |

> ⚠️ **Regra:** sempre usar o conversor ao consultar. Nunca acessar `.data()` diretamente sem conversão, pois Timestamps brutos causam erro de serialização no Next.js App Router.

---

## 5. Regras de Acesso

- **Leitura pública:** funções em `src/lib/data.ts` (server-only). Filtram por `published`, `active` e `type`.
- **Leitura administrativa:** funções em `src/lib/adminData.ts` (server-only). Exigem sessão válida.
- **Escrita:** Server Actions em `src/actions/*.ts`. Todas chamam `requireAdminSession()` antes de qualquer operação.
- **Nenhum acesso direto do navegador:** o Firebase Client SDK NÃO está configurado para acesso ao Firestore. Tudo passa pelo servidor Next.js.

---

## 6. Referências Cruzadas

- [ARQUITETURA.md](./ARQUITETURA.md) — Fluxo de dados e decisões técnicas
- [INSTALACAO_E_MANUTENCAO.md](./INSTALACAO_E_MANUTENCAO.md) — Publicação de índices e troubleshooting
- [MANUAL_DO_ADMINISTRADOR.md](./MANUAL_DO_ADMINISTRADOR.md) — Como gerenciar cada módulo pelo painel