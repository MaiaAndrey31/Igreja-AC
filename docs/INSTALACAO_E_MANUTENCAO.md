# Instalação e Manutenção — Igreja Amor & Cuidado

> Última atualização: 2026-11-13
> Versão do projeto: 0.1.0

---

## 1. Pré-requisitos

| Ferramenta | Versão Mínima | Finalidade |
|-----------|---------------|------------|
| Node.js | 20.x LTS | Runtime JavaScript |
| npm | 10.x | Gerenciador de pacotes |
| Git | 2.x | Controle de versão |
| Firebase CLI | 13.x | Publicação de índices Firestore |
| Vercel CLI | 39.x | Deploy e variáveis de ambiente locais |

Verifique as versões instaladas:

```bash
node -v        # Deve retornar v20.x ou superior
npm -v         # Deve retornar 10.x ou superior
git --version  # Deve retornar 2.x
firebase --version  # Deve retornar 13.x
vercel --version    # Deve retornar 39.x
```

---

## 2. Instalação Local

### 2.1 Clonar o repositório

```bash
git clone <url-do-repositorio>
cd igreja-amor-e-cuidado
```

### 2.2 Instalar dependências

```bash
npm install
```

### 2.3 Configurar variáveis de ambiente

Copie o arquivo de exemplo e preencha com os valores reais:

```bash
cp .env.example .env.local
```

Edite `.env.local` com os valores do seu projeto Firebase e Vercel (veja seção 3 abaixo).

> ⚠️ **Nunca commite** `.env.local` no repositório. Ele já está no `.gitignore`.

### 2.4 Criar administrador inicial

Execute o script de seed para criar o primeiro usuário administrativo no Firebase Auth:

```bash
npm run admin:create
```

Este comando usa as variáveis `ADMIN_EMAIL` e `ADMIN_PASSWORD` definidas em `.env.local`.

### 2.5 Iniciar servidor de desenvolvimento

```bash
npm run dev
```

Acesse `http://localhost:3000` para o site público e `http://localhost:3000/admin` para o painel administrativo.

Para abrir automaticamente o navegador:

```bash
npm run dev:open
```

---

## 3. Variáveis de Ambiente

Todas as variáveis estão documentadas em `.env.example`. Abaixo, a descrição de cada uma:

| Variável | Obrigatória | Descrição |
|----------|-------------|-----------|
| `FIREBASE_PROJECT_ID` | ✅ Produção + Dev | ID do projeto Firebase (Console → Configurações do projeto) |
| `FIREBASE_CLIENT_EMAIL` | ✅ Produção + Dev | E-mail da service account (Firebase → Contas de serviço → Gerar chave privada) |
| `FIREBASE_PRIVATE_KEY` | ✅ Produção + Dev | Chave privada da service account (copiar do JSON baixado, com `\n` literais entre aspas duplas) |
| `FIREBASE_WEB_API_KEY` | ✅ Produção + Dev | Web API Key do Firebase (Console → Configurações → Geral → Chave de API da Web). Usada apenas pelo servidor para verificação de senha via Identity Toolkit REST API |
| `NEXT_PUBLIC_SITE_URL` | ✅ Produção | Domínio público do site (ex.: `https://www.iacadamantina.com.br`). Usado em metadata, Open Graph, sitemap e schema.org |
| `ADMIN_EMAIL` | Apenas seed | E-mail do administrador inicial (usado por `npm run admin:create`) |
| `ADMIN_PASSWORD` | Apenas seed | Senha do administrador inicial (trocar após primeiro login via `/admin/senha`) |
| `BLOB_READ_WRITE_TOKEN` | ✅ Produção + Dev | Token de leitura/escrita do Vercel Blob. Na Vercel: gerado automaticamente ao conectar um Blob Store. Localmente: `vercel env pull .env.local` |

> ⚠️ **Segurança:** `FIREBASE_PRIVATE_KEY` é uma credencial sensível. Nunca compartilhe, nunca commite, nunca exponha em logs. A `FIREBASE_WEB_API_KEY` NÃO é secreta (é pública por design no Firebase), mas neste projeto é usada apenas no servidor.

---

## 4. Comandos Disponíveis

| Comando | Descrição |
|---------|-----------|
| `npm run dev` | Inicia servidor de desenvolvimento em `localhost:3000` |
| `npm run dev:open` | Igual ao `dev`, mas abre o navegador automaticamente |
| `npm run build` | Build de produção com webpack (`next build --webpack`) |
| `npm start` | Inicia servidor de produção (após `build`) |
| `npm run lint` | Executa ESLint |
| `npm test` | Executa testes unitários com Vitest (modo run) |
| `npm run test:watch` | Executa testes em modo watch |
| `npm run admin:create` | Cria/atualiza usuário administrativo no Firebase Auth |
| `npm run seed:initial` | Popula dados iniciais no Firestore |
| `npx tsc --noEmit` | Typecheck sem emitir arquivos |

### Fluxo de validação antes de commit

```bash
npx tsc --noEmit   # 1. Verifica tipos
npm run lint        # 2. Verifica estilo
npm run build       # 3. Verifica compilação completa
npm test            # 4. Executa testes
```

