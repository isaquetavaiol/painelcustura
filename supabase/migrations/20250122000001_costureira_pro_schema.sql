/*
# Costureira Pro - Complete Database Schema
Creates all necessary tables and relationships for the seamstress management app

## Query Description: 
This migration creates the complete database structure for Costureira Pro, including user profiles, clients, and services management. It establishes proper relationships and security policies for data access. No existing data will be affected as this is the initial schema setup.

## Metadata:
- Schema-Category: "Structural"
- Impact-Level: "Low"
- Requires-Backup: false
- Reversible: true

## Structure Details:
- profiles: User profiles linked to auth.users
- clients: Client management with contact information
- services: Service orders with pricing and status tracking
- Relationships: profiles -> clients -> services

## Security Implications:
- RLS Status: Enabled on all public tables
- Policy Changes: Yes (read/write policies for authenticated users)
- Auth Requirements: Authenticated users can only access their own data

## Performance Impact:
- Indexes: Added on foreign keys and frequently queried columns
- Triggers: Profile auto-creation trigger for new users
- Estimated Impact: Minimal performance overhead
*/

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create profiles table (linked to auth.users)
CREATE TABLE public.profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT,
    business_name TEXT,
    phone TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    PRIMARY KEY (id)
);

-- Create clients table
CREATE TABLE public.clients (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    phone TEXT,
    email TEXT,
    address TEXT,
    notes TEXT,
    is_favorite BOOLEAN DEFAULT false,
    total_spent DECIMAL(10,2) DEFAULT 0.00,
    last_service_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create services table
CREATE TABLE public.services (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE NOT NULL,
    description TEXT NOT NULL,
    value DECIMAL(10,2) NOT NULL CHECK (value >= 0),
    delivery_date DATE,
    status TEXT CHECK (status IN ('progress', 'delivered', 'paid')) DEFAULT 'progress',
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create indexes for better performance
CREATE INDEX idx_clients_profile_id ON public.clients(profile_id);
CREATE INDEX idx_clients_name ON public.clients(name);
CREATE INDEX idx_clients_is_favorite ON public.clients(is_favorite);
CREATE INDEX idx_services_profile_id ON public.services(profile_id);
CREATE INDEX idx_services_client_id ON public.services(client_id);
CREATE INDEX idx_services_status ON public.services(status);
CREATE INDEX idx_services_delivery_date ON public.services(delivery_date);
CREATE INDEX idx_services_created_at ON public.services(created_at);

-- Enable Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for profiles
CREATE POLICY "Users can view own profile" ON public.profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- Create RLS policies for clients
CREATE POLICY "Users can view own clients" ON public.clients
    FOR SELECT USING (auth.uid() = profile_id);

CREATE POLICY "Users can insert own clients" ON public.clients
    FOR INSERT WITH CHECK (auth.uid() = profile_id);

CREATE POLICY "Users can update own clients" ON public.clients
    FOR UPDATE USING (auth.uid() = profile_id);

CREATE POLICY "Users can delete own clients" ON public.clients
    FOR DELETE USING (auth.uid() = profile_id);

-- Create RLS policies for services
CREATE POLICY "Users can view own services" ON public.services
    FOR SELECT USING (auth.uid() = profile_id);

CREATE POLICY "Users can insert own services" ON public.services
    FOR INSERT WITH CHECK (auth.uid() = profile_id);

CREATE POLICY "Users can update own services" ON public.services
    FOR UPDATE USING (auth.uid() = profile_id);

CREATE POLICY "Users can delete own services" ON public.services
    FOR DELETE USING (auth.uid() = profile_id);

-- Function to automatically update the updated_at column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc'::text, NOW());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_clients_updated_at
    BEFORE UPDATE ON public.clients
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_services_updated_at
    BEFORE UPDATE ON public.services
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to update client statistics
CREATE OR REPLACE FUNCTION update_client_stats()
RETURNS TRIGGER AS $$
BEGIN
    -- Update total_spent and last_service_date for the client
    IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
        UPDATE public.clients 
        SET 
            total_spent = (
                SELECT COALESCE(SUM(value), 0) 
                FROM public.services 
                WHERE client_id = NEW.client_id AND status = 'paid'
            ),
            last_service_date = (
                SELECT MAX(created_at::date)
                FROM public.services 
                WHERE client_id = NEW.client_id
            ),
            updated_at = TIMEZONE('utc'::text, NOW())
        WHERE id = NEW.client_id;
        RETURN NEW;
    END IF;
    
    IF TG_OP = 'DELETE' THEN
        UPDATE public.clients 
        SET 
            total_spent = (
                SELECT COALESCE(SUM(value), 0) 
                FROM public.services 
                WHERE client_id = OLD.client_id AND status = 'paid'
            ),
            last_service_date = (
                SELECT MAX(created_at::date)
                FROM public.services 
                WHERE client_id = OLD.client_id
            ),
            updated_at = TIMEZONE('utc'::text, NOW())
        WHERE id = OLD.client_id;
        RETURN OLD;
    END IF;
    
    RETURN NULL;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update client statistics
CREATE TRIGGER update_client_stats_trigger
    AFTER INSERT OR UPDATE OR DELETE ON public.services
    FOR EACH ROW EXECUTE FUNCTION update_client_stats();

-- Function to create user profile automatically
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, full_name)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email)
    );
    RETURN NEW;
