import React from 'react';
import { motion } from 'framer-motion';
import { Heart, TrendingUp } from 'lucide-react';
import { useClients } from '../hooks/useSupabase';

interface ClientChipsProps {
  onClientSelect: (clientName: string) => void;
}

export const ClientChips: React.FC<ClientChipsProps> = ({ onClientSelect }) => {
  const { clients, loading } = useClients();

  // Get top 4 clients by total spent, favorites first
  const frequentClients = clients
    .sort((a, b) => {
      if (a.is_favorite && !b.is_favorite) return -1;
      if (!a.is_favorite && b.is_favorite) return 1;
      return b.total_spent - a.total_spent;
    })
    .slice(0, 4);

  if (loading) {
    return (
      <div className="space-y-3">
        <h3 className="text-lg font-bold text-gray-800 flex items-center">
          <TrendingUp className="w-5 h-5 mr-2 text-green-500" />
          Clientes Frequentes
        </h3>
        <div className="flex flex-wrap gap-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-gray-200 animate-pulse rounded-xl p-3 w-24 h-16"></div>
          ))}
        </div>
      </div>
    );
  }

  if (frequentClients.length === 0) {
    return (
      <div className="space-y-3">
        <h3 className="text-lg font-bold text-gray-800 flex items-center">
          <TrendingUp className="w-5 h-5 mr-2 text-green-500" />
          Clientes Frequentes
        </h3>
        <p className="text-gray-500 text-sm">
          Cadastre alguns serviços para ver seus clientes favoritos aqui
        </p>
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-3"
    >
      <h3 className="text-lg font-bold text-gray-800 flex items-center">
        <TrendingUp className="w-5 h-5 mr-2 text-green-500" />
        Clientes Frequentes
      </h3>
      
      <div className="flex flex-wrap gap-2">
        {frequentClients.map((client, index) => (
          <motion.button
            key={client.id}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.1 }}
            onClick={() => onClientSelect(client.name)}
            className="bg-white border border-gray-200 rounded-xl p-3 hover:border-green-400 hover:bg-green-50 transition-all shadow-sm"
          >
            <div className="flex items-center space-x-2">
              {client.is_favorite && (
                <Heart className="w-4 h-4 text-red-500 fill-current" />
              )}
              <div className="text-left">
                <p className="font-semibold text-gray-800 text-sm">{client.name}</p>
                <p className="text-green-600 font-medium text-xs">
                  R$ {client.total_spent.toFixed(2)}
                </p>
              </div>
            </div>
            {client.last_service_date && (
              <p className="text-gray-500 text-xs mt-1 text-left">
                Último: {new Date(client.last_service_date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
              </p>
            )}
          </motion.button>
        ))}
      </div>
    </motion.div>
  );
};
