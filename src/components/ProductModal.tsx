import React, { useState } from 'react';
import { X, Plus, Minus } from 'lucide-react';
import { Product } from '../types';
import { useCart } from '../context/CartContext';

interface ProductModalProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
}

export function ProductModal({ product, isOpen, onClose }: ProductModalProps) {
  const { dispatch } = useCart();
  const [selectedSize, setSelectedSize] = useState<string>('');
  const [quantity, setQuantity] = useState(1);

  if (!isOpen || !product) return null;

  const handleAddToCart = () => {
    if (product.sizes && product.sizes.length > 0 && !selectedSize) {
      return; // Не добавляем если размер не выбран
    }

    dispatch({
      type: 'ADD_ITEM',
      payload: {
        product,
        size: selectedSize || 'One Size'
      }
    });

    // Добавляем нужное количество (quantity - 1, так как один уже добавили)
    for (let i = 1; i < quantity; i++) {
      dispatch({
        type: 'ADD_ITEM',
        payload: {
          product,
          size: selectedSize || 'One Size'
        }
      });
    }

    onClose();
  };

  const displayPrice = product.sale_price || product.price;
  const hasDiscount = product.sale_price && product.sale_price < product.price;

  // Получаем остатки для выбранного размера
  const getStockForSize = (size: string) => {
    if (!product.stock_quantity || typeof product.stock_quantity !== 'object') return 0;
    return (product.stock_quantity as Record<string, number>)[size] || 0;
  };

  const selectedSizeStock = selectedSize ? getStockForSize(selectedSize) : 0;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-100">
          <h2 className="text-xl font-semibold text-gray-900">Product Details</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Изображение товара */}
            <div className="aspect-square bg-gray-100 rounded-2xl overflow-hidden">
              <img
                src={product.image_url}
                alt={product.name}
                className="w-full h-full object-cover"
              />
            </div>

            {/* Информация о товаре */}
            <div className="space-y-6">
              {/* Название и цена */}
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="text-2xl font-bold text-gray-900">{product.name}</h1>
                  {product.is_new && (
                    <span className="bg-black text-white text-xs px-2 py-1 rounded font-medium">
                      NEW
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-2xl font-bold text-gray-900">
                    Руб. {displayPrice.toLocaleString()}
                  </span>
                  {hasDiscount && (
                    <span className="text-lg text-gray-500 line-through">
                      Руб. {product.price.toLocaleString()}
                    </span>
                  )}
                </div>
                <p className="text-gray-600">{product.description}</p>
              </div>

              {/* Выбор размера */}
              {product.sizes && product.sizes.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Size</h3>
                  <div className="grid grid-cols-4 gap-3 mb-3">
                    {product.sizes.map((size) => {
                      const stock = getStockForSize(size);
                      const isOutOfStock = stock === 0;
                      const isSelected = selectedSize === size;
                      
                      return (
                        <button
                          key={size}
                          onClick={() => !isOutOfStock && setSelectedSize(size)}
                          disabled={isOutOfStock}
                          className={`p-3 border-2 rounded-xl text-center transition-all ${
                            isSelected
                              ? 'border-black bg-black text-white'
                              : isOutOfStock
                              ? 'border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed'
                              : 'border-gray-200 hover:border-gray-400 text-gray-900'
                          }`}
                        >
                          <div className="font-medium">{size}</div>
                        </button>
                      );
                    })}
                  </div>
                  
                  {/* Информация об остатках */}
                  <div className="flex gap-4 text-sm">
                    {product.sizes.map((size) => {
                      const stock = getStockForSize(size);
                      if (stock > 0 && stock <= 5) {
                        return (
                          <span key={size} className="text-orange-500">
                            Осталось: {stock} шт. Осталось: {stock} шт.
                          </span>
                        );
                      }
                      return null;
                    })}
                  </div>
                </div>
              )}

              {/* Количество */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Quantity</h3>
                <div className="flex items-center gap-4 mb-6">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="w-10 h-10 border border-gray-300 rounded-lg flex items-center justify-center hover:bg-gray-50 transition-colors"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="text-xl font-medium w-8 text-center">{quantity}</span>
                  <button
                    onClick={() => setQuantity(quantity + 1)}
                    className="w-10 h-10 border border-gray-300 rounded-lg flex items-center justify-center hover:bg-gray-50 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Кнопка добавления в корзину */}
              <button
                onClick={handleAddToCart}
                disabled={!product.in_stock || (product.sizes && product.sizes.length > 0 && !selectedSize)}
                className={`w-full py-4 rounded-xl font-medium text-lg transition-colors ${
                  !product.in_stock || (product.sizes && product.sizes.length > 0 && !selectedSize)
                    ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                    : 'bg-black text-white hover:bg-gray-800'
                }`}
              >
                {!product.in_stock 
                  ? 'Нет в наличии'
                  : (product.sizes && product.sizes.length > 0 && !selectedSize)
                  ? 'Select Size'
                  : 'Добавить в корзину'
                }
              </button>

              {/* Характеристики товара */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Product Features</h3>
                <ul className="space-y-2 text-gray-600">
                  <li className="flex items-center">
                    <span className="w-2 h-2 bg-gray-400 rounded-full mr-3"></span>
                    Premium quality materials
                  </li>
                  <li className="flex items-center">
                    <span className="w-2 h-2 bg-gray-400 rounded-full mr-3"></span>
                    Comfortable fit
                  </li>
                  <li className="flex items-center">
                    <span className="w-2 h-2 bg-gray-400 rounded-full mr-3"></span>
                    Easy care instructions
                  </li>
                  <li className="flex items-center">
                    <span className="w-2 h-2 bg-gray-400 rounded-full mr-3"></span>
                    Sustainable production
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}