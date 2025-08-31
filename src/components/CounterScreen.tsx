import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Minus, Package, Clock, User, ArrowUp, ArrowDown } from 'lucide-react';
import { usePieceCounters, usePieceCounterHistory, addPiecesToCounter, useClients } from '../hooks/useSupabase';

export const CounterScreen: React.FC = () => {
  const { counters, loading: countersLoading, refetch: refetchCounters } = usePieceCounters();
  const { history, loading: historyLoading, refetch: refetchHistory } = usePieceCounterHistory();
  const { clients } = useClients();
  const [selectedClient, setSelectedClient] = useState('');
  const [pieces, setPieces] = useState('');
  const [description, setDescription] = useState('');
  const [isAdding, setIsAdding] = useState(true);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedClient || !pieces) {
      alert('Por favor, selecione um cliente e informe a quantidade de peças.');
      return;
    }

    setLoading(true);
    
    try {
      const piecesAmount = isAdding ? parseInt(pieces) : -parseInt(pieces);
      await addPiecesToCounter({
        client_name: selectedClient,
        pieces_added: piecesAmount,
        description: description || (isAdding ? 'Peças adicionadas' : 'Peças removidas')
      });
      
      // Reset form
      setSelectedClient('');
      setPieces('');
      setDescription('');
      
      // Refresh data
      refetchCounters();
      refetchHistory();
      
    } catch (error) {
      console.error('Erro ao atualizar contador:', error);
      alert('Erro ao atualizar contador. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const quickAmounts = ['5', '10', '15', '20'];

  const getTotalPieces = () => {
    return counters.reduce((total, counter) => total + counter.total_pieces, 0);
  };

  if (countersLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500 mx-auto"></div>
          <p className="text-gray-500 mt-2">Carregando contadores...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm p-4 sticky top-0 z-10">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-800">Contador de Peças</h1>
          <div className="bg-green-100 rounded-full px-3 py-1">
            <span className="text-green-700 font-bold text-sm">
              {getTotalPieces()} peças
            </span>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-6">
        {/* Add/Remove Form */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl p-6 shadow-sm"
        >
          <h3 className="text-lg font-bold text-gray-800 mb-4">Atualizar Contador</h3>
          
          {/* Add/Remove Toggle */}
          <div className="flex bg-gray-100 rounded-xl p-1 mb-4">
            <button
              onClick={() => setIsAdding(true)}
              className={`flex-1 py-2 px-4 rounded-lg font-medium transition-all ${
                isAdding 
                  ? 'bg-green-500 text-white shadow-sm' 
                  : 'text-gray-600'
              }`}
            >
              <Plus className="w-4 h-4 inline mr-2" />
              Adicionar
            </button>
            <button
              onClick={() => setIsAdding(false)}
              className={`flex-1 py-2 px-4 rounded-lg font-medium transition-all ${
                !isAdding 
                  ? 'bg-red-500 text-white shadow-sm' 
                  : 'text-gray-600'
              }`}
            >
              <Minus className="w-4 h-4 inline mr-2" />
              Remover
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Client Select */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                <User className="w-4 h-4 inline mr-2" />
                Cliente
              </label>
              <select
                value={selectedClient}
                onChange={(e) => setSelectedClient(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
                required
              >
                <option value="">Selecione um cliente</option>
                {clients.map((client) => (
                  <option key={client.id} value={client.name}>
                    {client.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Pieces Input */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                <Package className="w-4 h-4 inline mr-2" />
                Quantidade de Peças
              </label>
              <input
                type="number"
                min="1"
                value={pieces}
                onChange={(e) => setPieces(e.target.value)}
                placeholder="Ex: 10"
                className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
                required
              />
              
              {/* Quick Amounts */}
              <div className="flex gap-2 mt-2">
                {quickAmounts.map((amount) => (
                  <button
                    key={amount}
                    type="button"
                    onClick={() => setPieces(amount)}
                    className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm hover:bg-gray-200 transition-colors"
                  >
                    {amount} peças
                  </button>
                ))}
              </div>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Descrição (opcional)</label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Ex: Entrega do pedido X"
                className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className={`w-full p-3 rounded-xl font-semibold text-white transition-colors ${
                isAdding 
                  ? 'bg-green-500 hover:bg-green-600' 
                  : 'bg-red-500 hover:bg-red-600'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {loading ? 'Salvando...' : (isAdding ? 'Adicionar Peças' : 'Remover Peças')}
            </button>
          </form>
        </motion.div>

        {/* Counters by Client */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="space-y-4"
        >
          <h3 className="text-lg font-bold text-gray-800">Contadores por Cliente</h3>
          
          {counters.length > 0 ? (
            <div className="space-y-3">
              {counters.map((counter, index) => (
                <motion.div
                  key={counter.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-white rounded-xl p-4 shadow-sm"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-gray-800">{counter.client_name}</h4>
                      <p className="text-gray-600 text-sm">
                        Atualizado em {new Date(counter.updated_at).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-green-600">{counter.total_pieces}</p>
                      <p className="text-gray-500 text-sm">peças</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Package className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">Ainda não há contadores</p>
              <p className="text-gray-400 text-sm">Adicione peças para começar</p>
            </div>
          )}
        </motion.div>

        {/* Recent History */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="space-y-4"
        >
          <h3 className="text-lg font-bold text-gray-800 flex items-center">
            <Clock className="w-5 h-5 mr-2" />
            Histórico Recente
          </h3>
          
          {historyLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-gray-200 animate-pulse rounded-xl h-16"></div>
              ))}
            </div>
          ) : history.length > 0 ? (
            <div className="space-y-3">
              {history.slice(0, 10).map((entry, index) => (
                <motion.div
                  key={entry.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="bg-white rounded-xl p-4 shadow-sm"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className={`p-2 rounded-full ${
                        entry.pieces_added > 0 ? 'bg-green-100' : 'bg-red-100'
                      }`}>
                        {entry.pieces_added > 0 ? (
                          <ArrowUp className="w-4 h-4 text-green-600" />
                        ) : (
                          <ArrowDown className="w-4 h-4 text-red-600" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-gray-800">{entry.client_name}</p>
                        <p className="text-gray-600 text-sm">{entry.description}</p>
                        <p className="text-gray-500 text-xs">
                          {new Date(entry.created_at).toLocaleDateString('pt-BR', {
                            day: '2-digit',
                            month: '2-digit',
                            year: '2-digit',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`text-lg font-bold ${
                        entry.pieces_added > 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {entry.pieces_added > 0 ? '+' : ''}{entry.pieces_added}
                      </p>
                      <p className="text-gray-500 text-sm">peças</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Clock className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">Ainda não há histórico</p>
              <p className="text-gray-400 text-sm">Adicione ou remova peças para ver o histórico</p>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};
