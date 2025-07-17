import React, { useState } from 'react';
import { Heart, ShoppingCart } from 'lucide-react';
import { Product } from '../types';
import { useCart } from '../context/CartContext';

interface ProductCardProps {
  product: Product;
  onProductClick: (product: Product) => void;
}

export function ProductCard({ product, onProductClick }: ProductCardProps) {
  const { addToCart } = useCart();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

  const images = product.images && product.images.length > 0 ? product.images : [product.image_url];
  const hasMultipleImages = images.length > 1;

  // Auto-scroll images on hover
  React.useEffect(() => {
    if (!isHovered || !hasMultipleImages) return;

    const interval = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % images.length);
    }, 1000);

    return () => clearInterval(interval);
  }, [isHovered, images.length, hasMultipleImages]);

  const handleAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (product.sizes && product.sizes.length > 0) {
      // If product has sizes, open modal to select size
      onProductClick(product);
    } else {
      // Add to cart directly if no sizes
      addToCart({
        id: product.id,
        name: product.name,
        price: product.sale_price || product.price,
        image: product.image_url,
        size: 'One Size',
        quantity: 1
      });
    }
  };

  const displayPrice = product.sale_price || product.price;
  const hasDiscount = product.sale_price && product.sale_price < product.price;

  return (
    <div 
      className="bg-white rounded-lg shadow-md overflow-hidden cursor-pointer transition-transform hover:scale-105"
      onClick={() => onProductClick(product)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => {
        setIsHovered(false);
        setCurrentImageIndex(0);
      }}
    >
      <div className="relative aspect-square overflow-hidden">
        <img
          src={images[currentImageIndex]}
          alt={product.image_alt_texts?.[currentImageIndex] || product.name}
          className="w-full h-full object-cover transition-opacity duration-300"
        />
        
        {/* Image indicators */}
        {hasMultipleImages && (
          <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 flex space-x-1">
            {images.slice(0, 5).map((_, index) => (
              <div
                key={index}
                className={`w-2 h-2 rounded-full transition-colors ${
                  index === currentImageIndex ? 'bg-white' : 'bg-white/50'
                }`}
              />
            ))}
            {images.length > 5 && (
              <span className="text-white text-xs bg-black/50 px-1 rounded">
                +{images.length - 5}
              </span>
            )}
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

        {/* Wishlist button */}
        <button className="absolute top-2 right-2 p-2 bg-white/80 rounded-full hover:bg-white transition-colors">
          <Heart className="w-4 h-4" />
        </button>
      </div>

      <div className="p-4">
        <h3 className="font-semibold text-gray-900 mb-1 line-clamp-2">{product.name}</h3>
        <p className="text-sm text-gray-600 mb-2 line-clamp-1">{product.category}</p>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="font-bold text-lg text-gray-900">
              ₽{displayPrice.toLocaleString()}
            </span>
            {hasDiscount && (
              <span className="text-sm text-gray-500 line-through">
                ₽{product.price.toLocaleString()}
              </span>
            )}
          </div>
          
          <button
            onClick={handleAddToCart}
            className="bg-black text-white p-2 rounded-lg hover:bg-gray-800 transition-colors"
          >
            <ShoppingCart className="w-4 h-4" />
          </button>
        </div>

        {/* Size info */}
        {product.sizes && product.sizes.length > 0 && (
          <div className="mt-2 text-xs text-gray-500">
            Sizes: {product.sizes.slice(0, 3).join(', ')}
            {product.sizes.length > 3 && '...'}
          </div>
        )}
      </div>
    </div>
  );
}