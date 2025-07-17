import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Product } from '../types';

interface UseProductsReturn {
  products: Product[];
  loading: boolean;
  error: string | null;
  applyFilters: (filters: {
    category?: string;
    priceRange?: [number, number];
    color?: string;
    brand?: string;
    sizes?: string[];
    inStock?: boolean;
  }) => void;
  getNewProducts: () => Product[];
  getSaleProducts: () => Product[];
}

export function useProducts(): UseProductsReturn {
  const [products, setProducts] = useState<Product[]>([]);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch products from Supabase
  useEffect(() => {
    async function fetchProducts() {
      try {
        setLoading(true);
        setError(null);

        const { data, error: fetchError } = await supabase
          .from('products')
          .select('*')
          .eq('in_stock', true)
          .order('created_at', { ascending: false });

        if (fetchError) {
          throw fetchError;
        }

        setAllProducts(data || []);
        setProducts(data || []);
      } catch (err) {
        console.error('Error fetching products:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch products');
      } finally {
        setLoading(false);
      }
    }

    fetchProducts();
  }, []);

  // Apply filters to products
  const applyFilters = (filters: {
    category?: string;
    priceRange?: [number, number];
    color?: string;
    brand?: string;
    sizes?: string[];
    inStock?: boolean;
  }) => {
    let filteredProducts = [...allProducts];

    // Filter by category
    if (filters.category && filters.category !== 'all') {
      filteredProducts = filteredProducts.filter(
        product => product.category === filters.category
      );
    }

    // Filter by price range
    if (filters.priceRange) {
      const [minPrice, maxPrice] = filters.priceRange;
      filteredProducts = filteredProducts.filter(product => {
        const price = product.sale_price || product.price;
        return price >= minPrice && price <= maxPrice;
      });
    }

    // Filter by color
    if (filters.color && filters.color !== 'all') {
      filteredProducts = filteredProducts.filter(
        product => product.color?.toLowerCase() === filters.color?.toLowerCase()
      );
    }

    // Filter by brand
    if (filters.brand && filters.brand !== 'all') {
      filteredProducts = filteredProducts.filter(
        product => product.brand?.toLowerCase() === filters.brand?.toLowerCase()
      );
    }

    // Filter by sizes
    if (filters.sizes && filters.sizes.length > 0) {
      filteredProducts = filteredProducts.filter(product =>
        product.sizes?.some(size => filters.sizes?.includes(size))
      );
    }

    // Filter by stock status
    if (filters.inStock !== undefined) {
      filteredProducts = filteredProducts.filter(
        product => product.in_stock === filters.inStock
      );
    }

    setProducts(filteredProducts);
  };

  // Get new products
  const getNewProducts = (): Product[] => {
    return allProducts.filter(product => product.is_new);
  };

  // Get sale products
  const getSaleProducts = (): Product[] => {
    return allProducts.filter(product => product.is_on_sale && product.sale_price);
  };

  return {
    products,
    loading,
    error,
    applyFilters,
    getNewProducts,
    getSaleProducts
  };
}