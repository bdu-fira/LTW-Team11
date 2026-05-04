import React, { createContext, useState, useContext, useEffect } from 'react';
import API from '../services/api';
import { useAuth } from './AuthContext';

const CartContext = createContext();

export const useCart = () => useContext(CartContext);

export const CartProvider = ({ children }) => {
  const [cart, setCart] = useState([]);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      fetchCart();
    } else {
      setCart([]);
    }
  }, [user]);

  const fetchCart = async () => {
    try {
      const { data } = await API.get('/cart');
      setCart(data);
    } catch (error) {
      console.error('Lỗi khi tải giỏ hàng:', error);
    }
  };

  const addToCart = async (productId, quantity) => {
    try {
      const { data } = await API.post('/cart', { productId, quantity });
      setCart(data);
    } catch (error) {
      throw error;
    }
  };

  const updateCartItem = async (itemId, quantity) => {
    try {
      const { data } = await API.put(`/cart/${itemId}`, { quantity });
      setCart(data);
    } catch (error) {
      throw error;
    }
  };

  const removeFromCart = async (itemId) => {
    try {
      const { data } = await API.delete(`/cart/${itemId}`);
      setCart(data);
    } catch (error) {
      throw error;
    }
  };

  const getCartTotal = () => {
    return cart.reduce((total, item) => {
      return total + (item.Product.price * item.quantity);
    }, 0);
  };

  return (
    <CartContext.Provider value={{ 
      cart, 
      addToCart, 
      updateCartItem, 
      removeFromCart,
      getCartTotal 
    }}>
      {children}
    </CartContext.Provider>
  );
};