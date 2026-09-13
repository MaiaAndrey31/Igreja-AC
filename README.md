# Igreja Amor e Cuidado em Adamantina

Site institucional e painel administrativo da Igreja Amor e Cuidado em Adamantina/SP — a primeira extensão
da rede nacional Amor e Cuidado (sede em Araçatuba/SP, 1936). O site é centrado nesta unidade: história
local, liderança local, células da microrregião. A rede nacional aparece só como contexto de pertencimento
(seção "Parte da família Amor e Cuidado"), nunca como protagonista.

## Stack

- Next.js 16 (App Router) + TypeScript
- Tailwind CSS v4 (tokens em `src/app/globals.css`, sem `tailwind.config`)
- Framer Motion (via `LazyMotion` + `MotionConfig reducedMotion="user"`)
- **Firebase**: Firestore (banco) e Authentication (login do admin) — só pelo servidor, via Admin SDK
  (`firebase-admin`). O navegador nunca fala com o Firebase diretamente.
- Uploads de mídia (fotos, vídeo do hero) ficam no **Vercel Blob** — não em disco local. Ver o alerta em
  "Deploy" sobre por quê (disco de host serverless não sobrevive entre requisições).

## Arquitetura de acesso ao Firebase — leia antes de mexer em auth/dados

Só o servidor (Server Components e Server Actions do Next.js) acessa o Firestore e o Firebase Auth, sempre
pelo Admin SDK. Isso tem duas consequências que valem entender antes de alterar qualquer coisa por aqui:

1. **As Security Rules (`firestore.rules`) não são a barreira principal.** O Admin SDK ignora as rules por
   completo — quem controla o acesso são as próprias Server Actions, via `requireAdminSession()`
   (`src/lib/auth/session.ts`). As rules estão configuradas para negar todo acesso vindo de SDK de cliente,
   como defesa em profundidade. Se um dia o site passar a ler dados direto do Firestore pelo navegador (ex.:
   atualização em tempo real), as rules precisam ser abertas — o arquivo já traz, comentado, o bloco pronto
   para isso.
2. **O login não usa o SDK de cliente do Firebase.** O e-mail/senha do admin é verificado pelo *servidor*,
   chamando a API REST do Identity Toolkit (`src/lib/firebase/identityToolkit.ts`) — o navegador só envia o
   formulário para uma Server Action, como sempre fez. Isso mantém a mesma arquitetura "tudo passa pelo
   servidor" também para autenticação.

## Rodando localmente

```bash
npm install
cp .env.example .env   # preencha as credenciais do Firebase, ver seção abaixo
npm run admin:create   # cria o usuário admin no Firebase Auth (lê ADMIN_EMAIL/ADMIN_PASSWORD do .env)
npm run dev
```

Acesse `http://localhost:3000` para o site público e `http://localhost:3000/admin/login` para o painel
administrativo, usando as credenciais definidas em `.env`.

**Troque a senha padrão assim que fizer o primeiro login**, em `/admin/senha`.

### Configurando o projeto Firebase (uma vez só)

1. Crie um projeto em [console.firebase.google.com](https://console.firebase.google.com) (é gratuito no
   plano Spark, suficiente para este site).
2. Ative **Firestore Database** (modo produção, qualquer região).
3. Ative **Authentication** → método "E-mail/senha".
4. Em *Configurações do projeto → Contas de serviço*, clique em "Gerar nova chave privada" — baixa um JSON.
   Copie `project_id`, `client_email` e `private_key` desse arquivo para `FIREBASE_PROJECT_ID`,
   `FIREBASE_CLIENT_EMAIL` e `FIREBASE_PRIVATE_KEY` no `.env` (ver `.env.example` para o formato exato).
5. Em *Configurações do projeto → Geral*, copie a "Chave de API da Web" para `FIREBASE_WEB_API_KEY` (não é
   secreta — é a mesma chave pública usada em qualquer app Firebase).
6. Cole o conteúdo de `firestore.rules` (na raiz deste repo) no Console — *Firestore Database → Regras* —
   e publique. (Alternativa, se algum dia configurarem a Firebase CLI:
   `firebase deploy --only firestore:rules,firestore:indexes`, usando o `firebase.json` já incluído.)
