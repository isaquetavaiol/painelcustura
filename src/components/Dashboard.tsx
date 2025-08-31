import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, Users, Scissors } from 'lucide-react';
import { QuickActions } from './QuickActions';
import { ComparisonCard } from './ComparisonCard';
import { useServices, useClients, useSupabase } from '../hooks/useSupabase';

export const Dashboard: React.FC = () => {
  const { user } = useSupabase();
  const { services } = useServices();
  const { clients } = useClients();

  const currentHour = new Date().getHours();
  const greeting = currentHour < 12 ? 'Bom dia' : currentHour < 18 ? 'Boa tarde' : 'Boa noite';

  // Calculate today's earnings
  const today = new Date().toISOString().split('T')[0];
  const todayServices = services.filter(service => 
    service.created_at.split('T')[0] === today && service.status === 'paid'
  );
  const todayEarnings = todayServices.reduce((sum, service) => sum + service.value, 0);

  // Calculate pending services
  const pendingServices = services.filter(service => service.status === 'progress');

  // Calculate this month's earnings
  const thisMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
  const monthlyServices = services.filter(service => 
    service.created_at.slice(0, 7) === thisMonth && service.status === 'paid'
  );
  const monthlyEarnings = monthlyServices.reduce((sum, service) => sum + service.value, 0);

  return (
    <div className="p-4 space-y-6">
      {/* Header */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-green-500 to-green-600 rounded-2xl p-6 text-white"
      >
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">{greeting}, {user?.user_metadata?.full_name || 'Costureira'}! ✂️</h1>
            <p className="text-green-100 mt-1">
              {pendingServices.length} serviços pendentes · <span className="font-semibold">R$ {todayEarnings.toFixed(2)}</span> hoje
            </p>
          </div>
          <div className="bg-white/20 rounded-full p-3">
            <Scissors className="w-6 h-6" />
          </div>
        </div>
      </motion.div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 gap-4">
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-xl p-4 shadow-sm"
        >
          <div className="flex items-center space-x-3">
            <div className="bg-blue-100 rounded-full p-2">
              <Users className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-gray-600 text-sm">Clientes</p>
              <p className="text-lg font-bold">{clients.length}</p>
            </div>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-xl p-4 shadow-sm"
        >
          <div className="flex items-center space-x-3">
            <div className="bg-green-100 rounded-full p-2">
              <TrendingUp className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-gray-600 text-sm">Este mês</p>
              <p className="text-lg font-bold">R$ {monthlyEarnings.toFixed(2)}</p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Comparison Card */}
      <ComparisonCard services={services} />

      {/* Quick Actions */}
      <QuickActions clients={clients} />
    </div>
  );
};
