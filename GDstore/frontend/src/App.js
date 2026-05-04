import React from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { Box } from '@mui/material';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import HomePage from './pages/HomePage';
import ProductsPage from './pages/ProductsPage';
import ProductDetailPage from './pages/ProductDetailPage';
import CartPage from './pages/CartPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ProfilePage from './pages/ProfilePage';
import AdminPage from './pages/AdminPage';
import ShipperPage from './pages/ShipperPage';
import './App.css';

const AUTH_ROUTES = ['/login', '/register'];

const theme = createTheme({
  palette: {
    primary:    { main: '#c62828' },
    secondary:  { main: '#4ecdc4' },
    background: { default: '#fafafa' }
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    button:     { textTransform: 'none', fontWeight: 600 }
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          transition: 'all 0.25s ease',
          '&:hover': { transform: 'translateY(-1px)' },
          '&:active': { transform: 'translateY(0)' },
        },
        contained: {
          boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
          '&:hover': { boxShadow: '0 6px 16px rgba(0,0,0,0.2)' }
        }
      }
    },
    MuiCard: {
      styleOverrides: { root: { borderRadius: 12 } }
    },
    MuiChip: {
      styleOverrides: { root: { borderRadius: 6 } }
    }
  }
});

/* ── Nội dung trang + animation khi đổi route ── */
function AnimatedRoutes() {
  const location  = useLocation();
  const isAuthPage = AUTH_ROUTES.includes(location.pathname);
  const isAdminPage = location.pathname.startsWith('/admin');

  return (
    <>
      {/* Navbar ẩn trên trang auth */}
      {!isAuthPage && <Navbar />}

      <Box
        key={location.pathname}
        sx={{
          animation: 'fadeIn 0.35s ease both',
          /* Nếu là auth page → full-screen, không cần margin */
          minHeight: isAuthPage ? '100vh' : 'auto',
          overflowX: 'hidden',
          width: '100%',
          maxWidth: '100vw'
        }}
      >
        <Routes location={location}>
          <Route path="/"           element={<HomePage />} />
          <Route path="/products"   element={<ProductsPage />} />
          <Route path="/product/:id" element={<ProductDetailPage />} />
          <Route path="/cart"       element={<CartPage />} />
          <Route path="/login"      element={<LoginPage />} />
          <Route path="/register"   element={<RegisterPage />} />
          <Route path="/profile"    element={<ProfilePage />} />
          <Route path="/admin"      element={<AdminPage />} />
          <Route path="/shipper"    element={<ShipperPage />} />
        </Routes>
      </Box>

      {/* Footer ẩn trên trang auth + admin */}
      {!isAuthPage && !isAdminPage && <Footer />}
    </>
  );
}

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <CartProvider>
          <BrowserRouter>
            <AnimatedRoutes />
          </BrowserRouter>
        </CartProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;