7. Rode `npm run admin:create` para criar o primeiro usuário administrador.
8. Rode `npm run seed:initial` para migrar para o Firestore os dados que antes viviam hardcoded em
   `src/data/*.ts` (liderança, mensagens, links sociais, horários) — idempotente, seguro rodar mais de uma
   vez.
9. **Publique os índices compostos** — `firebase deploy --only firestore:indexes` (exige `firebase login`
   antes) ou, mais simples na primeira vez, deixe o Console criar cada um sob demanda: acesse `/`, `/sobre` e
   `/mensagens` uma vez logo após o seed — se um índice estiver faltando, o Firestore recusa a consulta com um
   erro que já traz o link direto para criá-lo em um clique (ver `firestore.indexes.json` para a lista
   completa; 8 índices ao todo, hoje).

Não é preciso ativar o Firebase Storage — uploads de mídia ficam no Vercel Blob (ver `BLOB_READ_WRITE_TOKEN`
no `.env.example` e a seção "Deploy").

Nenhuma migration é necessária — o Firestore não tem schema, as coleções nascem sozinhas no primeiro
documento gravado pelo painel ou pelo `seed:initial`.

## Scripts

| Comando | Descrição |
| --- | --- |
| `npm run dev` | Servidor de desenvolvimento |
| `npm run build` | Build de produção |
| `npm run start` | Sobe o build de produção |
| `npm run lint` | ESLint |
| `npm run admin:create` | Cria/atualiza o usuário admin no Firebase Auth (lê `ADMIN_EMAIL`/`ADMIN_PASSWORD`) |
| `npm run seed:initial` | Migra para o Firestore o conteúdo que antes vivia em `src/data/*.ts` (liderança, mensagens, redes sociais, horários) — idempotente |

## Regra de conteúdo: não inventar informação

Nenhum dado sobre a igreja pode ser preenchido por inferência. Horário, endereço, nome de pastor, data de
evento ou frase institucional só entram no código com fonte verificada. O que ainda não foi publicado pela
igreja aparece literalmente como `[CONTEÚDO PENDENTE]` na interface — ver `src/data/pending.ts` e o componente
`Pending`.

A mesma regra vale para imagem: fotografia é 100% real da própria igreja. Enquanto a foto não chega, o bloco
mostra `MediaPlaceholder`, nunca banco de imagens.

## Onde mora cada conteúdo

Praticamente todo o conteúdo editorial e institucional vive no Firestore, gerenciável pelo painel `/admin` —
os próprios pastores mantêm, sem precisar de dev nem de novo deploy. Só `src/data/pending.ts` (o marcador
`[CONTEÚDO PENDENTE]`, utilitário de UI) continua em código: não é conteúdo, é comportamento.

| Coleção/documento | Conteúdo | Onde é editado | Onde aparece |
| --- | --- | --- | --- |
| `ministries` | Título, descrição, ícone, destaque, ordem, publicado | `/admin/ministerios` | Home e `/ministerios` |
| `cells` | Nome, líder, bairro (de Adamantina), endereço, dia/horário, WhatsApp, logo, ativa | `/admin/celulas` | `/celulas`, home (bairros com célula) |
| `announcements` | Avisos, cultos especiais, conferências | `/admin/avisos` | `/avisos` e home |
| `gallery` | Fotos | `/admin/galeria` | `/galeria` |
| `settings/site` | Hero (título, subtítulo, vídeo enviado ou link do YouTube, foto, foco), dados de contribuição | `/admin/configuracoes` | Home e `/contribua` |
| `leaders` | Liderança local — nome, função, frase, foto, ordem, visível | `/admin/lideranca` | Home e `/sobre` |
| `messages` | Pregações em destaque — título, pregador, data, ID do YouTube | `/admin/mensagens` | Home e `/mensagens` |
| `socialLinks` | Instagram, Facebook, WhatsApp, e-mail, YouTube (quando houver) | `/admin/redes-sociais` | Rodapé, home, JSON-LD |
| `services` | Horários de celebração — dia, hora, rótulo opcional | `/admin/horarios` | Home e `/sobre` |
| `settings/unit` | Nome, tagline, João 21:17, história (garagem → templo novo), endereço, contato, contexto de rede | `/admin/unidade` | Praticamente todas as páginas (header, rodapé, home, `/sobre`, jurídicas, metadata) |
| `formSubmissions` | Envios dos formulários públicos (célula, decisão, testemunho, oração) | — (só leitura/gestão) | `/admin/contatos` |
| `adminSecurity/{email}` | Contador de tentativas de login (força bruta) | — | Só uso interno |
| `formRateLimit/{ip:tipo}` | Limite de envios do formulário público por IP | — | Só uso interno |

