/*
# Contador de Peças - Sistema de Contagem
Sistema para contagem de peças entregues aos clientes com histórico completo

## Query Description: 
Esta operação criará um sistema de contagem de peças para acompanhar entregas aos clientes. 
Permite adicionar/remover peças com histórico detalhado por data. É uma funcionalidade 
completamente nova e não afeta dados existentes.

## Metadata:
- Schema-Category: "Safe"
- Impact-Level: "Low"
- Requires-Backup: false
- Reversible: true

## Structure Details:
- Nova tabela: piece_counters (contadores de peças por cliente)
- Nova tabela: piece_counter_history (histórico de movimentações)
- Triggers para atualização automática de contadores
- Políticas RLS para isolamento por usuário

## Security Implications:
- RLS Status: Enabled
- Policy Changes: Yes
- Auth Requirements: Usuário autenticado

## Performance Impact:
- Indexes: Adicionados em campos de consulta frequente
- Triggers: Trigger para atualização automática de contadores
- Estimated Impact: Mínimo - operações simples de CRUD
*/

-- Create piece_counters table
CREATE TABLE IF NOT EXISTS piece_counters (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    client_name TEXT NOT NULL,
    total_pieces INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create piece_counter_history table
CREATE TABLE IF NOT EXISTS piece_counter_history (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    counter_id UUID NOT NULL REFERENCES piece_counters(id) ON DELETE CASCADE,
    client_name TEXT NOT NULL,
    pieces_added INTEGER NOT NULL, -- Positive for add, negative for remove
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_piece_counters_user_id ON piece_counters(user_id);
CREATE INDEX IF NOT EXISTS idx_piece_counters_client_id ON piece_counters(client_id);
CREATE INDEX IF NOT EXISTS idx_piece_counter_history_user_id ON piece_counter_history(user_id);
CREATE INDEX IF NOT EXISTS idx_piece_counter_history_counter_id ON piece_counter_history(counter_id);
CREATE INDEX IF NOT EXISTS idx_piece_counter_history_created_at ON piece_counter_history(created_at DESC);

-- Enable RLS
ALTER TABLE piece_counters ENABLE ROW LEVEL SECURITY;
ALTER TABLE piece_counter_history ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for piece_counters
CREATE POLICY "Users can view their own piece counters" ON piece_counters
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own piece counters" ON piece_counters
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own piece counters" ON piece_counters
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own piece counters" ON piece_counters
    FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for piece_counter_history
CREATE POLICY "Users can view their own piece counter history" ON piece_counter_history
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own piece counter history" ON piece_counter_history
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create function to update counter total
CREATE OR REPLACE FUNCTION update_piece_counter_total()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE piece_counters 
    SET 
        total_pieces = total_pieces + NEW.pieces_added,
        updated_at = NOW()
    WHERE id = NEW.counter_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically update counter totals
CREATE TRIGGER update_piece_counter_total_trigger
    AFTER INSERT ON piece_counter_history
    FOR EACH ROW
    EXECUTE FUNCTION update_piece_counter_total();

-- Create function to get or create piece counter
CREATE OR REPLACE FUNCTION get_or_create_piece_counter(
    p_user_id UUID,
    p_client_id UUID,
    p_client_name TEXT
) RETURNS UUID AS $$
DECLARE
    counter_id UUID;
BEGIN
    -- Try to get existing counter
    SELECT id INTO counter_id 
    FROM piece_counters 
    WHERE user_id = p_user_id AND client_id = p_client_id;
    
    -- If not found, create new counter
    IF counter_id IS NULL THEN
        INSERT INTO piece_counters (user_id, client_id, client_name, total_pieces)
        VALUES (p_user_id, p_client_id, p_client_name, 0)
        RETURNING id INTO counter_id;
    END IF;
    
    RETURN counter_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
