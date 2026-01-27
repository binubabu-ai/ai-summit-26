-- Create Projects table
CREATE TABLE IF NOT EXISTS public.projects (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  slug TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Ensure unique slugs per user
  CONSTRAINT unique_user_slug UNIQUE (user_id, slug)
);

-- Create index for faster lookups
CREATE INDEX idx_projects_user_id ON public.projects(user_id);
CREATE INDEX idx_projects_slug ON public.projects(slug);

-- Enable Row Level Security
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Users can only see their own projects
CREATE POLICY "Users can view their own projects"
  ON public.projects
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can create their own projects
CREATE POLICY "Users can create their own projects"
  ON public.projects
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own projects
CREATE POLICY "Users can update their own projects"
  ON public.projects
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Users can delete their own projects
CREATE POLICY "Users can delete their own projects"
  ON public.projects
  FOR DELETE
  USING (auth.uid() = user_id);

-- Create Project API Keys table
CREATE TABLE IF NOT EXISTS public.project_api_keys (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT 'Default Key',
  key TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE,
  last_used_at TIMESTAMP WITH TIME ZONE,

  -- One active key per project (for now)
  CONSTRAINT unique_project_key UNIQUE (project_id)
);

-- Create index for API key lookups
CREATE INDEX idx_api_keys_key ON public.project_api_keys(key);
CREATE INDEX idx_api_keys_project_id ON public.project_api_keys(project_id);

-- Enable Row Level Security
ALTER TABLE public.project_api_keys ENABLE ROW LEVEL SECURITY;

-- RLS Policies for API Keys
-- Users can only see API keys for their own projects
CREATE POLICY "Users can view their own project API keys"
  ON public.project_api_keys
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.projects
      WHERE projects.id = project_api_keys.project_id
      AND projects.user_id = auth.uid()
    )
  );

-- Users can create API keys for their own projects
CREATE POLICY "Users can create API keys for their own projects"
  ON public.project_api_keys
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.projects
      WHERE projects.id = project_api_keys.project_id
      AND projects.user_id = auth.uid()
    )
  );

-- Users can delete API keys for their own projects
CREATE POLICY "Users can delete their own project API keys"
  ON public.project_api_keys
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.projects
      WHERE projects.id = project_api_keys.project_id
      AND projects.user_id = auth.uid()
    )
  );

-- Function to generate API keys with prefix
CREATE OR REPLACE FUNCTION generate_api_key()
RETURNS TEXT AS $$
DECLARE
  key_suffix TEXT;
BEGIN
  -- Generate a random 32-character suffix
  key_suffix := encode(gen_random_bytes(24), 'base64');
  -- Remove special characters and make URL-safe
  key_suffix := REPLACE(REPLACE(REPLACE(key_suffix, '+', ''), '/', ''), '=', '');
  -- Return with dj_ prefix
  RETURN 'dj_' || key_suffix;
END;
$$ LANGUAGE plpgsql;

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update updated_at
CREATE TRIGGER update_projects_updated_at
  BEFORE UPDATE ON public.projects
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create Project Sources table (cloud-managed sources)
CREATE TABLE IF NOT EXISTS public.project_sources (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('git', 'http', 'local')),
  url TEXT NOT NULL,
  branch TEXT,
  enabled BOOLEAN DEFAULT true,
  auth_key_name TEXT, -- Reference to keystore key name
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_synced_at TIMESTAMP WITH TIME ZONE,

  -- Unique source name per project
  CONSTRAINT unique_project_source_name UNIQUE (project_id, name)
);

-- Create index
CREATE INDEX idx_project_sources_project_id ON public.project_sources(project_id);

-- Enable Row Level Security
ALTER TABLE public.project_sources ENABLE ROW LEVEL SECURITY;

-- RLS Policies for Project Sources
CREATE POLICY "Users can view sources for their own projects"
  ON public.project_sources
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.projects
      WHERE projects.id = project_sources.project_id
      AND projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create sources for their own projects"
  ON public.project_sources
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.projects
      WHERE projects.id = project_sources.project_id
      AND projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update sources for their own projects"
  ON public.project_sources
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.projects
      WHERE projects.id = project_sources.project_id
      AND projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete sources for their own projects"
  ON public.project_sources
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.projects
      WHERE projects.id = project_sources.project_id
      AND projects.user_id = auth.uid()
    )
  );

-- Trigger to auto-update updated_at for sources
CREATE TRIGGER update_project_sources_updated_at
  BEFORE UPDATE ON public.project_sources
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
