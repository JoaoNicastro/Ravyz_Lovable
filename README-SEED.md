# Database Seeding Guide

Este guia explica como popular o banco de dados Supabase com os dados mock de candidatos e vagas.

## 📋 Pré-requisitos

1. Ter o projeto configurado com Supabase
2. Ter acesso ao Service Role Key do Supabase
3. Ter Node.js e npm/bun instalados

## 🚀 Método 1: Script TypeScript (Recomendado)

### Passo 1: Obter o Service Role Key

1. Acesse: https://supabase.com/dashboard/project/wmwpjbagtohitynxoqqx/settings/api
2. Copie o **Service Role Key** (não o anon key)
3. Configure a variável de ambiente:

```bash
export SUPABASE_SERVICE_ROLE_KEY="seu-service-role-key-aqui"
```

### Passo 2: Instalar dependências necessárias

```bash
npm install -D tsx
# ou
bun add -D tsx
```

### Passo 3: Executar o script de seed

```bash
npx tsx src/scripts/seed-database.ts
# ou
bun tsx src/scripts/seed-database.ts
```

### O que o script faz:

✅ Insere todos os jobs do `src/mock/jobs.json`
- Preserva os UUIDs originais
- Define status como 'active'
- Converte arrays para JSONB automaticamente

✅ Insere todos os candidates do `src/mock/candidates.json`
- Preserva os UUIDs originais
- Usa o mesmo UUID para user_id (dados mock)
- Converte skills e pillar_scores para JSONB

✅ Verifica os dados inseridos
- Conta total de jobs e candidates
- Mostra exemplos dos dados inseridos

## 🔧 Método 2: SQL Direto

Se preferir, você pode executar SQL diretamente no Supabase:

### Passo 1: Acessar SQL Editor

https://supabase.com/dashboard/project/wmwpjbagtohitynxoqqx/sql/new

### Passo 2: Copiar e colar o conteúdo do arquivo

```bash
cat src/scripts/seed-sample.sql
```

### Passo 3: Executar no SQL Editor

O arquivo `seed-sample.sql` contém exemplos de 2 jobs e 2 candidates. Para inserir todos os dados, use o script TypeScript.

## 📊 Estrutura dos Dados

### Jobs
```typescript
{
  id: uuid,                    // Preservado do JSON
  company_id: uuid,            // ID da empresa
  title: string,
  description: string,
  requirements: jsonb,         // Array de strings → JSONB
  pillar_scores: jsonb,        // Objeto → JSONB
  archetype: string,
  status: 'active',            // Sempre active
  location: string,
  created_at: timestamp        // Preservado do JSON
}
```

### Candidate Profiles
```typescript
{
  id: uuid,                    // Preservado do JSON
  user_id: uuid,               // Mesmo UUID do id (mock)
  full_name: string,
  email: string,
  phone: string,
  location: string,
  years_experience: number,
  skills: jsonb,               // Array → JSONB
  pillar_scores: jsonb,        // Objeto → JSONB
  archetype: string,
  headline: string,
  created_at: timestamp        // Preservado do JSON
}
```

## ✅ Verificação

Após executar o seed, você pode verificar:

1. **No Supabase Dashboard:**
   - Jobs: https://supabase.com/dashboard/project/wmwpjbagtohitynxoqqx/editor/jobs
   - Candidates: https://supabase.com/dashboard/project/wmwpjbagtohitynxoqqx/editor/candidate_profiles

2. **Na aplicação:**
   - Acesse `/dashboard/candidate`
   - Você deve ver as vagas disponíveis
   - Clique em "Candidatar-se" - agora deve funcionar!

## 🔍 Troubleshooting

### Erro: "SUPABASE_SERVICE_ROLE_KEY environment variable is required"
- Configure a variável de ambiente com o service role key

### Erro: "violates foreign key constraint"
- Certifique-se de que a tabela `jobs` foi populada antes de criar applications
- O company_id das vagas deve existir em company_profiles

### Erro: "duplicate key value violates unique constraint"
- Os dados já estão no banco
- O script usa `UPSERT` então pode ser executado múltiplas vezes

## 📝 Notas Importantes

⚠️ **user_id em candidate_profiles**: Para dados mock, estamos usando o mesmo UUID do candidate_id como user_id. Em produção, isso deve ser o UUID real do auth.users.

⚠️ **company_id em jobs**: Certifique-se de que 'test-company-123' existe em company_profiles ou ajuste os dados.

⚠️ **RLS Policies**: O script usa o Service Role Key que bypassa RLS. Para operações normais da aplicação, as policies RLS se aplicam normalmente.

## 🎯 Próximos Passos

Após o seed bem-sucedido:

1. ✅ Login na aplicação como candidato
2. ✅ Acesse o dashboard (`/dashboard/candidate`)
3. ✅ Veja as vagas disponíveis
4. ✅ Clique em "Candidatar-se"
5. ✅ A candidatura deve ser criada com sucesso!
6. ✅ Veja suas candidaturas na aba "Candidaturas"
