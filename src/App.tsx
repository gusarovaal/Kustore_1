import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { CartProvider } from './context/CartContext';
import { Header } from './components/Header';
import { HomePage } from './pages/HomePage';
import { NewPage } from './pages/NewPage';
import { SalePage } from './pages/SalePage';
import { AllProductsPage } from './pages/AllProductsPage';

function App() {
  return (
    <CartProvider>
      <Router>
        <div className="min-h-screen bg-white">
          <Header />
          
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/new" element={<NewPage />} />
            <Route path="/sale" element={<SalePage />} />
            <Route path="/all" element={<AllProductsPage />} />
          </Routes>
        </div>
      </Router>
    </CartProvider>
  );
}

export default App;