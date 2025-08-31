import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Dashboard } from './components/Dashboard';
import { ServiceForm } from './components/ServiceForm';
import { ClientsScreen } from './components/ClientsScreen';
import { CounterScreen } from './components/CounterScreen';
import { BottomNavigation } from './components/BottomNavigation';
import { AuthScreen } from './components/AuthScreen';
import { useSupabase } from './hooks/useSupabase';

function App(): JSX.Element {
  const { user, loading } = useSupabase();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500 mx-auto"></div>
          <p className="text-gray-500 mt-2">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <AuthScreen />;
  }

  return (
    <Router>
      <div className="min-h-screen bg-gray-50 max-w-md mx-auto relative">
        <div className="pb-24">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/service" element={<ServiceForm />} />
            <Route path="/counter" element={<CounterScreen />} />
            <Route path="/clients" element={<ClientsScreen />} />
          </Routes>
        </div>
        <BottomNavigation />
      </div>
    </Router>
  );
}

export default App;
