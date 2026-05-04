import React, { createContext, useState, useContext, useEffect } from 'react';
import API from '../services/api';
import { useAuth } from './AuthContext';

const CartContext = createContext();

export const useCart = () => useContext(CartContext);

export const CartProvider = ({ children }) => {
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(false);
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
      setLoading(true);
      const { data } = await API.get('/cart');
      setCart(data);
    } catch (error) {
      console.error('Lỗi tải giỏ hàng:', error);
    } finally {
      setLoading(false);
    }
  };

  const addToCart = async (productId, quantity) => {
    try {
      setLoading(true);
      const { data } = await API.post('/cart', { productId, quantity });
      
      if (data.success) {
        setCart(data.cart);
        return { success: true, message: data.message };
      } else {
        return { success: false, message: data.message };
      }
    } catch (error) {
      console.error('Lỗi thêm vào giỏ:', error);
      return { 
        success: false, 
        message: error.response?.data?.message || 'Không thể thêm vào giỏ hàng' 
      };
    } finally {
      setLoading(false);
    }
  };

  const updateCartItem = async (itemId, quantity) => {
    try {
      setLoading(true);
      const { data } = await API.put(`/cart/${itemId}`, { quantity });
      setCart(data);
      return { success: true };
    } catch (error) {
      console.error('Lỗi cập nhật giỏ:', error);
      return { 
        success: false, 
        message: error.response?.data?.message || 'Không thể cập nhật giỏ hàng' 
      };
    } finally {
      setLoading(false);
    }
  };

  const removeFromCart = async (itemId) => {
    try {
      setLoading(true);
      const { data } = await API.delete(`/cart/${itemId}`);
      setCart(data);
      return { success: true };
    } catch (error) {
      console.error('Lỗi xóa khỏi giỏ:', error);
      return { 
        success: false, 
        message: error.response?.data?.message || 'Không thể xóa sản phẩm' 
      };
    } finally {
      setLoading(false);
    }
  };

  const clearCart = async () => {
    try {
      setLoading(true);
      await API.delete('/cart');
      setCart([]);
      return { success: true };
    } catch (error) {
      console.error('Lỗi xóa giỏ hàng:', error);
      return { success: false };
    } finally {
      setLoading(false);
    }
  };

  const getCartTotal = () => {
    return cart.reduce((total, item) => {
      const originalPrice = item.Product?.price || 0;
      const finalPrice = item.Product?.isFlashSale 
        ? originalPrice * (1 - (item.Product.flashSaleDiscount || 0) / 100) 
        : originalPrice;
      return total + (finalPrice * item.quantity);
    }, 0);
  };

  const getCartCount = () => {
    return cart.reduce((total, item) => total + item.quantity, 0);
  };

  return (
    <CartContext.Provider value={{ 
      cart,
      loading,
      addToCart,
      updateCartItem,
      removeFromCart,
      clearCart,
      getCartTotal,
      getCartCount,
      fetchCart
    }}>
      {children}
    </CartContext.Provider>
  );
};