`settings/site` e `settings/unit` nascem sozinhos, com valores padrão, na primeira leitura — igual ao que já
acontecia com `settings/site` antes desta migração. As demais coleções acima (exceto `formSubmissions` e os
contadores internos) são semeadas uma vez por `npm run seed:initial`, a partir do conteúdo que vivia em
`src/data/*.ts` antes desta migração — ver a seção "Rodando localmente".

O rodapé e o header leem `settings/unit`/`socialLinks` a cada requisição, via `(site)/layout.tsx` — por isso
**todo o site público hoje renderiza dinamicamente** (`force-dynamic` no layout, herdado por todas as páginas
dele), não mais parcialmente estático. É a troca esperada ao tornar praticamente todo o conteúdo editável: uma
edição em `/admin/unidade` aparece imediatamente em qualquer página, sem rebuild.

> **Nota sobre os números:** `cellsCountLabel` (editável em `/admin/unidade`) está como `"70+"` (o número da
> página oficial da unidade, mais conservador). Uma matéria local de início de 2026 chegou a citar 102
> células — sinalize essa divergência à igreja, caso prefiram atualizar.

> **Alcance das células:** a unidade atua só em Adamantina — não numa microrregião de várias cidades (um
> `cellCities` chegou a existir aqui, listando 6 cidades da região, mas foi removido por não refletir a
> realidade da unidade). A home mostra os bairros de Adamantina com célula cadastrada, derivados
> diretamente do campo `neighborhood` de `cells` — não uma lista separada.

## Sistema de design

Duas camadas de token em `src/app/globals.css`:

1. `--ac-*` — a paleta bruta da marca (`--ac-ink`, `--ac-paper`, `--ac-stone`, `--ac-line`).
2. `--background`, `--foreground`, `--accent`… — papéis semânticos, que é o que todo componente usa.

A classe `.on-paper` reescreve só os papéis semânticos, então qualquer seção clara inverte sozinha — é assim
que a home alterna tinta/papel sem variante duplicada de componente.

Três papéis tipográficos: **Big Shoulders** (display), **Inter** (corpo) e **IBM Plex Mono** (`.font-data`,
reservada a dado operacional — horário, data, endereço). A troca de família é o que sinaliza "isto é
informação real, não decoração".

> **Identidade estritamente preto e branco.** A igreja não tem cor de destaque — logo, fachada e sinalização
> reais são só preto e branco. `--accent` reflete isso: é o mesmo tom do `--foreground` (papel no tema escuro,
> tinta no tema claro), não uma cor separada. A distinção "isto é interativo" vem de peso tipográfico,
> tracking, sublinhado e borda — nunca de matiz. Havia um dourado placeholder aqui antes de a igreja enviar
> os ativos reais; foi removido.

O favicon (`src/app/icon.jpg`) e o ícone de tela inicial do iOS (`src/app/apple-icon.jpg`) usam o ícone real
da marca (`public/assets/brand/logo-icon-dark.jpg`), enviado pela igreja.

### Ativos de imagem reais (`public/assets/`)

| Pasta | Conteúdo | Onde é usado |
| --- | --- | --- |
| `leaders/` | Retratos dos 7 pastores | Home (Liderança) |
| `building/` | `fachada-aerea.jpg` — vista aérea do templo (Parque do Sol) | Home (Nossa história), `/sobre` |
| `brand/` | `logo-icon.png` (fundo claro), `logo-icon-dark.jpg` (fundo escuro), `logo-wordmark.png` | Header, favicon, Footer |
| `gallery/` | `culto-pregacao.jpg`, `santa-ceia.jpg` | Hero (fallback), Home (Nossa história) |

Todos enviados diretamente pela igreja — nenhum é banco de imagens.

## Índices do Firestore

