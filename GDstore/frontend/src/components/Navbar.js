import React, { useState, useEffect } from 'react';
import {
  AppBar, Toolbar, Typography, IconButton,
  Badge, Menu, MenuItem, Box, Container, Avatar,
  InputBase, Button, Drawer, List, ListItem, ListItemText
} from '@mui/material';
import { ShoppingCart, Person, Search, Menu as MenuIcon } from '@mui/icons-material';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';

const NAV_LINKS = [
  { title: 'Nhà bếp', path: '/products?category=nha-bep' },
  { title: 'Phòng khách', path: '/products?category=phong-khach' },
  { title: 'Phòng ngủ', path: '/products?category=phong-ngu' },
  { title: 'Điện tử', path: '/products?category=dien-tu' },
  { title: 'Dụng cụ', path: '/products?category=dung-cu' },
  { title: 'Flash Sale', path: '/products?flashSale=true', special: true },
];

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const { cart } = useCart();
  const [anchorEl, setAnchorEl] = useState(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [scrolled, setScrolled] = useState(false);
  const [cartBounce, setCartBounce] = useState(false);

  // Shadow khi scroll
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Bounce cart khi số lượng thay đổi
  const prevCartLen = React.useRef(cart?.length || 0);
  useEffect(() => {
    if (cart?.length > prevCartLen.current) {
      setCartBounce(true);
      setTimeout(() => setCartBounce(false), 600);
    }
    prevCartLen.current = cart?.length || 0;
  }, [cart?.length]);

  const handleMenu = (e) => setAnchorEl(e.currentTarget);
  const handleClose = () => setAnchorEl(null);
  const handleLogout = () => { logout(); handleClose(); navigate('/login'); };
  const handleDrawerToggle = () => setMobileOpen(!mobileOpen);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/products?keyword=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery('');
    }
  };

  const getAvatarText = () => {
    if (!user) return 'U';
    return user.name ? user.name.charAt(0).toUpperCase() : user.email.charAt(0).toUpperCase();
  };

  if (['/login', '/register'].includes(location.pathname)) return null;

  return (
    <AppBar
      position="sticky"
      elevation={scrolled ? 4 : 0}
      sx={{
        bgcolor: '#c62828',
        borderBottom: '1px solid #b71c1c',
        transition: 'box-shadow 0.3s ease, backdrop-filter 0.3s ease',
        boxShadow: scrolled ? '0 4px 24px rgba(198,40,40,0.4)' : 'none',
      }}
    >
      <Container maxWidth="lg" sx={{ px: { xs: 1, sm: 2, md: 3 } }}>
        <Toolbar sx={{ px: '0 !important', minHeight: '80px', justifyContent: 'space-between', flexWrap: 'nowrap' }}>

          {/* ── MOBILE MENU BUTTON ── */}
          <Box sx={{ display: { xs: 'flex', md: 'none' }, alignItems: 'center' }}>
            <IconButton onClick={handleDrawerToggle} sx={{ color: 'white', ml: -1, mr: 1 }}>
              <MenuIcon />
            </IconButton>
          </Box>

          {/* ── LOGO ── */}
          <Box
            component={Link} to="/"
            sx={{
              display: 'flex', alignItems: 'baseline', gap: 0.5,
              textDecoration: 'none', mr: { xs: 2, md: 4 },
              transition: 'transform 0.25s ease',
              '&:hover': { transform: 'scale(1.04)' }
            }}
          >
            <Typography variant="h3" sx={{
              fontWeight: 900, fontStyle: 'italic', color: 'white',
              letterSpacing: '-2px', fontSize: { xs: '2rem', md: '2.5rem' },
              textShadow: '2px 2px 4px rgba(0,0,0,0.25)'
            }}>GD</Typography>
            <Typography variant="h5" sx={{
              fontWeight: 600, fontStyle: 'italic', color: 'white',
              letterSpacing: '-0.5px', fontSize: { xs: '1.2rem', md: '1.5rem' }, opacity: 0.9
            }}>STORE</Typography>
          </Box>

          {/* ── NAV LINKS ── */}
          <Box sx={{ display: { xs: 'none', md: 'flex' }, gap: { md: 2, lg: 4 }, flexGrow: 1, justifyContent: 'center', overflow: 'hidden' }}>
            {NAV_LINKS.map((link, i) => (
              <Box
                key={link.title}
                component={Link} to={link.path}
                sx={{
                  color: link.special ? '#ffeb3b' : 'white',
                  textDecoration: 'none',
                  fontSize: '0.9rem',
                  fontWeight: 600,
                  position: 'relative',
                  pb: 0.5,
                  animation: 'slideDown 0.4s ease both',
                  animationDelay: `${i * 0.06}s`,
                  transition: 'color 0.2s, transform 0.2s',
                  '&::after': {
                    content: '""',
                    position: 'absolute',
                    bottom: 0, left: 0,
                    width: '0%', height: '2px',
                    bgcolor: link.special ? '#ffeb3b' : 'rgba(255,255,255,0.9)',
                    transition: 'width 0.3s ease',
                    borderRadius: '2px',
                  },
                  '&:hover': {
                    color: link.special ? '#fff176' : 'rgba(255,255,255,0.95)',
                    transform: 'translateY(-2px)',
                  },
                  '&:hover::after': { width: '100%' },
                }}
              >
                {link.special ? '⚡ Flash Sale' : link.title}
              </Box>
            ))}
          </Box>

          {/* ── ICONS PHẢI ── */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>

            {/* Search */}
            <Box sx={{ display: { xs: 'none', sm: 'flex' }, alignItems: 'center', position: 'relative' }}>
              <form onSubmit={handleSearch} style={{ display: 'flex' }}>
                <InputBase
                  placeholder="Tìm kiếm sản phẩm..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  sx={{
                    bgcolor: 'rgba(255,255,255,0.18)',
                    px: 2, py: 0.5, borderRadius: 2,
                    width: 200, fontSize: '0.85rem', color: 'white', pr: 4,
                    transition: 'background 0.3s, width 0.3s',
                    '&:focus-within': {
                      bgcolor: 'rgba(255,255,255,0.28)',
                      width: 240,
                    },
                    '& input::placeholder': { color: 'rgba(255,255,255,0.7)', opacity: 1 }
                  }}
                />
                <IconButton type="submit" size="small"
                  sx={{ position: 'absolute', right: 4, top: '50%', transform: 'translateY(-50%)', color: 'white' }}>
                  <Search sx={{ fontSize: 20 }} />
                </IconButton>
              </form>
            </Box>

            {/* Cart với bounce */}
            <IconButton
              component={Link} to="/cart"
              sx={{
                color: 'white',
                transition: 'transform 0.2s',
                animation: cartBounce ? 'bounceCart 0.5s ease' : 'none',
                '&:hover': { transform: 'scale(1.15)' }
              }}
            >
              <Badge
                badgeContent={cart?.length || 0}
                sx={{ '& .MuiBadge-badge': { bgcolor: 'white', color: '#c62828', fontWeight: 'bold' } }}
              >
                <ShoppingCart />
              </Badge>
            </IconButton>

            {/* User menu */}
            {user ? (
              <>
                <IconButton onClick={handleMenu} sx={{ p: 0.5, transition: 'transform 0.2s', '&:hover': { transform: 'scale(1.1)' } }}>
                  <Avatar
                    src={user?.avatarUrl}
                    sx={{
                      width: 32, height: 32,
                      bgcolor: 'rgba(255,255,255,0.2)',
                      color: 'white', fontSize: '0.9rem', fontWeight: 'bold',
                      border: '2px solid rgba(255,255,255,0.4)',
                      transition: 'border-color 0.2s',
                      '&:hover': { borderColor: 'white' }
                    }}>
                    {getAvatarText()}
                  </Avatar>
                </IconButton>
                <Menu
                  anchorEl={anchorEl}
                  open={Boolean(anchorEl)}
                  onClose={handleClose}
                  PaperProps={{
                    elevation: 3,
                    sx: {
                      mt: 1.5, borderRadius: 2, minWidth: 160,
                      animation: 'scaleIn 0.2s cubic-bezier(0.34,1.56,0.64,1)',
                      transformOrigin: 'top right',
                      overflow: 'visible',
                      '&::before': {
                        content: '""',
                        display: 'block',
                        position: 'absolute',
                        top: -6, right: 14,
                        width: 12, height: 12,
                        bgcolor: 'background.paper',
                        transform: 'rotate(45deg)',
                        zIndex: 0,
                        boxShadow: '-1px -1px 3px rgba(0,0,0,0.08)',
                      }
                    }
                  }}
                  transformOrigin={{ horizontal: 'right', vertical: 'top' }}
                  anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
                >
                  <MenuItem onClick={() => { handleClose(); navigate('/profile'); }} sx={{ fontSize: '0.95rem', '&:hover': { bgcolor: '#fff5f5', color: '#c62828' } }}>
                    <Person sx={{ mr: 1.5, fontSize: 20, color: '#555' }} /> Hồ sơ
                  </MenuItem>
                  {user.role === 'admin' && (
                    <MenuItem onClick={() => { handleClose(); navigate('/admin'); }} sx={{ fontSize: '0.95rem', '&:hover': { bgcolor: '#fff5f5', color: '#c62828' } }}>
                      👑 Quản trị viên
                    </MenuItem>
                  )}
                  {(user.role === 'shipper' || user.role === 'admin') && (
                    <MenuItem onClick={() => { handleClose(); navigate('/shipper'); }} sx={{ fontSize: '0.95rem', '&:hover': { bgcolor: '#f3f0ff', color: '#7c3aed' } }}>
                      🚚 Trang Shipper
                    </MenuItem>
                  )}
                  <MenuItem onClick={handleLogout} sx={{ fontSize: '0.95rem', color: '#c62828', '&:hover': { bgcolor: '#fff5f5' } }}>
                    🚪 Đăng xuất
                  </MenuItem>
                </Menu>
              </>
            ) : (
              <IconButton
                component={Link} to="/login"
                sx={{ color: 'white', transition: 'transform 0.2s', '&:hover': { transform: 'scale(1.15)' } }}
              >
                <Person />
              </IconButton>
            )}
          </Box>
        </Toolbar>
      </Container>

      {/* ── MOBILE DRAWER ── */}
      <Drawer
        anchor="left"
        open={mobileOpen}
        onClose={handleDrawerToggle}
        sx={{
          display: { xs: 'block', md: 'none' },
          '& .MuiDrawer-paper': { boxSizing: 'border-box', width: 260, bgcolor: '#fafafa' },
        }}
      >
        <Box sx={{ p: 2, bgcolor: '#c62828', color: 'white', display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography variant="h5" sx={{ fontWeight: 900, fontStyle: 'italic', letterSpacing: '-1px' }}>GD STORE</Typography>
        </Box>
        <Box sx={{ p: 2 }}>
          {/* Mobile Search */}
          <form onSubmit={(e) => { handleSearch(e); handleDrawerToggle(); }}>
            <InputBase
              placeholder="Tìm kiếm sản phẩm..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              sx={{
                bgcolor: '#eee',
                px: 2, py: 0.5, borderRadius: 2,
                width: '100%', fontSize: '0.85rem', mb: 2
              }}
              endAdornment={<Search sx={{ color: '#aaa', fontSize: 20 }} />}
            />
          </form>
          <List disablePadding>
            {NAV_LINKS.map((link) => (
              <ListItem
                button
                key={link.title}
                component={Link}
                to={link.path}
                onClick={handleDrawerToggle}
                sx={{ borderRadius: 1, mb: 0.5, '&:hover': { bgcolor: 'rgba(0,0,0,0.04)' } }}
              >
                <ListItemText
                  primary={link.special ? '⚡ Flash Sale' : link.title}
                  primaryTypographyProps={{ fontWeight: 600, color: link.special ? '#ee4d2d' : '#333' }}
                />
              </ListItem>
            ))}
            {(user?.role === 'admin' || user?.role === 'shipper') && (
              <ListItem button component={Link} to="/shipper" onClick={handleDrawerToggle}
                sx={{ borderRadius: 1, mb: 0.5, '&:hover': { bgcolor: '#f3f0ff' } }}>
                <ListItemText primary="🚚 Trang Shipper"
                  primaryTypographyProps={{ fontWeight: 700, color: '#7c3aed' }} />
              </ListItem>
            )}
          </List>
        </Box>
      </Drawer>
    </AppBar>
  );
};

export default Navbar;