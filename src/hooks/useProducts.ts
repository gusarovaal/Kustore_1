import { useState, useEffect, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import { Product } from '../types';
import { FilterState } from '../components/FilterModal';

export function useProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('Fetching products from Supabase...');

      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('in_stock', true)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }

      console.log('Products fetched successfully:', data?.length || 0);
      setProducts(data || []);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      console.error('Error fetching products:', err);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const getNewProducts = useMemo(() => {
    return () => products.filter(product => product.is_new);
  }, [products]);

  const getSaleProducts = useMemo(() => {
    return () => products.filter(product => product.is_on_sale);
  }, [products]);

  const applyFilters = useMemo(() => {
    return (productsToFilter: Product[], filters: FilterState) => {
      return productsToFilter.filter(product => {
        // Price range filter
        const price = product.sale_price || product.price;
        if (price < filters.priceRange[0] || price > filters.priceRange[1]) {
          return false;
        }

        // Categories filter
        if (filters.categories.length > 0 && !filters.categories.includes(product.category)) {
          return false;
        }

        // Sizes filter
        if (filters.sizes.length > 0) {
          const hasMatchingSize = filters.sizes.some(size => product.sizes.includes(size));
          if (!hasMatchingSize) return false;
        }

        // Colors filter
        if (filters.colors.length > 0 && product.color && !filters.colors.includes(product.color)) {
          return false;
        }

        // Brands filter
        if (filters.brands.length > 0 && product.brand && !filters.brands.includes(product.brand)) {
          return false;
        }

        // New products filter
        if (filters.isNew !== null && product.is_new !== filters.isNew) {
          return false;
        }

        // Sale products filter
        if (filters.isOnSale !== null && product.is_on_sale !== filters.isOnSale) {
          return false;
        }

        // In stock filter
        if (!filters.inStock && !product.in_stock) {
          return false;
        }

        return true;
      });
    };
  }, []);

  useEffect(() => {
    fetchProducts();
  }, []);

  return {
    products,
    loading,
    error,
    getNewProducts,
    getSaleProducts,
    applyFilters,
    refetch: fetchProducts
  };
}