Toda consulta que combina um filtro (`where`) com `orderBy`, ou que usa mais de um `orderBy`, exige um índice
composto no Firestore — os 8 que este projeto usa estão declarados em `firestore.indexes.json`. Se algum
faltar em produção, a consulta falha com uma mensagem de erro que já traz o link direto para criar o índice
certo no Console — não é preciso decorar isso, só clicar no link na primeira vez que acontecer (ou publicar
todos de uma vez com `firebase deploy --only firestore:indexes`, após `firebase login`).

## Deploy

O projeto roda em qualquer host que suporte Next.js, incluindo hosts **serverless** (Vercel, Cloud Run
etc.) — uploads não dependem mais de disco local desde a migração para o Vercel Blob (ver
`src/lib/upload.ts`). Funções serverless têm disco somente leitura (exceto `/tmp`, apagado entre
requisições), o que antes exigia um host com disco persistente; o Blob resolve isso gravando fora do
processo da aplicação.

**Na Vercel:**

1. Conecte um Blob Store ao projeto (Dashboard → Storage → Create Database → Blob) — isso já injeta
   `BLOB_READ_WRITE_TOKEN` sozinho nas variáveis de ambiente do projeto, sem precisar copiar nada.
2. Defina as demais variáveis (`FIREBASE_*`, `NEXT_PUBLIC_SITE_URL`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`) nas
   variáveis de ambiente de produção (nunca reutilize os valores de exemplo do `.env.example`).
3. Rode `npm run admin:create` uma vez, localmente, apontando para as credenciais de produção (ou via
   `vercel env pull` + rodar o script local contra o Firebase de produção).
4. Deploy normal (`vercel deploy` ou push pra branch conectada).

**Em host com Node.js + disco persistente (VPS, "Node.js App" da Hostinger etc.):** os mesmos passos valem
— o Vercel Blob funciona em qualquer ambiente com acesso à internet, não só hospedado na própria Vercel,
já que é acessado por API/token. Se um dia preferirem voltar a gravar em disco local nesse tipo de host
(evitando a dependência do Blob), a troca fica isolada em `src/lib/upload.ts` — a assinatura de
`saveImageUpload`/`saveVideoUpload` foi mantida estável exatamente para isso.

Não existe conteúdo de exemplo criado automaticamente — o painel começa vazio de propósito, para que nada
fictício vá ao ar como se fosse real.

## Segurança

- Senha do admin: gerenciada pelo Firebase Authentication (hashing, verificação e troca de senha via Admin
  SDK — ver `src/actions/auth.ts`). Política mínima de 10 caracteres com maiúscula, minúscula, número e
  caractere especial, validada em `src/lib/auth/password.ts`.
- Sessão: cookie de sessão do Firebase Auth (`httpOnly; secure; sameSite=strict`), verificado com checagem de
  revogação a cada Server Action de mutação — ver `src/lib/auth/session.ts`.
- Bloqueio de conta após 5 tentativas de login falhas (15 min), persistido no Firestore
  (`adminSecurity/{email}`) — sobrevive a restart do servidor.
- Uploads: tipo de arquivo validado pelos bytes reais (não pela extensão), imagens reprocessadas via `sharp`
  (remove EXIF/metadados), nomes de arquivo gerados aleatoriamente (UUID), gravados no Vercel Blob com
  acesso público (`access: "public"` — são fotos/vídeos institucionais, não há dado sensível neles).
- Content-Security-Policy sem nonce (para preservar a geração estática), além de `X-Frame-Options`,
  `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy` e `Strict-Transport-Security` — ver
  `src/proxy.ts` e `next.config.mjs`.
- `/contribua` nunca exibe dados financeiros de exemplo: enquanto a igreja não salvar os dados reais em
  `/admin/configuracoes`, a página mostra `[CONTEÚDO PENDENTE]` (ver `src/lib/donation.ts`).
- Formulário público (`submitFormAction`, em `src/actions/formSubmissions.ts`): sem sessão (é a única Server
  Action deste projeto que não chama `requireAdminSession`), mas com honeypot (campo oculto que só um bot
  preenche — envio descartado silenciosamente) e limite de 5 envios/hora por IP+tipo, persistido no Firestore
  (`formRateLimit/{ip}:{tipo}`) — best-effort: depende do host repassar `x-forwarded-for` corretamente. As
  submissões (nome, contato, mensagem) só são legíveis por quem está logado, em `/admin/contatos`.
