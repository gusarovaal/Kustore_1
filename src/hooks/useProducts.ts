import { useState, useEffect, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import { Product } from '../types';
import { FilterState } from '../components/FilterModal';

interface UseProductsReturn {
  products: Product[];
  loading: boolean;
  error: string | null;
  applyFilters: (products: Product[], filters: FilterState) => Product[];
  getNewProducts: () => Product[];
  getSaleProducts: () => Product[];
}

export function useProducts(): UseProductsReturn {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch products from Supabase
  useEffect(() => {
    async function fetchProducts() {
      try {
        setLoading(true);
        setError(null);

        console.log('Fetching products from Supabase...');

        const { data, error: fetchError } = await supabase
          .from('products')
          .select('*')
          .eq('in_stock', true)
          .order('created_at', { ascending: false });

        if (fetchError) {
          console.error('Supabase error:', fetchError);
          throw fetchError;
        }

        console.log('Products fetched successfully:', data?.length || 0);
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
  const applyFilters = (productsToFilter: Product[], filters: FilterState): Product[] => {
    let filteredProducts = [...productsToFilter];

    // Filter by price range
    if (filters.priceRange) {
      const [minPrice, maxPrice] = filters.priceRange;
      filteredProducts = filteredProducts.filter(product => {
        const price = product.sale_price || product.price;
        return price >= minPrice && price <= maxPrice;
      });
    }

    // Filter by categories
    if (filters.categories && filters.categories.length > 0) {
      filteredProducts = filteredProducts.filter(product =>
        filters.categories.includes(product.category)
      );
    }

    // Filter by sizes
    if (filters.sizes && filters.sizes.length > 0) {
      filteredProducts = filteredProducts.filter(product =>
        product.sizes?.some(size => filters.sizes.includes(size))
      );
    }

    // Filter by colors
    if (filters.colors && filters.colors.length > 0) {
      filteredProducts = filteredProducts.filter(product =>
        product.color && filters.colors.includes(product.color)
      );
    }

    // Filter by brands
    if (filters.brands && filters.brands.length > 0) {
      filteredProducts = filteredProducts.filter(product =>
        product.brand && filters.brands.includes(product.brand)
      );
    }

    // Filter by new status
    if (filters.isNew !== null) {
      filteredProducts = filteredProducts.filter(product =>
        product.is_new === filters.isNew
      );
    }

    // Filter by sale status
    if (filters.isOnSale !== null) {
      filteredProducts = filteredProducts.filter(product =>
        product.is_on_sale === filters.isOnSale
      );
    }

    // Filter by stock status
    if (!filters.inStock) {
      filteredProducts = filteredProducts.filter(product =>
        product.in_stock === filters.inStock
      );
    }

    return filteredProducts;
  };

  // Get new products
  const getNewProducts = (): Product[] => {
    return products.filter(product => product.is_new);
  };

  // Get sale products
  const getSaleProducts = (): Product[] => {
    return products.filter(product => product.is_on_sale && product.sale_price);
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