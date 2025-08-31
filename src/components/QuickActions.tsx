import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Plus, Star } from 'lucide-react';
import { Client } from '../lib/supabase';

interface QuickActionsProps {
  clients: Client[];
}

export const QuickActions: React.FC<QuickActionsProps> = ({ clients }) => {
  const navigate = useNavigate();

  // Get top clients by total spent, favorites first
  const topClients = clients
    .sort((a, b) => {
      if (a.is_favorite && !b.is_favorite) return -1;
      if (!a.is_favorite && b.is_favorite) return 1;
      return b.total_spent - a.total_spent;
    })
    .slice(0, 2);

  const handleQuickAdd = (clientName: string) => {
    navigate('/service', { 
      state: { 
        prefilledClient: clientName
      } 
    });
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4 }}
      className="space-y-4"
    >
      <h3 className="text-lg font-bold text-gray-800">Ações Rápidas</h3>
      
      <div className="space-y-3">
        {topClients.map((client, index) => (
          <motion.button
            key={client.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 + index * 0.1 }}
            onClick={() => handleQuickAdd(client.name)}
            className="w-full bg-gradient-to-r from-amber-400 to-yellow-500 rounded-xl p-4 text-left shadow-md hover:shadow-lg transition-shadow"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="bg-white/20 rounded-full p-2">
                  <Plus className="w-5 h-5 text-white" />
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="text-white font-bold">{client.name}</span>
                    {client.is_favorite && (
                      <Star className="w-4 h-4 text-white fill-current" />
                    )}
                  </div>
                  <p className="text-yellow-100 text-sm">Novo serviço</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-white text-sm opacity-90">Total</p>
                <p className="text-white font-semibold">R$ {client.total_spent.toFixed(2)}</p>
              </div>
            </div>
          </motion.button>
        ))}

        <motion.button
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.7 }}
          onClick={() => navigate('/service')}
          className="w-full bg-white border-2 border-dashed border-gray-300 rounded-xl p-4 text-center hover:border-green-400 transition-colors"
        >
          <div className="flex items-center justify-center space-x-2 text-gray-600">
            <Plus className="w-5 h-5" />
            <span className="font-medium">Novo Serviço</span>
          </div>
        </motion.button>
      </div>
    </motion.div>
  );
};
