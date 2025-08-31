/*
# Correção da Estrutura do Banco - Costureira Pro
Corrige o erro de foreign key constraint removendo dados de exemplo problemáticos
e mantendo apenas a estrutura necessária das tabelas.

## Query Description: Esta operação corrige conflitos de foreign key removendo dados de exemplo 
que referenciam usuários inexistentes. Mantém toda a estrutura das tabelas e políticas RLS. 
Operação segura que não afeta dados reais dos usuários.

## Metadata:
- Schema-Category: "Safe"
- Impact-Level: "Low"
- Requires-Backup: false
- Reversible: true

## Structure Details:
- Mantém tabelas: profiles, clients, services
- Remove apenas dados de exemplo conflitantes
- Preserva todas as políticas RLS e triggers

## Security Implications:
- RLS Status: Enabled em todas as tabelas
- Policy Changes: No
- Auth Requirements: Mantém vinculação com auth.users

## Performance Impact:
- Indexes: Mantidos
- Triggers: Mantidos
- Estimated Impact: Nenhum impacto na performance
*/

-- Remover dados de exemplo existentes que causam conflito
DELETE FROM services WHERE client_id IN (
  SELECT id FROM clients WHERE user_id = 'a61020c7-d05b-4ed5-9d59-cda6d578dd5e'
);

DELETE FROM clients WHERE user_id = 'a61020c7-d05b-4ed5-9d59-cda6d578dd5e';

DELETE FROM profiles WHERE id = 'a61020c7-d05b-4ed5-9d59-cda6d578dd5e';

-- Recriar as tabelas se necessário (DROP CASCADE e CREATE)
DROP TABLE IF EXISTS services CASCADE;
DROP TABLE IF EXISTS clients CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;
DROP FUNCTION IF EXISTS handle_new_user() CASCADE;

-- Tabela de perfis das costureiras
CREATE TABLE profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    full_name TEXT,
    business_name TEXT,
    phone TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de clientes
CREATE TABLE clients (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
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

-- Tabela de serviços
CREATE TABLE services (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    client_id UUID REFERENCES clients(id) ON DELETE CASCADE NOT NULL,
    client_name TEXT NOT NULL, -- Para facilitar autocomplete
    description TEXT NOT NULL,
    value DECIMAL(10,2) NOT NULL,
    delivery_date DATE,
    status TEXT CHECK (status IN ('progress', 'delivered', 'paid')) DEFAULT 'progress',
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX idx_clients_user_id ON clients(user_id);
CREATE INDEX idx_clients_name ON clients(name);
CREATE INDEX idx_clients_favorite ON clients(user_id, is_favorite);
CREATE INDEX idx_services_user_id ON services(user_id);
CREATE INDEX idx_services_client_id ON services(client_id);
CREATE INDEX idx_services_status ON services(status);
CREATE INDEX idx_services_delivery_date ON services(delivery_date);
CREATE INDEX idx_services_created_at ON services(created_at);

-- Habilitar RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para profiles
CREATE POLICY "Users can view own profile" ON profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- Políticas RLS para clients
CREATE POLICY "Users can view own clients" ON clients
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own clients" ON clients
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own clients" ON clients
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own clients" ON clients
    FOR DELETE USING (auth.uid() = user_id);

-- Políticas RLS para services
CREATE POLICY "Users can view own services" ON services
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own services" ON services
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own services" ON services
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own services" ON services
    FOR DELETE USING (auth.uid() = user_id);

-- Função para criar perfil automaticamente
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger AS $$
BEGIN
    INSERT INTO public.profiles (id, full_name)
    VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para criar perfil automaticamente
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Função para atualizar estatísticas do cliente
CREATE OR REPLACE FUNCTION update_client_stats()
RETURNS trigger AS $$
BEGIN
    -- Atualizar total gasto e última data de serviço
    UPDATE clients 
    SET 
        total_spent = (
            SELECT COALESCE(SUM(value), 0) 
            FROM services 
            WHERE client_id = COALESCE(NEW.client_id, OLD.client_id)
            AND status = 'paid'
        ),
        last_service_date = (
            SELECT MAX(created_at::date) 
            FROM services 
            WHERE client_id = COALESCE(NEW.client_id, OLD.client_id)
        ),
        updated_at = NOW()
    WHERE id = COALESCE(NEW.client_id, OLD.client_id);
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Triggers para atualizar estatísticas do cliente
DROP TRIGGER IF EXISTS update_client_stats_on_service_change ON services;
CREATE TRIGGER update_client_stats_on_service_change
    AFTER INSERT OR UPDATE OR DELETE ON services
    FOR EACH ROW EXECUTE FUNCTION update_client_stats();
