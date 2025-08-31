import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Search, MessageCircle, Plus, Star } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useClients, updateClientFavorite } from '../hooks/useSupabase';

export const ClientsScreen: React.FC = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const { clients, loading, refetch } = useClients();

  const filteredClients = clients.filter(client =>
    client.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatusColor = (client: any) => {
    // Since we don't have status in clients table, we'll use a simple logic
    if (client.total_spent > 300) return 'bg-green-500';
    if (client.total_spent > 150) return 'bg-blue-500';
    return 'bg-gray-500';
  };

  const getStatusLabel = (client: any) => {
    if (client.total_spent > 300) return 'VIP';
    if (client.total_spent > 150) return 'Regular';
    return 'Novo';
  };

  const handleNewService = (clientName: string) => {
    navigate('/service', { 
      state: { 
        prefilledClient: clientName 
      } 
    });
  };

  const handleWhatsApp = (phone: string, clientName: string) => {
    const message = encodeURIComponent(`Olá ${clientName}! Tudo bem? Gostaria de falar sobre seu próximo serviço de costura.`);
    window.open(`https://wa.me/55${phone}?text=${message}`, '_blank');
  };

  const handleToggleFavorite = async (clientId: string, currentFavorite: boolean) => {
    try {
      await updateClientFavorite(clientId, !currentFavorite);
      refetch();
    } catch (error) {
      console.error('Error updating favorite:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500 mx-auto"></div>
          <p className="text-gray-500 mt-2">Carregando clientes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="bg-white shadow-sm p-4 sticky top-0 z-10">
        <h1 className="text-2xl font-bold text-gray-800 mb-4">Meus Clientes</h1>
        
        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar cliente..."
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
          />
        </div>
      </div>

      <div className="p-4">
        {/* Client List */}
        <div className="space-y-3">
          {filteredClients.map((client, index) => (
            <motion.div
              key={client.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm"
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-1">
                    <h3 className="font-bold text-gray-800">{client.name}</h3>
                    <button
                      onClick={() => handleToggleFavorite(client.id, client.is_favorite)}
                      className="p-1"
                    >
                      <Star 
                        className={`w-4 h-4 ${
                          client.is_favorite 
                            ? 'text-yellow-500 fill-current' 
                            : 'text-gray-300'
                        }`} 
                      />
                    </button>
                  </div>
                  <p className="text-gray-600 text-sm mb-1">
                    {client.last_service_date ? 
                      `Último serviço: ${new Date(client.last_service_date).toLocaleDateString('pt-BR')}` :
                      'Ainda não há serviços'
                    }
                  </p>
                  <div className="flex items-center space-x-3">
                    <span className="font-semibold text-green-600">
                      R$ {client.total_spent.toFixed(2)}
                    </span>
                    <span className={`px-2 py-1 rounded-full text-xs text-white ${getStatusColor(client)}`}>
                      {getStatusLabel(client)}
                    </span>
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleNewService(client.name)}
                    className="p-2 bg-green-100 text-green-600 rounded-full hover:bg-green-200 transition-colors"
                    title="Registrar novo serviço"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                  
                  {client.phone && (
                    <button
                      onClick={() => handleWhatsApp(client.phone!, client.name)}
                      className="p-2 bg-green-500 text-white rounded-full hover:bg-green-600 transition-colors"
                      title="Enviar WhatsApp"
                    >
                      <MessageCircle className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {filteredClients.length === 0 && !loading && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12"
          >
            <Search className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">
              {searchQuery ? 'Nenhum cliente encontrado' : 'Ainda não há clientes'}
            </p>
            <p className="text-gray-400 text-sm">
              {searchQuery ? 'Tente buscar por outro termo' : 'Cadastre seu primeiro serviço para começar'}
            </p>
          </motion.div>
        )}
      </div>
    </div>
  );
};
