import React, { useState } from 'react';
import { X, Plus, Minus, ChevronLeft, ChevronRight, Ruler } from 'lucide-react';
import { Product } from '../types';
import { useCart } from '../context/CartContext';

interface ProductModalProps {
  product: Product | null;
  onClose: () => void;
}

export function ProductModal({ product, onClose }: ProductModalProps) {
  const { dispatch, state } = useCart();
  const [selectedSize, setSelectedSize] = useState<string>('');
  const [quantity, setQuantity] = useState(1);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showMeasurements, setShowMeasurements] = useState(false);

  if (!product) return null;

  const images = product.images || [product.image_url];
  const altTexts = product.image_alt_texts || [product.name];

  const handleAddToCart = () => {
    if (!selectedSize) return;
    
    for (let i = 0; i < quantity; i++) {
      dispatch({ type: 'ADD_ITEM', payload: { product, size: selectedSize } });
    }
    onClose();
  };

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % images.length);
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  const goToImage = (index: number) => {
    setCurrentImageIndex(index);
  };

  const getMeasurements = (size: string) => {
    if (!product.measurements || !product.measurements[size]) {
      return {};
    }
    return product.measurements[size];
  };

  const getStockQuantity = (size: string) => {
    if (!product.stock_quantity || !product.stock_quantity[size]) {
      return 0;
    }
    return product.stock_quantity[size];
  };

  const getCartQuantityForSize = (size: string) => {
    const cartItem = state.items.find(
      item => item.product.id === product.id && item.size === size
    );
    return cartItem ? cartItem.quantity : 0;
  };

  const getAvailableQuantity = (size: string) => {
    const stockQty = getStockQuantity(size);
    const cartQty = getCartQuantityForSize(size);
    return Math.max(0, stockQty - cartQty);
  };

  const maxQuantityForSelectedSize = selectedSize ? getAvailableQuantity(selectedSize) : 0;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-6xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">Product Details</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="p-6">
          <div className="grid md:grid-cols-2 gap-8">
            {/* Product Images Gallery */}
            <div className="space-y-4">
              {/* Main Image */}
              <div className="relative aspect-square bg-gray-100 rounded-lg overflow-hidden group">
                <img
                  src={images[currentImageIndex]}
                  alt={altTexts[currentImageIndex] || product.name}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    // Fallback to placeholder if image fails to load
                    const target = e.target as HTMLImageElement;
                    target.src = '/images/products/placeholder.jpg';
                  }}
                />
                
                {/* Navigation Arrows */}
                {images.length > 1 && (
                  <>
                    <button
                      onClick={prevImage}
                      className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white bg-opacity-80 hover:bg-opacity-100 rounded-full p-2 shadow-lg transition-all opacity-0 group-hover:opacity-100"
                    >
                      <ChevronLeft className="h-5 w-5" />
                    </button>
                    <button
                      onClick={nextImage}
                      className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white bg-opacity-80 hover:bg-opacity-100 rounded-full p-2 shadow-lg transition-all opacity-0 group-hover:opacity-100"
                    >
                      <ChevronRight className="h-5 w-5" />
                    </button>
                  </>
                )}

                {/* Image Counter */}
                {images.length > 1 && (
                  <div className="absolute bottom-4 right-4 bg-black bg-opacity-60 text-white px-3 py-1 rounded-full text-sm">
                    {currentImageIndex + 1} / {images.length}
                  </div>
                )}
              </div>

              {/* Thumbnail Gallery */}
              {images.length > 1 && (
                <div className="grid grid-cols-4 gap-2">
                  {images.slice(0, 8).map((image, index) => (
                    <button
                      key={index}
                      onClick={() => goToImage(index)}
                      className={`aspect-square bg-gray-100 rounded-lg overflow-hidden border-2 transition-all ${
                        currentImageIndex === index
                          ? 'border-black'
                          : 'border-transparent hover:border-gray-300'
                      }`}
                    >
                      <img
                        src={image}
                        alt={altTexts[index] || `${product.name} - Image ${index + 1}`}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          // Fallback to placeholder if image fails to load
                          const target = e.target as HTMLImageElement;
                          target.src = '/images/products/placeholder.jpg';
                        }}
                      />
                    </button>
                  ))}
                  {images.length > 8 && (
                    <div className="aspect-square bg-gray-100 rounded-lg flex items-center justify-center text-gray-500 text-sm">
                      +{images.length - 8}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Product Info */}
            <div className="space-y-6">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">{product.name}</h1>
                <div className="flex items-center space-x-3">
                  {product.is_on_sale && product.sale_price ? (
                    <>
                      <span className="text-2xl font-semibold text-red-600">Руб. {product.sale_price}</span>
                      <span className="text-xl text-gray-400 line-through">Руб. {product.price}</span>
                      <span className="bg-red-600 text-white text-sm px-2 py-1 rounded">SALE</span>
                    </>
                  ) : (
                    <span className="text-2xl font-semibold text-gray-900">Руб. {product.price}</span>
                  )}
                  {product.is_new && (
                    <span className="bg-black text-white text-sm px-2 py-1 rounded">NEW</span>
                  )}
                </div>
              </div>

              <p className="text-gray-600">{product.description}</p>

              {/* Size Selection */}
              <div>
                <h3 className="text-sm font-medium text-gray-900 mb-3">Size</h3>
                <div className="flex flex-wrap gap-2 mb-8">
                  {product.sizes.map((size) => (
                    <div key={size} className="relative flex flex-col items-center">
                      <button
                        onClick={() => {
                          setSelectedSize(size);
                          setShowMeasurements(true);
                          setQuantity(1); // Reset quantity when size changes
                        }}
                        disabled={getStockQuantity(size) === 0}
                        className={`px-4 py-2 border rounded-lg transition-colors relative ${
                          selectedSize === size
                            ? 'bg-black text-white border-black'
                            : getStockQuantity(size) === 0
                            ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
                            : 'bg-white text-gray-900 border-gray-300 hover:border-black'
                        }`}
                      >
                        {size}
                        {getStockQuantity(size) === 0 && (
                          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
                            ×
                          </span>
                        )}
                      </button>
                      {getStockQuantity(size) > 0 && getStockQuantity(size) <= 2 && (
                        <div className="mt-1 text-xs text-orange-600 whitespace-nowrap text-center">
                          Осталось: {getAvailableQuantity(size)} шт.
                        </div>
                      )}
                      {getStockQuantity(size) === 0 && (
                        <div className="mt-1 text-xs text-red-600 whitespace-nowrap text-center">
                          Нет в наличии
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                
                {/* Size Measurements */}
                {selectedSize && showMeasurements && (
                  <>
                    {Object.keys(getMeasurements(selectedSize)).length > 0 ? (
                      <div className="mt-4 p-4 bg-gray-50 rounded-lg border">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center space-x-2">
                            <Ruler className="h-4 w-4 text-gray-600" />
                            <h4 className="text-sm font-medium text-gray-900">
                              Замеры для размера {selectedSize}
                            </h4>
                          </div>
                          <button
                            onClick={() => setShowMeasurements(false)}
                            className="text-gray-400 hover:text-gray-600 transition-colors"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-3 text-sm">
                          {Object.entries(getMeasurements(selectedSize)).map(([measurement, value]) => (
                            <div key={measurement} className="flex justify-between">
                              <span className="text-gray-600">{measurement}:</span>
                              <span className="font-medium text-gray-900">{value}</span>
                            </div>
                          ))}
                        </div>
                        
                        <div className="mt-3 pt-3 border-t border-gray-200">
                          <p className="text-xs text-gray-500">
                            * Замеры могут незначительно отличаться в зависимости от модели
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="mt-4 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                        <div className="flex items-center space-x-2">
                          <Ruler className="h-4 w-4 text-yellow-600" />
                          <p className="text-sm text-yellow-800">
                            Замеры для размера {selectedSize} пока не добавлены
                          </p>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Quantity Selection */}
              <div>
                <h3 className="text-sm font-medium text-gray-900 mb-3">Quantity</h3>
                {selectedSize && maxQuantityForSelectedSize === 0 && (
                  <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-sm text-red-800">
                      Товар размера {selectedSize} закончился на складе или уже добавлен в корзину в максимальном количестве
                    </p>
                  </div>
                )}
                <div className="flex items-center space-x-3">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    disabled={quantity <= 1}
                    className={`p-2 border rounded-lg transition-colors ${
                      quantity <= 1
                        ? 'border-gray-200 text-gray-400 cursor-not-allowed'
                        : 'border-gray-300 hover:border-black'
                    }`}
                  >
                    <Minus className="h-4 w-4" />
                  </button>
                  <span className="text-lg font-medium min-w-[3rem] text-center">{quantity}</span>
                  <button
                    onClick={() => setQuantity(quantity + 1)}
                    disabled={!selectedSize || quantity >= maxQuantityForSelectedSize}
                    className={`p-2 border rounded-lg transition-colors ${
                      !selectedSize || quantity >= maxQuantityForSelectedSize
                        ? 'border-gray-200 text-gray-400 cursor-not-allowed'
                        : 'border-gray-300 hover:border-black'
                    }`}
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
                {selectedSize && maxQuantityForSelectedSize > 0 && (
                  <p className="text-sm text-gray-600 mt-2">
                    Доступно для добавления: {maxQuantityForSelectedSize} шт.
                  </p>
                )}
              </div>

              {/* Add to Cart Button */}
              <button
                onClick={handleAddToCart}
                disabled={!selectedSize || maxQuantityForSelectedSize === 0}
                className={`w-full py-3 rounded-lg font-medium transition-colors ${
                  selectedSize && maxQuantityForSelectedSize > 0
                    ? 'bg-black text-white hover:bg-gray-800'
                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                }`}
              >
                {!selectedSize 
                  ? 'Select Size' 
                  : maxQuantityForSelectedSize === 0 
                  ? 'Out of Stock' 
                  : 'Add to Cart'
                }
              </button>

              {/* Product Features */}
              <div className="border-t border-gray-200 pt-6">
                <h3 className="text-sm font-medium text-gray-900 mb-3">Product Features</h3>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Premium quality materials</li>
                  <li>• Comfortable fit</li>
                  <li>• Easy care instructions</li>
                  <li>• Sustainable production</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}