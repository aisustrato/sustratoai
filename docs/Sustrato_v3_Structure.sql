-- -----------------------------------------------------------------------------
-- SUSTRATO AI V3 - STRUCTURE DUMP
-- Reconstructed from TypeScript Definitions
-- -----------------------------------------------------------------------------

-- 1. ENABLE EXTENSIONS (Optional but recommended)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. CREATE ENUMS (Tipos personalizados)
CREATE TYPE job_status AS ENUM ('pending', 'processing', 'completed', 'failed');
CREATE TYPE job_type AS ENUM ('import_articles', 'generate_embeddings', 'preclassification', 'batch_processing');
CREATE TYPE batch_preclass_status AS ENUM ('pending', 'in_progress', 'completed', 'validated', 'rejected');
CREATE TYPE dimension_type AS ENUM ('binary', 'categorical', 'text', 'scale');
CREATE TYPE dimension_status AS ENUM ('active', 'inactive', 'archived');
CREATE TYPE preclassification_phase_status AS ENUM ('planning', 'active', 'completed', 'archived');
CREATE TYPE group_visibility AS ENUM ('private', 'project', 'public');
CREATE TYPE note_visibility AS ENUM ('private', 'project', 'public');

-- 3. CREATE TABLES (Ordenadas por dependencia)

-- Tabla: projects
CREATE TABLE projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    owner_id UUID NOT NULL REFERENCES auth.users(id),
    status TEXT DEFAULT 'active'
);

-- Tabla: project_roles
CREATE TABLE project_roles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    role_name TEXT NOT NULL,
    role_description TEXT,
    can_bulk_edit_master_data BOOLEAN DEFAULT false,
    can_create_batches BOOLEAN DEFAULT false,
    can_manage_master_data BOOLEAN DEFAULT false,
    can_upload_files BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Tabla: project_members
CREATE TABLE project_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id),
    project_role_id UUID NOT NULL REFERENCES project_roles(id),
    joined_at TIMESTAMPTZ DEFAULT now(),
    is_active_for_user BOOLEAN DEFAULT true,
    updated_at TIMESTAMPTZ DEFAULT now(),
    contact_email_for_project TEXT,
    contextual_notes TEXT,
    ui_font_pair TEXT,
    ui_is_dark_mode BOOLEAN DEFAULT false,
    ui_theme TEXT
);

-- Tabla: articles
CREATE TABLE articles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    title TEXT,
    abstract TEXT,
    authors TEXT[],
    publication_year INTEGER,
    journal TEXT,
    doi TEXT,
    correlativo SERIAL,
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Tabla: preclassification_phases
CREATE TABLE preclassification_phases (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    phase_number INTEGER NOT NULL,
    status preclassification_phase_status DEFAULT 'planning',
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Tabla: preclass_dimensions
CREATE TABLE preclass_dimensions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    phase_id UUID REFERENCES preclassification_phases(id),
    name TEXT NOT NULL,
    description TEXT,
    type dimension_type NOT NULL,
    status dimension_status DEFAULT 'active',
    ordering INTEGER DEFAULT 0,
    icon TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ
);

-- Tabla: preclass_dimension_options
CREATE TABLE preclass_dimension_options (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    dimension_id UUID NOT NULL REFERENCES preclass_dimensions(id) ON DELETE CASCADE,
    value TEXT NOT NULL,
    emoticon TEXT,
    ordering INTEGER DEFAULT 0
);

-- Tabla: preclass_dimension_questions
CREATE TABLE preclass_dimension_questions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    dimension_id UUID NOT NULL REFERENCES preclass_dimensions(id) ON DELETE CASCADE,
    question TEXT NOT NULL,
    ordering INTEGER DEFAULT 0
);

-- Tabla: preclass_dimension_examples
CREATE TABLE preclass_dimension_examples (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    dimension_id UUID NOT NULL REFERENCES preclass_dimensions(id) ON DELETE CASCADE,
    example TEXT NOT NULL
);