---

## 5. Configuração do Firebase

### 5.1 Criar projeto Firebase

1. Acesse [console.firebase.google.com](https://console.firebase.google.com)
2. Clique em "Adicionar projeto"
3. Defina o nome e ID do projeto
4. Ative o **Firestore** (modo produção ou teste)
5. Ative a **Authentication** (provedor Email/Senha)
6. Gere uma **Service Account Key**: Configurações do projeto → Contas de serviço → Gerar nova chave privada → baixe o JSON
7. Copie `project_id`, `client_email` e `private_key` do JSON para `.env.local`
8. Copie a **Web API Key**: Configurações do projeto → Geral → Chave de API da Web

### 5.2 Publicar índices do Firestore

Os índices compostos estão definidos em `firestore.indexes.json`. Após adicionar novos índices ou fazer deploy pela primeira vez:

```bash
firebase login              # Autentica na CLI do Firebase
firebase use <project-id>   # Seleciona o projeto
firebase deploy --only firestore:indexes
```

> ⚠️ **Crítico:** sem os índices publicados, consultas compostas (como pop-ups, eventos filtrados, etc.) retornarão erro `FAILED_PRECONDITION` em produção. O tratamento de erro em `getEligiblePopups()` retorna lista vazia em caso de falha, mas outros módulos podem quebrar.

### 5.3 Regras de Segurança do Firestore

Como todo o acesso ao Firestore passa pelo servidor Next.js (Admin SDK), as regras de segurança podem ser restritivas:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Negar acesso direto do cliente — tudo passa pelo servidor Next.js
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

O Admin SDK ignora essas regras, então o servidor continua funcionando normalmente.

---

## 6. Deploy na Vercel

### 6.1 Preparação

1. Crie uma conta na [Vercel](https://vercel.com)
2. Conecte o repositório Git (GitHub, GitLab ou Bitbucket)
3. Configure as variáveis de ambiente no Dashboard da Vercel:
   - Settings → Environment Variables
   - Adicione todas as variáveis listadas na seção 3
   - Marque "Production" e "Preview" conforme necessário

### 6.2 Vercel Blob

1. No Dashboard da Vercel: Storage → Create Database → Blob
2. Conecte ao projeto
3. O token `BLOB_READ_WRITE_TOKEN` será injetado automaticamente como variável de ambiente

### 6.3 Deploy automático

Após conectar o repositório, cada push na branch principal dispara um deploy automático. O build executa `next build --webpack`.

### 6.4 Deploy manual

```bash
vercel --prod
```

### 6.5 Domínio personalizado

1. Vercel Dashboard → Project → Settings → Domains
2. Adicione o domínio (ex.: `www.iacadamantina.com.br`)
3. Configure os DNS conforme instruções da Vercel
4. Atualize `NEXT_PUBLIC_SITE_URL` para o domínio final

---

## 7. Monitoramento e Logs

### 7.1 Logs da Vercel

- **Dashboard:** Project → Deployments → selecione um deploy → Logs
- **CLI:** `vercel logs <deployment-url>`
- **Tempo real:** `vercel logs --follow`

### 7.2 Logs do servidor

As funções server-side usam `console.info`, `console.error` e `console.warn`. Estes aparecem nos logs da Vercel (não no console do navegador).

Padrões de log utilizados no projeto:
- `[admin/layout]` — Validação de sessão administrativa
- `[getEligiblePopups]` — Falhas na consulta de pop-ups
- `[export/pdf]` — Erros na geração de PDF

### 7.3 Erros de build

Se o build falhar na Vercel:
1. Verifique os logs do deploy
2. Execute `npm run build` localmente para reproduzir
3. Verifique se há erros de tipo (`npx tsc --noEmit`)
4. Verifique se as variáveis de ambiente estão configuradas

---

## 8. Diagnóstico de Erros Conhecidos

### 8.1 Índices ausentes no Firestore

**Sintoma:** Erro `FAILED_PRECONDITION: The query requires an index` nos logs da Vercel. Páginas carregam parcialmente ou sem dados.

**Causa:** Um índice composto definido em `firestore.indexes.json` não foi publicado no Firebase.

**Solução:**
```bash
firebase deploy --only firestore:indexes
```

Aguarde alguns minutos para os índices serem provisionados.

### 8.2 Objetos Timestamp enviados para Client Components

**Sintoma:** Erro `Only plain objects, and a few built-ins, can be passed to Client Components from Server Components. Classes or null prototypes are not supported.` com digest numérico.

**Causa:** Um Server Component passou uma instância de Firestore Timestamp (ou outra classe do Admin SDK) diretamente como prop para um Client Component.

**Solução:**
1. Identifique o campo problemático na mensagem de erro (ex.: `opensAt`, `activatedAt`)
2. Verifique se o conversor em `collections.ts` converte esse campo usando `toDate()` ou função equivalente
3. Se for um campo aninhado (como `availability`), crie uma função de serialização dedicada (ex.: `serializeAvailability()`)
4. Nunca use spread (`...data`) sem verificar campos aninhados

**Prevenção:** Sempre usar conversores centralizados em `collections.ts`. Nunca acessar `.data()` diretamente sem conversão.

### 8.3 Problemas de autorização administrativa

**Sintoma:** Redirecionamento para `/admin/login` mesmo após login bem-sucedido. Ou erro 401 em Server Actions.

**Causas possíveis:**
- Cookie de sessão expirado ou corrompido
- Variáveis `FIREBASE_*` incorretas
- Usuário não possui claim `admin` no Firebase Auth

**Solução:**
1. Verifique as variáveis `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL` e `FIREBASE_PRIVATE_KEY`
2. Re-execute `npm run admin:create` para garantir que o usuário tem a claim `admin`
3. Limpe cookies do navegador e faça login novamente
4. Verifique logs `[admin/layout]` nos logs da Vercel

### 8.4 Falhas de upload

**Sintoma:** Erro ao enviar imagens no painel administrativo. Mensagens como "Falha ao processar a imagem" ou erros de autenticação do Vercel Blob.

**Causas possíveis:**
- `BLOB_READ_WRITE_TOKEN` ausente ou inválido
- Imagem excede 8MB ou formato não suportado
- Blob Store não conectado ao projeto Vercel

**Solução:**
1. Verifique se o Blob Store está conectado: Vercel Dashboard → Storage
2. Verifique o token: `vercel env pull .env.local` (local) ou Settings → Environment Variables (produção)
3. Verifique tamanho e formato da imagem (JPEG, PNG, WebP; máx. 8MB)

### 8.5 Falhas em consultas e respostas de formulários

**Sintoma:** Formulário público retorna erro 500 ou tela de indisponibilidade. Respostas não são salvas.

**Causas possíveis:**
- Formulário com `adminStatus != "published"`
- Período de disponibilidade encerrado (`closesAt` no passado)
- Limite de submissões atingido (`submissionCount >= maxSubmissions`)
- Rate limit ativo
- Erro de serialização no conversor `dynamicFormConverter`

**Solução:**
1. Verifique o `adminStatus` e `availability` do formulário no painel admin
2. Verifique se `serializeAvailability()` está sendo chamada no conversor
3. Verifique logs de erro nas Server Actions (`submitDynamicFormAction`)
4. Teste com um formulário simples (sem agendamento, sem limite) para isolar o problema

### 8.6 Pop-ups não aparecem

**Sintoma:** Pop-up configurado no admin não aparece na home.

**Causas possíveis:**
- Índice `published + showAsPopup + popupPriority` não publicado
- Data de vigência fora do período atual
- Frequência já marcada como vista no navegador
- `showAsPopup` ou `published` desativados

**Solução:**
1. Verifique se o índice foi publicado: `firebase deploy --only firestore:indexes`
2. Verifique datas de início e término no admin
3. Limpe `sessionStorage` e `localStorage` do navegador para testar
4. Use o botão "Pré-visualizar pop-up" no admin para confirmar o layout

---

## 9. Backup e Recuperação

### 9.1 Backup do Firestore

O Firebase oferece exportação automática para Cloud Storage:

1. Console do Firebase → Firestore → Exportações
2. Configure exportações automáticas diárias
3. Ou exporte manualmente: `gcloud firestore export gs://<bucket>/backup-<data>`

### 9.2 Backup de uploads (Vercel Blob)

Os arquivos no Vercel Blob persistem enquanto o Blob Store estiver ativo. Para backup:

1. Liste todos os blobs via API do Vercel Blob
2. Baixe cada arquivo para armazenamento local ou outro bucket

### 9.3 Recuperação

- **Firestore:** restaure de uma exportação via Console do Firebase ou `gcloud firestore import`
- **Uploads:** re-envie os arquivos via painel administrativo
- **Configurações:** reconfigure via painel administrativo (dados em `settings/site` e `settings/unit`)

> ⚠️ Não há mecanismo de rollback automático. Mantenha backups regulares.

---

## 10. Manutenção Rotineira

| Tarefa | Frequência | Comando/Ação |
|--------|-----------|--------------|
| Verificar logs de erro | Diária | Vercel Dashboard → Logs |
| Verificar builds falhos | Diária | Vercel Dashboard → Deployments |
| Backup do Firestore | Diária (automático) | Console Firebase → Exportações |
| Atualizar dependências | Mensal | `npm update && npm audit` |
| Renovar certificados SSL | Automática | Vercel gerencia automaticamente |
| Revisar índices Firestore | A cada nova feature | Comparar `firestore.indexes.json` com console |
| Trocar senha administrativa | Trimestral | `/admin/senha` |

---

## 11. Referências Cruzadas

- [ARQUITETURA.md](./ARQUITETURA.md) — Visão geral da arquitetura e fluxo de dados
- [BANCO_DE_DADOS.md](./BANCO_DE_DADOS.md) — Estrutura detalhada das coleções e índices
- [MANUAL_DO_ADMINISTRADOR.md](./MANUAL_DO_ADMINISTRADOR.md) — Guia operacional para equipe da igreja
- [GUIA_RAPIDO.md](./GUIA_RAPIDO.md) — Treinamento rápido para novos administradores