import React, { createContext, useContext, useReducer } from 'react';
import { CartItem, Product } from '../types';

interface CartState {
  items: CartItem[];
  total: number;
  itemCount: number;
}

type CartAction =
  | { type: 'ADD_ITEM'; payload: { product: Product; size: string } }
  | { type: 'REMOVE_ITEM'; payload: { productId: string; size: string } }
  | { type: 'UPDATE_QUANTITY'; payload: { productId: string; size: string; quantity: number } }
  | { type: 'CLEAR_CART' };

const CartContext = createContext<{
  state: CartState;
  dispatch: React.Dispatch<CartAction>;
  addToCart: (item: any) => void;
} | undefined>(undefined);

function cartReducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case 'ADD_ITEM': {
      const { product, size } = action.payload;
      
      const existingItem = state.items.find(
        item => item.product.id === product.id && item.size === size
      );

      if (existingItem) {
        const updatedItems = state.items.map(item =>
          item.product.id === product.id && item.size === size
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
        const total = updatedItems.reduce((sum, item) => {
          const price = item.product.is_on_sale && item.product.sale_price ? item.product.sale_price : item.product.price;
          return sum + price * item.quantity;
        }, 0);
        const itemCount = updatedItems.reduce((sum, item) => sum + item.quantity, 0);
        return { items: updatedItems, total, itemCount };
      }

      const newItems = [...state.items, { product, size, quantity: 1 }];
      const total = newItems.reduce((sum, item) => {
        const price = item.product.is_on_sale && item.product.sale_price ? item.product.sale_price : item.product.price;
        return sum + price * item.quantity;
      }, 0);
      const itemCount = newItems.reduce((sum, item) => sum + item.quantity, 0);
      return { items: newItems, total, itemCount };
    }

    case 'REMOVE_ITEM': {
      const updatedItems = state.items.filter(
        item => !(item.product.id === action.payload.productId && item.size === action.payload.size)
      );
      const total = updatedItems.reduce((sum, item) => {
        const price = item.product.is_on_sale && item.product.sale_price ? item.product.sale_price : item.product.price;
        return sum + price * item.quantity;
      }, 0);
      const itemCount = updatedItems.reduce((sum, item) => sum + item.quantity, 0);
      return { items: updatedItems, total, itemCount };
    }

    case 'UPDATE_QUANTITY': {
      const { productId, size, quantity } = action.payload;
      
      const updatedItems = state.items.map(item =>
        item.product.id === productId && item.size === size
          ? { ...item, quantity }
          : item
      );
      const total = updatedItems.reduce((sum, item) => {
        const price = item.product.is_on_sale && item.product.sale_price ? item.product.sale_price : item.product.price;
        return sum + price * item.quantity;
      }, 0);
      const itemCount = updatedItems.reduce((sum, item) => sum + item.quantity, 0);
      return { items: updatedItems, total, itemCount };
    }

    case 'CLEAR_CART':
      return { items: [], total: 0, itemCount: 0 };

    default:
      return state;
  }
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(cartReducer, {
    items: [],
    total: 0,
    itemCount: 0,
  });

  const addToCart = (item: any) => {
    dispatch({ 
      type: 'ADD_ITEM', 
      payload: { 
        product: {
          id: item.id,
          name: item.name,
          price: item.price,
          sale_price: null,
          image_url: item.image,
          category: 'general',
          description: '',
          sizes: [item.size],
          in_stock: true,
          is_new: false,
          is_on_sale: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }, 
        size: item.size 
      } 
    });
  };

  return (
    <CartContext.Provider value={{ state, dispatch, addToCart }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}