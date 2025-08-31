import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Home, Plus, Users, Package } from 'lucide-react';
import { motion } from 'framer-motion';

export const BottomNavigation: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const navItems = [
    { path: '/', icon: Home, label: 'Dashboard' },
    { path: '/service', icon: Plus, label: 'Serviço' },
    { path: '/counter', icon: Package, label: 'Contador' },
    { path: '/clients', icon: Users, label: 'Clientes' }
  ];

  const activeIndex = navItems.findIndex(item => item.path === location.pathname);

  return (
    <div className="fixed bottom-0 left-1/2 transform -translate-x-1/2 w-full max-w-md">
      {/* Ilha Dinâmica */}
      <div className="relative bg-white mx-4 mb-4 rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
        {/* Indicador Dinâmico */}
        <motion.div
          className="absolute top-1 h-1 bg-green-500 rounded-full"
          initial={false}
          animate={{
            left: `${(activeIndex / navItems.length) * 100}%`,
            width: `${100 / navItems.length}%`
          }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
        />
        
        {/* Barra de Fundo do Item Ativo */}
        <motion.div
          className="absolute inset-y-0 bg-green-50 rounded-xl mx-1 my-1"
          initial={false}
          animate={{
            left: `${(activeIndex / navItems.length) * 100}%`,
            width: `${100 / navItems.length - 2}%`
          }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
        />

        {/* Navegação */}
        <div className="relative flex justify-around py-3">
          {navItems.map((item, index) => {
            const isActive = location.pathname === item.path;
            return (
              <motion.button
                key={item.path}
                onClick={() => navigate(item.path)}
                className="flex flex-col items-center space-y-1 py-2 px-3 rounded-xl transition-colors relative z-10"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <motion.div
                  animate={{
                    scale: isActive ? 1.1 : 1,
                    rotateY: isActive ? 360 : 0
                  }}
                  transition={{ duration: 0.3 }}
                >
                  <item.icon 
                    className={`w-6 h-6 ${
                      isActive ? 'text-green-600' : 'text-gray-500'
                    }`} 
                  />
                </motion.div>
                <motion.span 
                  className={`text-xs font-medium ${
                    isActive ? 'text-green-600' : 'text-gray-500'
                  }`}
                  animate={{
                    scale: isActive ? 1.05 : 1,
                    fontWeight: isActive ? 600 : 500
                  }}
                >
                  {item.label}
                </motion.span>

                {/* Indicador de Ponto Ativo */}
                {isActive && (
                  <motion.div
                    className="absolute -top-1 w-1 h-1 bg-green-500 rounded-full"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.1 }}
                  />
                )}
              </motion.button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
