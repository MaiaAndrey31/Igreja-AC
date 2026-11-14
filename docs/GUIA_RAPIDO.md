# Guia Rápido — Igreja Amor & Cuidado

> **Versão:** 1.0 | **Data:** 13 de novembro de 2026
> Para treinamento de novos administradores. Consulte o [Manual Completo](./MANUAL_DO_ADMINISTRADOR.md) para detalhes.

---

## Acesso ao Painel

1. Acesse **https://www.iacadamantina.com.br/admin**
2. Digite e-mail e senha → clique em **"Entrar"**
3. Navegue pelo menu lateral à esquerda
4. Sempre clique em **"Sair"** ao terminar

---

## Tarefas Mais Frequentes

### 📋 Cadastrar uma nova célula

1. Menu → **Células** → botão **"Nova célula"**
2. Preencha: Nome, Líder, Bairro, Endereço, Dia/Horário
3. Ative **"Célula ativa"** e **"Publicar no site"**
4. ⚠️ Ao publicar, o endereço completo fica visível publicamente
5. Clique em **"Criar célula"**
6. Verifique em `/celulas` se aparece corretamente

### 🎉 Criar um evento com inscrições

1. Menu → **Eventos** → botão **"Novo evento"**
2. Preencha título, descrição, data, local e banner
3. Em **Inscrições**, selecione um formulário existente
4. Defina limite de vagas (opcional)
5. Ative **"Publicado no site"**
6. Para destacar na home: ative **"Destacar na página inicial"**
7. Clique em **"Criar evento"**

### 📝 Criar um formulário

1. Menu → **Formulários** → botão **"Novo formulário"**
2. Defina título, slug e finalidade
3. Adicione campos clicando em **"Adicionar campo"**
4. Configure disponibilidade (manual, agendada ou por duração)
5. Clique em **"Publicar"**
6. URL pública: `/formularios/[slug]`

### 📊 Consultar e exportar respostas

1. Menu → **Formulários** → clique **"Respostas"** no formulário
2. Visualize todas as inscrições na tabela
3. Exporte usando os botões superiores:
 - **CSV** → para Excel/Google Sheets
 - **XML** → para integração com outros sistemas
 - **PDF** → relatório consolidado com identidade visual
4. Para PDF individual: clique no ícone de download na linha da resposta

### 🔔 Publicar um aviso como pop-up

1. Menu → **Avisos** → **"Novo aviso"** (ou edite existente)
2. Preencha título, descrição e datas
3. Na seção **"Pop-up na Entrada do Site"**, ative o switch
4. Configure texto e link do botão, prioridade e frequência
5. Clique em **"Pré-visualizar pop-up"** para testar
6. Ative **"Publicado no site"** → salve

### 🖼️ Adicionar foto à galeria

1. Menu → **Galeria** → **"Adicionar foto"**
2. Envie a imagem (JPG/PNG/WebP, máx. 8MB)
3. Adicione legenda e defina ordem
4. Ative **"Ativa"** → salve

### ⏰ Alterar horários de culto

1. Menu → **Horários** → edite ou crie novo
2. Escolha o **Tipo de programação**:
   - **Semanal**: selecione dia da semana e horário (cultos recorrentes)
   - **Acontecimento único**: preencha data e horário (vigílias, celebrações)
3. Adicione rótulo opcional → salve
4. Acontecimentos únicos deixam de aparecer no site automaticamente após a data

### 🔗 Atualizar redes sociais

1. Menu → **Redes sociais** → edite ou crie novo
2. Selecione plataforma e preencha URL
3. Ative → salve

### 🔑 Trocar senha

1. Menu → **Senha**
2. Digite nova senha (mín. 8 caracteres, maiúsculas + minúsculas + números)
3. Confirme → clique em **"Alterar senha"**

---

## Checklist de Publicação

Antes de publicar qualquer conteúdo, verifique:

- [ ] Todos os campos obrigatórios preenchidos
- [ ] Imagens com formato correto (JPG/PNG/WebP) e tamanho < 8MB
- [ ] Endereços de células autorizados pelo líder
- [ ] Datas de vigência corretas (eventos, avisos, pop-ups)
- [ ] Formulários vinculados funcionando (testar inscrição)
- [ ] Pré-visualização testada (pop-ups)
- [ ] Conteúdo revisado ortograficamente

---

## Exportações — Resumo Rápido

| Formato | Quando usar | Como |
|---------|------------|------|
| CSV | Análise no Excel, filtros avançados | Botão "Exportar CSV" |
| XML | Integração com sistemas externos | Botão "XML" |
| PDF Consolidado | Relatório completo para impressão/arquivo | Botão "PDF" |
| PDF Individual | Comprovante de inscrição específica | Ícone de download na linha |

---

## Problemas Rápidos

| Problema | Solução |
|----------|---------|
| Pop-up não aparece | Verifique publicação + vigência; limpe cache do navegador |
| Endereço da célula não aparece | Confirme "Célula ativa" E "Publicar no site" ambos ativados |
| Erro ao salvar formulário | Verifique campos obrigatórios e slug (apenas letras minúsculas, números e hífens) |
| Imagem não carrega | Verifique formato (JPG/PNG/WebP) e tamanho (< 8MB) |
| Inscrições ultrapassaram limite | Verifique "Máximo de respostas" na edição do formulário |
| Página com erro | Recarregue; se persistir, contacte suporte técnico |

---

## Contato e Suporte

Em caso de dúvidas ou problemas técnicos que não constam neste guia:

- Consulte o [Manual Completo](./MANUAL_DO_ADMINISTRADOR.md) para instruções detalhadas
- Consulte a [Documentação Técnica](./ARQUITETURA.md) para informações sobre arquitetura
- Entre em contato com o desenvolvedor responsável pelo projeto

---

## Documentos Relacionados

- [Manual do Administrador](./MANUAL_DO_ADMINISTRADOR.md) — guia completo passo a passo
- [Arquitetura](./ARQUITETURA.md) — documentação técnica para desenvolvedores
- [Banco de Dados](./BANCO_DE_DADOS.md) — estrutura das coleções Firestore
- [Instalação e Manutenção](./INSTALACAO_E_MANUTENCAO.md) — setup, deploy e troubleshooting