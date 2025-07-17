import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { Header } from './components/Header';
import { HomePage } from './pages/HomePage';
import { NewPage } from './pages/NewPage';
import { SalePage } from './pages/SalePage';
import { AllProductsPage } from './pages/AllProductsPage';
import { AdminLoginPage } from './pages/AdminLoginPage';
import { AdminDashboard } from './pages/AdminDashboard';
import { ProtectedRoute } from './components/ProtectedRoute';
import { TelegramWebAppInit } from './components/TelegramWebAppInit';

function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <Router>
          <TelegramWebAppInit />
          <div className="min-h-screen bg-gray-50">
            <Header />
            <main>
              <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/new" element={<NewPage />} />
                <Route path="/sale" element={<SalePage />} />
                <Route path="/all" element={<AllProductsPage />} />
                <Route path="/admin/login" element={<AdminLoginPage />} />
                <Route 
                  path="/admin/dashboard" 
                  element={
                    <ProtectedRoute>
                      <AdminDashboard />
                    </ProtectedRoute>
                  } 
                />
              </Routes>
            </main>
          </div>
        </Router>
      </CartProvider>
    </AuthProvider>
  );
}

export default App;