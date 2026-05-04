import React, { useState, useEffect } from 'react';
import {
  Container, Grid, Card, CardMedia, CardContent, Typography,
  Button, TextField, FormControl, InputLabel, Select, MenuItem,
  Box, Pagination, CircularProgress, Alert, Paper,
  Chip, IconButton, InputAdornment, Rating, Breadcrumbs,
  Link, Skeleton, Avatar, Divider
} from '@mui/material';
import {
  Search, ShoppingCart, Favorite, FavoriteBorder,
  LocalShipping, FlashOn, FilterList, Close,
  Sort, Home, ChevronRight
} from '@mui/icons-material';
import { useNavigate, useLocation, Link as RouterLink } from 'react-router-dom';
import API from '../services/api';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { getFirstImage } from '../utils/imageUtils';

const ProductsPage = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [totalProducts, setTotalProducts] = useState(0);

  // Filter states
  const getInitialFilters = () => {
    const params = new URLSearchParams(window.location.search);
    return {
      keyword: params.get('keyword') || '',
      category: params.get('category') || '',
      minPrice: params.get('minPrice') || '',
      maxPrice: params.get('maxPrice') || '',
      sortBy: 'newest',
      flashSale: params.get('flashSale') === 'true'
    };
  };
  const [filters, setFilters] = useState(getInitialFilters);

  const [tempFilters, setTempFilters] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return {
      keyword: params.get('keyword') || '',
      category: params.get('category') || '',
      minPrice: params.get('minPrice') || '',
      maxPrice: params.get('maxPrice') || ''
    };
  });

  const [favorites, setFavorites] = useState([]);
  const [showMobileFilter, setShowMobileFilter] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();
  const { addToCart } = useCart();
  const { user } = useAuth();

  // Format price function
  const formatPrice = (price) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(price).replace('₫', 'đ');
  };

  // Sync khi URL thay doi (nguoi dung dang o trang products va click danh muc tren header)
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const category = params.get('category') || '';
    const keyword = params.get('keyword') || '';
    const minPrice = params.get('minPrice') || '';
    const maxPrice = params.get('maxPrice') || '';
    const flashSale = params.get('flashSale') === 'true';
    setFilters(prev => ({ ...prev, category, keyword, minPrice, maxPrice, flashSale }));
    setTempFilters({ keyword, category, minPrice, maxPrice });
  }, [location.search]);


  // Fetch products when filters change
  useEffect(() => {
    fetchProducts();
  }, [page, filters]);

  const fetchProducts = async () => {
    try {
      setLoading(true);

      // Build query params
      const params = new URLSearchParams();
      params.append('page', page);
      params.append('limit', 20);

      if (filters.keyword) params.append('keyword', filters.keyword);
      if (filters.category) params.append('category', filters.category);

      let finalMinPrice = filters.minPrice;
      let finalMaxPrice = filters.maxPrice;

      if (finalMinPrice === 'over_3000000') {
        finalMinPrice = '3000000';
      }

      if (finalMaxPrice === 'over_3000000') {
        if (!finalMinPrice) {
          finalMinPrice = '3000000';
        }
        finalMaxPrice = '';
      }

      if (finalMinPrice) params.append('minPrice', finalMinPrice);
      if (finalMaxPrice) params.append('maxPrice', finalMaxPrice);

      if (filters.sortBy) params.append('sortBy', filters.sortBy);
      if (filters.flashSale) params.append('flashSale', 'true');
      // Debug: Xem API đang gọi gì
      console.log('🔍 Fetching with flashSale:', filters.flashSale);
      console.log('🔍 Fetching products with filters:', Object.fromEntries(params));

      const { data } = await API.get(`/products?${params}`);

      console.log('✅ Received products:', data.products?.length || 0);

      setProducts(data.products || []);
      setPages(data.pages || 1);
      setTotalProducts(data.total || 0);
      setError('');
    } catch (error) {
      console.error('Lỗi tải sản phẩm:', error);
      setError('Không thể tải sản phẩm. Vui lòng thử lại sau.');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setFilters({
      ...filters,
      keyword: tempFilters.keyword,
      category: tempFilters.category,
      minPrice: tempFilters.minPrice,
      maxPrice: tempFilters.maxPrice
    });
    setPage(1);
  };

  const handleSortChange = (event) => {
    setFilters(prev => ({
      ...prev,
      sortBy: event.target.value
    }));
    setPage(1);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const clearFilters = () => {
    setTempFilters({
      keyword: '',
      category: '',
      minPrice: '',
      maxPrice: ''
    });
    setFilters({
      keyword: '',
      category: '',
      minPrice: '',
      maxPrice: '',
      sortBy: 'newest'
    });
    setPage(1);
  };

  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  const handleAddToCart = async (product) => {
    if (!user) {
      navigate('/login');
      return;
    }

    const result = await addToCart(product.id, 1);
    setSnackbar({
      open: true,
      message: result.success ? result.message : (result.message || 'Lỗi thêm vào giỏ hàng'),
      severity: result.success ? 'success' : 'error'
    });
  };

  const handleCloseSnackbar = () => setSnackbar({ ...snackbar, open: false });

  const toggleFavorite = (productId) => {
    if (favorites.includes(productId)) {
      setFavorites(favorites.filter(id => id !== productId));
    } else {
      setFavorites([...favorites, productId]);
    }
  };

  // Sort options
  const sortOptions = [
    { value: 'newest', label: 'Mới nhất' },
    { value: 'price_asc', label: 'Giá: Thấp đến cao' },
    { value: 'price_desc', label: 'Giá: Cao đến thấp' },
    { value: 'name_asc', label: 'Tên: A-Z' },
    { value: 'name_desc', label: 'Tên: Z-A' },
    { value: 'best_selling', label: 'Bán chạy' }
  ];

  // Category options
  const categoryOptions = [
    { value: '', label: 'Tất cả danh mục' },
    { value: 'nha-bep', label: 'Nhà bếp' },
    { value: 'phong-khach', label: 'Phòng khách' },
    { value: 'phong-ngu', label: 'Phòng ngủ' },
    { value: 'dien-tu', label: 'Điện tử' },
    { value: 'dung-cu', label: 'Dụng cụ' }
  ];

  // Price options
  const priceOptions = [
    { value: '', label: 'Không chọn' },
    { value: '0', label: '0đ' },
    { value: '10000', label: '10.000đ' },
    { value: '20000', label: '20.000đ' },
    { value: '50000', label: '50.000đ' },
    { value: '100000', label: '100.000đ' },
    { value: '200000', label: '200.000đ' },
    { value: '500000', label: '500.000đ' },
    { value: '1000000', label: '1.000.000đ' },
    { value: '2000000', label: '2.000.000đ' },
    { value: '3000000', label: '3.000.000đ' },
    { value: 'over_3000000', label: 'Trên 3.000.000đ' }
  ];

  if (loading && products.length === 0) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Grid container spacing={2}>
          {[1, 2, 3, 4, 5, 6, 7, 8].map((item) => (
            <Grid item xs={6} sm={3} md={3} key={item}>
              <Skeleton variant="rectangular" height={180} sx={{ borderRadius: 2 }} />
              <Skeleton variant="text" sx={{ mt: 1 }} />
              <Skeleton variant="text" width="60%" />
            </Grid>
          ))}
        </Grid>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4, animation: 'fadeIn 0.4s ease both' }}>
      {/* Breadcrumb */}
      <Breadcrumbs sx={{ mb: 3 }}>
        <Link
          component={RouterLink}
          to="/"
          underline="hover"
          color="inherit"
          sx={{ display: 'flex', alignItems: 'center' }}
        >
          <Home sx={{ mr: 0.5 }} fontSize="inherit" />
          Trang chủ
        </Link>
        <Typography color="text.primary">Sản phẩm</Typography>
      </Breadcrumbs>

      {/* Header với thanh tìm kiếm */}
      <Paper sx={{ p: 3, mb: 3, borderRadius: 2 }}>
        <Typography variant="h5" fontWeight="600" gutterBottom>
          Tìm kiếm sản phẩm
        </Typography>

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {/* Hàng 1: Tìm kiếm & Danh mục */}
          <Box sx={{ display: 'flex', gap: 2, flexDirection: { xs: 'column', md: 'row' } }}>
            <Box sx={{ flex: 1 }}>
              <TextField
                fullWidth
                size="small"
                placeholder="Nhập tên sản phẩm..."
                value={tempFilters.keyword}
                onChange={(e) => setTempFilters({ ...tempFilters, keyword: e.target.value })}
                onKeyPress={handleKeyPress}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search color="primary" />
                    </InputAdornment>
                  ),
                }}
              />
            </Box>

            <Box sx={{ flex: 1 }}>
              <FormControl fullWidth size="small">
                <InputLabel>Danh mục</InputLabel>
                <Select
                  value={tempFilters.category}
                  label="Danh mục"
                  onChange={(e) => {
                    const val = e.target.value;
                    setTempFilters(prev => ({ ...prev, category: val }));
                    setFilters(prev => ({ ...prev, category: val }));
                    setPage(1);
                  }}
                >
                  {categoryOptions.map(option => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>
          </Box>

          {/* Hàng 2: Khoảng giá và nút Tìm */}
          <Box sx={{ display: 'flex', gap: 2, flexDirection: { xs: 'column', md: 'row' } }}>
            <Box sx={{ flex: 1 }}>
              <FormControl fullWidth size="small">
                <InputLabel>Giá từ</InputLabel>
                <Select
                  value={tempFilters.minPrice}
                  label="Giá từ"
                  onChange={(e) => setTempFilters({ ...tempFilters, minPrice: e.target.value })}
                >
                  {priceOptions.filter(opt => opt.value !== 'over_3000000').map(option => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>

            <Box sx={{ flex: 1 }}>
              <FormControl fullWidth size="small">
                <InputLabel>Giá đến</InputLabel>
                <Select
                  value={tempFilters.maxPrice}
                  label="Giá đến"
                  onChange={(e) => setTempFilters({ ...tempFilters, maxPrice: e.target.value })}
                >
                  {priceOptions.map(option => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>

            <Box sx={{ width: { xs: '100%', md: '150px' } }}>
              <Button
                fullWidth
                variant="contained"
                onClick={handleSearch}
                startIcon={<Search />}
                sx={{ height: '40px' }}
              >
                Tìm
              </Button>
            </Box>
          </Box>
        </Box>

        {/* Hiển thị filters đang áp dụng */}
        {(filters.keyword || filters.category || filters.minPrice || filters.maxPrice) && (
          <Box sx={{ mt: 2, display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
            <Typography variant="body2" color="text.secondary">
              Đang lọc:
            </Typography>
            {filters.keyword && (
              <Chip
                size="small"
                label={`Tìm: ${filters.keyword}`}
                onDelete={() => {
                  setTempFilters({ ...tempFilters, keyword: '' });
                  setFilters({ ...filters, keyword: '' });
                }}
                color="primary"
                variant="outlined"
              />
            )}
            {filters.category && (
              <Chip
                size="small"
                label={`Danh mục: ${categoryOptions.find(opt => opt.value === filters.category)?.label}`}
                onDelete={() => {
                  setTempFilters({ ...tempFilters, category: '' });
                  setFilters({ ...filters, category: '' });
                }}
                color="primary"
                variant="outlined"
              />
            )}
            {filters.minPrice && (
              <Chip
                size="small"
                label={filters.minPrice === 'over_3000000' ? 'Từ: 3.000.000đ' : `Từ: ${parseInt(filters.minPrice).toLocaleString('vi-VN')}đ`}
                onDelete={() => {
                  setTempFilters({ ...tempFilters, minPrice: '' });
                  setFilters({ ...filters, minPrice: '' });
                }}
                color="primary"
                variant="outlined"
              />
            )}
            {filters.maxPrice && (
              <Chip
                size="small"
                label={filters.maxPrice === 'over_3000000' ? 'Trên 3.000.000đ' : `Đến: ${parseInt(filters.maxPrice).toLocaleString('vi-VN')}đ`}
                onDelete={() => {
                  setTempFilters({ ...tempFilters, maxPrice: '' });
                  setFilters({ ...filters, maxPrice: '' });
                }}
                color="primary"
                variant="outlined"
              />
            )}
            <Button size="small" onClick={clearFilters} color="secondary">
              Xóa tất cả
            </Button>
          </Box>
        )}
      </Paper>

      {/* Kết quả và sắp xếp */}
      <Paper sx={{ p: 2, mb: 3, borderRadius: 2 }}>
        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, justifyContent: 'space-between', alignItems: { xs: 'flex-start', md: 'center' }, gap: 2 }}>
          <Typography variant="body1">
            <strong style={{ color: '#ff6b6b', fontSize: '1.2rem' }}>{totalProducts}</strong> sản phẩm được tìm thấy
          </Typography>

          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', width: { xs: '100%', md: 'auto' } }}>
            <Typography variant="body2" color="text.secondary" sx={{ minWidth: '60px' }}>Sắp xếp:</Typography>
            <FormControl size="small" sx={{ minWidth: 160, flex: { xs: 1, md: 'none' } }}>
              <Select
                value={filters.sortBy}
                onChange={handleSortChange}
                displayEmpty
                startAdornment={<Sort sx={{ mr: 1, color: 'action.active' }} />}
              >
                {sortOptions.map(option => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
        </Box>
      </Paper>

      {/* Products Grid */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {products.length === 0 ? (
        <Paper sx={{ p: 8, textAlign: 'center' }}>
          <img
            src="https://via.placeholder.com/200x200?text=No+Products"
            alt="No products"
            style={{ width: 150, marginBottom: 16 }}
          />
          <Typography variant="h6" color="text.secondary" gutterBottom>
            Không tìm thấy sản phẩm nào
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Thử điều chỉnh bộ lọc hoặc tìm kiếm với từ khóa khác
          </Typography>
          <Button variant="contained" onClick={clearFilters}>
            Xóa bộ lọc
          </Button>
        </Paper>
      ) : (
        <>
          <Box sx={{
            display: 'grid',
            gridTemplateColumns: { xs: 'repeat(2, 1fr)', sm: 'repeat(3, 1fr)', md: 'repeat(4, 1fr)', lg: 'repeat(5, 1fr)' },
            gap: 2
          }}>
            {products.map((product, index) => (
              <Box key={product.id} sx={{ animation: `staggerReveal 0.5s ease ${Math.min(index * 0.05, 0.5)}s both` }}>
                <Card
                  onClick={() => navigate(`/product/${product.id}`)}
                  sx={{
                    cursor: 'pointer', borderRadius: 2, border: 'none',
                    boxShadow: '0 1px 4px rgba(0,0,0,0.07)',
                    height: '100%',
                    transition: 'all 0.3s ease',
                    '&:hover': { transform: 'translateY(-7px)', boxShadow: '0 12px 28px rgba(0,0,0,0.12)' },
                    '&:hover img': { transform: 'scale(1.06)' }
                  }}
                >
                  <Box sx={{ bgcolor: '#f5f5f5', borderRadius: '8px 8px 0 0', overflow: 'hidden', position: 'relative' }}>
                    <CardMedia component="img" height="200"
                      image={getFirstImage(product.images, 'https://via.placeholder.com/200')}
                      alt={product.name}
                      sx={{ objectFit: 'contain', p: 1.5, transition: 'transform 0.4s ease' }}
                    />
                    {product.isFlashSale && (
                      <Chip label={`-${product.flashSaleDiscount || 0}%`} size="small" sx={{ position: 'absolute', top: 10, left: 10, bgcolor: '#c62828', color: 'white', fontWeight: 700, borderRadius: 1 }} />
                    )}
                  </Box>
                  <CardContent sx={{ p: '12px 14px !important' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                      <Rating value={4.5} size="small" readOnly sx={{ color: '#ffc107', fontSize: '0.9rem' }} />
                      <Typography variant="caption" color="text.secondary" sx={{ ml: 0.5 }}>(42)</Typography>
                    </Box>
                    <Typography variant="body2" noWrap fontWeight={600} sx={{ mb: 0.5, color: '#333' }}>{product.name}</Typography>

                    <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1 }}>
                      <Typography variant="body1" color="#c62828" fontWeight={700}>
                        {product.isFlashSale
                          ? formatPrice(product.price * (1 - (product.flashSaleDiscount || 0) / 100))
                          : formatPrice(product.price)}
                      </Typography>
                      {product.isFlashSale && (
                        <Typography variant="caption" sx={{ textDecoration: 'line-through', color: '#999' }}>
                          {formatPrice(product.price)}
                        </Typography>
                      )}
                    </Box>
                  </CardContent>
                </Card>
              </Box>
            ))}
          </Box>

          {/* Pagination */}
          {pages > 1 && (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
              <Pagination
                count={pages}
                page={page}
                onChange={(e, value) => setPage(value)}
                color="primary"
                size="large"
                showFirstButton
                showLastButton
              />
            </Box>
          )}
        </>
      )}

      {/* Snackbar thông báo */}
      <Box
        sx={{
          position: 'fixed', bottom: 24, left: 24, zIndex: 10000,
          animation: snackbar.open ? 'slideInLeft 0.4s ease' : 'none'
        }}
      >
        {snackbar.open && (
          <Paper
            elevation={6}
            sx={{
              display: 'flex', alignItems: 'center', gap: 2,
              p: '12px 24px', borderRadius: '12px',
              bgcolor: snackbar.severity === 'success' ? '#2e7d32' : '#c62828',
              color: 'white', fontWeight: 700,
              boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
            }}
          >
            <Typography variant="body1">{snackbar.message}</Typography>
            <IconButton size="small" onClick={handleCloseSnackbar} sx={{ color: 'white' }}>
              <Close fontSize="small" />
            </IconButton>
          </Paper>
        )}
      </Box>


    </Container>
  );
};

export default ProductsPage;