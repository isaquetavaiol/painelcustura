import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Database types
export interface Profile {
  id: string;
  full_name: string | null;
  business_name: string | null;
  phone: string | null;
  created_at: string;
  updated_at: string;
}

export interface Client {
  id: string;
  user_id: string;
  name: string;
  phone: string | null;
  email: string | null;
  is_favorite: boolean;
  total_spent: number;
  last_service_date: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface Service {
  id: string;
  user_id: string;
  client_id: string;
  client_name: string;
  description: string;
  value: number;
  delivery_date: string | null;
  status: 'progress' | 'delivered' | 'paid';
  created_at: string;
  updated_at: string;
}

export interface PieceCounter {
  id: string;
  user_id: string;
  client_id: string;
  client_name: string;
  total_pieces: number;
  created_at: string;
  updated_at: string;
}

export interface PieceCounterHistory {
  id: string;
  user_id: string;
  counter_id: string;
  client_name: string;
  pieces_added: number;
  description: string | null;
  created_at: string;
}
