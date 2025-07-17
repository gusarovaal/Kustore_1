import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Product } from '../types';

export function useProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProducts = async (filters?: {
    category?: string;
    search?: string;
    isNew?: boolean;
    isOnSale?: boolean;
    minPrice?: number;
    maxPrice?: number;
  }) => {
    try {
      setLoading(true);
      setError(null);

      let query = supabase
        .from('products')
        .select('*')
        .eq('in_stock', true)
        .order('created_at', { ascending: false });

      // Apply filters
      if (filters?.category) {
        query = query.eq('category', filters.category);
      }

      if (filters?.search) {
        query = query.or(`name.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
      }

      if (filters?.isNew) {
        query = query.eq('is_new', true);
      }

      if (filters?.isOnSale) {
        query = query.eq('is_on_sale', true);
      }

      if (filters?.minPrice !== undefined) {
        query = query.gte('price', filters.minPrice);
      }

      if (filters?.maxPrice !== undefined) {
        query = query.lte('price', filters.maxPrice);
      }

      const { data, error } = await query;

      if (error) throw error;

      setProducts(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      console.error('Error fetching products:', err);
    } finally {
      setLoading(false);
    }
  };

  const getProductById = async (id: string): Promise<Product | null> => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data;
    } catch (err) {
      console.error('Error fetching product:', err);
      return null;
    }
  };

  const getProductsByCategory = async (category: string) => {
    return fetchProducts({ category });
  };

  const searchProducts = async (searchTerm: string) => {
    return fetchProducts({ search: searchTerm });
  };

  const getNewProducts = async () => {
    return fetchProducts({ isNew: true });
  };

  const getSaleProducts = async () => {
    return fetchProducts({ isOnSale: true });
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  return {
    products,
    loading,
    error,
    fetchProducts,
    getProductById,
    getProductsByCategory,
    searchProducts,
    getNewProducts,
    getSaleProducts,
    refetch: () => fetchProducts()
  };
}