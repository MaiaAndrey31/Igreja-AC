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
- Uploads de mídia (fotos, vídeo do hero) ficam em **disco local**, em `public/uploads/` — não usam nenhum
  serviço externo. Ver o alerta em "Deploy" sobre o que isso exige do host.

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

Não é preciso ativar o Storage — uploads de mídia ficam em disco local (ver seção "Deploy").

Nenhuma migration é necessária — o Firestore não tem schema, as coleções nascem sozinhas no primeiro
documento gravado pelo painel.

## Scripts

| Comando | Descrição |
| --- | --- |
| `npm run dev` | Servidor de desenvolvimento |
| `npm run build` | Build de produção |
| `npm run start` | Sobe o build de produção |
| `npm run lint` | ESLint |
| `npm run admin:create` | Cria/atualiza o usuário admin no Firebase Auth (lê `ADMIN_EMAIL`/`ADMIN_PASSWORD`) |

## Regra de conteúdo: não inventar informação

Nenhum dado sobre a igreja pode ser preenchido por inferência. Horário, endereço, nome de pastor, data de
evento ou frase institucional só entram no código com fonte verificada. O que ainda não foi publicado pela
igreja aparece literalmente como `[CONTEÚDO PENDENTE]` na interface — ver `src/data/pending.ts` e o componente
`Pending`.

A mesma regra vale para imagem: fotografia é 100% real da própria igreja. Enquanto a foto não chega, o bloco
mostra `MediaPlaceholder`, nunca banco de imagens.

## Onde mora cada conteúdo

**`src/data/` — estrutural, versionado em código** (muda raramente, precisa de revisão):

| Arquivo | Conteúdo |
| --- | --- |
| `unit.ts` | Nome, tagline, João 21:17, história (garagem → templo novo), endereço, contato, horários, contexto de rede |
| `leaders.ts` | Liderança local confirmada publicamente (Toninho Donha, Lucas Donha, Matheus Magnani) |
| `cellCities.ts` | As 6 cidades da microrregião alcançadas por células |
| `messages.ts` | Pregações em destaque (hoje vazio → estado pendente, sem link de vídeo confirmado) |
| `socialLinks.ts` | Instagram, Facebook, WhatsApp, e-mail (sem YouTube — handle não confirmado) |

**Firestore, via painel `/admin` — editorial, os próprios pastores mantêm** (publica sem precisar de dev):

| Coleção/documento | Conteúdo | Onde aparece |
| --- | --- | --- |
| `ministries` | Título, descrição, ícone, destaque, ordem, publicado | Home e `/ministerios` |
| `cells` | Nome, líder, bairro, dia/horário, WhatsApp, logo, ativa | `/celulas` |
| `announcements` | Avisos, cultos especiais, conferências | `/avisos` e home |
| `gallery` | Fotos | `/galeria` |
| `settings/site` | Hero (título, subtítulo, vídeo/foto, foco), dados de contribuição | Home e `/contribua` |
| `adminSecurity/{email}` | Contador de tentativas de login (força bruta) | Só uso interno |

O rodapé aponta para `/ministerios` com um link fixo, em vez de listar cada ministério: o rodapé é
compartilhado por todas as páginas, e uma consulta ao Firestore ali tiraria a geração estática das páginas
que não precisam disso.

> **Nota sobre os números:** `unit.cellsCount` está como `"70+"` (o número da página oficial da unidade,
> mais conservador). Uma matéria local de início de 2026 chegou a citar 102 células — sinalize essa
> divergência à igreja antes de publicar, caso prefiram atualizar.

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

Toda consulta com filtro (`where`) combinado a mais de um `orderBy` exige um índice composto no Firestore —
os 5 que este projeto usa estão declarados em `firestore.indexes.json`. Se algum faltar em produção, a
consulta falha com uma mensagem de erro que já traz o link direto para criar o índice certo no Console —
não é preciso decorar isso, só clicar no link na primeira vez que acontecer.

## Deploy

O projeto **exige** um host com Node.js persistente e disco persistente (VPS, ou "Node.js App" da
Hostinger, por exemplo) — não uma hospedagem serverless/containers efêmeros (Vercel, Cloud Run sem volume
etc.). O motivo: os uploads do painel (`public/uploads/`) são gravados no disco local do servidor (ver
`src/lib/upload.ts`); num host efêmero, esse diretório é recriado a cada deploy e todo arquivo enviado se
perde. Se um dia migrarem para esse tipo de host, será preciso trocar `src/lib/upload.ts` por um object
storage externo (Firebase Storage, Supabase Storage, S3...) antes — a interface das duas funções de upload
foi mantida estável exatamente para isolar essa troca.

Passos:

1. Defina as variáveis `FIREBASE_*`, `NEXT_PUBLIC_SITE_URL`, `ADMIN_EMAIL` e `ADMIN_PASSWORD` como variáveis
   de ambiente de produção (nunca reutilize os valores de exemplo do `.env.example`).
2. Rode `npm run admin:create` uma vez, contra as credenciais de produção.
3. Garanta que `public/uploads/` sobrevive a um redeploy (ex.: symlink para um diretório fora da pasta que o
   deploy substitui, ou um volume persistente) — senão, cada deploy apaga hero/galeria/avisos já enviados.
4. `npm run build && npm run start` (ou um process manager como PM2 na frente do `next start`).
5. Inclua `public/uploads/` na rotina de backup — é o único dado deste projeto que não está no Firestore.

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
  (remove EXIF/metadados), nomes de arquivo gerados aleatoriamente, gravados em `public/uploads/` (disco
  local — ver o alerta em "Deploy" sobre persistência).
- Content-Security-Policy sem nonce (para preservar a geração estática), além de `X-Frame-Options`,
  `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy` e `Strict-Transport-Security` — ver
  `src/proxy.ts` e `next.config.mjs`.
- `/contribua` nunca exibe dados financeiros de exemplo: enquanto a igreja não salvar os dados reais em
  `/admin/configuracoes`, a página mostra `[CONTEÚDO PENDENTE]` (ver `src/lib/donation.ts`).