END;
$$ language 'plpgsql' SECURITY DEFINER;

-- Create trigger for automatic profile creation
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Insert some sample data for development
DO $$
DECLARE
    sample_user_id UUID;
    client1_id UUID;
    client2_id UUID;
    client3_id UUID;
BEGIN
    -- Generate a sample user ID (this would normally be created by auth)
    sample_user_id := uuid_generate_v4();
    
    -- Insert sample profile
    INSERT INTO public.profiles (id, full_name, business_name, phone)
    VALUES (
        sample_user_id,
        'Roberta Silva',
        'Ateliê da Roberta',
        '11987654321'
    );
    
    -- Insert sample clients
    INSERT INTO public.clients (id, profile_id, name, phone, is_favorite, total_spent, last_service_date)
    VALUES 
        (uuid_generate_v4(), sample_user_id, 'Kaue', '11999999999', true, 420.00, '2024-06-03'),
        (uuid_generate_v4(), sample_user_id, 'Maria', '11888888888', false, 280.00, '2024-05-28'),
        (uuid_generate_v4(), sample_user_id, 'João', '11777777777', false, 150.00, '2024-05-20'),
        (uuid_generate_v4(), sample_user_id, 'Ana', '11666666666', true, 320.00, '2024-05-15')
    RETURNING id INTO client1_id;
    
    -- Get client IDs for services
    SELECT id INTO client1_id FROM public.clients WHERE name = 'Kaue' AND profile_id = sample_user_id;
    SELECT id INTO client2_id FROM public.clients WHERE name = 'Maria' AND profile_id = sample_user_id;
    SELECT id INTO client3_id FROM public.clients WHERE name = 'João' AND profile_id = sample_user_id;
    
    -- Insert sample services
    INSERT INTO public.services (profile_id, client_id, description, value, delivery_date, status)
    VALUES 
        (sample_user_id, client1_id, 'Vestido de noiva', 300.00, '2024-06-15', 'paid'),
        (sample_user_id, client1_id, 'Ajuste de vestido', 120.00, '2024-06-20', 'paid'),
        (sample_user_id, client2_id, 'Calça social', 150.00, '2024-06-10', 'delivered'),
        (sample_user_id, client2_id, 'Blusa básica', 80.00, '2024-06-05', 'paid'),
        (sample_user_id, client2_id, 'Saia midi', 120.00, '2024-06-25', 'progress'),
        (sample_user_id, client3_id, 'Camisa social', 100.00, '2024-06-12', 'progress'),
        (sample_user_id, client3_id, 'Bermuda', 50.00, '2024-05-30', 'paid');
        
END $$;
