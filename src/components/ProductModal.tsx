import React, { useState } from 'react';
import { X, ShoppingCart, Heart, ChevronLeft, ChevronRight } from 'lucide-react';
import { Product } from '../types';
import { useCart } from '../context/CartContext';

interface ProductModalProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
}

export function ProductModal({ product, isOpen, onClose }: ProductModalProps) {
  const { addToCart } = useCart();
  const [selectedSize, setSelectedSize] = useState<string>('');
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  if (!isOpen || !product) return null;

  const images = product.images && product.images.length > 0 ? product.images : [product.image_url];
  const hasMultipleImages = images.length > 1;

  const handleAddToCart = () => {
    if (product.sizes && product.sizes.length > 0 && !selectedSize) {
      alert('Пожалуйста, выберите размер');
      return;
    }

    addToCart({
      id: product.id,
      name: product.name,
      price: product.sale_price || product.price,
      image: product.image_url,
      size: selectedSize || 'One Size',
      quantity: 1
    });

    onClose();
  };

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % images.length);
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  const displayPrice = product.sale_price || product.price;
  const hasDiscount = product.sale_price && product.sale_price < product.price;

  // Get stock for selected size
  const getStockForSize = (size: string) => {
    if (!product.stock_quantity || typeof product.stock_quantity !== 'object') return 0;
    return (product.stock_quantity as Record<string, number>)[size] || 0;
  };

  const selectedSizeStock = selectedSize ? getStockForSize(selectedSize) : 0;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
          <h2 className="text-xl font-semibold">{product.name}</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Image Gallery */}
            <div className="space-y-4">
              {/* Main Image */}
              <div className="relative aspect-square bg-gray-100 rounded-lg overflow-hidden">
                <img
                  src={images[currentImageIndex]}
                  alt={product.image_alt_texts?.[currentImageIndex] || product.name}
                  className="w-full h-full object-cover"
                />
                
                {/* Navigation arrows */}
                {hasMultipleImages && (
                  <>
                    <button
                      onClick={prevImage}
                      className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-white/80 hover:bg-white p-2 rounded-full transition-colors"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <button
                      onClick={nextImage}
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-white/80 hover:bg-white p-2 rounded-full transition-colors"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </>
                )}

                {/* Image counter */}
                {hasMultipleImages && (
                  <div className="absolute bottom-2 right-2 bg-black/50 text-white text-sm px-2 py-1 rounded">
                    {currentImageIndex + 1} / {images.length}
                  </div>
                )}

                {/* Badges */}
                <div className="absolute top-2 left-2 flex flex-col space-y-1">
                  {product.is_new && (
                    <span className="bg-green-500 text-white text-xs px-2 py-1 rounded">
                      NEW
                    </span>
                  )}
                  {hasDiscount && (
                    <span className="bg-red-500 text-white text-xs px-2 py-1 rounded">
                      SALE
                    </span>
                  )}
                </div>
              </div>

              {/* Thumbnail Gallery */}
              {hasMultipleImages && (
                <div className={`grid gap-2 ${
                  images.length <= 4 ? 'grid-cols-4' : 
                  images.length <= 6 ? 'grid-cols-6' : 'grid-cols-8'
                }`}>
                  {images.map((image, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentImageIndex(index)}
                      className={`aspect-square rounded-lg overflow-hidden border-2 transition-colors ${
                        index === currentImageIndex ? 'border-black' : 'border-gray-200 hover:border-gray-400'
                      }`}
                    >
                      <img
                        src={image}
                        alt={product.image_alt_texts?.[index] || `${product.name} ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Product Info */}
            <div className="space-y-6">
              <div>
                <div className="flex items-center space-x-2 mb-2">
                  <span className="font-bold text-2xl text-gray-900">
                    ₽{displayPrice.toLocaleString()}
                  </span>
                  {hasDiscount && (
                    <span className="text-lg text-gray-500 line-through">
                      ₽{product.price.toLocaleString()}
                    </span>
                  )}
                </div>
                <p className="text-gray-600">{product.category}</p>
                {product.brand && (
                  <p className="text-sm text-gray-500">Brand: {product.brand}</p>
                )}
              </div>

              <div>
                <h3 className="font-semibold mb-2">Description</h3>
                <p className="text-gray-700">{product.description}</p>
              </div>

              {/* Size Selection */}
              {product.sizes && product.sizes.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-3">Size</h3>
                  <div className="grid grid-cols-4 gap-2">
                    {product.sizes.map((size) => {
                      const stock = getStockForSize(size);
                      const isOutOfStock = stock === 0;
                      const isSelected = selectedSize === size;
                      
                      return (
                        <button
                          key={size}
                          onClick={() => !isOutOfStock && setSelectedSize(size)}
                          disabled={isOutOfStock}
                          className={`p-3 border rounded-lg text-center transition-colors ${
                            isSelected
                              ? 'border-black bg-black text-white'
                              : isOutOfStock
                              ? 'border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed'
                              : 'border-gray-300 hover:border-gray-400'
                          }`}
                        >
                          <div className="font-medium">{size}</div>
                          {stock > 0 && stock <= 5 && (
                            <div className="text-xs text-orange-500">
                              Only {stock} left
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                  {selectedSize && selectedSizeStock > 0 && (
                    <p className="text-sm text-green-600 mt-2">
                      ✓ In stock ({selectedSizeStock} available)
                    </p>
                  )}
                </div>
              )}

              {/* Additional Info */}
              {product.color && (
                <div>
                  <h3 className="font-semibold mb-2">Color</h3>
                  <p className="text-gray-700">{product.color}</p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex space-x-4">
                <button
                  onClick={handleAddToCart}
                  disabled={!product.in_stock || (product.sizes && product.sizes.length > 0 && !selectedSize)}
                  className="flex-1 bg-black text-white py-3 px-6 rounded-lg hover:bg-gray-800 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-2"
                >
                  <ShoppingCart className="w-5 h-5" />
                  <span>Add to Cart</span>
                </button>
                
                <button className="p-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                  <Heart className="w-5 h-5" />
                </button>
              </div>

              {!product.in_stock && (
                <p className="text-red-600 text-center">Out of Stock</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}