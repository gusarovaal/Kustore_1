import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Product } from '../types';
import { FilterState } from '../components/FilterModal';

export function useProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('Fetching products from Supabase...');
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }

      console.log('Fetched products:', data);

      if (!data || data.length === 0) {
        console.warn('No products found in database');
        setProducts([]);
        return;
      }

      // Transform database format to frontend format
      const transformedProducts: Product[] = data.map(item => ({
        id: item.id,
        name: item.name,
        price: item.price,
        sale_price: item.sale_price,
        image_url: item.image_url,
        images: item.images || [item.image_url],
        image_alt_texts: item.image_alt_texts || [item.name],
        category: item.category,
        subcategory: item.subcategory,
        color: item.color,
        brand: item.brand,
        description: item.description,
        sizes: item.sizes,
        in_stock: item.in_stock,
        is_new: item.is_new,
        is_on_sale: item.is_on_sale,
        created_at: item.created_at,
        updated_at: item.updated_at,
        measurements: item.measurements || {},
        stock_quantity: item.stock_quantity || {}
      }));

      setProducts(transformedProducts);
      console.log('Transformed products:', transformedProducts);
    } catch (err) {
      console.error('Error fetching products:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const getNewProducts = () => {
    return products.filter(product => product.is_new);
  };

  const getSaleProducts = () => {
    return products.filter(product => product.is_on_sale);
  };

  const getProductsByCategory = (category: string) => {
    console.log('Getting products by category:', category, 'Total products:', products.length);
    if (category === 'all') return products;
    const filtered = products.filter(product => product.category === category);
    console.log('Filtered by category result:', filtered.length);
    return filtered;
  };

  const applyFilters = (products: Product[], filters: FilterState): Product[] => {
    return products.filter(product => {
      // Price filter
      const price = product.is_on_sale && product.sale_price ? product.sale_price : product.price;
      if (price < filters.priceRange[0] || price > filters.priceRange[1]) {
        return false;
      }

      // Size filter
      if (filters.sizes.length > 0) {
        const hasMatchingSize = filters.sizes.some(size => product.sizes.includes(size));
        if (!hasMatchingSize) return false;
      }

      // Color filter (mock implementation - in real app you'd have color data)
      if (filters.colors.length > 0) {
        if (!filters.colors.includes(product.color || '')) {
          return false;
        }
      }

      // Brand filter (mock implementation)
      if (filters.brands.length > 0) {
        if (!filters.brands.includes(product.brand || '')) {
          return false;
        }
      }

      // Category filter
      if (filters.categories.length > 0) {
        if (!filters.categories.includes(product.category)) {
          return false;
        }
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
      if (filters.inStock && !product.in_stock) {
        return false;
      }

      return true;
    });
  };
  return {
    products,
    loading,
    error,
    getNewProducts,
    getSaleProducts,
    getProductsByCategory,
    applyFilters,
    refetch: fetchProducts
  };
}