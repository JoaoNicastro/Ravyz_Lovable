# RAVYZ - Arquitetura e Fluxo de Navegação

**Última atualização:** 28 de Setembro, 2025 - 19:30 UTC

## 1. Mapa de Pastas Principais

### `src/pages/`
- **`/`** → `Index.tsx` - Página inicial com hero e navegação
- **`/auth`** → `Auth.tsx` - Login e cadastro
- **`/forgot-password`** → `ForgotPassword.tsx` - Recuperação de senha
- **`/reset-password`** → `ResetPassword.tsx` - Redefinir senha
- **`/profile-selection`** → `ProfileSelection.tsx` - Escolha Candidato/Empresa
- **`/onboarding/candidate`** → `OnboardingFlow.tsx` - Fluxo candidato (5 passos)
- **`/company/onboarding`** → `CompanyOnboardingFlow.tsx` - Fluxo empresa (3 passos)
- **`/dashboard/candidate`** → `CandidateDashboard.tsx` - Dashboard do candidato
- **`/dashboard/company`** → `CompanyDashboard.tsx` - Dashboard da empresa
- **`/resume/analyze`** → `ResumeAnalyze.tsx` - Upload e análise de currículo
- **`/company/profile`** → `CompanyProfile.tsx` - Perfil da empresa
- **`*`** → `NotFound.tsx` - 404

### `src/components/`
- **`onboarding/steps/`** - Componentes dos passos de onboarding:
  - `CandidateRegistrationStep.tsx`
  - `CandidateAssessmentStep.tsx` 
  - `CandidateValidationStep.tsx`
  - `DreamJobStep.tsx`
  - `FillMethodStep.tsx`
  - `ProfessionalAssessmentStep.tsx`
  - `CompanyRegistrationStep.tsx`
  - `CompanyJobDefinitionStep.tsx`
  - `CompanyAssessmentStep.tsx` (⚠️ Arquivo existe mas não está na lista de arquivos)
- **`forms/`** - Formulários reutilizáveis:
  - `AuthForm.tsx` - Login/Cadastro
  - `CandidateProfileForm.tsx` - Dados do candidato
  - `FormField.tsx` - Campo de formulário genérico
- **`ui/`** - Componentes UI (shadcn/ui)
- **Outros:**
  - `MatchRadarChart.tsx` - Gráfico de compatibilidade
  - `MatchingDisplay.tsx` - Exibição de matches
  - `Notifications.tsx` - Notificações
  - `ProtectedRoute.tsx` - Proteção de rotas
  - `QuestionRenderer.tsx` - Renderização de questões

### `src/lib/`
- **`matching-engine.ts`** - Motor de matching principal
- **`matching-engine-example.ts`** - Exemplos do motor de matching
- **`ravyz-examples.ts`** - Exemplos de dados do RAVYZ
- **`question-bank.json`** - Banco de questões para assessments
- **`question-bank-loader.ts`** - Carregador do banco de questões
- **`schemas.ts`** - Esquemas Zod para validação
- **`data-persistence.ts`** - Persistência de dados
- **`utils.ts`** - Utilitários gerais

### `supabase/migrations/`
- Scripts SQL para criação e atualização do schema do banco de dados

### `supabase/functions/`
- Edge functions para lógica de backend (vazio no momento)

## 2. Fluxo de Navegação Atual

```mermaid
graph TD
    A[/ - Index] --> B{Usuário logado?}
    B -->|Não| C[/auth - Login/Signup]
    B -->|Sim| D[/profile-selection]
    
    C --> E[/forgot-password]
    E --> F[/reset-password]
    C --> D
    
    D --> G{Perfil selecionado}
    G -->|Candidato| H[/onboarding/candidate]
    G -->|Empresa| I[/company/onboarding]
    
    H --> H1[Passo 1: Registro]
    H1 --> H2[Passo 2: Assessment]
    H2 --> H3[Passo 3: Validação]
    H3 --> H4[Passo 4: Dream Job]
    H4 --> H5[Passo 5: Método Preenchimento]
    H5 --> J[/dashboard/candidate]
    
    I --> I1[Passo 1: Registro Empresa]
    I1 --> I2[Passo 2: Definição Job]
    I2 --> I3[Passo 3: Assessment Empresa]
    I3 --> K[/dashboard/company]
    
    L[/resume/analyze] --> H2
    
    M[Qualquer rota inválida] --> N[/not-found - 404]
    
    J --> O[/company/profile]
    K --> O
```

## 3. Fluxo de Matching

### Pipeline de Compatibilidade
1. **Coleta de Dados do Candidato:**
   - `CandidateAssessmentStep` → coleta respostas comportamentais
   - Calcula `pillar_scores` (autonomia, liderança, etc.)
   - Determina `archetype` baseado nos top 2 pillars
   - Salva em `candidate_profiles`

2. **Coleta de Dados da Empresa:**
   - `CompanyAssessmentStep` → define perfil comportamental ideal
   - Calcula `pillar_scores` para a vaga
   - Determina `archetype` da vaga
   - Salva em `jobs`

3. **Cálculo de Matching:**
   - `matching-engine.ts` executa algoritmo de compatibilidade
   - Usa **cosine similarity** entre pillar_scores
   - Aplica **boosts de arquétipo** (+15% se archetypes compatíveis)
   - Considera **skills_vector** e outros fatores
   - Gera score final de 0-100%

4. **Persistência de Resultados:**
   - Salva em `matching_results` com score_breakdown detalhado
   - Inclui `explanation` textual da compatibilidade
   - Define `expires_at` para cache de 7 dias

5. **Exibição nos Dashboards:**
   - `CandidateDashboard` → mostra vagas compatíveis
   - `CompanyDashboard` → mostra candidatos recomendados
   - `MatchRadarChart` → visualiza breakdown de compatibilidade

### Tabelas Principais do Matching
- **`candidate_profiles`** - Dados dos candidatos
- **`company_profiles`** - Dados das empresas  
- **`jobs`** - Vagas com perfil comportamental ideal
- **`matching_results`** - Resultados de compatibilidade
- **`applications`** - Candidaturas enviadas
- **`resume_analyses`** - Análises de currículo com IA

### Arquétipos Suportados
- **Executor** (autonomia + disciplina)
- **Líder Estratégico** (liderança + visão estratégica)
- **Colaborador** (colaboração + comunicação)
- **Inovador** (criatividade + adaptabilidade)
- **Especialista** (especialização + precisão)

---

**Nota:** Este arquivo deve ser atualizado sempre que houver mudanças na navegação, novos componentes importantes ou alterações no algoritmo de matching.