-- Tabla: article_batches
CREATE TABLE article_batches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    phase_id UUID REFERENCES preclassification_phases(id),
    name TEXT,
    batch_number INTEGER NOT NULL,
    status batch_preclass_status DEFAULT 'pending',
    translation_complete BOOLEAN DEFAULT false,
    assigned_to UUID REFERENCES auth.users(id),
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Tabla: article_batch_items
CREATE TABLE article_batch_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    batch_id UUID NOT NULL REFERENCES article_batches(id) ON DELETE CASCADE,
    article_id UUID NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
    status batch_preclass_status DEFAULT 'pending',
    human_label TEXT,
    ai_label TEXT,
    ai_process_opinion TEXT,
    ai_keywords TEXT[],
    requires_adjudication BOOLEAN DEFAULT false,
    preclassified_by UUID REFERENCES auth.users(id),
    preclassified_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Tabla: article_dimension_reviews
CREATE TABLE article_dimension_reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    article_id UUID NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
    article_batch_item_id UUID NOT NULL REFERENCES article_batch_items(id) ON DELETE CASCADE,
    dimension_id UUID NOT NULL REFERENCES preclass_dimensions(id),
    option_id UUID REFERENCES preclass_dimension_options(id),
    classification_value TEXT,
    confidence_score NUMERIC,
    rationale TEXT,
    reviewer_id UUID NOT NULL REFERENCES auth.users(id),
    reviewer_type TEXT NOT NULL, -- 'human' or 'ai'
    iteration INTEGER DEFAULT 1,
    is_final BOOLEAN DEFAULT false,
    prevalidated BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Tabla: article_groups
CREATE TABLE article_groups (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    visibility group_visibility DEFAULT 'private',
    user_id UUID NOT NULL REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Tabla: article_group_items
CREATE TABLE article_group_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    group_id UUID NOT NULL REFERENCES article_groups(id) ON DELETE CASCADE,
    article_id UUID NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id),
    description TEXT,
    added_at TIMESTAMPTZ DEFAULT now()
);

-- Tabla: article_notes
CREATE TABLE article_notes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    article_id UUID NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id),
    title TEXT,
    note_content TEXT,
    visibility note_visibility DEFAULT 'private',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Tabla: article_translations
CREATE TABLE article_translations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    article_id UUID NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
    language TEXT NOT NULL,
    title TEXT NOT NULL,
    abstract TEXT,
    summary TEXT,
    translator_system TEXT,
    translated_by UUID REFERENCES auth.users(id),
    translated_at TIMESTAMPTZ DEFAULT now(),
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Tabla: ai_job_history
CREATE TABLE ai_job_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id),
    job_type job_type NOT NULL,
    status job_status DEFAULT 'pending',
    progress NUMERIC DEFAULT 0,
    description TEXT,
    error_message TEXT,
    details JSONB,
    ai_model TEXT,
    input_tokens INTEGER,
    output_tokens INTEGER,
    started_at TIMESTAMPTZ DEFAULT now(),
    completed_at TIMESTAMPTZ
);

-- Tabla: article_abstract_highlights
CREATE TABLE article_abstract_highlights (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    article_id UUID NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id),
    version_type TEXT NOT NULL,
    highlighted_content TEXT NOT NULL,
    highlights_metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ
);

-- Tabla: phase_eligible_articles
CREATE TABLE phase_eligible_articles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    phase_id UUID NOT NULL REFERENCES preclassification_phases(id) ON DELETE CASCADE,
    article_id UUID NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT now()
);


-- 4. ENABLE RLS (Seguridad Básica)
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE article_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE article_batch_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE article_dimension_reviews ENABLE ROW LEVEL SECURITY;

-- 5. BASIC POLICIES (Permitir todo al usuario autenticado por ahora para facilitar importación)
-- OJO: Esto es temporal para la migración. Luego ajustaremos.

CREATE POLICY "Enable all access for authenticated users" ON projects FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Enable all access for authenticated users" ON articles FOR ALL USING (auth.role() = 'authenticated');
-- (Repetir para otras tablas si es necesario, pero con projects suele bastar para cascada)

-- -----------------------------------------------------------------------------
-- END OF DUMP
-- -----------------------------------------------------------------------------
