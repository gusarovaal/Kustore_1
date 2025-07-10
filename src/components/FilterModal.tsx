import React, { useState, useEffect } from 'react';
import { X, Filter, ChevronDown, ChevronUp } from 'lucide-react';
import { Product } from '../types';

interface FilterModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  onFiltersChange: (filters: FilterState) => void;
  currentFilters: FilterState;
}

export interface FilterState {
  priceRange: [number, number];
  sizes: string[];
  colors: string[];
  brands: string[];
  categories: string[];
  isNew: boolean | null;
  isOnSale: boolean | null;
  inStock: boolean;
}

export const defaultFilters: FilterState = {
  priceRange: [0, 1000],
  sizes: [],
  colors: [],
  brands: [],
  categories: [],
  isNew: null,
  isOnSale: null,
  inStock: true,
};

export function FilterModal({ isOpen, onClose, products, onFiltersChange, currentFilters }: FilterModalProps) {
  const [filters, setFilters] = useState<FilterState>(currentFilters);
  const [expandedSections, setExpandedSections] = useState({
    price: true,
    category: true,
    size: true,
    color: false,
    brand: false,
    status: true,
  });

  // Extract unique values from products database
  const availableCategories = Array.from(new Set(products.map(p => p.category))).sort();
  const availableColors = Array.from(new Set(products.map(p => p.color).filter(Boolean))).sort();
  const availableBrands = Array.from(new Set(products.map(p => p.brand).filter(Boolean))).sort();
  
  // Get sizes based on selected categories or all sizes if no category selected
  const getAvailableSizes = () => {
    let relevantProducts = products;
    
    if (filters.categories.length > 0) {
      relevantProducts = products.filter(p => filters.categories.includes(p.category));
    }
    
    const allSizes = Array.from(new Set(relevantProducts.flatMap(p => p.sizes)));
    
    // Group sizes by type for better organization
    const clothingSizes = allSizes.filter(size => ['XS', 'S', 'M', 'L', 'XL', 'XXL'].includes(size));
    const pantsSizes = allSizes.filter(size => /^\d+$/.test(size) && parseInt(size) >= 26 && parseInt(size) <= 50);
    const shoeSizes = allSizes.filter(size => /^\d+$/.test(size) && parseInt(size) >= 35 && parseInt(size) <= 50);
    const otherSizes = allSizes.filter(size => 
      !clothingSizes.includes(size) && 
      !pantsSizes.includes(size) && 
      !shoeSizes.includes(size)
    );
    
    return {
      clothing: clothingSizes.sort(),
      pants: pantsSizes.sort((a, b) => parseInt(a) - parseInt(b)),
      shoes: shoeSizes.sort((a, b) => parseInt(a) - parseInt(b)),
      other: otherSizes.sort()
    };
  };
  
  const availableSizes = getAvailableSizes();
  
  const minPrice = Math.min(...products.map(p => p.price));
  const maxPrice = Math.max(...products.map(p => p.price));

  useEffect(() => {
    setFilters(currentFilters);
  }, [currentFilters]);

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const handlePriceChange = (index: number, value: number) => {
    const newRange: [number, number] = [...filters.priceRange];
    newRange[index] = value;
    if (index === 0 && value > newRange[1]) {
      newRange[1] = value;
    }
    if (index === 1 && value < newRange[0]) {
      newRange[0] = value;
    }
    setFilters(prev => ({ ...prev, priceRange: newRange }));
  };

  const toggleArrayFilter = (key: 'sizes' | 'colors' | 'brands', value: string) => {
    setFilters(prev => ({
      ...prev,
      [key]: prev[key].includes(value)
        ? prev[key].filter(item => item !== value)
        : [...prev[key], value]
    }));
  };

  const toggleCategoryFilter = (category: string) => {
    setFilters(prev => ({
      ...prev,
      categories: prev.categories.includes(category)
        ? prev.categories.filter(item => item !== category)
        : [...prev.categories, category],
      // Reset sizes when category changes
      sizes: prev.categories.includes(category) ? prev.sizes : []
    }));
  };
  const handleBooleanFilter = (key: 'isNew' | 'isOnSale', value: boolean | null) => {
    setFilters(prev => ({
      ...prev,
      [key]: prev[key] === value ? null : value
    }));
  };

  const applyFilters = () => {
    onFiltersChange(filters);
    onClose();
  };

  const resetFilters = () => {
    const resetState = {
      ...defaultFilters,
      priceRange: [minPrice, maxPrice] as [number, number]
    };
    setFilters(resetState);
    onFiltersChange(resetState);
  };

  const getActiveFiltersCount = () => {
    let count = 0;
    if (filters.priceRange[0] > minPrice || filters.priceRange[1] < maxPrice) count++;
    if (filters.categories.length > 0) count++;
    if (filters.sizes.length > 0) count++;
    if (filters.colors.length > 0) count++;
    if (filters.brands.length > 0) count++;
    if (filters.isNew !== null) count++;
    if (filters.isOnSale !== null) count++;
    if (!filters.inStock) count++;
    return count;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-2">
            <Filter className="h-5 w-5" />
            <h2 className="text-xl font-bold text-gray-900">Фильтры</h2>
            {getActiveFiltersCount() > 0 && (
              <span className="bg-black text-white text-xs px-2 py-1 rounded-full">
                {getActiveFiltersCount()}
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Price Range */}
          <div>
            <button
              onClick={() => toggleSection('price')}
              className="flex items-center justify-between w-full text-left"
            >
              <div className="flex items-center space-x-2">
                <h3 className="text-lg font-medium text-gray-900">Цена</h3>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    const resetState = {
                      ...filters,
                      priceRange: [minPrice, maxPrice] as [number, number]
                    };
                    setFilters(resetState);
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              {expandedSections.price ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </button>
            {expandedSections.price && (
              <div className="mt-6 space-y-6">
                {/* Input fields */}
                <div className="flex items-center space-x-4 text-sm">
                  <div className="flex items-center space-x-2">
                    <span className="text-gray-600">от</span>
                    <input
                      type="number"
                      value={filters.priceRange[0]}
                      onChange={(e) => handlePriceChange(0, Number(e.target.value))}
                      className="w-20 px-2 py-1 border-b border-gray-300 bg-transparent focus:outline-none focus:border-black text-center"
                      min={minPrice}
                      max={maxPrice}
                    />
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-gray-600">до</span>
                    <input
                      type="number"
                      value={filters.priceRange[1]}
                      onChange={(e) => handlePriceChange(1, Number(e.target.value))}
                      className="w-20 px-2 py-1 border-b border-gray-300 bg-transparent focus:outline-none focus:border-black text-center"
                      min={minPrice}
                      max={maxPrice}
                    />
                  </div>
                </div>
                
                {/* Dual Range Slider */}
                <div className="dual-range-slider">
                  <div className="relative h-2 bg-gray-200 rounded-full">
                    {/* Active range track */}
                    <div 
                      className="absolute h-2 bg-blue-500 rounded-full"
                      style={{
                        left: `${((filters.priceRange[0] - minPrice) / (maxPrice - minPrice)) * 100}%`,
                        width: `${((filters.priceRange[1] - filters.priceRange[0]) / (maxPrice - minPrice)) * 100}%`
                      }}
                    />
                    
                    {/* Min range slider */}
                    <input
                      type="range"
                      min={minPrice}
                      max={maxPrice}
                      value={filters.priceRange[0]}
                      onChange={(e) => handlePriceChange(0, Number(e.target.value))}
                      className="range-min"
                    />
                    
                    {/* Max range slider */}
                    <input
                      type="range"
                      min={minPrice}
                      max={maxPrice}
                      value={filters.priceRange[1]}
                      onChange={(e) => handlePriceChange(1, Number(e.target.value))}
                      className="range-max"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Categories */}
          <div>
            <button
              onClick={() => toggleSection('category')}
              className="flex items-center justify-between w-full text-left"
            >
              <h3 className="text-lg font-medium text-gray-900">Категория одежды</h3>
              {expandedSections.category ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </button>
            {expandedSections.category && (
              <div className="mt-4 space-y-2">
                {availableCategories.map(category => (
                  <label key={category} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={filters.categories.includes(category)}
                      onChange={() => toggleCategoryFilter(category)}
                      className="rounded border-gray-300 text-black focus:ring-black"
                    />
                    <span className="text-gray-700 capitalize">{category}</span>
                  </label>
                ))}
              </div>
            )}
          </div>
          {/* Sizes */}
          <div>
            <button
              onClick={() => toggleSection('size')}
              className="flex items-center justify-between w-full text-left"
            >
              <h3 className="text-lg font-medium text-gray-900">Размер</h3>
              {expandedSections.size ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </button>
            {expandedSections.size && (
              <div className="mt-4 space-y-4">
                {availableSizes.clothing.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Одежда</h4>
                    <div className="flex flex-wrap gap-2">
                      {availableSizes.clothing.map(size => (
                        <button
                          key={size}
                          onClick={() => toggleArrayFilter('sizes', size)}
                          className={`px-3 py-2 border rounded-lg text-sm transition-colors ${
                            filters.sizes.includes(size)
                              ? 'bg-black text-white border-black'
                              : 'bg-white text-gray-700 border-gray-300 hover:border-black'
                          }`}
                        >
                          {size}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                
                {availableSizes.pants.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Брюки/Джинсы</h4>
                    <div className="flex flex-wrap gap-2">
                      {availableSizes.pants.map(size => (
                        <button
                          key={size}
                          onClick={() => toggleArrayFilter('sizes', size)}
                          className={`px-3 py-2 border rounded-lg text-sm transition-colors ${
                            filters.sizes.includes(size)
                              ? 'bg-black text-white border-black'
                              : 'bg-white text-gray-700 border-gray-300 hover:border-black'
                          }`}
                        >
                          {size}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                
                {availableSizes.shoes.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Обувь</h4>
                    <div className="flex flex-wrap gap-2">
                      {availableSizes.shoes.map(size => (
                        <button
                          key={size}
                          onClick={() => toggleArrayFilter('sizes', size)}
                          className={`px-3 py-2 border rounded-lg text-sm transition-colors ${
                            filters.sizes.includes(size)
                              ? 'bg-black text-white border-black'
                              : 'bg-white text-gray-700 border-gray-300 hover:border-black'
                          }`}
                        >
                          {size}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                
                {availableSizes.other.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Другое</h4>
                    <div className="flex flex-wrap gap-2">
                      {availableSizes.other.map(size => (
                        <button
                          key={size}
                          onClick={() => toggleArrayFilter('sizes', size)}
                          className={`px-3 py-2 border rounded-lg text-sm transition-colors ${
                            filters.sizes.includes(size)
                              ? 'bg-black text-white border-black'
                              : 'bg-white text-gray-700 border-gray-300 hover:border-black'
                          }`}
                        >
                          {size}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Colors */}
          <div>
            <button
              onClick={() => toggleSection('color')}
              className="flex items-center justify-between w-full text-left"
            >
              <h3 className="text-lg font-medium text-gray-900">Цвет</h3>
              {expandedSections.color ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </button>
            {expandedSections.color && (
              <div className="mt-4 flex flex-wrap gap-2">
                {availableColors.map(color => (
                  <button
                    key={color}
                    onClick={() => toggleArrayFilter('colors', color)}
                    className={`px-3 py-2 border rounded-lg text-sm transition-colors ${
                      filters.colors.includes(color)
                        ? 'bg-black text-white border-black'
                        : 'bg-white text-gray-700 border-gray-300 hover:border-black'
                    }`}
                  >
                    {color}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Brands */}
          <div>
            <button
              onClick={() => toggleSection('brand')}
              className="flex items-center justify-between w-full text-left"
            >
              <h3 className="text-lg font-medium text-gray-900">Бренд</h3>
              {expandedSections.brand ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </button>
            {expandedSections.brand && (
              <div className="mt-4 space-y-2">
                {availableBrands.map(brand => (
                  <label key={brand} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={filters.brands.includes(brand)}
                      onChange={() => toggleArrayFilter('brands', brand)}
                      className="rounded border-gray-300 text-black focus:ring-black"
                    />
                    <span className="text-gray-700">{brand}</span>
                  </label>
                ))}
              </div>
            )}
          </div>

          {/* Status Filters */}
          <div>
            <button
              onClick={() => toggleSection('status')}
              className="flex items-center justify-between w-full text-left"
            >
              <h3 className="text-lg font-medium text-gray-900">Статус</h3>
              {expandedSections.status ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </button>
            {expandedSections.status && (
              <div className="mt-4 space-y-3">
                <div className="flex items-center space-x-4">
                  <button
                    onClick={() => handleBooleanFilter('isNew', true)}
                    className={`px-3 py-2 border rounded-lg text-sm transition-colors ${
                      filters.isNew === true
                        ? 'bg-black text-white border-black'
                        : 'bg-white text-gray-700 border-gray-300 hover:border-black'
                    }`}
                  >
                    Новинки
                  </button>
                  <button
                    onClick={() => handleBooleanFilter('isOnSale', true)}
                    className={`px-3 py-2 border rounded-lg text-sm transition-colors ${
                      filters.isOnSale === true
                        ? 'bg-red-600 text-white border-red-600'
                        : 'bg-white text-gray-700 border-gray-300 hover:border-red-600'
                    }`}
                  >
                    Скидки
                  </button>
                </div>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={filters.inStock}
                    onChange={(e) => setFilters(prev => ({ ...prev, inStock: e.target.checked }))}
                    className="rounded border-gray-300 text-black focus:ring-black"
                  />
                  <span className="text-gray-700">Только в наличии</span>
                </label>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200">
          <button
            onClick={resetFilters}
            className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
          >
            Сбросить все
          </button>
          <div className="flex items-center space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Отмена
            </button>
            <button
              onClick={applyFilters}
              className="px-6 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
            >
              Применить
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}