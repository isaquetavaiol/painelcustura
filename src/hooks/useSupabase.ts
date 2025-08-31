import { useState, useEffect } from 'react';
import { supabase, type Client, type Service, type PieceCounter, type PieceCounterHistory } from '../lib/supabase';

export const useSupabase = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  return { user, loading };
};

export const useClients = () => {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchClients = async () => {
    try {
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .order('last_service_date', { ascending: false, nullsFirst: false });

      if (error) throw error;
      setClients(data || []);
    } catch (error) {
      console.error('Error fetching clients:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClients();
  }, []);

  return { clients, loading, refetch: fetchClients };
};

export const useServices = () => {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchServices = async () => {
    try {
      const { data, error } = await supabase
        .from('services')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setServices(data || []);
    } catch (error) {
      console.error('Error fetching services:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchServices();
  }, []);

  return { services, loading, refetch: fetchServices };
};

export const usePieceCounters = () => {
  const [counters, setCounters] = useState<PieceCounter[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCounters = async () => {
    try {
      const { data, error } = await supabase
        .from('piece_counters')
        .select('*')
        .order('updated_at', { ascending: false });

      if (error) throw error;
      setCounters(data || []);
    } catch (error) {
      console.error('Error fetching piece counters:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCounters();
  }, []);

  return { counters, loading, refetch: fetchCounters };
};

export const usePieceCounterHistory = (counterId?: string) => {
  const [history, setHistory] = useState<PieceCounterHistory[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchHistory = async () => {
    try {
      let query = supabase
        .from('piece_counter_history')
        .select('*')
        .order('created_at', { ascending: false });

      if (counterId) {
        query = query.eq('counter_id', counterId);
      }

      const { data, error } = await query;

      if (error) throw error;
      setHistory(data || []);
    } catch (error) {
      console.error('Error fetching piece counter history:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [counterId]);

  return { history, loading, refetch: fetchHistory };
};

export const createService = async (serviceData: {
  client_name: string;
  description: string;
  value: number;
  delivery_date?: string;
  status: 'progress' | 'delivered' | 'paid';
}) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    // Get or create client
    const { data: clientId, error: clientError } = await supabase
      .rpc('get_or_create_client', {
        p_user_id: user.id,
        p_client_name: serviceData.client_name
      });

    if (clientError) throw clientError;

    // Create service
    const { data, error } = await supabase
      .from('services')
      .insert({
        user_id: user.id,
        client_id: clientId,
        client_name: serviceData.client_name,
        description: serviceData.description,
        value: serviceData.value,
        delivery_date: serviceData.delivery_date,
        status: serviceData.status
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error creating service:', error);
    throw error;
  }
};

export const addPiecesToCounter = async (data: {
  client_name: string;
  pieces_added: number;
  description?: string;
}) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    // Get or create client first
    const { data: clientId, error: clientError } = await supabase
      .rpc('get_or_create_client', {
        p_user_id: user.id,
        p_client_name: data.client_name
      });

    if (clientError) throw clientError;

    // Get or create counter
    const { data: counterId, error: counterError } = await supabase
      .rpc('get_or_create_piece_counter', {
        p_user_id: user.id,
        p_client_id: clientId,
        p_client_name: data.client_name
      });

    if (counterError) throw counterError;

    // Add history entry (trigger will update counter automatically)
    const { data: historyData, error: historyError } = await supabase
      .from('piece_counter_history')
      .insert({
        user_id: user.id,
        counter_id: counterId,
        client_name: data.client_name,
        pieces_added: data.pieces_added,
        description: data.description
      })
      .select()
      .single();

    if (historyError) throw historyError;
    return historyData;
  } catch (error) {
    console.error('Error adding pieces to counter:', error);
    throw error;
  }
};

export const updateClientFavorite = async (clientId: string, isFavorite: boolean) => {
  try {
    const { error } = await supabase
      .from('clients')
      .update({ is_favorite: isFavorite })
      .eq('id', clientId);

    if (error) throw error;
  } catch (error) {
    console.error('Error updating client favorite:', error);
    throw error;
  }
};
