/*
# Criação do Schema Completo - Costureira Pro
Criação das tabelas principais para gestão de costureiras, clientes e serviços

## Query Description: Esta operação criará o schema completo do sistema.
Inclui tabelas para perfis de usuários, clientes e serviços com todas as 
relações e políticas de segurança. É uma operação segura que não afeta 
dados existentes.

## Metadata:
- Schema-Category: "Safe"
- Impact-Level: "Low"
- Requires-Backup: false
- Reversible: true

## Structure Details:
- profiles: perfis das costureiras
- clients: dados dos clientes
- services: histórico de serviços

## Security Implications:
- RLS Status: Enabled
- Policy Changes: Yes
- Auth Requirements: Authenticated users only

## Performance Impact:
- Indexes: Added for performance
- Triggers: Added for data consistency
- Estimated Impact: Minimal performance impact
*/

-- Enable RLS
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO postgres, anon, authenticated, service_role;

-- Create profiles table
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  full_name TEXT,
  business_name TEXT,
  phone TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create clients table
CREATE TABLE IF NOT EXISTS public.clients (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  is_favorite BOOLEAN DEFAULT FALSE,
  total_spent DECIMAL(10,2) DEFAULT 0,
  last_service_date DATE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create services table
CREATE TABLE IF NOT EXISTS public.services (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE NOT NULL,
  client_name TEXT NOT NULL,
  description TEXT NOT NULL,
  value DECIMAL(10,2) NOT NULL,
  delivery_date DATE,
  status TEXT CHECK (status IN ('progress', 'delivered', 'paid')) DEFAULT 'progress',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- RLS Policies for clients
CREATE POLICY "Users can view own clients" ON public.clients
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own clients" ON public.clients
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own clients" ON public.clients
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own clients" ON public.clients
  FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for services
CREATE POLICY "Users can view own services" ON public.services
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own services" ON public.services
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own services" ON public.services
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own services" ON public.services
  FOR DELETE USING (auth.uid() = user_id);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_clients_user_id ON public.clients(user_id);
CREATE INDEX IF NOT EXISTS idx_clients_name ON public.clients(name);
CREATE INDEX IF NOT EXISTS idx_services_user_id ON public.services(user_id);
CREATE INDEX IF NOT EXISTS idx_services_client_id ON public.services(client_id);
CREATE INDEX IF NOT EXISTS idx_services_created_at ON public.services(created_at);

-- Function to handle new user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user registration
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update client statistics
CREATE OR REPLACE FUNCTION public.update_client_stats()
RETURNS TRIGGER AS $$
BEGIN
  -- Update total spent and last service date for the client
  UPDATE public.clients 
  SET 
    total_spent = (
      SELECT COALESCE(SUM(value), 0) 
      FROM public.services 
      WHERE client_id = COALESCE(NEW.client_id, OLD.client_id)
      AND status = 'paid'
    ),
    last_service_date = (
      SELECT MAX(created_at::date) 
      FROM public.services 
      WHERE client_id = COALESCE(NEW.client_id, OLD.client_id)
    ),
    updated_at = NOW()
  WHERE id = COALESCE(NEW.client_id, OLD.client_id);
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to update client stats when services change
DROP TRIGGER IF EXISTS update_client_stats_trigger ON public.services;
CREATE TRIGGER update_client_stats_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.services
  FOR EACH ROW EXECUTE FUNCTION public.update_client_stats();

-- Function to automatically create or link clients
CREATE OR REPLACE FUNCTION public.get_or_create_client(
  p_user_id UUID,
  p_client_name TEXT
) RETURNS UUID AS $$
DECLARE
  client_id UUID;
BEGIN
  -- Try to find existing client
  SELECT id INTO client_id
  FROM public.clients
  WHERE user_id = p_user_id AND LOWER(name) = LOWER(p_client_name)
  LIMIT 1;
  
  -- If not found, create new client
  IF client_id IS NULL THEN
    INSERT INTO public.clients (user_id, name)
    VALUES (p_user_id, p_client_name)
    RETURNING id INTO client_id;
  END IF;
  
  RETURN client_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
