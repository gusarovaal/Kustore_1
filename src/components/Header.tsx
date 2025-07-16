import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Search, ShoppingBag, Menu, X } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { AuthButton } from './AuthButton';

export function Header() {
  const { state } = useCart();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex-shrink-0">
            <Link to="/">
              <h1 className="text-2xl font-bold text-black">KUSTORE</h1>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex space-x-8">
            <Link 
              to="/new" 
              className={`px-3 py-2 text-sm font-medium transition-colors ${
                isActive('/new') 
                  ? 'text-black border-b-2 border-black' 
                  : 'text-gray-900 hover:text-gray-600'
              }`}
            >
              New
            </Link>
            <Link 
              to="/all" 
              className={`px-3 py-2 text-sm font-medium transition-colors ${
                isActive('/all') 
                  ? 'text-black border-b-2 border-black' 
                  : 'text-gray-900 hover:text-gray-600'
              }`}
            >
              Весь ассортимент
            </Link>
            <Link 
              to="/sale" 
              className={`px-3 py-2 text-sm font-medium transition-colors ${
                isActive('/sale') 
                  ? 'text-black border-b-2 border-black' 
                  : 'text-gray-900 hover:text-gray-600'
              }`}
            >
              Sale
            </Link>
          </nav>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center space-x-4">
            <AuthButton />
            <button className="p-2 text-gray-900 hover:text-gray-600 transition-colors relative">
              <ShoppingBag className="h-5 w-5" />
              {state.itemCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-black text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {state.itemCount}
                </span>
              )}
            </button>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2 text-gray-900"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="md:hidden bg-white border-t border-gray-200">
          <nav className="px-4 py-2 space-y-1">
            <Link 
              to="/new" 
              className={`block px-3 py-2 hover:bg-gray-50 ${
                isActive('/new') ? 'text-black font-medium' : 'text-gray-900'
              }`}
              onClick={() => setIsMenuOpen(false)}
            >
              New
            </Link>
            <Link 
              to="/all" 
              className={`block px-3 py-2 hover:bg-gray-50 ${
                isActive('/all') ? 'text-black font-medium' : 'text-gray-900'
              }`}
              onClick={() => setIsMenuOpen(false)}
            >
              Весь ассортимент
            </Link>
            <Link 
              to="/sale" 
              className={`block px-3 py-2 hover:bg-gray-50 ${
                isActive('/sale') ? 'text-black font-medium' : 'text-gray-900'
              }`}
              onClick={() => setIsMenuOpen(false)}
            >
              Sale
            </Link>
          </nav>
          <div className="px-4 py-2 border-t border-gray-200 flex items-center space-x-4">
            <AuthButton />
            <button className="p-2 text-gray-900 relative">
              <ShoppingBag className="h-5 w-5" />
              {state.itemCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-black text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {state.itemCount}
                </span>
              )}
            </button>
          </div>
        </div>
      )}
    </header>
  );
}