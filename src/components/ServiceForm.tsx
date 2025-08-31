import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, Calendar, DollarSign, User, FileText, Check } from 'lucide-react';
import { ClientChips } from './ClientChips';
import { createService } from '../hooks/useSupabase';

interface ServiceFormData {
  client: string;
  description: string;
  value: string;
  deliveryDate: string;
  status: 'progress' | 'delivered' | 'paid';
}

export const ServiceForm: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<ServiceFormData>({
    client: '',
    description: '',
    value: '',
    deliveryDate: new Date().toISOString().split('T')[0],
    status: 'progress'
  });

  const [showClientSuggestions, setShowClientSuggestions] = useState(false);

  const clientSuggestions = [
    'Kaue (Último: 03/06)',
    'Maria (Último: 28/05)',
    'João (Último: 20/05)',
    'Ana (Último: 15/05)',
    'Carla (Último: 10/05)'
  ];

  const serviceSuggestions = [
    'Vestido social',
    'Calça ajustada',
    'Blusa básica',
    'Saia midi',
    'Blazer feminino'
  ];

  const quickValues = ['80', '120', '150', '200'];

  useEffect(() => {
    if (location.state?.prefilledClient) {
      setFormData(prev => ({
        ...prev,
        client: location.state.prefilledClient,
        description: location.state.prefilledService || ''
      }));
    }
  }, [location.state]);

  const handleClientSelect = (clientName: string) => {
    const cleanName = clientName.split(' (')[0];
    setFormData(prev => ({ ...prev, client: cleanName }));
    setShowClientSuggestions(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.client || !formData.description || !formData.value) {
      alert('Por favor, preencha todos os campos obrigatórios.');
      return;
    }

    setLoading(true);
    
    try {
      await createService({
        client_name: formData.client,
        description: formData.description,
        value: parseFloat(formData.value),
        delivery_date: formData.deliveryDate,
        status: formData.status
      });
      
      navigate('/', { replace: true });
    } catch (error) {
      console.error('Erro ao salvar serviço:', error);
      alert('Erro ao salvar serviço. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm p-4">
        <div className="flex items-center space-x-4">
          <button 
            onClick={() => navigate('/')}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-xl font-bold text-gray-800">Novo Serviço</h1>
        </div>
      </div>

      <div className="p-4 space-y-6">
        {/* Recent Clients */}
        <ClientChips onClientSelect={handleClientSelect} />

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Client Input */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-2"
          >
            <label className="block text-sm font-medium text-gray-700">
              <User className="w-4 h-4 inline mr-2" />
              Cliente *
            </label>
            <div className="relative">
              <input
                type="text"
                value={formData.client}
                onChange={(e) => {
                  setFormData(prev => ({ ...prev, client: e.target.value }));
                  setShowClientSuggestions(e.target.value.length > 0);
                }}
                onFocus={() => setShowClientSuggestions(formData.client.length > 0)}
                placeholder="Digite o nome..."
                className="w-full p-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
                autoFocus
                required
              />
              
              {showClientSuggestions && (
                <motion.div 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-48 overflow-y-auto"
                >
                  {clientSuggestions
                    .filter(client => 
                      client.toLowerCase().includes(formData.client.toLowerCase())
                    )
                    .map((client, index) => (
                      <button
                        key={index}
                        type="button"
                        onClick={() => handleClientSelect(client)}
                        className="w-full p-3 text-left hover:bg-gray-50 first:rounded-t-xl last:rounded-b-xl"
                      >
                        {client}
                      </button>
                    ))
                  }
                </motion.div>
              )}
            </div>
          </motion.div>

          {/* Description Input */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="space-y-2"
          >
            <label className="block text-sm font-medium text-gray-700">
              <FileText className="w-4 h-4 inline mr-2" />
              Descrição *
            </label>
            <input
              type="text"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Ex: Vestido de noiva - 3 ajustes"
              className="w-full p-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
              required
            />
            
            {/* Service Suggestions */}
            <div className="flex flex-wrap gap-2 mt-2">
              {serviceSuggestions.map((service, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, description: service }))}
                  className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm hover:bg-gray-200 transition-colors"
                >
                  {service}
                </button>
              ))}
            </div>
          </motion.div>

          {/* Value Input */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="space-y-2"
          >
            <label className="block text-sm font-medium text-gray-700">
              <DollarSign className="w-4 h-4 inline mr-2" />
              Valor (R$) *
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={formData.value}
              onChange={(e) => setFormData(prev => ({ ...prev, value: e.target.value }))}
              placeholder="0,00"
              className="w-full p-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
              required
            />
            
            {/* Quick Values */}
            <div className="flex gap-2 mt-2">
              {quickValues.map((value, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, value }))}
                  className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm hover:bg-green-200 transition-colors"
                >
                  R$ {value}
                </button>
              ))}
            </div>
          </motion.div>

          {/* Date Input */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="space-y-2"
          >
            <label className="block text-sm font-medium text-gray-700">
              <Calendar className="w-4 h-4 inline mr-2" />
              Data de Entrega
            </label>
            <input
              type="date"
              value={formData.deliveryDate}
              onChange={(e) => setFormData(prev => ({ ...prev, deliveryDate: e.target.value }))}
              className="w-full p-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </motion.div>

          {/* Status Selector */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="space-y-2"
          >
            <label className="block text-sm font-medium text-gray-700">Status</label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { value: 'progress', label: 'Em andamento', color: 'bg-gray-500' },
                { value: 'delivered', label: 'Entregue', color: 'bg-blue-500' },
                { value: 'paid', label: 'Pago', color: 'bg-green-500' }
              ].map((status) => (
                <button
                  key={status.value}
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, status: status.value as any }))}
                  className={`p-3 rounded-xl text-white text-sm font-medium transition-all ${
                    formData.status === status.value 
                      ? status.color + ' ring-2 ring-offset-2 ring-gray-400' 
                      : status.color + ' opacity-60'
                  }`}
                >
                  {status.label}
                </button>
              ))}
            </div>
          </motion.div>

          {/* Submit Button */}
          <motion.button
            type="submit"
            disabled={loading}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="w-full bg-green-500 text-white p-4 rounded-xl font-semibold hover:bg-green-600 transition-colors flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Check className="w-5 h-5" />
            <span>{loading ? 'Salvando...' : 'Salvar e Atualizar Ganho'}</span>
          </motion.button>
        </form>
      </div>
    </div>
  );
};
