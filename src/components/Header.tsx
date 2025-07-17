import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ShoppingCart, Menu, X } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { AuthButton } from './AuthButton';
import { CartSidebar } from './CartSidebar';

export function Header() {
  const { state } = useCart();
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <>
      <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <Link to="/" className="flex items-center space-x-2">
              <div className="text-2xl font-bold text-gray-900">KUSTORE</div>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center space-x-8">
              <Link
                to="/"
                className="text-gray-700 hover:text-gray-900 transition-colors font-medium"
              >
                Главная
              </Link>
              <Link
                to="/new"
                className="text-gray-700 hover:text-gray-900 transition-colors font-medium"
              >
                Новинки
              </Link>
              <Link
                to="/sale"
                className="text-gray-700 hover:text-gray-900 transition-colors font-medium"
              >
                Распродажа
              </Link>
              <Link
                to="/all"
                className="text-gray-700 hover:text-gray-900 transition-colors font-medium"
              >
                Каталог
              </Link>
            </nav>

            {/* Right side actions */}
            <div className="flex items-center space-x-4">
              <AuthButton />
              
              {/* Cart button */}
              <button
                onClick={() => setIsCartOpen(true)}
                className="relative p-2 text-gray-900 hover:text-gray-600 transition-colors"
              >
                <ShoppingCart className="h-6 w-6" />
                {state.itemCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                    {state.itemCount}
                  </span>
                )}
              </button>

              {/* Mobile menu button */}
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="md:hidden p-2 text-gray-900 hover:text-gray-600 transition-colors"
              >
                {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
            </div>
          </div>

          {/* Mobile Navigation */}
          {isMobileMenuOpen && (
            <div className="md:hidden border-t border-gray-200 py-4">
              <nav className="flex flex-col space-y-4">
                <Link
                  to="/"
                  className="text-gray-700 hover:text-gray-900 transition-colors font-medium"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Главная
                </Link>
                <Link
                  to="/new"
                  className="text-gray-700 hover:text-gray-900 transition-colors font-medium"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Новинки
                </Link>
                <Link
                  to="/sale"
                  className="text-gray-700 hover:text-gray-900 transition-colors font-medium"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Распродажа
                </Link>
                <Link
                  to="/all"
                  className="text-gray-700 hover:text-gray-900 transition-colors font-medium"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Каталог
                </Link>
              </nav>
            </div>
          )}
        </div>
      </header>

      <CartSidebar isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
    </>
  );
}