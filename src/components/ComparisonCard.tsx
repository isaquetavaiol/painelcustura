import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { Service } from '../lib/supabase';

interface ComparisonCardProps {
  services: Service[];
}

export const ComparisonCard: React.FC<ComparisonCardProps> = ({ services }) => {
  // Calculate daily earnings for the last 7 days
  const today = new Date();
  const weekData = [];
  
  for (let i = 6; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(today.getDate() - i);
    const dateString = date.toISOString().split('T')[0];
    
    const dayServices = services.filter(service => 
      service.created_at.split('T')[0] === dateString && service.status === 'paid'
    );
    const dayEarnings = dayServices.reduce((sum, service) => sum + service.value, 0);
    weekData.push(dayEarnings);
  }

  const todayEarnings = weekData[weekData.length - 1];
  const yesterdayEarnings = weekData[weekData.length - 2] || 0;
  const maxValue = Math.max(...weekData, 100); // Minimum height for visualization

  // Calculate percentage change
  let percentageChange = 0;
  let isPositive = true;
  
  if (yesterdayEarnings > 0) {
    percentageChange = ((todayEarnings - yesterdayEarnings) / yesterdayEarnings) * 100;
    isPositive = percentageChange >= 0;
  } else if (todayEarnings > 0) {
    percentageChange = 100;
    isPositive = true;
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="bg-white rounded-2xl p-6 shadow-sm"
    >
      <h3 className="text-lg font-bold text-gray-800 mb-4">Comparação Rápida</h3>
      
      {/* Today vs Yesterday */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <p className="text-2xl font-bold text-gray-800">R$ {todayEarnings.toFixed(2)}</p>
          <p className="text-gray-600 text-sm">Hoje</p>
        </div>
        <div className="text-right">
          <div className={`flex items-center ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
            {isPositive ? (
              <TrendingUp className="w-4 h-4 mr-1" />
            ) : (
              <TrendingDown className="w-4 h-4 mr-1" />
            )}
            <span className="font-semibold">
              {isPositive ? '+' : ''}{percentageChange.toFixed(0)}%
            </span>
          </div>
          <p className="text-gray-600 text-sm">vs ontem (R$ {yesterdayEarnings.toFixed(2)})</p>
        </div>
      </div>

      {/* Mini Chart */}
      <div className="space-y-2">
        <p className="text-sm text-gray-600 font-medium">Últimos 7 dias</p>
        <div className="flex items-end space-x-1 h-16">
          {weekData.map((value, index) => (
            <motion.div
              key={index}
              initial={{ height: 0 }}
              animate={{ height: `${(value / maxValue) * 100}%` }}
              transition={{ delay: 0.5 + index * 0.1 }}
              className={`flex-1 rounded-t ${
                index === weekData.length - 1 
                  ? 'bg-green-500' 
                  : 'bg-gray-200'
              }`}
              style={{ minHeight: '8px' }}
            />
          ))}
        </div>
        <div className="flex justify-between text-xs text-gray-500">
          {['S', 'T', 'Q', 'Q', 'S', 'S', 'D'].map((day, index) => (
            <span key={index} className="w-full text-center">{day}</span>
          ))}
        </div>
      </div>
    </motion.div>
  );
};
